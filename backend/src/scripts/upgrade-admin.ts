import { User } from '../models/User';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function upgradeToAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
    
    const user = await User.findOneAndUpdate(
      { email: 'wes.piper@gmail.com' },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log('✅ User upgraded to admin:');
      console.log('   Email:', user.email);
      console.log('   Name:', user.firstName, user.lastName);
      console.log('   Role:', user.role);
    } else {
      console.log('❌ User not found with email: wes.piper@gmail.com');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

upgradeToAdmin();