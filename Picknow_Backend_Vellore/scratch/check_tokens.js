import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

async function checkTokens() {
  try {
    await mongoose.connect(process.env.DB);
    console.log('Connected to MongoDB');

    const usersWithTokens = await User.find({ pushToken: { $ne: null } }).select('email pushToken');
    console.log('Users with push tokens:', JSON.stringify(usersWithTokens, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTokens();
