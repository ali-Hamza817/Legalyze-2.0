const Document = require('../models/Document');
const Case = require('../models/Case');
const TimelineEvent = require('../models/TimelineEvent');
const { processDocument } = require('../utils/documentProcessor');
const pineconeService = require('./pineconeService');
const intelligence = require('./legalIntelligence');

/**
 * Legal Workflow Orchestrator
 * Coordinates the entire document lifecycle: Upload -> Extract -> Link -> Vectorize
 */
const processUpload = async (documentId, buffer, mimeType, userId, chatId = null) => {
    try {
        console.log(`🎬 Orchestrating Workflow for Doc: ${documentId}`);

        // 1. Text Extraction
        console.log('📄 Extracting text...');
        const { chunks, text } = await processDocument(buffer, mimeType);
        
        // 2. Legal Intelligence (Parallel Execution)
        console.log('🧠 Running Legal Intelligence...');
        const [docType, summary, deepMetadata] = await Promise.all([
            intelligence.classifyDocument(text),
            intelligence.generateSummary(text),
            intelligence.extractDeepMetadata(text)
        ]);

        console.log(`🔹 Classified as: ${docType}`);

        // === LEGAL DOCUMENT CHECK ===
        const nonLegalTypes = ['Unknown', 'Other', 'Non-Legal'];
        const isLegalDocument = !nonLegalTypes.includes(docType);
        
        if (!isLegalDocument) {
            console.log('⚠️ Document classified as Non-Legal. Skipping Pinecone indexing.');
            await Document.findByIdAndUpdate(documentId, {
                processed: true,
                docType: 'Non-Legal',
                isLegal: false,
                processingError: 'This document does not appear to be a legal document.'
            });
            return null; // Early exit
        }
        // ==============================

        // 3. Timeline Generation
        const timelineEvents = await intelligence.generateTimeline(text, deepMetadata.dates?.documentDate);
        
        // 4. Case Linking / Creation
        let caseId = null;
        // logic to link to generic case if not exists, or create new based on metadata
        // For now, simpler logic: If chatId provided, link to that context. 
        // LWOE advanced: Try to match "Case Number" or "Parties" to existing Case.
        
        // AUTO-CREATE CASE if high confidence (e.g. contains "Versus" and "Case No")
        if (deepMetadata.parties?.petitioner && deepMetadata.court?.name) {
            const caseTitle = `${deepMetadata.parties.petitioner} vs ${deepMetadata.parties.respondent || 'State'}`;
            
            // Check if case exists for user
            let existingCase = await Case.findOne({ 
                user: userId, 
                $text: { $search: `"${deepMetadata.parties.petitioner}"` } 
            });

            if (!existingCase) {
                console.log('✨ Auto-Creating New Case:', caseTitle);
                existingCase = await Case.create({
                    user: userId,
                    title: caseTitle,
                    type: mapDocTypeToCaseType(docType),
                    court: deepMetadata.court.name,
                    judge: deepMetadata.court.judge,
                    clientName: deepMetadata.parties.petitioner,
                    opponentName: deepMetadata.parties.respondent,
                    status: 'Active'
                });
            }
            caseId = existingCase._id;
        }

        // Sanitize summary to match Schema (String)
        const sanitizedSummary = { ...summary };
        if (typeof summary.facts === 'object') {
            sanitizedSummary.facts = JSON.stringify(summary.facts, null, 2);
        }
        if (typeof summary.reliefSought === 'object') {
            sanitizedSummary.reliefSought = JSON.stringify(summary.reliefSought, null, 2);
        }

        // 5. Update Document Record
        const doc = await Document.findByIdAndUpdate(documentId, {
            processed: true,
            chunkCount: chunks.length,
            extractedText: text,
            docType: docType,
            summary: sanitizedSummary,
            metadata: deepMetadata,
            caseId: caseId,
            chatId: chatId // Maintain chat context link
        }, { new: true });

        // 6. Save Timeline Events
        if (caseId && timelineEvents.length > 0) {
            const events = timelineEvents.map(e => ({
                caseId: caseId,
                title: e.title,
                date: new Date(e.date),
                type: mapEventType(e.type),
                description: e.description,
                sourceDocument: documentId,
                status: new Date(e.date) > new Date() ? 'Upcoming' : 'Completed'
            }));
            await TimelineEvent.insertMany(events);
            
            // Link to Case
            const eventIds = await TimelineEvent.find({ caseId }).distinct('_id');
            await Case.findByIdAndUpdate(caseId, { 
                $addToSet: { documents: documentId },
                timelineEvents: eventIds 
            });
        }

        // 7. Vectorization (Pinecone) - Background
        // Enrich chunks with deep metadata (filter out null values to prevent Pinecone error)
        const enrichedChunks = chunks.map(chunk => {
            const metadata = {
                chatId: chatId || undefined,
                caseId: caseId ? caseId.toString() : undefined,
                docType: docType || undefined,
                judge: deepMetadata.court?.judge || undefined,
                laws: deepMetadata.statutes || undefined
            };
            // Remove undefined keys (Pinecone doesn't accept null)
            Object.keys(metadata).forEach(key => {
                if (metadata[key] === undefined || metadata[key] === null) {
                    delete metadata[key];
                }
            });
            return {
                ...chunk,
                metadata
            };
        });

        await pineconeService.upsertVectors(
            documentId,
            doc.filename,
            userId,
            enrichedChunks,
            'user-uploads' // Explicitly index to user namespace
        );
        await Document.findByIdAndUpdate(documentId, { pineconeIndexed: true });
        
        console.log('✅ Workflow Complete!');
        return doc;

    } catch (error) {
        console.error('❌ Orchestrator Error:', error);
        await Document.findByIdAndUpdate(documentId, { 
            processingError: error.message,
            processed: true // Mark as finished (failed) to unblock UI
        });
        throw error;
    }
};

// Utils
function mapDocTypeToCaseType(docType) {
    const map = {
        'Bail Application': 'Criminal',
        'FIR': 'Criminal',
        'Rent Agreement': 'Civil',
        'Divorce Deed': 'Family',
        'Tax Notice': 'Taxation'
    };
    return map[docType] || 'Other';
}

function mapEventType(type) {
    const allowed = ['Hearing', 'Deadline', 'Order', 'Incident', 'Filing', 'Meeting', 'Other'];
    return allowed.includes(type) ? type : 'Other';
}

module.exports = {
    processUpload
};
