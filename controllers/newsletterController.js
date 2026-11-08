const Subscriber = require('../models/Subscriber');

exports.getAllSubscribers = async () => {
  const subscribers = await Subscriber.find().sort({ subscribedAt: -1 }).select('-_id -__v').lean();
  return { success: true, total: subscribers.length, subscribers };
};

exports.subscribe = async (email) => {
  if (!email || !email.includes('@') || !email.includes('.')) {
    return { success: false, status: 400, error: 'Valid email address required' };
  }

  const clean = email.trim().toLowerCase();
  const existing = await Subscriber.findOne({ email: clean });
  if (existing) return { success: true, message: 'Already subscribed to KLYRO updates' };

  await Subscriber.create({ email: clean, subscribedAt: new Date().toISOString() });
  return { success: true, message: 'Thank you for subscribing to KLYRO updates!' };
};
