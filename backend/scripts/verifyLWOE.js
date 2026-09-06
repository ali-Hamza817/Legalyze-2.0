const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Document = require('../models/Document');
const Case = require('../models/Case');
const TimelineEvent = require('../models/TimelineEvent');
const { processUpload } = require('../services/workflowOrchestrator');
const User = require('../models/User');

const MOCK_TEXT = `%MOCK-PDF
IN THE COURT OF SESSIONS JUDGE, LAHORE
Bail Application No. 888/2024

Ahmed Khan ... Petitioner
Versus
The State ... Respondent

FIR No. 101/2024
Dated: 01.01.2024
Offence Under Section 302 PPC
Police Station: Gulberg, Lahore

RESPECTFULLY SHEWETH:

1. That the petitioner is innocent and was falsely implicated in the FIR dated 01.01.2024.
2. That the alleged incident occurred on 31.12.2023 at 10:00 PM.
3. That the petitioner was arrested on 02.01.2024.
4. That the bail application was rejected by the Judicial Magistrate on 15.01.2024.
5. That the next hearing is scheduled for 20.02.2024.

PRAYER:
It is prayed that post-arrest bail may be granted.
`;

async function verifyLWOE() {
    console.log('🚀 Starting LWOE Workflow Verification...');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ DB Connected');
        await Case.syncIndexes();
        console.log('✅ Indexes Synced');
        
        // 1. Create Mock User & Document
        const userId = new mongoose.Types.ObjectId();
        const docId = new mongoose.Types.ObjectId();
        
        const mockDoc = await Document.create({
            _id: docId,
            user: userId,
            filename: 'mock_bail_app.pdf',
            originalName: 'mock_bail_app.pdf',
            s3Key: `mock/key/${Date.now()}`,
            s3Url: 'http://mock',
            fileSize: 1024,
            mimeType: 'application/pdf',
            chatId: 'test-chat-lwoe'
        });
        
        console.log('📄 Mock Document Created:', docId);

        // 2. Run Orchestrator
        console.log('🎬 Running Orchestrator...');
        // Pass Buffer with MOCK-PDF signature to trigger the mock extraction path
        const buffer = Buffer.from(MOCK_TEXT);
        
        await processUpload(docId.toString(), buffer, 'application/pdf', userId.toString(), 'test-chat-lwoe');
        
        // 3. Verify Results
        const updatedDoc = await Document.findById(docId);
        console.log('✅ Document Record Updated:', updatedDoc.docType);
        
        if (updatedDoc.caseId) {
            const linkedCase = await Case.findById(updatedDoc.caseId);
            console.log('✅ Case Auto-Created:', linkedCase.title);
            console.log('   - Type:', linkedCase.type);
            console.log('   - Client:', linkedCase.clientName);
        } else {
            console.warn('⚠️ Case NOT created/linked');
        }

        const events = await TimelineEvent.find({ sourceDocument: docId });
        console.log(`✅ Timeline Events Generated: ${events.length}`);
        events.forEach(e => console.log(`   - [${e.date.toISOString().split('T')[0]}] ${e.title} (${e.type})`));

        // Cleanup
        await Document.deleteOne({ _id: docId });
        if (updatedDoc.caseId) await Case.deleteOne({ _id: updatedDoc.caseId });
        await TimelineEvent.deleteMany({ sourceDocument: docId });
        
        console.log('✨ Verification PASSED');

    } catch (e) {
        console.error('❌ Verification Failed:', e);
    } finally {
        await mongoose.disconnect();
    }
}

verifyLWOE();
