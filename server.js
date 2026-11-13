require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const siteConfig = require('./config/siteConfig');

const productsController = require('./controllers/productsController');
const reviewsController = require('./controllers/reviewsController');
const categoriesController = require('./controllers/categoriesController');
const ordersController   = require('./controllers/ordersController');
const newsletterController = require('./controllers/newsletterController');
const inquiriesController  = require('./controllers/inquiriesController');

const app = express();
const PORT = process.env.PORT || siteConfig.port || 5001;

// ── Security & Performance Middleware ─────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// CORS — allow frontend origins only
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://www.klyroo.online',
  'https://klyroo.online',
  'https://klyro-admin.vercel.app',
  'https://admin.klyroo.online',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting for public write endpoints
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Health ────────────────────────────────────────────────────
app.get(['/', '/api/health'], (req, res) => {
  res.json({
    status: 'online',
    db: 'json-files',
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

app.post('/api/orders', writeLimiter, async (req, res) => {
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
app.post('/api/newsletter', writeLimiter, async (req, res) => {
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

app.post('/api/inquiries', writeLimiter, async (req, res) => {
  try {
    const data = await inquiriesController.createInquiry(req.body);
    res.status(data.status || 200).json(data);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin Utilities ───────────────────────────────────────────
// Protected by ADMIN_SECRET env var — not publicly accessible
app.post('/api/admin/seed-reviews', (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  const { exec } = require('child_process');
  exec('node scripts/seed-sample-reviews.js', (error, stdout, stderr) => {
    if (error) return res.status(500).json({ success: false, error: error.message, stderr });
    res.json({ success: true, message: 'Reviews seeded successfully', output: stdout });
  });
});

// ── Reviews ──────────────────────────────────────────────────
app.get('/api/reviews', reviewsController.getAllReviews);
app.get('/api/reviews/product/:productId', reviewsController.getProductReviews);
app.post('/api/reviews', writeLimiter, reviewsController.submitReview);
app.patch('/api/reviews/:id', reviewsController.updateReview);
app.delete('/api/reviews/:id', reviewsController.deleteReview);

// ── 404 Fallback ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Endpoint '${req.method} ${req.path}' not found` });
});

// ── Start (with MongoDB optional) ─────────────────────────────
async function startServer() {
  try {
    await connectDB();
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed. Running with JSON file storage only.');
    console.warn('   Error:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` KLYRO Backend  →  http://localhost:${PORT}`);
    console.log(` Database       →  JSON Files (local)`);
    console.log(` Framework      →  Express`);
    console.log(`===============================================`);
  });
}

startServer();

module.exports = app;
