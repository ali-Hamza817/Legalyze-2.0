const mongoose = require('mongoose');

/**
 * Supreme Court Judgment Model
 * Stores metadata for indexed judgments from Pakistani courts
 */
const JudgmentSchema = new mongoose.Schema({
    // Citation identifiers
    citation: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    caseTitle: {
        type: String,
        required: true,
        index: true
    },
    caseNumber: {
        type: String,
        index: true
    },

    // Court details
    court: {
        type: String,
        enum: [
            'Supreme Court of Pakistan',
            'Federal Shariat Court',
            'Lahore High Court',
            'Sindh High Court',
            'Peshawar High Court',
            'Balochistan High Court',
            'Islamabad High Court',
            'Other'
        ],
        default: 'Supreme Court of Pakistan'
    },
    bench: String,
    judge: String,

    // Case classification
    caseType: {
        type: String,
        enum: ['Criminal', 'Civil', 'Constitutional', 'Review', 'Appeal', 'Family', 'Commercial', 'Taxation', 'Other'],
        default: 'Other',
        index: true
    },

    // Dates
    decisionDate: {
        type: Date,
        index: true
    },
    indexedAt: {
        type: Date,
        default: Date.now
    },

    // Content
    summary: String,
    ratio: {
        type: String,
        text: true  // Enable text search for ratio
    },
    statutes: [{
        type: String
    }],
    keywords: [{
        type: String,
        index: true
    }],

    // Source
    pdfUrl: String,
    textLength: Number,
    chunkCount: Number,

    // Processing status
    indexed: {
        type: Boolean,
        default: false,
        index: true
    },
    processingError: String
}, {
    timestamps: true
});

// Text index for full-text search
JudgmentSchema.index({
    citation: 'text',
    caseTitle: 'text',
    summary: 'text',
    ratio: 'text'
});

// Compound index for common queries
JudgmentSchema.index({ caseType: 1, decisionDate: -1 });
JudgmentSchema.index({ court: 1, caseType: 1 });

/**
 * Search judgments by keywords
 */
JudgmentSchema.statics.searchByKeywords = async function(keywords, options = {}) {
    const { caseType, court, limit = 20 } = options;
    
    const query = {
        $text: { $search: keywords },
        indexed: true
    };
    
    if (caseType) query.caseType = caseType;
    if (court) query.court = court;
    
    return this.find(query)
        .select('-__v')
        .sort({ score: { $meta: 'textScore' }, decisionDate: -1 })
        .limit(limit);
};

/**
 * Get recent judgments by case type
 */
JudgmentSchema.statics.getRecentByType = async function(caseType, limit = 10) {
    return this.find({ caseType, indexed: true })
        .select('citation caseTitle court decisionDate ratio')
        .sort({ decisionDate: -1 })
        .limit(limit);
};

/**
 * Get judgments citing a specific statute
 */
JudgmentSchema.statics.findByStatute = async function(statute, limit = 20) {
    return this.find({
        statutes: { $regex: statute, $options: 'i' },
        indexed: true
    })
        .select('citation caseTitle court decisionDate ratio statutes')
        .sort({ decisionDate: -1 })
        .limit(limit);
};

module.exports = mongoose.model('Judgment', JudgmentSchema);
