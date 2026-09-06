const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GeneratedDocument = require('../models/GeneratedDocument');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const { protect } = require('../middleware/auth');
const { mapFactsToFields, generateFieldStatusMessage, validateFields } = require('../services/fieldMapper');
const { checkFactCompleteness } = require('../services/factExtractor');
const { generateRentAgreementPDF } = require('../utils/pdfGenerator');

/**
 * Smart Document Generation Routes
 * Handles intelligent document generation with auto-filled fields from extracted facts
 */

// @route   POST /api/smart-generate/analyze
// @desc    Analyze user's extracted facts for a specific document type
// @access  Private
router.post('/analyze', protect, async (req, res) => {
    try {
        const { documentType } = req.body;

        if (!documentType) {
            return res.status(400).json({
                success: false,
                message: 'Document type is required'
            });
        }

        // Get user with extracted facts
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Map facts to template fields
        const mappedFields = mapFactsToFields(user.extractedFacts || {}, documentType);

        // Check completeness
        const completeness = checkFactCompleteness(user.extractedFacts || {}, documentType);

        // Generate status message
        const fieldStatus = generateFieldStatusMessage(user.extractedFacts || {}, documentType);

        // Validate fields
        const validation = validateFields(mappedFields, documentType);

        res.status(200).json({
            success: true,
            data: {
                documentType,
                mappedFields,
                completeness,
                statusMessage: fieldStatus.message,
                validation,
                factsLastUpdated: user.factsLastUpdated
            }
        });

    } catch (error) {
        console.error('Error analyzing facts:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing facts for document generation',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/smart-generate/generate
// @desc    Generate document with auto-filled fields (and optional user overrides)
// @access  Private
router.post('/generate', protect, async (req, res) => {
    try {
        const { documentType, fieldOverrides, allowMissingFields } = req.body;

        if (!documentType) {
            return res.status(400).json({
                success: false,
                message: 'Document type is required'
            });
        }

        // Get user with extracted facts
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Map facts to template fields
        let mappedFields = mapFactsToFields(user.extractedFacts || {}, documentType);

        // Apply user overrides if provided
        if (fieldOverrides) {
            mappedFields = { ...mappedFields, ...fieldOverrides };
        }

        // Check completeness
        const completeness = checkFactCompleteness(user.extractedFacts || {}, documentType);

        // If not complete and user hasn't allowed missing fields, return error
        if (!completeness.isComplete && !allowMissingFields) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields: completeness.missingFields,
                completeness
            });
        }

        // Validate fields
        const validation = validateFields(mappedFields, documentType);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Field validation failed',
                errors: validation.errors
            });
        }


        // Generate the document based on type
        let htmlContent;
        let fileName;
        
        if (documentType === 'house-rent') {
            const { generateRentAgreementHTML } = require('../utils/htmlGenerator');
            htmlContent = generateRentAgreementHTML(mappedFields);
            fileName = `Rent_Agreement_${mappedFields.companyName?.replace(/\s+/g, '_') || 'Document'}_${Date.now()}.html`;
        } else {
            // Check if it exists in our new template registry
            let isRegistryTemplate = false;
            try {
                const templates = require('../config/documentTemplates');
                const templateDef = templates.find(t => t.id === documentType);
                
                if (templateDef) {
                    const { generateLegalDocumentHTML } = require('../utils/htmlGenerator');
                    htmlContent = generateLegalDocumentHTML(documentType, mappedFields);
                    fileName = `${templateDef.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
                    isRegistryTemplate = true;
                }
            } catch (err) {
                console.warn('Template registry check failed, falling back to generic:', err.message);
            }

            if (!isRegistryTemplate) {
                // Use generic HTML generator for other types
                const { generateGenericHTML } = require('../utils/htmlGenerator');
                const title = documentType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                htmlContent = generateGenericHTML(title + ' Document', mappedFields);
                fileName = `${documentType}_${Date.now()}.html`;
            }
        }

        // Save to database with HTML content
        const generatedDoc = new GeneratedDocument({
            userId: req.user._id,
            user: req.user._id,
            fileName: fileName,
            documentType: documentType,
            formData: mappedFields,
            htmlContent: htmlContent,
            fileSize: Buffer.byteLength(htmlContent, 'utf8')
        });

        await generatedDoc.save();

        // Generate view token for secure access
        const viewToken = generatedDoc.generateViewToken();
        const viewUrl = `/api/generate/view/${viewToken}`;

        res.status(200).json({
            success: true,
            message: 'Document generated successfully',
            data: {
                document: {
                    id: generatedDoc._id,
                    fileName: fileName,
                    url: `/api/generate/documents/${generatedDoc._id}`,
                    htmlUrl: viewUrl,
                    viewUrl: viewUrl,
                    createdAt: generatedDoc.createdAt
                },
                usedFields: mappedFields,
                completeness
            }
        });

    } catch (error) {
        console.error('Error generating document:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating document',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/smart-generate/facts
// @desc    Get user's extracted facts
// @access  Private
router.get('/facts', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                extractedFacts: user.extractedFacts || {},
                factsLastUpdated: user.factsLastUpdated
            }
        });

    } catch (error) {
        console.error('Error fetching facts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching extracted facts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   PUT /api/smart-generate/facts
// @desc    Update user's extracted facts manually
// @access  Private
router.put('/facts', protect, async (req, res) => {
    try {
        const { extractedFacts } = req.body;

        if (!extractedFacts) {
            return res.status(400).json({
                success: false,
                message: 'Extracted facts are required'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.extractedFacts = extractedFacts;
        user.factsLastUpdated = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Facts updated successfully',
            data: {
                extractedFacts: user.extractedFacts,
                factsLastUpdated: user.factsLastUpdated
            }
        });

    } catch (error) {
        console.error('Error updating facts:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating extracted facts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   DELETE /api/smart-generate/facts
// @desc    Clear user's extracted facts
// @access  Private
router.delete('/facts', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.extractedFacts = {};
        user.factsLastUpdated = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Facts cleared successfully'
        });

    } catch (error) {
        console.error('Error clearing facts:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing extracted facts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/smart-generate/documents/:id/html
// @desc    Get HTML content of a generated document
// @access  Private
router.get('/documents/:id/html', protect, async (req, res) => {
    try {
        const doc = await GeneratedDocument.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        if (!doc.htmlContent) {
            return res.status(404).json({
                success: false,
                message: 'HTML content not available for this document'
            });
        }

        // Set headers for HTML
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
        res.send(doc.htmlContent);

    } catch (error) {
        console.error('Error fetching HTML document:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching document',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
