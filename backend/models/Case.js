const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        caseNumber: {
            type: String,
            trim: true
        },
        type: {
            type: String,
            enum: ['Criminal', 'Civil', 'Corporate', 'Family', 'Taxation', 'Constitutional', 'Other'],
            default: 'Other'
        },
        status: {
            type: String,
            enum: ['Active', 'Pending', 'Closed', 'Archived'],
            default: 'Active'
        },
        clientName: String,
        opponentName: String,
        court: String,
        judge: String,
        
        // Linked Artifacts
        documents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document'
        }],
        timelineEvents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TimelineEvent'
        }],
        
        // AI Analysis
        summary: String,
        strategy: String,
        nextHearingDate: Date
    },
    {
        timestamps: true,
        collection: 'cases'
    }
);

// Indexes
caseSchema.index({ user: 1, status: 1 });
caseSchema.index({ caseNumber: 1 });
caseSchema.index({ title: 'text', clientName: 'text', opponentName: 'text' });

const Case = mongoose.model('Case', caseSchema);

module.exports = Case;
