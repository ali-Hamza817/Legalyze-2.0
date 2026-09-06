const express = require('express');
const router = express.Router();
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const { protect } = require('../middleware/auth');
const GeneratedDocument = require('../models/GeneratedDocument');
const { generateRentAgreementPDF } = require('../utils/pdfGenerator');

// @route   POST /api/generate/rent-agreement
// @desc    Generate House Rent Agreement PDF
// @access  Private
router.post('/rent-agreement', protect, async (req, res) => {
    try {
        const formData = req.body;
        
        // Validate required fields
        const requiredFields = [
            'dateOfAgreement', 'landlordName', 'landlordFatherName', 'landlordAddress',
            'companyName', 'directorName', 'propertyAddress', 'monthlyRent',
            'leaseStartDate', 'signingPlace', 'signingDate'
        ];
        
        const missingFields = requiredFields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        
        console.log('Generating PDF for user:', req.user.email);
        
        // Generate PDF
        const pdfBuffer = await generateRentAgreementPDF(formData);
        
        // Create unique filename
        const timestamp = Date.now();
        const fileName = `Rent_Agreement_${formData.companyName.replace(/\s+/g, '_')}_${timestamp}.pdf`;
        const s3Key = `generated-documents/${req.user._id}/${fileName}`;
        
        console.log('Uploading to S3:', s3Key);
        
        // Upload to S3 with encryption
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ServerSideEncryption: 'AES256', // Server-side encryption
            Metadata: {
                userId: req.user._id.toString(),
                documentType: 'rent-agreement',
                generatedAt: new Date().toISOString()
            }
        });
        
        await s3Client.send(uploadCommand);
        
        // Generate S3 URL
        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        
        console.log('PDF uploaded successfully:', s3Url);
        
        // Save document metadata to database
        const generatedDocument = new GeneratedDocument({
            userId: req.user._id,
            documentType: 'rent-agreement',
            fileName,
            s3Key,
            s3Url,
            formData,
            fileSize: pdfBuffer.length,
            status: 'completed'
        });
        
        await generatedDocument.save();
        
        console.log('Document metadata saved to database');
        
        // Generate signed URL for immediate viewing
        const signedUrl = await generatedDocument.getSignedUrl();
        
        res.status(201).json({
            success: true,
            message: 'Document generated successfully',
            document: {
                id: generatedDocument._id,
                fileName,
                documentType: 'rent-agreement',
                fileSize: pdfBuffer.length,
                createdAt: generatedDocument.createdAt,
                signedUrl // For immediate viewing
            }
        });
        
    } catch (error) {
        console.error('Document generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate document',
            error: error.message
        });
    }
});

// @route   GET /api/generate/documents
// @desc    Get all generated documents for logged in user
// @access  Private
router.get('/documents', protect, async (req, res) => {
    try {
        const documents = await GeneratedDocument.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .select('-formData'); // Exclude form data from list
        
        // Generate signed URLs and view URLs for all documents
        const documentsWithUrls = await Promise.all(
            documents.map(async (doc) => {
                const signedUrl = doc.s3Key ? await doc.getSignedUrl() : null;
                const viewToken = doc.generateViewToken();
                const htmlUrl = doc.htmlContent ? `/api/generate/view/${viewToken}` : null;
                
                return {
                    id: doc._id,
                    fileName: doc.fileName,
                    documentType: doc.documentType,
                    fileSize: doc.fileSize,
                    createdAt: doc.createdAt,
                    status: doc.status,
                    signedUrl,
                    htmlUrl,
                    viewUrl: htmlUrl // For compatibility
                };
            })
        );
        
        res.status(200).json({
            success: true,
            count: documentsWithUrls.length,
            documents: documentsWithUrls
        });
        
    } catch (error) {
        console.error('Fetch documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
            error: error.message
        });
    }
});

// @route   GET /api/generate/documents/:id
// @desc    Get specific generated document
// @access  Private
router.get('/documents/:id', protect, async (req, res) => {
    try {
        const document = await GeneratedDocument.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        
        // Generate signed URL
        const signedUrl = await document.getSignedUrl();
        
        res.status(200).json({
            success: true,
            document: {
                id: document._id,
                fileName: document.fileName,
                documentType: document.documentType,
                fileSize: document.fileSize,
                createdAt: document.createdAt,
                status: document.status,
                signedUrl
            }
        });
        
    } catch (error) {
        console.error('Fetch document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document',
            error: error.message
        });
    }
});

