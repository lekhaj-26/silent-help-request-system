const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { syncLocalDataToMongo } = require('./utils/sync');

dotenv.config();

async function run() {
  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    await syncLocalDataToMongo();
    console.log('✨ All users and requests are verified in MongoDB Atlas!');
    process.exit(0);
  } catch (err) {
    console.error(`❌ Connection failed: ${err.message}`);
    process.exit(1);
  }
}

run();
