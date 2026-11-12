const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');

// Module-level flag updated by mongoose connection events — no DB round-trip per request
let mongoAvailable = false;
mongoose.connection.on('connected', () => { mongoAvailable = true; });
mongoose.connection.on('disconnected', () => { mongoAvailable = false; });
// Set initial state if already connected when module loads (e.g. hot reload)
if (mongoose.connection.readyState === 1) mongoAvailable = true;

function checkMongo() { return mongoAvailable; }

// Read products from JSON file
function readProductsFromFile() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    return [];
  }
  const data = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  return data.products || data || [];
}

// Write products to JSON file
function writeProductsToFile(products) {
  const data = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  data.products = products;
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
}

// Seed products from JSON on first run if DB is empty
async function seedProductsIfEmpty() {
  const isMongo = checkMongo();
  if (!isMongo) return;

  const count = await Product.countDocuments();
  if (count > 0) return;

  if (!fs.existsSync(PRODUCTS_FILE)) return;

  const products = readProductsFromFile();
  if (products.length > 0) {
    await Product.insertMany(products);
    console.log(`✅ Seeded ${products.length} products into MongoDB`);
  }
}

seedProductsIfEmpty().catch(console.error);

exports.getProducts = async (query = {}) => {
  const isMongo = checkMongo();

  if (isMongo) {
    // MongoDB version
    let filter = {};

    // Hide out-of-stock products on frontend (admin can pass showAll=true to bypass)
    if (!query.showAll) {
      filter.inStock = true;
    }

    if (query.category && query.category !== 'all') {
      filter.categorySlug = query.category.toLowerCase();
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    let sortObj = {};
    switch (query.sort) {
      case 'price-asc':   sortObj = { price: 1 }; break;
      case 'price-desc':  sortObj = { price: -1 }; break;
      case 'discount':    sortObj = { discount: -1 }; break;
      case 'bestseller':  sortObj = { isBestSeller: -1 }; break;
      case 'rating':      sortObj = { rating: -1 }; break;
      default:            sortObj = {}; break;
    }

    let dbQuery = Product.find(filter).sort(sortObj).select('-_id -__v').lean();

    if (query.limit) {
      const l = parseInt(query.limit, 10);
      if (!isNaN(l) && l > 0) dbQuery = dbQuery.limit(l);
    }

    const products = await dbQuery;
    return { success: true, total: products.length, products };
  } else {
    // JSON file version
    let products = readProductsFromFile();

    // Hide out-of-stock products on frontend
    if (!query.showAll) {
      products = products.filter(p => p.inStock !== false);
    }

    // Filter by category
    if (query.category && query.category !== 'all') {
      products = products.filter(p => p.categorySlug === query.category.toLowerCase());
    }

    // Search
    if (query.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (query.sort) {
      case 'price-asc':   products.sort((a, b) => a.price - b.price); break;
      case 'price-desc':  products.sort((a, b) => b.price - a.price); break;
      case 'discount':    products.sort((a, b) => b.discount - a.discount); break;
      case 'bestseller':  products.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0)); break;
      case 'rating':      products.sort((a, b) => b.rating - a.rating); break;
    }

    // Limit
    if (query.limit) {
      const l = parseInt(query.limit, 10);
      if (!isNaN(l) && l > 0) products = products.slice(0, l);
    }

    return { success: true, total: products.length, products };
  }
};

exports.getProductBySlug = async (slug) => {
  const isMongo = checkMongo();

  if (isMongo) {
    // Search by both id and slug
    const product = await Product.findOne({ $or: [{ id: slug }, { slug }] }).select('-_id -__v').lean();
    if (!product) return { success: false, status: 404, error: `Product '${slug}' not found` };
    return { success: true, product };
  } else {
    const products = readProductsFromFile();
    const product = products.find(p => p.slug === slug || p.id === slug);
    if (!product) return { success: false, status: 404, error: `Product '${slug}' not found` };
    return { success: true, product };
  }
};

exports.getCategories = async () => {
  const dataFile = path.join(__dirname, '..', 'data', 'products.json');
  const { categories } = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  return { success: true, total: categories.length, categories };
};

exports.addProduct = async (body) => {
  const { name, category, categorySlug, price, originalPrice, discount, description, images, inStock,
    rating, reviewsCount, isNewArrival, isBestSeller, isFeatured, features, variants } = body;

  if (!name || !category || !price || !images || images.length === 0) {
    return { success: false, status: 400, error: 'name, category, price, and at least one image are required' };
  }

  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-') + '-' + Date.now();

  const newProductData = {
    id: `prod-${Date.now()}`,
    slug,
    name: name.trim(),
    category,
    categorySlug: categorySlug || category.toLowerCase().replace(/\s+/g, '-'),
    price: Number(price),
    originalPrice: Number(originalPrice || price),
    discount: Number(discount || 0),
    description: (description || '').trim(),
    fullDescription: (description || '').trim(),
    features: Array.isArray(features) ? features : [],
    specs: {},
    images: Array.isArray(images) ? images : [images],
    variants: Array.isArray(variants) ? variants : [],
    inStock: inStock !== false,
    rating: Number(rating || 4.0),
    reviewsCount: Number(reviewsCount || 0),
    isNewArrival: !!isNewArrival,
    isBestSeller: !!isBestSeller,
    isFeatured: !!isFeatured,
  };

  const isMongo = checkMongo();

  if (isMongo) {
    const newProduct = await Product.create(newProductData);
    return { success: true, product: newProduct.toObject() };
  } else {
    // Add to JSON file
    const products = readProductsFromFile();
    products.unshift(newProductData);
    writeProductsToFile(products);
    
    // Update category itemCount
    const categoriesController = require('./categoriesController');
    categoriesController.updateCategoryCounts();
    
    return { success: true, product: newProductData };
  }
};

exports.deleteProduct = async (id) => {
  const isMongo = checkMongo();

  if (isMongo) {
    const product = await Product.findOneAndDelete({ $or: [{ id }, { slug: id }] });
    if (!product) return { success: false, status: 404, error: `Product '${id}' not found` };
    return { success: true, message: `Product '${product.name}' deleted`, productId: product.id };
  } else {
    // Delete from JSON file
    const products = readProductsFromFile();
    const index = products.findIndex(p => p.id === id || p.slug === id);
    
    if (index === -1) {
      return { success: false, status: 404, error: `Product '${id}' not found` };
    }
    
    const deletedProduct = products[index];
    products.splice(index, 1);
    writeProductsToFile(products);
    
    // Update category itemCount
    const categoriesController = require('./categoriesController');
    categoriesController.updateCategoryCounts();
    
    return { success: true, message: `Product '${deletedProduct.name}' deleted`, productId: deletedProduct.id };
  }
};

exports.updateProduct = async (id, body) => {
  const isMongo = checkMongo();

  if (isMongo) {
    const product = await Product.findOneAndUpdate(
      { $or: [{ id }, { slug: id }] },
      body,
      { new: true }
    ).lean();
    if (!product) return { success: false, status: 404, error: `Product '${id}' not found` };
    return { success: true, product };
  } else {
    // Update in JSON file
    const products = readProductsFromFile();
    const index = products.findIndex(p => p.id === id || p.slug === id);
    
    if (index === -1) {
      return { success: false, status: 404, error: `Product '${id}' not found` };
    }
    
    products[index] = { ...products[index], ...body };
    writeProductsToFile(products);
    
    return { success: true, product: products[index] };
  }
};