// @route   DELETE /api/generate/documents/:id
// @desc    Delete generated document
// @access  Private
router.delete('/documents/:id', protect, async (req, res) => {
    try {
        const document = await GeneratedDocument.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        
        // Delete from S3 only if document has S3 key (for PDF documents)
        if (document.s3Key) {
            try {
                await GeneratedDocument.deleteFromS3(document.s3Key);
            } catch (s3Error) {
                console.warn('S3 deletion failed (document might be HTML-only):', s3Error.message);
                // Continue with database deletion even if S3 deletion fails
            }
        }
        
        // Delete from database
        await document.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete document',
            error: error.message
        });
    }
});

// @route   GET /api/generate/view/:token
// @desc    View HTML document with temporary token (public)
// @access  Public (with valid token)
router.get('/view/:token', async (req, res) => {
    try {
        const jwt = require('jsonwebtoken');
        
        // Verify the token
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
        
        // Check if it's a view token
        if (decoded.type !== 'view-token') {
            return res.status(403).send('<html><body><h1>Invalid token type</h1></body></html>');
        }
        
        // Find the document
        const document = await GeneratedDocument.findById(decoded.documentId);
        
        if (!document) {
            return res.status(404).send('<html><body><h1>Document not found</h1></body></html>');
        }
        
        // Verify the document belongs to the user in the token
        if (document.userId.toString() !== decoded.userId) {
            return res.status(403).send('<html><body><h1>Unauthorized access</h1></body></html>');
        }
        
        // Serve the HTML content
        res.set('Content-Type', 'text/html');
        res.send(document.htmlContent || '<html><body><h1>Document content not available</h1></body></html>');
        
    } catch (error) {
        console.error('View HTML error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).send('<html><body><h1>Invalid or expired token</h1></body></html>');
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).send('<html><body><h1>Token has expired. Please generate a new link.</h1></body></html>');
        }
        res.status(500).send('<html><body><h1>Error loading document</h1></body></html>');
    }
});

// @route   GET /api/generate/documents/:id/html
// @desc    Serve HTML content of generated document (legacy, protected)
// @access  Private
router.get('/documents/:id/html', protect, async (req, res) => {
    try {
        const document = await GeneratedDocument.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!document) {
            return res.status(404).send('<html><body><h1>Document not found</h1></body></html>');
        }
        
        // Serve the HTML content
        res.set('Content-Type', 'text/html');
        res.send(document.htmlContent || '<html><body><h1>Document content not available</h1></body></html>');
        
    } catch (error) {
        console.error('Serve HTML error:', error);
        res.status(500).send('<html><body><h1>Error loading document</h1></body></html>');
    }
});

// @route   GET /api/generate/documents/:id/pdf
// @desc    Download document as PDF
// @access  Private
router.get('/documents/:id/pdf', protect, async (req, res) => {
    try {
        const document = await GeneratedDocument.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        
        if (!document.htmlContent) {
            return res.status(404).json({
                success: false,
                message: 'Document content not available'
            });
        }
        
        // Convert HTML to PDF using Puppeteer
        console.log('Starting PDF generation for document:', req.params.id);
        
        if (!document.htmlContent || document.htmlContent.length < 10) {
            console.error('Document has invalid HTML content length:', document.htmlContent ? document.htmlContent.length : 0);
            return res.status(400).json({
                success: false,
                message: 'Invalid document content'
            });
        }
        
        console.log('HTML Content length:', document.htmlContent.length);

        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        console.log('Setting HTML content...');
        await page.setContent(document.htmlContent, { waitUntil: 'networkidle0' });
        
        console.log('Generating PDF...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
        });
        
        await browser.close();
        console.log('PDF generated successfully. Buffer size:', pdfBuffer.length);
        
        if (pdfBuffer.length === 0) {
            throw new Error('Generated PDF buffer is empty');
        }
        
        // Set headers for PDF download
        const pdfFileName = document.fileName.replace('.html', '.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        // Use res.end for binary data to prevent any encoding interference
        res.end(pdfBuffer);
        
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating PDF',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
