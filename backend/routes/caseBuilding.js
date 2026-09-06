const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const CaseBuildingSession = require('../models/CaseBuildingSession');
const openai = require('../config/openai');
const verificationService = require('../services/verificationService');
const LegalAgentService = require('../services/LegalAgentService');
const { PETITION_TEMPLATES } = require('../services/petitionTemplates');

/**
 * @route   POST /api/case-building/sessions
 * @desc    Create a new case building session
 * @access  Private
 */
router.post('/sessions', protect, async (req, res) => {
    try {
        const { facts, caseType, clientPosition, courtLevel, urgency } = req.body;

        const session = await CaseBuildingSession.create({
            user: req.user.id,
            caseDetails: {
                facts,
                caseType: caseType || 'other',
                clientPosition: clientPosition || 'petitioner',
                courtLevel: courtLevel || 'district',
                urgency: urgency || 'normal'
            },
            currentStep: 0,
            status: 'in_progress'
        });

        res.status(201).json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create case building session'
        });
    }
});

/**
 * @route   GET /api/case-building/sessions
 * @desc    Get all user's case building sessions
 * @access  Private
 */
router.get('/sessions', protect, async (req, res) => {
    try {
        const { status, limit = 20 } = req.query;
        
        const query = { user: req.user.id };
        if (status) query.status = status;

        const sessions = await CaseBuildingSession.find(query)
            .select('title caseDetails.caseType caseDetails.facts status currentStep createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: sessions.length,
            data: sessions
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sessions'
        });
    }
});

/**
 * @route   GET /api/case-building/sessions/:id
 * @desc    Get single session with full details
 * @access  Private
 */
router.get('/sessions/:id', protect, async (req, res) => {
    try {
        const session = await CaseBuildingSession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch session'
        });
    }
});

/**
 * @route   PUT /api/case-building/sessions/:id
 * @desc    Update session (save progress)
 * @access  Private
 */
router.put('/sessions/:id', protect, async (req, res) => {
    try {
        const updates = req.body;
        
        const session = await CaseBuildingSession.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Update session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update session'
        });
    }
});

/**
 * @route   DELETE /api/case-building/sessions/:id
 * @desc    Delete a session
 * @access  Private
 */
router.delete('/sessions/:id', protect, async (req, res) => {
    try {
        const session = await CaseBuildingSession.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            message: 'Session deleted'
        });

    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete session'
        });
    }
});

/**
 * @route   POST /api/case-building/extract-facts
 * @desc    Extract factual elements from case description
 * @access  Private
 */
router.post('/extract-facts', protect, async (req, res) => {
    try {
        const { facts } = req.body;

        if (!facts || facts.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a detailed case description'
            });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'system',
                content: `You are a Pakistani legal expert. Extract all factual elements from the case description.
Be precise and extract ONLY facts that are explicitly mentioned or clearly implied.

Return a JSON object with:
{
    "parties": [{"name": "Person's name or role", "role": "complainant/accused/victim/witness"}],
    "dates": [{"date": "Date mentioned", "event": "What happened on this date"}],
    "locations": [{"place": "Location name", "relevance": "Why this place is relevant"}],
    "keyEvents": [{"description": "What happened", "importance": "high/medium/low"}],
    "evidence": [{"type": "document/witness/physical/digital", "description": "Description of evidence"}],
    "keyFacts": ["Fact 1", "Fact 2", ...] // Simple bullet points of key facts
}`
            }, {
                role: 'user',
                content: `Extract all factual elements from this case:\n\n${facts}`
            }],
            response_format: { type: 'json_object' },
            temperature: 0.1
        });

        const extractedFacts = JSON.parse(response.choices[0].message.content);

        res.json({
            success: true,
            data: extractedFacts
        });

    } catch (error) {
        console.error('Extract facts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to extract facts'
        });
    }
});

/**
 * @route   POST /api/case-building/analyze
 * @desc    Analyze case and get classification (Step 1)
 * @access  Private
 */
