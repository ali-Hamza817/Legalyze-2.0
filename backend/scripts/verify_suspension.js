require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const axios = require('axios');

async function testSuspension() {
    console.log('--- SUSPENSION LOGIC VERIFICATION ---');
    
    // 1. Connect and Setup Test User
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log(`Connecting to MongoDB using URI length: ${mongoURI ? mongoURI.length : 'UNDEFINED'}`);
    
    await mongoose.connect(mongoURI);
    const testEmail = 'suspended_test@legalyze.com';
    const testPass = 'Password123!';
    
    let user = await User.findOne({ email: testEmail });
    if (!user) {
        console.log('Creating test user...');
        user = await User.create({
            email: testEmail,
            password: testPass,
            firstName: 'Suspended',
            lastName: 'User',
            isVerified: true,
            isActive: true
        });
    }

    // 2. Suspend User
    console.log('🚫 Suspending user...');
    user.isActive = false;
    await user.save();
    
    // 3. Attempt Login
    console.log('🔐 Attempting Login...');
    try {
        await axios.post('http://localhost:5000/api/auth/login', {
            email: testEmail,
            password: testPass
        });
        console.error('❌ FAIL: Login succeeded but should have failed!');
    } catch (err) {
        if (err.response) {
            console.log(`✅ Login Blocked. Status: ${err.response.status}`);
            console.log(`   Message: "${err.response.data.message}"`);
            
            if (err.response.status === 403 && 
                err.response.data.message.includes('suspended by super admin')) {
                console.log('✅ PASS: Correct status and message received.');
            } else {
                console.error('❌ FAIL: Incorrect status or message.');
            }
        } else {
            console.error('❌ FAIL: Unknown error:', err.message);
        }
    }

    // 4. Cleanup
    console.log('🧹 Cleanup: Deleting test user...');
    await User.deleteOne({ email: testEmail });
    await mongoose.disconnect();
}

testSuspension();
