const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: String,
  timestamp: { type: String, default: () => new Date().toISOString() },
  message: String,
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  price: Number,
  quantity: Number,
  variant: String,
  image: String,
  subtotal: Number,
}, { _id: false });

const customerSchema = new mongoose.Schema({
  fullName: String,
  mobileNumber: String,
  email: String,
  houseBuilding: String,
  streetLocality: String,
  city: String,
  state: String,
  pinCode: String,
  landmark: String,
  orderNotes: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered'],
    default: 'placed',
  },
  customer: customerSchema,
  items: [orderItemSchema],
  subtotal: Number,
  shippingFee: Number,
  totalAmount: Number,
  statusHistory: [statusHistorySchema],
}, { timestamps: false });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
