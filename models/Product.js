const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: String,
  options: [String],
}, { _id: false });

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: String,
  categorySlug: String,
  price: Number,
  originalPrice: Number,
  discount: Number,
  description: String,
  fullDescription: String,
  features: [String],
  specs: { type: Map, of: String },
  images: [String],
  variants: [variantSchema],
  inStock: { type: Boolean, default: true },
  rating: { type: Number, default: 4.0 },
  reviewsCount: { type: Number, default: 0 },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: false });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
