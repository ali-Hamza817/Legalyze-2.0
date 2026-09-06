require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pineconeService = require('../services/pineconeService');
const mongoose = require('mongoose');

async function verifyIsolation() {
    console.log('--- RAG NAMESPACE ISOLATION TEST ---');
    
    // Test Data
    const docId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const chunks = [{
        chunkIndex: 0,
        text: "This is a confidential user document. It should NOT be mixed with laws.",
        embedding: new Array(1024).fill(0.1) // Correct embedding dimension (1024) matches Pinecone index
    }];

    try {
        // 1. Upsert to 'user-uploads' (Simulate workflow)
        console.log('📤 Upserting test vector to [user-uploads]...');
        await pineconeService.upsertVectors(
            docId, 
            "Confidential Doc.pdf", 
            userId, 
            chunks, 
            'user-uploads'
        );

        // 2. Query 'user-uploads' (Should Find It)
        console.log('🔍 Querying [user-uploads]...');
        const userResults = await pineconeService.queryVectors(
            chunks[0].embedding,
            1,
            userId,
            null,
            null,
            'user-uploads'
        );
        
        if (userResults.length > 0 && userResults[0].text.includes('confidential')) {
            console.log('✅ PASS: Found document in [user-uploads]');
        } else {
            console.error('❌ FAIL: Did NOT find document in [user-uploads]');
        }

        // 3. Query 'authoritative-laws' (Should NOT Find It)
        console.log('🔍 Querying [authoritative-laws]...');
        const lawResults = await pineconeService.queryVectors(
            chunks[0].embedding,
            1,
            userId,
            null,
            null,
            'authoritative-laws'
        );

        // Check if our test doc text appears in laws (it shouldn't)
        const leaked = lawResults.length > 0 && lawResults[0].text.includes('confidential');

        if (!leaked) {
            console.log('✅ PASS: Document NOT found in [authoritative-laws]');
        } else {
            console.error('❌ FAIL: Document LEAKED into [authoritative-laws]!');
        }

        // Cleanup
        console.log('🧹 Cleanup...');
        await pineconeService.deleteVectors(docId); // This logic needs update to support namespace deletion?
        // Actually deleteVectors implementation in pineconeService defaults to index.deleteMany without namespace selection??
        // Let's check pineconeService deleteVectors...
        
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

verifyIsolation();
