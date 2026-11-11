const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  itemCount: { type: Number, default: 0 },
  image: { type: String, default: '/categories/default.jpg' },
}, { timestamps: true });

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
