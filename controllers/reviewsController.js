const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const REVIEWS_FILE = path.join(__dirname, '../data/reviews.json');

// Try to load Review model
let Review = null;
try {
  Review = require('../models/Review');
} catch (e) {}

// Event-based mongo check — no DB round-trip per request
let mongoAvailable = false;
mongoose.connection.on('connected', () => { mongoAvailable = true; });
mongoose.connection.on('disconnected', () => { mongoAvailable = false; });
if (mongoose.connection.readyState === 1) mongoAvailable = true;

function isMongoAvailable() { return !!(Review && mongoAvailable); }

// JSON helpers
function readReviews() {
  if (!fs.existsSync(REVIEWS_FILE)) return [];
  return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
}

function writeReviews(reviews) {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

// GET all reviews (admin)
async function getAllReviews(req, res) {
  try {
    const { productId, slug, status } = req.query;
    const useMongo = isMongoAvailable();

    let reviews;
    if (useMongo) {
      let filter = {};
      // Support both productId and slug
      if (productId) filter.productId = productId;
      if (slug) filter.productSlug = slug;
      if (status) filter.status = status;
      // If no status filter, show only approved reviews (for public)
      if (!status && (productId || slug)) filter.status = 'approved';
      
      reviews = await Review.find(filter).select('-_id -__v').sort({ createdAt: -1 }).lean();
    } else {
      reviews = readReviews();
      if (productId) reviews = reviews.filter(r => r.productId === productId);
      if (slug) reviews = reviews.filter(r => r.productSlug === slug);
      // If no status filter, show only approved reviews (for public)
      if (!status && (productId || slug)) reviews = reviews.filter(r => r.status === 'approved');
      if (status) reviews = reviews.filter(r => r.status === status);
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, total: reviews.length, reviews });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// GET approved reviews for a product (public)
async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;
    const useMongo = isMongoAvailable();

    let reviews;
    if (useMongo) {
      reviews = await Review.find({ productId, status: 'approved' })
        .select('-_id -__v').sort({ createdAt: -1 }).lean();
    } else {
      reviews = readReviews().filter(r => r.productId === productId && r.status === 'approved');
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, total: reviews.length, reviews });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// POST - Submit a review
async function submitReview(req, res) {
  try {
    // Support both customerName and userName field names
    const { productId, productSlug, productName, customerName, userName, rating, comment, variant } = req.body;
    const name = customerName || userName;

    if (!productId || !name || !rating || !comment) {
      return res.status(400).json({ success: false, error: 'productId, customerName, rating, and comment are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    const newReview = {
      id: `rev-${Date.now()}`,
      productId,
      productSlug: productSlug || '',
      productName: productName || '',
      customerName: name.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      variant: variant || '',
      verified: false,
      helpful: 0,
      status: 'approved', // Auto-approve for now (can change to 'pending' later)
      createdAt: new Date().toISOString(),
    };

    const useMongo = isMongoAvailable();
    if (useMongo) {
      await Review.create(newReview);
    } else {
      const reviews = readReviews();
      reviews.push(newReview);
      writeReviews(reviews);
    }

    res.json({ success: true, message: 'Review submitted successfully!', review: newReview });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// PATCH - Update review (admin)
async function updateReview(req, res) {
  try {
    const { id } = req.params;
    const { status, customerName, userName, rating, comment, verified } = req.body;
    const name = customerName || userName;

    const useMongo = isMongoAvailable();

    if (useMongo) {
      const updates = {};
      if (status !== undefined) updates.status = status;
      if (name) updates.customerName = name.trim();
      if (rating) updates.rating = Number(rating);
      if (comment) updates.comment = comment.trim();
      if (verified !== undefined) updates.verified = verified;

      const review = await Review.findOneAndUpdate({ id }, updates, { new: true }).select('-_id -__v').lean();
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      res.json({ success: true, review });
    } else {
      const reviews = readReviews();
      const index = reviews.findIndex(r => r.id === id);
      if (index === -1) return res.status(404).json({ success: false, error: 'Review not found' });

      if (status !== undefined) reviews[index].status = status;
      if (name) reviews[index].customerName = name.trim();
      if (rating) reviews[index].rating = Number(rating);
      if (comment) reviews[index].comment = comment.trim();
      if (verified !== undefined) reviews[index].verified = verified;

      writeReviews(reviews);
      res.json({ success: true, review: reviews[index] });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// DELETE review (admin)
async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const useMongo = isMongoAvailable();

    if (useMongo) {
      const review = await Review.findOneAndDelete({ id });
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
    } else {
      const reviews = readReviews();
      const index = reviews.findIndex(r => r.id === id);
      if (index === -1) return res.status(404).json({ success: false, error: 'Review not found' });
      reviews.splice(index, 1);
      writeReviews(reviews);
    }

    res.json({ success: true, message: 'Review deleted' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

module.exports = { getAllReviews, getProductReviews, submitReview, updateReview, deleteReview };
