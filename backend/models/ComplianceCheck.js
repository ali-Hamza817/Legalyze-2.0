const mongoose = require('mongoose');

const articleReferenceSchema = new mongoose.Schema({
    articleNumber: {
        type: String,
        required: true
    },
    heading: {
        type: String,
        required: false // Made optional to support new format
    },
    part: String,
    partName: String,
    relevance: String,
    alignment: {
        type: String,
        enum: ['COMPLIANT', 'CONFLICT', 'PARTIAL', 'YES', 'NO'], // Added YES/NO for new format
        default: 'COMPLIANT'
    },
    notes: String
}, { _id: false });

const potentialIssueSchema = new mongoose.Schema({
    issue: String,
    severity: {
        type: String,
        enum: ['HIGH', 'MEDIUM', 'LOW']
    },
    constitutionalArticle: String,
    recommendation: String
}, { _id: false });

const complianceCheckSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        documentName: {
            type: String,
            required: true
        },
        s3Key: String,
        s3Url: String,
        fileSize: Number,
        mimeType: String,
        complianceStatus: {
            type: String,
            enum: ['FULLY_COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'COMPLIANT', 'REVIEW_REQUIRED'], // Support all status types
            required: true
        },
        complianceScore: {
            type: Number,
            min: 0,
            max: 100
        },
        executiveSummary: String,
        detailedAnalysis: String,
        constitutionalProvisions: [articleReferenceSchema],
        potentialIssues: [potentialIssueSchema],
        recommendations: String,
        reportText: String // Full formatted report
    },
    {
        timestamps: true,
        collection: 'compliance_checks'
    }
);

// Index for quick user queries
complianceCheckSchema.index({ user: 1, createdAt: -1 });
complianceCheckSchema.index({ complianceStatus: 1 });

const ComplianceCheck = mongoose.model('ComplianceCheck', complianceCheckSchema);

module.exports = ComplianceCheck;
