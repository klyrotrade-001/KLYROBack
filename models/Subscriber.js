const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subscribedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });

module.exports = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);
