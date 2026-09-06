const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema(
    {
        caseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Case',
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        type: {
            type: String,
            enum: ['Hearing', 'Deadline', 'Order', 'Incident', 'Filing', 'Meeting', 'Other'],
            required: true
        },
        description: String,
        status: {
            type: String,
            enum: ['Upcoming', 'Completed', 'Overdue', 'Cancelled'],
            default: 'Upcoming'
        },
        sourceDocument: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document'
        },
        outcome: String // For hearings
    },
    {
        timestamps: true,
        collection: 'timeline_events'
    }
);

// Indexes
timelineEventSchema.index({ caseId: 1, date: 1 });

const TimelineEvent = mongoose.model('TimelineEvent', timelineEventSchema);

module.exports = TimelineEvent;
