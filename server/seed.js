const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const HelpRequest = require('./models/HelpRequest');

dotenv.config();

const seedData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing
    await User.deleteMany({});
    await HelpRequest.deleteMany({});
    console.log('Cleared existing users and help requests.');

    // Create users
    const student1 = await User.create({
      name: 'John Doe',
      email: 'student@college.edu',
      password: 'password123',
      role: 'student'
    });

    const student2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@college.edu',
      password: 'password123',
      role: 'student'
    });

    const faculty = await User.create({
      name: 'Prof. Anderson',
      email: 'faculty@college.edu',
      password: 'password123',
      role: 'faculty'
    });

    console.log('Created users:');
    console.log(`- Student: ${student1.email} (password: password123)`);
    console.log(`- Student: ${student2.email} (password: password123)`);
    console.log(`- Faculty: ${faculty.email} (password: password123)`);

    console.log('✅ Users seeded successfully! Zero default help requests.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
