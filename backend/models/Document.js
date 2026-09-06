const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        caseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Case',
            index: true
        },
        filename: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        },
        s3Key: {
            type: String,
            required: true,
            unique: true
        },
        s3Url: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        mimeType: {
            type: String,
            required: true,
            enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        },
        chunkCount: {
            type: Number,
            default: 0
        },
        processed: {
            type: Boolean,
            default: false
        },
        pineconeIndexed: {
            type: Boolean,
            default: false
        },
        isLegal: {
            type: Boolean,
            default: true
        },
        processingError: String,
        
        // Intelligence Data
        docType: String,
        
        // Deep Extraction Metadata (LWOE)
        metadata: {
            parties: {
                petitioner: String,
                respondent: String
            },
            court: {
                name: String,
                judge: String,
                jurisdiction: String
            },
            dates: {
                documentDate: Date,
                incidentDate: Date
            },
            statutes: [String], // e.g., ["302 PPC", "497 CrPC"]
            outcome: String,
            keyIssues: [String]
        },

        summary: {
            facts: String,
            legalIssues: [String],
            reliefSought: String
        },
        extractedText: String, // Store full text for persistence
        
        // Context
        chatId: {
            type: String,
            index: true
        }
    },
    {
        timestamps: true,
        collection: 'documents'
    }
);

// Index for user queries
documentSchema.index({ user: 1, processed: 1, pineconeIndexed: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
