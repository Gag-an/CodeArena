import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    console.log(users.map(u => ({ username: u.username, leetcode_link: u.leetcode_link })));
    mongoose.disconnect();
}
run();
