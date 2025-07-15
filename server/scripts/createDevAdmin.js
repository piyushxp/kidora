const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = 'mongodb+srv://admin:password%40123@cluster0.ids1oua.mongodb.net/kidora'

const DEFAULT_EMAIL = 'devadmin@example.com';
const DEFAULT_PASSWORD = 'devadmin123';

async function createDevAdmin() {
  await mongoose.connect(MONGODB_URI);
  const existing = await User.findOne({ email: DEFAULT_EMAIL });
  if (existing) {
    console.log('Dev admin already exists:', DEFAULT_EMAIL);
    process.exit(0);
  }
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const user = new User({
    name: 'Dev Admin',
    email: DEFAULT_EMAIL,
    password,
    role: 'dev_admin',
    isActive: true
  });
  await user.save();
  console.log('Dev admin created!');
  console.log('Email:', DEFAULT_EMAIL);
  console.log('Password:', DEFAULT_PASSWORD);
  process.exit(0);
}

createDevAdmin().catch(err => {
  console.error('Error creating dev admin:', err);
  process.exit(1);
}); 