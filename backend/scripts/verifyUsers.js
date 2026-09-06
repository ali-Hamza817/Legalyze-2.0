require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const updateUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Update all existing users to be verified
        const result = await User.updateMany(
            {},
            { $set: { isVerified: true } }
        );

        console.log(`✅ Updated ${result.modifiedCount} users to verified status`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateUsers();
