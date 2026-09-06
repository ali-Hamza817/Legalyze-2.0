const compromise = require('compromise');

/**
 * Document Processor - Enhanced with Sentence-Level Extraction
 * Extracts text with character-range provenance for precise citations
 */

/**
 * Extract sentences from document text with detailed provenance metadata
 * @param {string} text - Full document text
 * @param {number} startOffset - Character offset to start from (default 0)
 * @returns {Array} - Array of sentences with metadata
 */
function extractSentencesWithProvenance(text, startOffset = 0) {
    const sentences = [];
    
    // Use compromise NLP for intelligent sentence detection
    const doc = compromise(text);
    const sentencesNLP = doc.sentences().out('array');
    
    let currentChar = startOffset;
    let currentParagraph = 0;
    let currentPage = 1; // Approximate page based on character count
    const CHARS_PER_PAGE = 3000; // Rough estimate
    
    const lines = text.split('\n');
    let lineIndex = 0;
    let lineCharPosition = 0;
   
    sentencesNLP.forEach((sentenceText, index) => {
        const trimmedText = sentenceText.trim();
        if (!trimmedText || trimmedText.length < 10) return; // Skip very short fragments
        
        // Find sentence position in original text
        const sentencePos = text.indexOf(trimmedText, currentChar);
        if (sentencePos === -1) {
            currentChar += trimmedText.length;
            return;
        }
        
        const startChar = sentencePos;
        const endChar = sentencePos + trimmedText.length;
        
        // Determine paragraph (new paragraph = double newline or significant gap)
        const textBetween = text.substring(currentChar, startChar);
        if (textBetween.includes('\n\n') || textBetween.includes('\r\n\r\n')) {
            currentParagraph++;
        }
        
        // Approximate page number
        const approximatePage = Math.floor(startChar / CHARS_PER_PAGE) + 1;
        
        // Find line number
        let lineNum = 0;
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1; // +1 for newline
            if (charCount >= startChar) {
                lineNum = i + 1;
                break;
            }
        }
        
        sentences.push({
            sentenceId: index,
            text: trimmedText,
            startChar,
            endChar,
            page: approximatePage,
            paragraph: currentParagraph,
            line: lineNum,
            length: trimmedText.length
        });
        
        currentChar = endChar;
    });
    
    return sentences;
}

/**
 * Extract paragraphs with metadata (for broader context)
 */
function extractParagraphsWithProvenance(text, startOffset = 0) {
    const paragraphs = [];
    const blocks = text.split(/\n\s*\n/); // Split on double newlines
    
    let currentChar = startOffset;
    
    blocks.forEach((block, index) => {
        const trimmed = block.trim();
        if (!trimmed || trimmed.length < 20) {
            currentChar += block.length + 2; // +2 for double newline
            return;
        }
        
        const blockPos = text.indexOf(trimmed, currentChar);
        if (blockPos === -1) {
            currentChar += block.length + 2;
            return;
        }
        
        paragraphs.push({
            paragraphId: index,
            text: trimmed,
            startChar: blockPos,
            endChar: blockPos + trimmed.length,
            estimatedPage: Math.floor(blockPos / 3000) + 1,
            wordCount: trimmed.split(/\s+/).length
        });
        
        currentChar = blockPos + trimmed.length + 2;
    });
    
    return paragraphs;
}

/**
 * Extract document structure with headings, sections, etc.
 */
function extractDocumentStructure(text) {
    const structure = {
        title: null,
        sections: [],
        metadata: {}
    };
    
    const lines = text.split('\n');
    let currentSection = null;
    let charPosition = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect titles (usually first few lines, all caps or title case)
        if (i < 5 && line.length > 10 && line.length < 200) {
            if (!structure.title && (line === line.toUpperCase() || /^[A-Z]/.test(line))) {
                structure.title = line;
            }
        }
        
        // Detect section headings (numbered, bold patterns, etc.)
        const sectionMatch = line.match(/^(\d+\.|[IVX]+\.|Section\s+\d+|Article\s+\d+|Chapter\s+\d+)\s*(.*)$/i);
        if (sectionMatch) {
            if (currentSection) {
                structure.sections.push(currentSection);
            }
            
            currentSection = {
                heading: line,
                number: sectionMatch[1],
                title: sectionMatch[2],
                startChar: charPosition,
                content: []
            };
        } else if (currentSection) {
            currentSection.content.push(line);
        }
        
        charPosition += lines[i].length + 1; // +1 for newline
    }
    
    if (currentSection) {
        structure.sections.push(currentSection);
    }
    
    return structure;
}

module.exports = {
    extractSentencesWithProvenance,
    extractParagraphsWithProvenance,
    extractDocumentStructure
};
