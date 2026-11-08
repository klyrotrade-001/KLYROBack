const Order = require('../models/Order');
const siteConfig = require('../config/siteConfig');

exports.createOrder = async (body) => {
  const { customer, items } = body;

  if (!customer || !customer.fullName || !customer.mobileNumber) {
    return { success: false, status: 400, error: 'Full name and mobile number are required' };
  }
  if (!customer.houseBuilding || !customer.streetLocality || !customer.city || !customer.pinCode) {
    return { success: false, status: 400, error: 'Complete delivery address is required' };
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { success: false, status: 400, error: 'Cart must contain at least one product' };
  }

  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const orderId = `KLY-${randomSuffix}`;

  const orderItems = items.map((item) => ({
    productId: item.product ? item.product.id : item.id,
    name: item.product ? item.product.name : item.name,
    price: item.product ? item.product.price : item.price,
    quantity: item.quantity,
    variant: item.selectedVariant || item.variant,
    image: item.product && item.product.images ? item.product.images[0] : item.image,
    subtotal: (item.product ? item.product.price : item.price) * item.quantity,
  }));

  const subtotal = orderItems.reduce((sum, it) => sum + it.subtotal, 0);
  const shippingFee = subtotal >= siteConfig.freeShippingThreshold ? 0 : siteConfig.standardShippingFee;
  const totalAmount = subtotal + shippingFee;
  const now = new Date().toISOString();

  const newOrder = new Order({
    id: orderId,
    createdAt: now,
    status: 'placed',
    customer,
    items: orderItems,
    subtotal,
    shippingFee,
    totalAmount,
    statusHistory: [{ status: 'placed', timestamp: now, message: 'Order initiated with delivery address' }],
  });

  await newOrder.save();

  // Build WhatsApp message
  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;
  const lines = [
    `*NEW ORDER — ${siteConfig.name}*`,
    `_Order ID: *${orderId}*_`,
    `_${siteConfig.tagline}_`,
    '', '*Customer Details*',
    `Name: ${customer.fullName.trim()}`,
    `Mobile: ${customer.mobileNumber.trim()}`,
  ];
  if (customer.email) lines.push(`Email: ${customer.email.trim()}`);
  lines.push('', '*Delivery Address*',
    `${customer.houseBuilding.trim()}, ${customer.streetLocality.trim()}`,
    `${customer.city.trim()}, ${customer.state.trim()} - ${customer.pinCode.trim()}`);
  if (customer.landmark) lines.push(`Landmark: ${customer.landmark.trim()}`);
  if (customer.orderNotes) lines.push(`Notes: ${customer.orderNotes.trim()}`);
  lines.push('', '*Order Items*');
  orderItems.forEach((item, i) => {
    const v = item.variant ? ` [${item.variant}]` : '';
    lines.push(`${i + 1}. ${item.name}${v} (Qty: ${item.quantity}) — ${fmt(item.price)} each = *${fmt(item.subtotal)}*`);
  });
  lines.push('', `Subtotal: ${fmt(subtotal)}`,
    `Shipping: ${shippingFee === 0 ? 'FREE' : fmt(shippingFee)}`,
    `*Total Payable: ${fmt(totalAmount)}*`, '',
    `Please confirm my Order *#${orderId}* and share estimated delivery timeline.`);

  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;

  return { success: true, orderId, order: newOrder.toObject(), whatsappUrl };
};

exports.getAllOrders = async () => {
  const orders = await Order.find().sort({ createdAt: -1 }).select('-_id -__v').lean();
  return { success: true, total: orders.length, orders };
};

exports.getOrderById = async (id) => {
  const order = await Order.findOne({ id: id.trim().toUpperCase() }).select('-_id -__v').lean();
  if (!order) return { success: false, status: 404, error: `Order #${id} not found` };
  return { success: true, order };
};

exports.trackOrder = async (query) => {
  const clean = query.trim().toUpperCase();
  let order = await Order.findOne({ id: clean }).lean();
  if (order) return { success: true, matchType: 'order_id', orders: [order] };

  const phoneClean = query.replace(/\D/g, '');
  const byPhone = await Order.find({ 'customer.mobileNumber': { $regex: phoneClean } }).lean();
  if (byPhone.length > 0) return { success: true, matchType: 'phone', orders: byPhone };

  return { success: false, status: 404, error: `No orders found matching "${query}"` };
};

exports.deleteOrder = async (id) => {
  const order = await Order.findOneAndDelete({ id: id.trim().toUpperCase() });
  if (!order) return { success: false, status: 404, error: `Order #${id} not found` };
  return { success: true, message: `Order #${order.id} deleted` };
};

exports.updateOrderStatus = async (id, status, message) => {
  const order = await Order.findOne({ id: id.trim().toUpperCase() });
  if (!order) return { success: false, status: 404, error: `Order #${id} not found` };

  order.status = status;
  order.statusHistory.push({
    status,
    timestamp: new Date().toISOString(),
    message: message || `Status updated to ${status}`,
  });
  await order.save();
  return { success: true, order: order.toObject() };
};
