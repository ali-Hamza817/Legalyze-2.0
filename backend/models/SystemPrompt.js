const mongoose = require('mongoose');

const systemPromptSchema = new mongoose.Schema({
    key: {
        type: String, // e.g., 'LAWYER_PERSONA', 'CASE_ANALYSIS'
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const SystemPrompt = mongoose.model('SystemPrompt', systemPromptSchema);

module.exports = SystemPrompt;
