const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const categoriesPath = path.join(__dirname, '../data/categories.json');
const productsPath = path.join(__dirname, '../data/products.json');

let Category = null;
let Product = null;

try { Category = require('../models/Category'); } catch {}
try { Product = require('../models/Product'); } catch {}

async function isMongoAvailable() {
  if (!Category) return false;
  try {
    await Category.countDocuments();
    return true;
  } catch { return false; }
}

function readCategories() {
  const data = fs.readFileSync(categoriesPath, 'utf8');
  return JSON.parse(data);
}

function writeCategories(categories) {
  fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
}

function generateSlug(name) {
  return name.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function updateCategoryCounts() {
  const useMongo = await isMongoAvailable();
  if (useMongo) {
    const categories = await Category.find().lean();
    for (const cat of categories) {
      const count = await Product.countDocuments({ categorySlug: cat.slug });
      await Category.updateOne({ id: cat.id }, { itemCount: count });
    }
    return await Category.find().lean();
  } else {
    const categories = readCategories();
    const productsRaw = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const products = productsRaw.products || productsRaw;
    categories.forEach(cat => {
      cat.itemCount = products.filter(p => p.categorySlug === cat.slug).length;
    });
    writeCategories(categories);
    return categories;
  }
}

async function getAllCategories(req, res) {
  try {
    const categories = await updateCategoryCounts();
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
}

async function getCategoryBySlug(req, res) {
  try {
    const { slug } = req.params;
    const useMongo = await isMongoAvailable();
    let category;
    if (useMongo) {
      category = await Category.findOne({ slug }).lean();
    } else {
      const categories = readCategories();
      category = categories.find(c => c.slug === slug);
    }
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
}

async function addCategory(req, res) {
  try {
    const { name, description, image } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Category name is required' });

    const slug = generateSlug(name);
    const id = slug;

    const useMongo = await isMongoAvailable();
    if (useMongo) {
      const existing = await Category.findOne({ slug });
      if (existing) return res.status(400).json({ success: false, error: 'Category with this name already exists' });

      const newCategory = await Category.create({
        id, name: name.trim(), slug,
        description: description?.trim() || '',
        itemCount: 0,
        image: image || '/categories/default.jpg',
      });
      return res.json({ success: true, category: newCategory.toObject() });
    } else {
      const categories = readCategories();
      if (categories.find(c => c.slug === slug)) {
        return res.status(400).json({ success: false, error: 'Category with this name already exists' });
      }
      const newCategory = { id, name: name.trim(), slug, description: description?.trim() || '', itemCount: 0, image: image || '/categories/default.jpg' };
      categories.push(newCategory);
      writeCategories(categories);
      return res.json({ success: true, category: newCategory });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add category' });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;
    const useMongo = await isMongoAvailable();

    if (useMongo) {
      const updates = {};
      if (name?.trim()) {
        updates.name = name.trim();
        const newSlug = generateSlug(name);
        const existing = await Category.findOne({ id });
        if (existing && newSlug !== existing.slug) {
          await Product.updateMany({ categorySlug: existing.slug }, { categorySlug: newSlug, category: name.trim() });
          updates.slug = newSlug;
          updates.id = newSlug;
        }
      }
      if (description !== undefined) updates.description = description.trim();
      if (image) updates.image = image;

      const category = await Category.findOneAndUpdate({ id }, updates, { new: true }).lean();
      if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
      return res.json({ success: true, category });
    } else {
      const categories = readCategories();
      const index = categories.findIndex(c => c.id === id);
      if (index === -1) return res.status(404).json({ success: false, error: 'Category not found' });
      if (name?.trim()) {
        categories[index].name = name.trim();
        const newSlug = generateSlug(name);
        if (newSlug !== categories[index].slug) {
          const oldSlug = categories[index].slug;
          categories[index].slug = newSlug;
          categories[index].id = newSlug;
          const productsRaw = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
          const products = productsRaw.products || productsRaw;
          products.forEach(p => { if (p.categorySlug === oldSlug) { p.categorySlug = newSlug; p.category = name.trim(); } });
          if (productsRaw.products) productsRaw.products = products;
          fs.writeFileSync(productsPath, JSON.stringify(productsRaw.products ? productsRaw : products, null, 2));
        }
      }
      if (description !== undefined) categories[index].description = description.trim();
      if (image) categories[index].image = image;
      writeCategories(categories);
      return res.json({ success: true, category: categories[index] });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const useMongo = await isMongoAvailable();

    if (useMongo) {
      const category = await Category.findOne({ id });
      if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
      const hasProducts = await Product.exists({ categorySlug: category.slug });
      if (hasProducts) return res.status(400).json({ success: false, error: 'Cannot delete category with existing products' });
      await Category.deleteOne({ id });
      return res.json({ success: true, message: 'Category deleted successfully' });
    } else {
      const categories = readCategories();
      const index = categories.findIndex(c => c.id === id);
      if (index === -1) return res.status(404).json({ success: false, error: 'Category not found' });
      const productsRaw = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      const products = productsRaw.products || productsRaw;
      const hasProducts = products.some(p => p.categorySlug === categories[index].slug);
      if (hasProducts) return res.status(400).json({ success: false, error: 'Cannot delete category with existing products' });
      categories.splice(index, 1);
      writeCategories(categories);
      return res.json({ success: true, message: 'Category deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
}

module.exports = { getAllCategories, getCategoryBySlug, addCategory, updateCategory, deleteCategory, updateCategoryCounts };
