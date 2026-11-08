const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'klyro',
    });
    isConnected = true;
    console.log('✅ MongoDB connected — klyro database');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err; // Let caller handle — server falls back to JSON file storage
  }
}

module.exports = connectDB;
