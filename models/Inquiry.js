const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  message: { type: String, required: true },
  type: { type: String, default: 'general' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });

module.exports = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);
