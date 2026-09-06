const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const { protect } = require('../middleware/auth');
const ComplianceCheck = require('../models/ComplianceCheck');
const Conversation = require('../models/Conversation');
const { extractText } = require('../utils/documentProcessor');
const { extractSentencesWithProvenance } = require('../services/sentenceExtractor');
const { processThematicCompliance: processDocumentCompliance } = require('../services/complianceMatchingEngine'); // Aliased for minimal disruption
const { generateComplianceReport, generateStrictMarkdown } = require('../services/complianceReportGenerator');
const { classifyLegalDocument, verifyLegalReferences } = require('../services/legalComplianceAgent');
const { generatePDFReport } = require('../services/pdfReportGenerator');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed'));
        }
    }
});

// @route   POST /api/constitutional-compliance/check
// @desc    Enhanced constitutional compliance check with sentence-level mapping
// @access  Private
router.post('/check', protect, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log(`\n🏛️  ENHANCED Constitutional Compliance Check`);
        console.log(`   User: ${req.user.email}`);
        console.log(`   Document: ${req.file.originalname}`);

        // Step 1: Upload to S3
        let s3Key = null;
        let s3Url = null;
        
        try {
            const fileExtension = req.file.originalname.split('.').pop();
            const timestamp = new Date().toISOString().split('T')[0];
            const uuid = crypto.randomBytes(8).toString('hex');
            s3Key = `compliance/${req.user.id}/${timestamp}_${uuid}/${req.file.originalname}`;

            const uploadParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ServerSideEncryption: 'AES256',
                Metadata: {
                    originalName: req.file.originalname,
                    uploadedBy: req.user.id.toString(),
                    type: 'constitutional-compliance-v2'
                }
            };

            await s3Client.send(new PutObjectCommand(uploadParams));
            s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
            console.log('   ✅ Document uploaded to S3');
        } catch (s3Error) {
            console.error('   ⚠️  S3 upload failed:', s3Error.message);
        }

        // Step 2: Extract text from document
        console.log('   📄 Extracting text from document...');
        const documentText = await extractText(req.file.buffer, req.file.mimetype);
        
        if (!documentText || documentText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Could not extract text. The document might be a scanned image or empty. Please upload a machine-readable PDF or Word document.'
            });
        }

        console.log(`   ✅ Extracted ${documentText.length} characters`);

        // Step 2.5: Agentic Classification
        console.log('   🤖 Classifying document via Agentic RAG...');
        const classification = await classifyLegalDocument(documentText);
        console.log(`   📊 Classification: ${classification.classification} (Confidence: ${classification.confidence}%)`);

        if (!classification.isLegal) {
            return res.status(403).json({
                success: false,
                message: `Compliance check is only available for legal documents. This document looks like a "${classification.classification}".`,
                reasoning: classification.reasoning
            });
        }

        // Step 2.6: Verify References
        console.log('   📚 Verifying legal references in document...');
        const verifiedReferences = await verifyLegalReferences(documentText);
        console.log(`   ✅ Verified ${verifiedReferences.length} references.`);

        // Step 3: Extract sentences (kept for backward compatibility)
        console.log('   ✂️  Extracting sentences for report metadata...');
        const sentences = extractSentencesWithProvenance(documentText);

        // Step 4: High-speed Thematic Compliance Scan (Rapid Scan V2)
        console.log('   🔍 Performing high-speed thematic compliance matching...');
        const documentMeta = {
            name: req.file.originalname,
            s3Path: s3Url,
            size: req.file.size,
            mimeType: req.file.mimetype,
            userId: req.user.id,
            fullText: documentText,
            timestamp: new Date().toISOString()
        };

        const mappings = await processDocumentCompliance(documentText, documentMeta); 


        // Step 5: Generate comprehensive report
        console.log('   📝 Generating comprehensive compliance report...');
        const report = await generateComplianceReport(documentMeta, sentences, mappings, verifiedReferences);
        
        // Generate Strict Markdown for Chat Persistence
        console.log('   📋 Generating strict markdown format...');
        const strictMarkdown = generateStrictMarkdown(report);

        // Step 6: Generate PDF report
        console.log('   📄 Generating PDF report...');
        const pdfPath = path.join(__dirname, '../temp', `${report.report_id}.pdf`);
        
        // Ensure temp directory exists
        await fs.mkdir(path.join(__dirname, '../temp'), { recursive: true });
        
        await generatePDFReport(report, pdfPath);
        console.log('   ✅ PDF report generated');

        // Step 7: Upload PDF to S3
        let pdfS3Key = null;
        try {
            const pdfBuffer = await fs.readFile(pdfPath);
            if (s3Key) {
                pdfS3Key = s3Key.replace(path.basename(s3Key), `report_${report.report_id}.pdf`);
                
                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: pdfS3Key,
                    Body: pdfBuffer,
                    ContentType: 'application/pdf',
                    ServerSideEncryption: 'AES256'
                }));
                
                console.log('   ✅ PDF uploaded to S3');
            } else {
                console.warn('   ⚠️  Skipping PDF upload: s3Key is null');
            }
            
            // Clean up local PDF
            await fs.unlink(pdfPath).catch(() => {});
        } catch (pdfError) {
            console.error('   ⚠️  PDF upload failed:', pdfError.message);
        }

        // Step 8: Upload JSON report to S3
        let jsonS3Key = null;
        if (s3Key) {
            jsonS3Key = s3Key.replace(path.basename(s3Key), `report_${report.report_id}.json`);
            try {
                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: jsonS3Key,
                    Body: JSON.stringify(report, null, 2),
                    ContentType: 'application/json',
                    ServerSideEncryption: 'AES256'
                }));
                console.log('   ✅ JSON report uploaded to S3');
            } catch (jsonError) {
                console.error('   ⚠️  JSON upload failed:', jsonError.message);
            }
        } else {
            console.warn('   ⚠️  Skipping JSON upload: s3Key is null');
        }

        // Step 9: Save to database
        const complianceCheck = new ComplianceCheck({
            user: req.user.id,
            documentName: req.file.originalname,
            s3Key: s3Key,
            s3Url: s3Url,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            complianceStatus: report.summary.overallCompliance,
            complianceScore: report.summary.totalSnippets > 0 
                ? Math.round((report.summary.highConfidenceFindings / report.summary.totalSnippets) * 100)
                : 0,
            executiveSummary: report.summary.executiveSummary,
            detailedAnalysis: JSON.stringify(report),
            constitutionalProvisions: mappings.slice(0, 20).map(m => ({
                articleNumber: m.constitution_match.article || 'Unknown',
                heading: m.constitution_match.articleHeading || 'Unknown',
                part: m.constitution_match.part || null,
                partName: m.constitution_match.partName || null,
                relevance: m.decision,
                alignment: m.decision, // YES/NO/PARTIAL
                notes: (m.rationale || '').substring(0, 500)
            })),
            potentialIssues: report.violations.map(v => ({
                issue: v.description,
                severity: v.severity,
                constitutionalArticle: v.constitution_reference,
                recommendation: v.suggested_fix
            })),
            recommendations: report.suggested_actions.map(a => a.action).join('\n'),
            reportText: JSON.stringify(report, null, 2)
        });

        await complianceCheck.save();
        console.log('   ✅ Compliance check saved to database\n');

        // Step 10: Generate Smart Title & Create Persistent Conversation
        console.log('   🧠 Generating smart chat title...');
        let chatTitle = `Compliance: ${req.file.originalname.substring(0, 30)}`;
        try {
            const titlePrompt = `Generate a very concise, professional legal chat title (strictly 3-4 words) for this constitutional compliance report:
"${report.summary.executiveSummary.substring(0, 300)}"

Requirements:
1. Strictly 3-4 words.
2. Use strict legal terminology.
3. No quotes, no labels like "Title:", just the text.`;
            
            const titleResponse = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: titlePrompt }],
                temperature: 0.3,
                max_tokens: 30
            });
            chatTitle = titleResponse.choices[0].message.content.replace(/['"]/g, '').trim();
            console.log(`   ✅ Generated title: "${chatTitle}"`);
        } catch (e) {
            console.error('   ⚠️  Title generation failed, using default:', e.message);
        }

        const conversation = new Conversation({
            user: req.user.id,
            title: chatTitle,
            messages: [
                {
                    role: 'user',
                    content: `📝 Compliance Check for: **${req.file.originalname}**`,
                    metadata: {
                        fileName: req.file.originalname,
                        fileSize: req.file.size,
                        s3Url: s3Url
                    }
                },
                {
                    role: 'assistant',
                    content: strictMarkdown, // PERSISTENT STRICT MARKDOWN REPORT
                    metadata: {
                        complianceCheckId: complianceCheck._id,
                        reportId: report.report_id,
                        isStrictReport: true,
                        reportType: 'constitutional_compliance'
                    }
                }
            ],
            documentIds: [],
            metadata: {
                isComplianceReport: true,
                reportId: report.report_id,
                complianceScore: complianceCheck.complianceScore,
                documentName: req.file.originalname
            }
        });

        await conversation.save();
        console.log('   ✅ Conversation created with persistent strict report\n');

        // Step 11: Return comprehensive response
        res.status(200).json({
            success: true,
            message: 'Enhanced constitutional compliance check completed',
            data: {
                checkId: complianceCheck._id,
                conversationId: conversation._id, // NEW: Conversation ID for frontend navigation
                report_id: report.report_id,
                documentName: req.file.originalname,
                complianceStatus: report.summary.overallCompliance,
                complianceScore: complianceCheck.complianceScore,
                executiveSummary: report.summary.executiveSummary,
                keyFindings: report.summary.keyFindings,
                article_analysis: report.article_analysis, // NEW: Article-by-article breakdown
                totalMappings: mappings.length,
                violations: report.violations,
                mappings: mappings.slice(0, 10), // First 10 for preview
                confidence_summary: report.confidence_summary,
                suggested_actions: report.suggested_actions,
                reportUrls: {
                    json: jsonS3Key,
                    pdf: pdfS3Key
                },
                createdAt: complianceCheck.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Enhanced compliance check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing constitutional compliance check',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/constitutional-compliance/history
// @desc    Get user's compliance check history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const checks = await ComplianceCheck.find({
            user: req.user.id
        })
        .select('-reportText -detailedAnalysis')
        .sort({ createdAt: -1 })
        .limit(50);

        res.status(200).json({
            success: true,
            data: checks
        });

    } catch (error) {
        console.error('Get compliance history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching compliance history'
        });
    }
});

// @route   GET /api/constitutional-compliance/:id
// @desc    Get specific compliance check details
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const check = await ComplianceCheck.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!check) {
            return res.status(404).json({
                success: false,
                message: 'Compliance check not found'
            });
        }

        // Parse detailed analysis if it's a string
        let detailedAnalysis = check.detailedAnalysis;
        if (typeof detailedAnalysis === 'string') {
            try {
                detailedAnalysis = JSON.parse(detailedAnalysis);
            } catch (e) {
                // Keep as string if not valid JSON
            }
        }

        res.status(200).json({
            success: true,
            data: {
                ...check.toObject(),
                detailedAnalysis
            }
        });

    } catch (error) {
        console.error('Get compliance check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching compliance check'
        });
    }
});

module.exports = router;
