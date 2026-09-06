const Tesseract = require('tesseract.js');

/**
 * Extract text from image buffer using Tesseract OCR
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromImage = async (buffer) => {
    try {
        console.log('🔄 Starting OCR processing...');
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    // console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            }
        });
        
        console.log('✅ OCR extraction complete');
        return text;
    } catch (error) {
        console.error('❌ OCR Error:', error);
        throw new Error(`OCR failed: ${error.message}`);
    }
};

module.exports = {
    extractTextFromImage
};
