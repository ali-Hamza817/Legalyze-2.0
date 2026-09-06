const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Judgment = require('../models/Judgment');
const {
    runScrapingPipeline,
    getJudgmentContext
} = require('../services/judgmentScraper');
const { hybridSearch, intelligentSearch } = require('../services/searchService');

/**
 * @route   GET /api/judgments/search
 * @desc    Search indexed Supreme Court judgments (Hybrid: Keyword + Vector)
 * @access  Private
 */
router.get('/search', protect, async (req, res) => {
    try {
        const { query, caseType, year, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const filters = {};
        if (caseType) filters.caseType = caseType;
        if (year) filters.year = parseInt(year);

        const results = await hybridSearch(query, filters, parseInt(limit));

        res.json({
            success: true,
            count: results.length,
            data: results
        });

    } catch (error) {
        console.error('Judgment search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching judgments',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/judgments/intelligent-search
 * @desc    Deep Search indexed Supreme Court judgments (Hybrid + AI re-ranking)
 * @access  Private
 */
router.post('/intelligent-search', protect, async (req, res) => {
    try {
        const { query, caseType, filters = {}, limit = 5 } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const standardFilters = { ...filters };
        if (caseType) standardFilters.caseType = caseType;

        const results = await intelligentSearch(query, standardFilters, parseInt(limit));

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Intelligent search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing intelligent search',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/judgments/context
 * @desc    Get judgment context for RAG (used by chat)
 * @access  Private
 */
router.get('/context', protect, async (req, res) => {
    try {
        const { query, caseType } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query is required'
            });
        }

        const context = await getJudgmentContext(query, caseType);

        res.json({
            success: true,
            context: context
        });

    } catch (error) {
        console.error('Context fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching judgment context'
        });
    }
});

/**
 * @route   GET /api/judgments/list
 * @desc    List indexed judgments with filters
 * @access  Private
 */
router.get('/list', protect, async (req, res) => {
    try {
        const { caseType, court, page = 1, limit = 20 } = req.query;
        
        const query = { indexed: true };
        if (caseType) query.caseType = caseType;
        if (court) query.court = court;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const judgments = await Judgment.find(query)
            .select('citation caseTitle court caseType decisionDate ratio')
            .sort({ decisionDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Judgment.countDocuments(query);

        res.json({
            success: true,
            data: judgments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('List judgments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error listing judgments'
        });
    }
});

/**
 * @route   GET /api/judgments/:citation
 * @desc    Get single judgment by citation
 * @access  Private
 */
router.get('/:citation', protect, async (req, res) => {
    try {
        const judgment = await Judgment.findOne({
            citation: { $regex: req.params.citation, $options: 'i' }
        });

        if (!judgment) {
            return res.status(404).json({
                success: false,
                message: 'Judgment not found'
            });
        }

        res.json({
            success: true,
            data: judgment
        });

    } catch (error) {
        console.error('Get judgment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching judgment'
        });
    }
});

/**
 * @route   POST /api/judgments/scrape
 * @desc    Trigger scraping pipeline (Admin only)
 * @access  Private (should be admin-protected in production)
 */
router.post('/scrape', protect, async (req, res) => {
    try {
        const { maxPages = 3, delay = 2000 } = req.body;

        // Note: In production, add admin role check here
        console.log(`🚀 Scraping triggered by user: ${req.user.email}`);

        // Run asynchronously and return immediately
        res.json({
            success: true,
            message: 'Scraping pipeline started. Check server logs for progress.',
            config: { maxPages, delay }
        });

        // Run in background
        runScrapingPipeline({ maxPages, delay })
            .then(stats => {
                console.log('📊 Scraping completed:', stats);
            })
            .catch(err => {
                console.error('❌ Scraping failed:', err);
            });

    } catch (error) {
        console.error('Scrape trigger error:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting scraping pipeline'
        });
    }
});

/**
 * @route   GET /api/judgments/stats
 * @desc    Get judgment indexing statistics
 * @access  Private
 */
router.get('/stats/summary', protect, async (req, res) => {
    try {
        const totalIndexed = await Judgment.countDocuments({ indexed: true });
        const byType = await Judgment.aggregate([
            { $match: { indexed: true } },
            { $group: { _id: '$caseType', count: { $sum: 1 } } }
        ]);
        const byCourt = await Judgment.aggregate([
            { $match: { indexed: true } },
            { $group: { _id: '$court', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                total: totalIndexed,
                byType: byType.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {}),
                byCourt: byCourt.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {})
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

module.exports = router;