router.post('/analyze', protect, async (req, res) => {
    try {
        const { facts, sessionId } = req.body;

        // Use LegalAgentService for cited analysis
        const agenticResult = await LegalAgentService.processQuery(
            `Analyze this case for a Pakistani lawyer and provide classification: ${facts}`,
            { userId: req.user.id }
        );

        // Still need the JSON format for the UI, so we keep a focused classification call
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'system',
                content: `You are Legalyze AI classification engine. Extract structured data from this analysis:
                ${agenticResult.content}

Return a JSON object:
{
    "caseType": "Criminal|Civil|Constitutional|Family",
    "legalIssues": ["Issue 1", "Issue 2"],
    "applicableLaws": [{"section": "Section X", "law": "Act Y", "relevance": "..."}],
    "urgencyLevel": "high|medium|low",
    "initialAdvice": "The expert advice from the analysis"
}`
            }],
            response_format: { type: 'json_object' },
            temperature: 0.1
        });

        const classification = JSON.parse(response.choices[0].message.content);

        // Update session if provided
        if (sessionId) {
            await CaseBuildingSession.findOneAndUpdate(
                { _id: sessionId, user: req.user.id },
                { 
                    classification,
                    'caseDetails.caseType': classification.caseType?.toLowerCase(),
                    selectedTemplateId: agenticResult.metadata.suggestedTemplateId,
                    currentStep: 1
                }
            );
        }

        res.json({
            success: true,
            data: classification
        });

    } catch (error) {
        console.error('Analyze error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze case'
        });
    }
});

/**
 * @route   GET /api/case-building/templates
 * @desc    Get all available petition templates
 * @access  Private
 */
router.get('/templates', protect, async (req, res) => {
    res.json({
        success: true,
        data: PETITION_TEMPLATES
    });
});

/**
 * @route   POST /api/case-building/strategy
 * @desc    Generate comprehensive case strategy (Step 5)
 * @access  Private
 */
router.post('/strategy', protect, async (req, res) => {
    try {
        const { facts, caseType, clientPosition, courtLevel, relevantLaws, precedents, extractedFacts, sessionId } = req.body;

        // Build context from extracted facts
        let factsContext = '';
        if (extractedFacts?.keyFacts?.length > 0) {
            factsContext = `\n\nKEY FACTUAL ELEMENTS (Reference these specifically):\n${extractedFacts.keyFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;
        }
        if (extractedFacts?.dates?.length > 0) {
            factsContext += `\n\nCRITICAL DATES:\n${extractedFacts.dates.map(d => `- ${d.date}: ${d.event}`).join('\n')}`;
        }
        if (extractedFacts?.evidence?.length > 0) {
            factsContext += `\n\nAVAILABLE EVIDENCE:\n${extractedFacts.evidence.map(e => `- ${e.type}: ${e.description}`).join('\n')}`;
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'system',
                content: `You are Legalyze AI, the most advanced Pakistani Legal Strategist. Your goal is to generate a comprehensive, 100% legally compliant case strategy.
                
STRICT COMPLIANCE RULES:
1. Every argument must be grounded in the CONSTITUTION OF PAKISTAN, PAKISTAN PENAL CODE (PPC), or CODE OF CRIMINAL/CIVIL PROCEDURE (CrPC/CPC).
2. You must cite Supreme Court of Pakistan judgements with full citations wherever possible.
3. Be authoritative yet practical. Your output is used by high-level advocates.

FORMATTING REQUIREMENTS:
- Use professional headings (e.g., # STRATEGIC LEGAL MEMORANDUM)
- Use bold text for Law Sections (e.g., **Section 302 PPC**)
- Ensure the layout is structured like a formal legal document with clear transitions.
- The output must look high-end when rendered as a PDF.`
            }, {
                role: 'user',
                content: `Generate an Intelligent Legal Strategy for a case under Pakistani Law.
                
**CASE PARAMETERS:**
- **Type:** ${caseType}
- **Role:** ${clientPosition}
- **Forum:** ${courtLevel}

**FACTUAL BASIS:**
${facts}
${factsContext}

**LEGAL BASIS (Provided References):**
- **Statutes:** ${JSON.stringify(relevantLaws?.slice(0, 5) || [], null, 2)}
- **Precedents:** ${JSON.stringify(precedents?.slice(0, 5) || [], null, 2)}

Please provide a detailed strategy with the following structure:

# STRATEGIC LEGAL MEMORANDUM

## 1. EXECUTIVE SUMMARY
Professional overview of the legal position.

## 2. CONSTITUTIONAL & STATUTORY FRAMEWORK
Detailed analysis of applicable articles of the Constitution and sections of PPC/CrPC/CPC.

## 3. MANDATORY PRECEDENTS
Analysis of Supreme Court and High Court judgements provided in context.

## 4. THE "WHY" (LEGAL REASONING)
Explain the logical path from Facts -> Law -> Desired Outcome. Address the specific facts extracted.

## 5. ANTICIPATED CHALLENGES & COUNTER-ARGUMENTS
What will the opposing counsel argue? How do we neutralize it?

## 6. PROCEDURAL ROADMAP
Detailed steps for filing, stay orders, and trial management.

## 7. RECOMMENDED ACTION PLAN
Immediate prioritized steps.`
            }],
            temperature: 0.3,
            max_tokens: 3000
        });

        let strategy = response.choices[0].message.content;

        // VERIFICATION: Check hallucinations
        strategy = await verificationService.annotateStrategy(strategy);

        // Update session if provided
        if (sessionId) {
            await CaseBuildingSession.findOneAndUpdate(
                { _id: sessionId, user: req.user.id },
                { strategy, currentStep: 4, status: 'completed' }
            );
        }

        res.json({
            success: true,
            data: { strategy }
        });

    } catch (error) {
        console.error('Strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate strategy'
        });
    }
});

const { generateStrategyPDF } = require('../services/caseStrategyPDF');
const { generateLegalDocumentPDF } = require('../services/legalDocumentPDF');

/**
 * @route   GET /api/case-building/sessions/:id/export
 * @desc    Export case strategy as PDF
 * @access  Private
 */
router.get('/sessions/:id/export', protect, async (req, res) => {
    try {
        const session = await CaseBuildingSession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session || !session.strategy) {
            return res.status(404).json({
                success: false,
                message: 'Session or strategy not found'
            });
        }

        const pdfBuffer = await generateStrategyPDF({ session, user: req.user });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Legal_Strategy_${session._id}.pdf`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Export strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export strategy as PDF'
        });
    }
});

