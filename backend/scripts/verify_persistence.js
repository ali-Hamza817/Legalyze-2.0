const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const API_URL = 'http://127.0.0.1:5000/api';
const EMAIL = 'persistence_test@gmail.com';
const PASSWORD = 'password123';

const User = require('../models/User');

async function seedUser() {
    try {
        console.log('Connecting to MongoDB...');
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/legalyze';
        console.log('Using Mongo URI:', uri.replace(/\/\/.*@/, '//***@')); 
        
        await mongoose.connect(uri);
        console.log('Connected.');

        console.log('Seeding verified user...');
        // Hash password manually or use save hook? User model likely has pre-save hook.
        // Let's rely on model instantiation. but first delete if exists.
        await User.deleteOne({ email: EMAIL });
        
        const user = new User({
            name: 'Persistence Test',
            email: EMAIL,
            password: PASSWORD,
            isVerified: true // Force verified
        });
        
        await user.save();
        console.log('User seeded successfully.');
        await mongoose.connection.close();
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

const runTest = async () => {
    try {
        await seedUser();

        console.log('--- Starting Persistence Verification ---');

        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email: EMAIL, password: PASSWORD });
        const token = loginRes.data.data.token; // Check response structure from server.js/auth.js
        // auth.js login returns: { success: true, token, user: ... } or data wrapper?
        // Let's check auth.js login response. 
        // Based on typical express implementations it might be res.json({ success: true, token, user }).
        // I'll log response to be safe if it fails.
        // Actually earlier code used `loginRes.data.data.token`. Let's verify structure quickly or assume `loginRes.data.token`?
        // `AuthContext` uses `response.data.token`. `api.js` returns `response.data`.
        // So `axios` returns `response`, `response.data` is the body.
        // Body is `{ success: true, token, user }`.
        
        // Wait, earlier script failed with `response.data.data.token`?
        // If my assumption about structure is wrong, that's a problem.
        // Let's look at `AuthContext.jsx`:
        // const { user: userData, token: userToken } = response.data;
        // So `response.data` (from api.js wrapper) has `token`.
        // But `api.js` returns `response.data` from axios.
        // So Axios `response.data` is the body.
        // Body: `{ success: true, token: '...', user: ... }`
        // So correct path is `loginRes.data.token`.
        
        const authToken = loginRes.data.token;
        const config = { headers: { 'Authorization': `Bearer ${authToken}` } };
        
        // 2. Upload (Fake PDF content)
        const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 100 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 f\n0000000060 00000 f\n0000000157 00000 f\n0000000307 00000 f\n0000000392 00000 f\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n492\n%%EOF';
        const pdfPath = path.join(__dirname, 'test.pdf');
        fs.writeFileSync(pdfPath, pdfContent);
        
        const form = new FormData();
        form.append('document', fs.createReadStream(pdfPath));
        
        const uploadConfig = {
            headers: {
                ...config.headers,
                ...form.getHeaders()
            }
        };

        console.log('2. Uploading PDF...');
        const uploadRes = await axios.post(`${API_URL}/documents/upload`, form, uploadConfig);
        // documents.js: res.status(201).json({ success: true, data: { id, filename ... } })
        const docId = uploadRes.data.data.id;
        const filename = uploadRes.data.data.filename;
        console.log(`   Uploaded Doc ID: ${docId}`);

        // 3. Send Message with Files
        console.log('3. Sending Message with Files...');
        const filePayload = [{
            id: docId,
            filename: filename,
            processed: true
        }];
        
        const msgRes = await axios.post(`${API_URL}/chat`, {
            message: "Analyze this file",
            files: filePayload
        }, config);
        
        // Chat route returns: { success: true, data: { conversationId, ... } }
        const chatId = msgRes.data.data.conversationId;
        console.log(`   Message Sent. Chat ID: ${chatId}`);

        // 4. Verify History
        console.log('4. Verifying Persistence...');
        const historyRes = await axios.get(`${API_URL}/chat/conversations/${chatId}`, config);
        // Get conversation: { success: true, data: { messages: [...] } }
        const messages = historyRes.data.data.messages;
        const lastMsg = messages.find(m => m.role === 'user');
        
        console.log('   Retrieved Message:', JSON.stringify(lastMsg, null, 2));
        
        if (lastMsg.files && lastMsg.files.length > 0 && lastMsg.files[0].id === docId) {
            console.log('✅ SUCCESS: File persistence verified!');
            fs.unlinkSync(pdfPath);
        } else {
            console.error('❌ FAILURE: File not found in message history.');
            process.exit(1);
        }

    } catch (e) {
        console.error('❌ ERROR:', e.message);
        if (e.response) {
            console.error('Response Data:', e.response.data);
            console.error('Response Status:', e.response.status);
        }
        try { fs.unlinkSync(path.join(__dirname, 'test.pdf')); } catch(err) {}
    }
};

runTest();
