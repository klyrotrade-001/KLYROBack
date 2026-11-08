const fs = require('fs');
const path = require('path');

const categoriesPath = path.join(__dirname, '../data/categories.json');
const productsPath = path.join(__dirname, '../data/products.json');

// Helper to read categories
function readCategories() {
  const data = fs.readFileSync(categoriesPath, 'utf8');
  return JSON.parse(data);
}

// Helper to write categories
function writeCategories(categories) {
  fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
}

// Helper to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to update product counts
function updateCategoryCounts() {
  const categories = readCategories();
  const productsRaw = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const products = productsRaw.products || productsRaw;

  categories.forEach((cat) => {
    cat.itemCount = products.filter((p) => p.categorySlug === cat.slug).length;
  });

  writeCategories(categories);
  return categories;
}

// GET all categories
function getAllCategories(req, res) {
  try {
    const categories = updateCategoryCounts();
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
}

// GET category by slug
function getCategoryBySlug(req, res) {
  try {
    const { slug } = req.params;
    const categories = readCategories();
    const category = categories.find((c) => c.slug === slug);
    
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    res.json({ success: true, category });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
}

// POST - Add new category
function addCategory(req, res) {
  try {
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const categories = readCategories();
    const slug = generateSlug(name);
    const id = slug;

    // Check if slug already exists
    if (categories.find((c) => c.slug === slug)) {
      return res.status(400).json({ success: false, error: 'Category with this name already exists' });
    }

    const newCategory = {
      id,
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      itemCount: 0,
      image: image || '/categories/default.jpg',
    };

    categories.push(newCategory);
    writeCategories(categories);

    res.json({ success: true, category: newCategory });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ success: false, error: 'Failed to add category' });
  }
}

// PATCH - Update category
function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    const categories = readCategories();
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Update fields if provided
    if (name && name.trim()) {
      categories[index].name = name.trim();
      const newSlug = generateSlug(name);
      
      // Update slug and products if name changed
      if (newSlug !== categories[index].slug) {
        const oldSlug = categories[index].slug;
        categories[index].slug = newSlug;
        categories[index].id = newSlug;
        
        // Update products with this category
        const productsRaw = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        const products = productsRaw.products || productsRaw;
        products.forEach((p) => {
          if (p.categorySlug === oldSlug) {
            p.categorySlug = newSlug;
            p.category = name.trim();
          }
        });
        if (productsRaw.products) productsRaw.products = products;
        fs.writeFileSync(productsPath, JSON.stringify(productsRaw.products ? productsRaw : products, null, 2));
      }
    }
    
    if (description !== undefined) {
      categories[index].description = description.trim();
    }
    
    if (image) {
      categories[index].image = image;
    }

    writeCategories(categories);
    updateCategoryCounts();

    res.json({ success: true, category: categories[index] });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
}

// DELETE category
function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const categories = readCategories();
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Check if category has products
    const productsRaw = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const products = productsRaw.products || productsRaw;
    const hasProducts = products.some((p) => p.categorySlug === categories[index].slug);

    if (hasProducts) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete category with existing products. Please move or delete products first.' 
      });
    }

    categories.splice(index, 1);
    writeCategories(categories);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
}

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  addCategory,
  updateCategory,
  deleteCategory,
  updateCategoryCounts,
};
