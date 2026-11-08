const Inquiry = require('../models/Inquiry');

exports.getAllInquiries = async () => {
  const inquiries = await Inquiry.find().sort({ createdAt: -1 }).select('-_id -__v').lean();
  return { success: true, total: inquiries.length, inquiries };
};

exports.createInquiry = async (body) => {
  const { name, phone, email, message, type } = body;
  if (!name || !phone || !message) {
    return { success: false, status: 400, error: 'Name, phone, and message are required' };
  }

  const inquiry = await Inquiry.create({
    id: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : undefined,
    message: message.trim(),
    type: type || 'general',
    createdAt: new Date().toISOString(),
  });

  return { success: true, inquiryId: inquiry.id, message: 'Inquiry received successfully' };
};
