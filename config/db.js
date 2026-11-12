const mongoose = require('mongoose');

let isConnected = false;

// Keep isConnected in sync with actual connection state
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️  MongoDB disconnected — will reconnect on next request');
});
mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('✅ MongoDB reconnected');
});

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
    throw err;
  }
}

module.exports = connectDB;
