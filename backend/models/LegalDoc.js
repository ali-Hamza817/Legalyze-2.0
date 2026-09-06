const mongoose = require('mongoose');

const legalDocSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: String, // Store as string with unit e.g. "2.4 MB" for UI convenience
        required: true
    },
    s3Key: {
        type: String,
        required: false // If utilizing S3 storage
    },
    pineconeId: {
        type: String,
        required: false // Prefix used for vectors
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        default: 'General'
    },
    status: {
        type: String,
        enum: ['Indexing', 'Indexed', 'Failed'],
        default: 'Indexing'
    }
}, { timestamps: true });

const LegalDoc = mongoose.model('LegalDoc', legalDocSchema);

module.exports = LegalDoc;
