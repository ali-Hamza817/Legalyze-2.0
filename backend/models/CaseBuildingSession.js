const mongoose = require('mongoose');

/**
 * Case Building Session Model
 * Stores wizard sessions for lawyers to reference previous case strategies
 */
const CaseBuildingSessionSchema = new mongoose.Schema({
    // User reference
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Session title (auto-generated from case type and date)
    title: {
        type: String,
        default: 'New Case Strategy'
    },

    // Case intake data
    caseDetails: {
        facts: { type: String, required: true },
        caseType: { 
            type: String, 
            enum: ['criminal', 'civil', 'constitutional', 'family', 'other'],
            default: 'other'
        },
        clientPosition: {
            type: String,
            enum: ['petitioner', 'respondent', 'appellant', 'applicant'],
            default: 'petitioner'
        },
        courtLevel: {
            type: String,
            enum: ['district', 'sessions', 'highcourt', 'supreme', 'family', 'tribunal'],
            default: 'district'
        },
        urgency: {
            type: String,
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal'
        }
    },

    // Extracted facts (AI-parsed factual elements)
    extractedFacts: {
        parties: [{ name: String, role: String }],
        dates: [{ date: String, event: String }],
        locations: [{ place: String, relevance: String }],
        keyEvents: [{ description: String, importance: String }],
        evidence: [{ 
            type: { type: String }, 
            description: String 
        }],
        keyFacts: [String] // Simple list of key factual points
    },

    // AI-generated classification
    classification: {
        caseType: String,
        legalIssues: [String],
        applicableLaws: [{
            section: String,
            law: String,
            relevance: String
        }],
        urgencyLevel: String,
        initialAdvice: String
    },

    // Relevant laws found
    relevantLaws: [{
        section: String,
        law: String,
        description: String,
        relevance: String,
        elements: [String]
    }],

    // Precedents found
    precedents: [{
        citation: String,
        caseName: String,
        court: String,
        date: String,
        ratio: String,
        application: String,
        source: { type: String, enum: ['database', 'ai'], default: 'ai' }
    }],

    // Generated strategy
    strategy: {
        type: String,
        default: ''
    },

    // Generated documents
    documents: [{
        type: { type: String },
        content: String,
        createdAt: { type: Date, default: Date.now }
    }],

    // Selection of petition template
    selectedTemplateId: String,
    factualFields: {
        type: Map,
        of: String,
        default: {}
    },

    // Wizard progress tracking
    currentStep: {
        type: Number,
        default: 0,
        min: 0,
        max: 6
    },
    
    // Status
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'archived'],
        default: 'in_progress',
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
CaseBuildingSessionSchema.index({ user: 1, status: 1, createdAt: -1 });
CaseBuildingSessionSchema.index({ user: 1, 'caseDetails.caseType': 1 });

// Auto-generate title before save
CaseBuildingSessionSchema.pre('save', function(next) {
    if (this.isNew || !this.title || this.title === 'New Case Strategy') {
        const caseType = this.caseDetails?.caseType || 'Case';
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        this.title = `${caseType.charAt(0).toUpperCase() + caseType.slice(1)} Case - ${date}`;
    }
    next();
});

/**
 * Get user's recent sessions
 */
CaseBuildingSessionSchema.statics.getUserSessions = async function(userId, limit = 20) {
    return this.find({ user: userId })
        .select('title caseDetails.caseType status currentStep createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(limit);
};

/**
 * Get session with full details
 */
CaseBuildingSessionSchema.statics.getFullSession = async function(sessionId, userId) {
    return this.findOne({ _id: sessionId, user: userId });
};

module.exports = mongoose.model('CaseBuildingSession', CaseBuildingSessionSchema);
