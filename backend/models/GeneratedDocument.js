const mongoose = require('mongoose');

const generatedDocumentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    documentType: {
        type: String,
        required: [true, 'Document type is required']
    },
    fileName: {
        type: String,
        required: [true, 'File name is required']
    },
    s3Key: {
        type: String
    },
    s3Url: {
        type: String
    },
    htmlContent: {
        type: String  // Store HTML content directly
    },
    formData: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Form data is required']
    },
    fileSize: {
        type: Number
    },
    status: {
        type: String,
        enum: ['generating', 'completed', 'failed'],
        default: 'completed'
    }
}, {
    timestamps: true
});

// Index for faster queries
generatedDocumentSchema.index({ userId: 1, createdAt: -1 });
generatedDocumentSchema.index({ documentType: 1 });

// Virtual for document age
generatedDocumentSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Instance method to get signed URL
generatedDocumentSchema.methods.getSignedUrl = async function() {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const s3Client = require('../config/s3');
    
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: this.s3Key
    });
    
    // URL expires in 1 hour
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
};

// Instance method to generate temporary view token for HTML viewing
generatedDocumentSchema.methods.generateViewToken = function() {
    const jwt = require('jsonwebtoken');
    
    // Create a token that expires in 1 hour
    const token = jwt.sign(
        {
            documentId: this._id.toString(),
            userId: this.userId.toString(),
            type: 'view-token'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    
    return token;
};

// Static method to delete document from S3
generatedDocumentSchema.statics.deleteFromS3 = async function(s3Key) {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const s3Client = require('../config/s3');
    
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key
    });
    
    await s3Client.send(command);
};

// Pre-remove hook to delete from S3
generatedDocumentSchema.pre('remove', async function() {
    await this.constructor.deleteFromS3(this.s3Key);
});

module.exports = mongoose.model('GeneratedDocument', generatedDocumentSchema);
