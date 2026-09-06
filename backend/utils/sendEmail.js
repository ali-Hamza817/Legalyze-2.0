const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // Convert plain text to HTML (preserve line breaks)
    const htmlMessage = options.message.replace(/\n/g, '<br>');

    // Define email options
    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message, // Plain text version
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${htmlMessage}</div>`,
    };

    // In development or if SMTP is failing, log the message to console for testing
    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
        console.log('================ EMAIL PREVIEW ================');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('===============================================');
    }

    // Send email
    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
