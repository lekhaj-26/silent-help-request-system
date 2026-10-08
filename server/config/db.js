const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn('⚠️  Warning: MONGO_URI is not defined in .env! Please configure your MongoDB connection string.');
      return;
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Automatically synchronize any locally captured users & requests into MongoDB Atlas
    const { syncLocalDataToMongo } = require('../utils/sync');
    await syncLocalDataToMongo();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (error.message.includes('IP') || error.message.includes('whitelisted') || error.message.includes('Could not connect to any servers')) {
      console.warn('⚠️  Your current IP is blocked by MongoDB Atlas Network Access.');
      console.warn('👉 Go to MongoDB Atlas -> Network Access -> Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0).');
    }
  }
};

module.exports = connectDB;
