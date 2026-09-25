import { sendPushNotification } from '../utils/pushNotification.js';
import mongoose from 'mongoose';

async function testPush() {
  try {
    // This is the user kjshyam35@gmail.com
    // I'll just hardcode the token from the check_tokens output if I had it, 
    // but better to fetch it from DB.
    
    await mongoose.connect('mongodb://Picknow_asdasfadfaUSer:Picknow_2025uafbv@103.195.246.143:29876/picknow_DB?authSource=admin');
    
    // Find the user with token
    const user = await mongoose.connection.db.collection('users').findOne({ email: 'kjshyam35@gmail.com' });
    
    if (!user || !user.pushToken) {
      console.log('User not found or no token');
      process.exit(1);
    }

    console.log(`Sending test push to ${user.email}...`);
    await sendPushNotification(user._id, "Picknow Test", "If you see this, notifications are working!", { test: true });
    
    console.log('Push sent request finished. Check console for Expo response.');
    
    // Wait a bit for the async fetch in sendPushNotification to finish
    setTimeout(() => process.exit(0), 3000);
  } catch (error) {
    console.error('Test Push Error:', error);
    process.exit(1);
  }
}

testPush();
