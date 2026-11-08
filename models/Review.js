const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  productId: { type: String, required: true, index: true },
  productName: { type: String, default: '' },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  variant: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

module.exports = mongoose.model('Review', reviewSchema);
