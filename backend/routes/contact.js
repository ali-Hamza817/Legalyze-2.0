const express = require('express');
const rateLimit = require('express-rate-limit');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

// Rate limiting for contact routes
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Email validation utility (relaxed but still safe)
const validateEmail = (email) => {
    if (!email) return false;

    // Basic pattern: something@something.domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    // Lightweight spam-domain check on domain only
    const domain = email.split('@')[1]?.toLowerCase() || '';
    const spamDomains = ['tempmail', 'throwaway', '10minutemail', 'guerrillamail', 'mailinator'];
    if (spamDomains.some(spam => domain.includes(spam))) return false;

    return true;
};

// @route   POST /api/contact
// @desc    Send contact form message
// @access  Public (rate limited)
router.post('/', contactLimiter, async (req, res) => {
    try {
        const { name, email, phone, company, subject, message } = req.body;
        
        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, subject, and message'
            });
        }
        
        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address. Temporary/spam emails are not allowed.'
            });
        }
        
        // Prepare email content for admin
        const emailContent = `
New Contact Form Submission from Legalyze

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Company: ${company || 'Not provided'}
Subject: ${subject}

Message:
${message}

---
Received at: ${new Date().toLocaleString()}
        `.trim();
        
        // Send email to admin
        await sendEmail({
            email: 'cyberhamza8.17@gmail.com',
            subject: `[Legalyze Contact] ${subject}`,
            message: emailContent
        });
        
        // Send confirmation email to user
        const confirmationContent = `
Dear ${name},

Thank you for contacting Legalyze! We have received your message and will get back to you as soon as possible.

Your message:
${message}

Best regards,
The Legalyze Team
        `.trim();
        
        try {
            await sendEmail({
                email: email,
                subject: 'Thank you for contacting Legalyze',
                message: confirmationContent
            });
        } catch (confirmError) {
            // Log but don't fail if confirmation email fails
            console.error('Failed to send confirmation email:', confirmError);
        }
        
        res.status(200).json({
            success: true,
            message: 'Thank you for your message! We will get back to you soon.'
        });
        
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

// @route   POST /api/contact/subscribe
// @desc    Subscribe to newsletter
// @access  Public (rate limited)
router.post('/subscribe', contactLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validate required field
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email address'
            });
        }
        
        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address. Temporary/spam emails are not allowed.'
            });
        }
        
        // Prepare email content for admin
        const emailContent = `
New Newsletter Subscription - Legalyze

Email: ${email}

Subscribed at: ${new Date().toLocaleString()}
        `.trim();
        
        // Send notification to admin
        await sendEmail({
            email: 'cyberhamza8.17@gmail.com',
            subject: '[Legalyze] New Newsletter Subscription',
            message: emailContent
        });
        
        // Send welcome email to subscriber
        const welcomeContent = `
Welcome to Legalyze Newsletter!

Thank you for subscribing to our newsletter. You'll now receive the latest updates about:

• AI-powered legal document generation
• Legal tech industry insights
• Product updates and new features
• Exclusive tips and best practices

Stay tuned for our next newsletter!

Best regards,
The Legalyze Team

---
To unsubscribe, please contact us at support@legalyze.com
        `.trim();
        
        try {
            await sendEmail({
                email: email,
                subject: 'Welcome to Legalyze Newsletter',
                message: welcomeContent
            });
        } catch (welcomeError) {
            // Log but don't fail if welcome email fails
            console.error('Failed to send welcome email:', welcomeError);
        }
        
        res.status(200).json({
            success: true,
            message: 'Thank you for subscribing! Check your email for confirmation.'
        });
        
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to subscribe. Please try again later.'
        });
    }
});

module.exports = router;