/**
 * @route   GET /api/case-building/sessions/:id/documents/:index/export
 * @desc    Export a specific drafted document as PDF
 * @access  Private
 */
router.get('/sessions/:id/documents/:index/export', protect, async (req, res) => {
    try {
        const session = await CaseBuildingSession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session || !session.documents || !session.documents[req.params.index]) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const document = session.documents[req.params.index];
        const pdfBuffer = await generateLegalDocumentPDF({ document, session, user: req.user });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Legal_Document_${req.params.index}.pdf`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Export document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export document as PDF'
        });
    }
});

/**
 * @route   POST /api/case-building/save-filing-details
 * @desc    Save filing details for a session
 * @access  Private
 */
router.post('/save-filing-details', protect, async (req, res) => {
    try {
        const { sessionId, factualFields } = req.body;
        
        const session = await CaseBuildingSession.findOneAndUpdate(
            { _id: sessionId, user: req.user.id },
            { 
                $set: { factualFields: factualFields },
                currentStep: 6 // Corresponds to Drafting step
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Save filing details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save filing details'
        });
    }
});

/**
 * @route   POST /api/case-building/draft
 * @desc    Generate a legal document draft using AI (fallback or custom)
 * @access  Private
 */
router.post('/draft', protect, async (req, res) => {
    try {
        const { facts, strategy, relevantLaws, precedents, sessionId, filingDetails, templateId } = req.body;

        // Get the template - default to WRIT_PETITION_199
        const selectedTemplate = PETITION_TEMPLATES[templateId] || PETITION_TEMPLATES.WRIT_PETITION_199;
        
        // Get the template content
        let documentContent = selectedTemplate.template;
        
        // Replace all placeholders with actual values from filingDetails
        if (filingDetails) {
            Object.keys(filingDetails).forEach(key => {
                const placeholder = `{{${key}}}`;
                const value = filingDetails[key] || '______';
                documentContent = documentContent.replace(new RegExp(placeholder, 'g'), value);
            });
        }
        
        // Replace any remaining placeholders with underscores
        documentContent = documentContent.replace(/\{\{[^}]+\}\}/g, '______');

        const newDoc = {
            type: selectedTemplate.name,
            content: documentContent,
            createdAt: new Date()
        };

        if (sessionId) {
            await CaseBuildingSession.findOneAndUpdate(
                { _id: sessionId, user: req.user.id },
                { $push: { documents: newDoc } }
            );
        }

        res.json({
            success: true,
            data: newDoc
        });

    } catch (error) {
        console.error('Drafting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate legal document'
        });
    }
});

module.exports = router;
