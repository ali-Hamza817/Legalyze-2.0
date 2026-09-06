const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    files: [{
        filename: String,
        id: String,
        processed: Boolean
    }]
});

const conversationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        title: {
            type: String,
            default: 'New Conversation'
        },
        messages: [messageSchema],
        documentIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document'
        }],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: 'conversations'
    }
);

// Auto-generate title from first user message - Disabled to allow smart AI titles in routes
/*
conversationSchema.pre('save', function(next) {
    if (this.isNew && this.messages.length > 0) {
        const firstMessage = this.messages.find(m => m.role === 'user');
        if (firstMessage) {
            // Use first 50 chars of first message as title
            this.title = firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '');
        }
    }
    next();
});
*/

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
