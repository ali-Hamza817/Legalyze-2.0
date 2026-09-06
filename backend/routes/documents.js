const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');
const Document = require('../models/Document');

const { protect } = require('../middleware/auth');
const { processDocument } = require('../utils/documentProcessor');
const { classifyDocument, generateSummary } = require('../services/legalIntelligence');
const openai = require('../config/openai');
const crypto = require('crypto');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed'));
        }
    }
});

// @route   POST /api/documents/upload
// @desc    Upload document to S3 and process
// @access  Private
router.post('/upload', protect, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Generate unique filename
        const fileExtension = req.file.originalname.split('.').pop();
        const chatId = req.body.chatId || 'unsorted';
        const uniqueFilename = `${req.user.id}/chats/${chatId}/documents/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

        // Upload to S3 with AES-256 encryption
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: uniqueFilename,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ServerSideEncryption: 'AES256', // AES-256 encryption
            Metadata: {
                originalName: req.file.originalname,
                uploadedBy: req.user.id.toString(),
                chatId: chatId 
            }
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        // Generate S3 URL
        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFilename}`;

        // Create document record
        const document = new Document({
            user: req.user.id,
            filename: uniqueFilename,
            originalName: req.file.originalname,
            s3Key: uniqueFilename,
            s3Url: s3Url,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            s3Url: s3Url,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            processed: false,
            chatId: chatId
        });

        await document.save();

        // Process document asynchronously
        processDocumentAsync(document._id, req.file.buffer, req.file.mimetype);

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully. Processing in background.',
            data: {
                id: document._id,
                filename: document.originalName,
                fileSize: document.fileSize,
                uploadedAt: document.createdAt,
                processed: document.processed
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading document',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

const pineconeService = require('../services/pineconeService');

// Async function to process document
// Async function to process document using LWOE Orchestrator
async function processDocumentAsync(documentId, buffer, mimeType) {
    // Import dynamically to avoid circular dependencies if any
    const { processUpload } = require('../services/workflowOrchestrator');
    const Document = require('../models/Document'); // Re-require to ensure availablity

    try {
        const document = await Document.findById(documentId);
        if (!document) return;

        // Delegate to Orchestrator
        await processUpload(
            documentId, 
            buffer, 
            mimeType, 
            document.user, 
            document.chatId
        );

    } catch (error) {
        console.error(`❌ Error processing document ${documentId}:`, error);
        // Error handling is also done in orchestrator, but safety net here
    }
}

// @route   GET /api/documents
// @desc    Get all user documents
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const documents = await Document.find({
            user: req.user.id
        })
        .sort({ createdAt: -1 });

        const formattedDocuments = documents.map(doc => ({
            id: doc._id,
            filename: doc.originalName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            processed: doc.processed,
            pineconeIndexed: doc.pineconeIndexed,
            chunkCount: doc.chunkCount || 0,
            processingError: doc.processingError,
            uploadedAt: doc.createdAt
        }));

        res.status(200).json({
            success: true,
            data: formattedDocuments
        });

    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching documents'
        });
    }
});

// @route   GET /api/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: document._id,
                filename: document.originalName,
                fileSize: document.fileSize,
                mimeType: document.mimeType,
                processed: document.processed,
                pineconeIndexed: document.pineconeIndexed,
                chunkCount: document.chunkCount || 0,
                uploadedAt: document.createdAt
            }
        });

    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching document'
        });
    }
});

// @route   GET /api/documents/:id/download
// @desc    Get signed URL for document download
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Generate signed URL valid for 1 hour
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: document.s3Key
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        res.status(200).json({
            success: true,
            data: {
                url: signedUrl,
                filename: document.originalName
            }
        });

    } catch (error) {
        console.error('Get download URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating download URL'
        });
    }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document from S3 and database
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Delete vectors from Pinecone
        try {
            await pineconeService.deleteVectors(document._id);
        } catch (error) {
            console.error('Error deleting from Pinecone:', error);
            // Continue with deletion even if Pinecone fails
        }

        // Delete from S3
        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: document.s3Key
        };

        await s3Client.send(new DeleteObjectCommand(deleteParams));

        // Delete from database
        await Document.deleteOne({ _id: document._id });

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting document'
        });
    }
});

module.exports = router;

// NOTE: Additional compliance-check routes are defined below for clarity

// @route   POST /api/documents/compliance-check
// @desc    Upload a legal document and get an AI-based compliance review
// @access  Private
router.post('/compliance-check', protect, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Extract plain text from the document using existing processor
        const chunks = await processDocument(req.file.buffer, req.file.mimetype);
        const text = chunks.map(c => c.text || '').join('\n\n').slice(0, 12000); // trim to keep prompt manageable

        if (!text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Could not extract readable text from the document.'
            });
        }

        const prompt = `You are an experienced legal compliance assistant.
You are given the full text of a legal contract or document.

Your tasks:
1. Briefly summarize what this document is about (2-3 sentences).
2. Identify any potential compliance, risk, or fairness issues. Focus on:
   - Unbalanced obligations
   - Missing key protections
   - Ambiguous or risky clauses
   - Red flags for the weaker party
3. Provide clear, actionable recommendations. For each issue, suggest concrete wording changes or clauses to add.
4. If the document appears generally fine and balanced, clearly say so and still mention any minor improvements if applicable.

Return your answer in clear markdown with sections:
- Summary
- Findings
- Recommendations

Here is the document text:
"""
${text}
"""`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a precise, cautious legal compliance assistant. You are not giving formal legal advice, only risk-oriented suggestions.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2
        });

        const aiMessage = completion.choices?.[0]?.message?.content || 'No analysis could be generated.';

        return res.status(200).json({
            success: true,
            message: 'Compliance analysis completed',
            data: {
                analysis: aiMessage
            }
        });
    } catch (error) {
        console.error('Compliance check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to run compliance check',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
