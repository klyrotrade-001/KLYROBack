require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const siteConfig = require('./config/siteConfig');

const productsController = require('./controllers/productsController');
const categoriesController = require('./controllers/categoriesController');
const ordersController   = require('./controllers/ordersController');
const newsletterController = require('./controllers/newsletterController');
const inquiriesController  = require('./controllers/inquiriesController');

const app = express();
const PORT = process.env.PORT || siteConfig.port || 5001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health ────────────────────────────────────────────────────
app.get(['/','  /api/health'], (req, res) => {
  res.json({
    status: 'online',
    db: 'mongodb',
    name: siteConfig.name,
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    db: 'mongodb',
    name: siteConfig.name,
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ── Products ──────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    res.json(await productsController.getProducts(req.query));
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const data = await productsController.addProduct(req.body);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const data = await productsController.getProductBySlug(req.params.id);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.patch('/api/products/:id', async (req, res) => {
  try {
    const data = await productsController.updateProduct(req.params.id, req.body);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const data = await productsController.deleteProduct(req.params.id);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Categories ────────────────────────────────────────────────
app.get('/api/categories', categoriesController.getAllCategories);
app.get('/api/categories/:slug', categoriesController.getCategoryBySlug);
app.post('/api/categories', categoriesController.addCategory);
app.patch('/api/categories/:id', categoriesController.updateCategory);
app.delete('/api/categories/:id', categoriesController.deleteCategory);

// ── Orders ────────────────────────────────────────────────────
app.get('/api/orders', async (req, res) => {
  try {
    res.json(await ordersController.getAllOrders());
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const data = await ordersController.createOrder(req.body);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const data = await ordersController.getOrderById(req.params.id);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const data = await ordersController.deleteOrder(req.params.id);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.patch('/api/orders/:id', async (req, res) => {
  try {
    const data = await ordersController.updateOrderStatus(req.params.id, req.body.status, req.body.message);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Order Tracking ────────────────────────────────────────────
app.get('/api/track', async (req, res) => {
  try {
    if (!req.query.query) return res.status(400).json({ success: false, error: 'Query parameter required' });
    const data = await ordersController.trackOrder(req.query.query);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Newsletter / Subscribers ──────────────────────────────────
app.post('/api/newsletter', async (req, res) => {
  try {
    const data = await newsletterController.subscribe(req.body.email);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/subscribers', async (req, res) => {
  try {
    res.json(await newsletterController.getAllSubscribers());
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Inquiries ─────────────────────────────────────────────────
app.get('/api/inquiries', async (req, res) => {
  try {
    res.json(await inquiriesController.getAllInquiries());
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/inquiries', async (req, res) => {
  try {
    const data = await inquiriesController.createInquiry(req.body);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── 404 Fallback ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Endpoint '${req.method} ${req.path}' not found` });
});

// ── Start ─────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` KLYRO Backend  →  http://localhost:${PORT}`);
    console.log(` Database       →  MongoDB Atlas (klyro)`);
    console.log(` Framework      →  Express`);
    console.log(`===============================================`);
  });
});

module.exports = app;
