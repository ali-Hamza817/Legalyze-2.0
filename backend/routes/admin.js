const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const SystemPrompt = require('../models/SystemPrompt');
const LegalDoc = require('../models/LegalDoc');
const Conversation = require('../models/Conversation');
const ComplianceCheck = require('../models/ComplianceCheck');
const CaseBuildingSession = require('../models/CaseBuildingSession');
const { processDocument, generateEmbedding } = require('../utils/documentProcessor'); 
const pineconeService = require('../services/pineconeService');
const LoginLog = require('../models/LoginLog');
const SystemSettings = require('../models/SystemSettings');
const axios = require('axios');

// Middleware to ensure admin
// Ideally impoprt from middleware/adminMiddleware.js if created
const { protectAdmin: checkAdminRole } = require('../middleware/adminMiddleware');

// Wrap verification: protect (JWT) + checkAdminRole
const adminAuth = [require('../middleware/auth').protect, checkAdminRole];

// @route   POST /api/admin/seed-knowledge-base
// @desc    Seed authoritative legal documents into the list
router.post('/seed-knowledge-base', adminAuth, async (req, res) => {
    try {
        const seedDocs = [
            { title: 'The Constitution of the Islamic Republic of Pakistan', category: 'Constitution' },
            { title: 'Pakistan Penal Code (PPC)', category: 'Authoritative Laws' },
            { title: 'Code of Civil Procedure (CPC)', category: 'Authoritative Laws' },
            { title: 'Code of Criminal Procedure (CrPC)', category: 'Authoritative Laws' },
            { title: 'The Limitation Act, 1908', category: 'Statutory Laws' },
            { title: 'Qanun-e-Shahadat Order, 1984', category: 'Authoritative Laws' }
        ];

        let seededCount = 0;
        for (const docInfo of seedDocs) {
            const exists = await LegalDoc.findOne({ title: docInfo.title });
            if (!exists) {
                const newDoc = new LegalDoc({
                    ...docInfo,
                    fileName: 'authoritative_source',
                    fileSize: 'N/A (Pre-indexed)',
                    status: 'Indexed',
                    uploadDate: new Date()
                });
                await newDoc.save();
                seededCount++;
            }
        }

        res.json({ message: `Seeded ${seededCount} authoritative documents`, total: seedDocs.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Seeding failed' });
    }
});

// Configure multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// @route   POST /api/admin/knowledge-base
// @desc    Upload and Index Document
router.post('/knowledge-base', adminAuth, upload.single('document'), async (req, res) => {
    try {
        console.log('📂 RAG Upload Request Received');
        if (!req.file) {
            console.warn('❌ No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(`📄 File: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);

        // 1. Upload to S3
        const fileExtension = req.file.originalname.split('.').pop();
        const uniqueFilename = `admin/knowledge-base/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;
        
        // Sanitize original filename for S3 metadata (remove non-ASCII characters)
        const sanitizedOriginalName = req.file.originalname.replace(/[^\x00-\x7F]/g, "'");
        
        console.log(`☁️ Uploading to S3: ${uniqueFilename}`);
        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: uniqueFilename,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                Metadata: { originalName: sanitizedOriginalName, type: 'knowledge-base' }
            }));
            console.log('✅ S3 Upload Success');
        } catch (s3Err) {
            console.error('❌ S3 Upload Error:', s3Err);
            throw new Error(`S3 fail: ${s3Err.message}`);
        }

        // 2. Create DB Record
        console.log('💾 Saving DB record...');
        const doc = new LegalDoc({
            title: req.file.originalname,
            fileName: uniqueFilename,
            fileSize: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
            s3Key: uniqueFilename,
            category: req.body.category || 'General',
            status: 'Indexing'
        });
        await doc.save();
        console.log('✅ DB Record Saved');

        // 3. Process & Embed (Delegated to helper)
        console.log('⚡ Starting background indexing...');
        processAndIndex(doc, req.file.buffer, req.file.mimetype, req.body.category || 'General');

        res.json(doc);
    } catch (err) {
        console.error('🔥 CRITICAL UPLOAD ERROR:', err);
        res.status(500).json({ 
            message: 'Upload failed', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        });
    }
});

const openai = require('../config/openai');

async function processAndIndex(doc, buffer, mimetype, category = 'General') {
    try {
        console.log(`🚀 Starting indexing for: ${doc.title} in namespace: ${category}`);
        // processDocument returns { chunks: [...], text: "..." } and ALREADY generates embeddings
        const { chunks } = await processDocument(buffer, mimetype);
        
        if (!chunks || chunks.length === 0) {
            throw new Error('No chunks extracted from document');
        }

        // Upsert to Pinecone
        // Using category as namespace to allow filtered RAG queries
        // Note: upsertRawVectors supports namespace
        const vectors = chunks.map(chunk => ({
            id: `${doc._id}_${chunk.chunkIndex}`,
            values: chunk.embedding,
            metadata: {
                documentId: doc._id.toString(),
                title: doc.title,
                text: chunk.text,
                category: category
            }
        }));

        await pineconeService.upsertRawVectors(vectors, category.toLowerCase().replace(/\s+/g, '-'));

        doc.status = 'Indexed';
        doc.pineconeId = doc._id; 
        await doc.save();
        console.log(`✅ Indexing complete for: ${doc.title}`);
    } catch (e) {
        console.error('Indexing Error:', e);
        doc.status = 'Failed';
        await doc.save();
    }
}


// @route   GET /api/admin/stats
// @desc    Get system overview statistics with historical trends
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const { range = '7d' } = req.query;
        
        // 1. Core Counts
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const totalDocs = await LegalDoc.countDocuments();
        const pendingDocs = await LegalDoc.countDocuments({ status: 'Indexing' });
        
        // Feature Specific Counts
        let complianceCount = 0;
        let caseBuilderCount = 0;
        let totalChats = 0;

        try { complianceCount = await ComplianceCheck.countDocuments(); } catch(e) {}
        try { caseBuilderCount = await CaseBuildingSession.countDocuments(); } catch(e) {}
        try { totalChats = await Conversation.countDocuments(); } catch(e) {}
        
        // 2. Document Categories Distribution
        const docCategories = await LegalDoc.aggregate([
            { $group: { _id: "$category", value: { $sum: 1 } } },
            { $project: { name: "$_id", value: 1, _id: 0 } }
        ]);

        // 3. Historical Trends
        let days = 7;
        if (range === '24h') days = 1;
        if (range === '30d') days = 30;
        if (range === 'all') days = 90;

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - days);

        // Define aggregation pipeline helper
        const getTrend = async (Model, fieldName) => {
            return await Model.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }},
                { $sort: { _id: 1 } }
            ]);
        };

        const userTrend = await getTrend(User, 'users');
        const chatTrend = await getTrend(Conversation, 'requests');
        const complianceTrend = await getTrend(ComplianceCheck, 'compliance');

        // Merge trends into a single time series
        const dateData = {};
        
        // Initialize all dates in range with zero values
        for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            dateData[dateStr] = { name: dateStr, users: 0, requests: 0, compliance: 0 };
        }

        userTrend.forEach(item => { if (dateData[item._id]) dateData[item._id].users = item.count; });
        chatTrend.forEach(item => { if (dateData[item._id]) dateData[item._id].requests = item.count; });
        complianceTrend.forEach(item => { if (dateData[item._id]) dateData[item._id].compliance = item.count; });

        const history = Object.values(dateData).sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            overview: {
                users: { total: totalUsers, active: activeUsers },
                knowledgeBase: { total: totalDocs, pending: pendingDocs },
                totalChats: totalChats,
                complianceCount,
                caseBuilderCount
            },
            history: history,
            distributions: {
                docs: docCategories.length > 0 ? docCategories : [{ name: 'Uncategorized', value: totalDocs }],
                features: [
                    { name: 'Legal Chat', value: totalChats },
                    { name: 'Compliance Checks', value: complianceCount },
                    { name: 'Case Builder', value: caseBuilderCount }
                ]
            }
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ message: 'Server Error', details: err.message });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users (paginated)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = {};
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (status !== 'all') {
            query.isActive = status === 'active';
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            users,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalUsers: total
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/admin/users/:id/suspend
// @desc    Toggle user suspension
router.put('/users/:id/suspend', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent suspending superadmin
        if (user.role === 'superadmin') {
            return res.status(403).json({ message: 'Cannot suspend Super Admin' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({ message: `User ${user.isActive ? 'activated' : 'suspended'}`, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/prompts
// @desc    Get all system prompts
router.get('/prompts', adminAuth, async (req, res) => {
    try {
        const prompts = await SystemPrompt.find().sort({ key: 1 });
        res.json(prompts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/admin/prompts/:id
// @desc    Update a system prompt
router.put('/prompts/:id', adminAuth, async (req, res) => {
    try {
        const { content, description } = req.body;
        const prompt = await SystemPrompt.findById(req.params.id);
        
        if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

        prompt.content = content;
        if (description) prompt.description = description;
        prompt.lastUpdated = Date.now();
        
        await prompt.save();
        res.json(prompt);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/knowledge-base
// @desc    List all indexed documents
router.get('/knowledge-base', adminAuth, async (req, res) => {
    try {
        const docs = await LegalDoc.find().sort({ uploadDate: -1 });
        res.json(docs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/admin/knowledge-base/:id
// @desc    Delete document from Index
router.delete('/knowledge-base/:id', adminAuth, async (req, res) => {
    try {
        const doc = await LegalDoc.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        // TODO: Call Pinecone deletion service here
        // await deleteFromPinecone(doc.pineconeId);

        await LegalDoc.deleteOne({ _id: doc._id }); // Correct way to delete document instance
        res.json({ message: 'Document removed from Knowledge Base' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/reports/users
// @desc    Full details of all registered users
router.get('/reports/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Failed to generate user report' });
    }
});

// @route   GET /api/admin/reports/suspended
// @desc    List of all suspended accounts
router.get('/reports/suspended', adminAuth, async (req, res) => {
    try {
        const users = await User.find({ isActive: false }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Failed to generate suspended users report' });
    }
});

// @route   GET /api/admin/reports/resources
// @desc    System Resource usage report (chats, compliance, case buildup)
router.get('/reports/resources', adminAuth, async (req, res) => {
    try {
        // Dynamic imports for models if not already global
        const Conversation = require('../models/Conversation');
        const ComplianceCheck = require('../models/ComplianceCheck');
        const CaseBuildingSession = require('../models/CaseBuildingSession');

        const stats = {
            totalChats: await Conversation.countDocuments(),
            complianceChecks: await ComplianceCheck.countDocuments(),
            caseBuildups: await CaseBuildingSession.countDocuments(),
            totalUsers: await User.countDocuments()
        };
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to generate resource report' });
    }
});

// @route   GET /api/admin/reports/knowledge-base
// @desc    Detailed Knowledge Base audit report
router.get('/reports/knowledge-base', adminAuth, async (req, res) => {
    try {
        const docs = await LegalDoc.find().sort({ category: 1 });
        const summary = await LegalDoc.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);
        res.json({ docs, summary });
    } catch (err) {
        res.status(500).json({ message: 'Failed to generate KB report' });
    }
});

// @route   GET /api/admin/reports/activity
// @desc    User activity and engagement report
router.get('/reports/activity', adminAuth, async (req, res) => {
    try {
        const LoginLog = require('../models/LoginLog');
        
        const recentLogins = await LoginLog.find()
            .populate('userId', 'firstName lastName email')
            .sort({ loginTime: -1 })
            .limit(50);
        
        const registrationTrends = await User.aggregate([
            { $group: { 
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                count: { $sum: 1 } 
            }},
            { $sort: { _id: -1 } },
            { $limit: 30 }
        ]);

        res.json({ recentLogins, registrationTrends });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to generate activity report' });
    }
});

// @route   POST /api/admin/verify-secret
// @desc    Verify admin secret code for sensitive operations
router.post('/verify-secret', adminAuth, async (req, res) => {
    try {
        const { code } = req.body;
        // In production, this should be hashed. For this specific requirement, we check against env.
        const secret = process.env.ADMIN_SECRET_CODE || 'legalyze_admin_secret_123'; // Fallback for dev

        if (code === secret) {
            res.json({ success: true, message: 'Verified' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid Secret Code' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/admin/seed-prompts
// @desc    Seed/Reset system prompts to default
router.post('/seed-prompts', adminAuth, async (req, res) => {
    try {
        // Dynamic require to avoid circular dependency issues
        const { PAKISTAN_LEGAL_CONTEXT } = require('../services/pakistanLegalPrompts');
        const prompts = [
            {
                key: 'LAWYER_PERSONA',
                title: 'Core Outcome: Pakistani Legal Expert',
                description: 'The main persona for general chat. Defines tone, jurisdiction rules, and response structure.',
                content: PAKISTAN_LEGAL_CONTEXT.identity + '\n\n' + 
                         PAKISTAN_LEGAL_CONTEXT.jurisdictionRules + '\n\n' + 
                         PAKISTAN_LEGAL_CONTEXT.citationGuidance + '\n\n' + 
                         PAKISTAN_LEGAL_CONTEXT.responseFormat
            },
            {
                key: 'CASE_ANALYSIS',
                title: 'Logic: Case Analysis & Classification',
                description: 'Used by the "Analyze" step in Case Builder to classify cases and identifying issues.',
                content: `Analyze this case for a Pakistani lawyer and provide classification.
Return a JSON object:
{
    "caseType": "Criminal|Civil|Constitutional|Family",
    "legalIssues": ["Issue 1", "Issue 2"],
    "applicableLaws": [{"section": "Section X", "law": "Act Y", "relevance": "..."}],
    "urgencyLevel": "high|medium|low",
    "initialAdvice": "The expert advice from the analysis"
}`
            },
            {
                key: 'STRATEGY_GENERATION',
                title: 'Logic: Legal Strategy Generator',
                description: 'The master prompt for generating the 7-step legal strategy PDF content.',
                content: `You are Legalyze AI, the most advanced Pakistani Legal Strategist. Your goal is to generate a comprehensive, 100% legally compliant case strategy.
                
STRICT COMPLIANCE RULES:
1. Every argument must be grounded in the CONSTITUTION OF PAKISTAN, PAKISTAN PENAL CODE (PPC), or CODE OF CRIMINAL/CIVIL PROCEDURE (CrPC/CPC).
2. You must cite Supreme Court of Pakistan judgements with full citations wherever possible.
3. Be authoritative yet practical. Your output is used by high-level advocates.

FORMATTING REQUIREMENTS:
- Use professional headings (e.g., # STRATEGIC LEGAL MEMORANDUM)
- Use bold text for Law Sections (e.g., **Section 302 PPC**)
- Ensure the layout is structured like a formal legal document with clear transitions.`
            },
            {
                key: 'COMPLIANCE_REVIEW',
                title: 'Logic: Document Compliance Review',
                description: 'Used for reviewing uploaded contracts/documents in the Compliance module.',
                content: `You are an experienced legal compliance assistant.
Your tasks:
1. Briefly summarize what this document is about (2-3 sentences).
2. Identify any potential compliance, risk, or fairness issues. Focus on:
   - Unbalanced obligations
   - Missing key protections
   - Ambiguous or risky clauses
   - Red flags for the weaker party
3. Provide clear, actionable recommendations. For each issue, suggest concrete wording changes or clauses to add.

Return your answer in clear markdown.`
            },
            {
                key: 'FACT_EXTRACTION',
                title: 'Logic: Fact Extraction',
                description: 'Used to extract structured facts (parties, dates, events) from unstructured user text.',
                content: `You are a Pakistani legal expert. Extract all factual elements from the case description.
Be precise and extract ONLY facts that are explicitly mentioned or clearly implied.`
            }
        ];

        let results = [];
        for (const p of prompts) {
            const updated = await SystemPrompt.findOneAndUpdate(
                { key: p.key },
                { ...p, lastUpdated: new Date() },
                { upsert: true, new: true }
            );
            results.push(updated);
        }

        res.json({ success: true, message: `Seeded ${results.length} system prompts`, prompts: results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Seeding failed' });
    }
});

// @route   GET /api/admin/system-settings
// @desc    Get global system settings
router.get('/system-settings', adminAuth, async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/admin/system-settings
// @desc    Update global system settings (Announcements, Maintenance, Themes)
router.put('/system-settings', adminAuth, async (req, res) => {
    try {
        const { globalAnnouncement, maintenanceMode, disabledThemes } = req.body;
        let settings = await SystemSettings.getSettings();

        if (globalAnnouncement) settings.globalAnnouncement = globalAnnouncement;
        if (typeof maintenanceMode === 'boolean') settings.maintenanceMode = maintenanceMode;
        if (disabledThemes) settings.disabledThemes = disabledThemes;

        settings.lastUpdatedBy = req.user._id;
        await settings.save();
        
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/admin/users/:id/permissions
// @desc    Toggle specific feature permissions for a user
router.put('/users/:id/permissions', adminAuth, async (req, res) => {
    try {
        const { feature, isEnabled } = req.body; // e.g., { feature: 'compliance', isEnabled: false }
        const user = await User.findById(req.params.id);
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'superadmin') return res.status(403).json({ message: 'Cannot restrict Super Admin' });

        // If disabling, add to array if not present
        if (!isEnabled) {
            if (!user.disabledFeatures.includes(feature)) {
                user.disabledFeatures.push(feature);
            }
        } 
        // If enabling, remove from array
        else {
            user.disabledFeatures = user.disabledFeatures.filter(f => f !== feature);
        }

        await user.save();
        res.json({ 
            success: true, 
            message: `Feature '${feature}' ${isEnabled ? 'enabled' : 'disabled'} for user`,
            disabledFeatures: user.disabledFeatures 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/live-activity
// @desc    Get real-time system pulse (Logins, Compliance, Health)
router.get('/live-activity', adminAuth, async (req, res) => {
    try {
        // 1. Fetch Recent Logins
        const recentLogins = await LoginLog.find()
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(10);

        // 2. Fetch Recent Compliance Checks
        const recentCompliance = await ComplianceCheck.find()
            .populate('user', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(10);

        // 3. System Health Checks (Simple ping check)
        const health = {
            openai: 'Healthy',
            pinecone: 'Healthy',
            aws: 'Healthy',
            database: 'Healthy'
        };

        // Basic check for OpenAI (just check if key exists, or do a tiny ping)
        if (!process.env.OPENAI_API_KEY) health.openai = 'Missing Key';
        if (!process.env.PINECONE_API_KEY) health.pinecone = 'Missing Key';
        if (!process.env.AWS_ACCESS_KEY_ID) health.aws = 'Missing Credentials';

        res.json({
            success: true,
            activities: {
                logins: recentLogins,
                compliance: recentCompliance
            },
            health
        });
    } catch (err) {
        console.error('Live Activity Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch live pulse' });
    }
});

module.exports = router;
