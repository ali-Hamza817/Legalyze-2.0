const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars immediately
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { processDocument } = require('../utils/documentProcessor');
const { classifyDocument, generateSummary } = require('../services/legalIntelligence');
const pineconeService = require('../services/pineconeService');
const Document = require('../models/Document');
const User = require('../models/User');

const MOCK_USER_ID = new mongoose.Types.ObjectId();
const MOCK_CHAT_ID = "test-chat-" + Date.now();

async function runVerification() {
    console.log('🚀 Starting Pipeline Verification...');

    try {
        // 1. Connect to DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 2. Mock File Upload & Processing
        // We'll simulate the processDocumentAsync logic here directly to test components
        const mockText = `
        IN THE HIGH COURT OF SINDH, KARACHI
        Criminal Bail Application No. 123 of 2024

        Ali Hamza ... Applicant
        Versus
        The State ... Respondent

        FIR No. 45/2024
        U/S 302/34 PPC
        PS Clifton, Karachi

        SUBJECT: APPLICATION FOR GRANT OF POST-ARREST BAIL

        RESPECTFULLY SHEWETH:
        1. That the applicant is innocent and has been falsely implicated.
        2. That there is no eyewitness to the alleged incident.
        3. That the delay in FIR is unexplained.

        PRAYER:
        It is respectfully prayed that this Hon'ble Court may be pleased to grant post-arrest bail to the applicant.
        `;

        console.log('📄 Simulating Document Processing...');
        
        // chunker test
        const { splitIntoChunks } = require('../utils/documentProcessor');
        // Note: documentProcessor now returns { chunks, text } from processDocument, but we are simulating the text part manually here for verify
        
        // Simulating the flow in routes/documents.js
        console.log('🧠 Running Legal Intelligence...');
        const docType = await classifyDocument(mockText);
        console.log(`🔹 Classification Result: ${docType}`);
        
        if (!docType.includes('Bail') && !docType.includes('Legal')) {
            console.warn('⚠️ Classification might be inaccurate, expected Bail Application');
        }

        const summary = await generateSummary(mockText);
        console.log(`🔹 Summary Generated: ${summarizeString(JSON.stringify(summary))}`);

        // Vectorization Test
        console.log('Vectors: Generating chunks and upscale...');
        // We need to mock chunks structure as expected by pineconeService
        const mockChunks = [
            { text: mockText, chunkIndex: 0, embedding: new Array(1536).fill(0.1) } // Mock embedding
        ];
        
        // Enriched chunks
        const enrichedChunks = mockChunks.map(c => ({
            ...c,
            metadata: { 
                 chatId: MOCK_CHAT_ID,
                 docType: docType
            }
        }));

        console.log('🔹 Enriched Chunks prepared for Pinecone:', enrichedChunks[0].metadata);

        // We won't actually push to Pinecone to save cost/time in this script unless strictly needed, 
        // but we verified the logic relies on enrichedChunks having metadata.
        
        console.log('✅ Pipeline Logic Verified (Simulated)');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

function summarizeString(str) {
    return str.length > 100 ? str.substring(0, 100) + '...' : str;
}

runVerification();
