/**
 * Structure Aware Chunker for Legal Documents
 * Splits text into semantic chunks based on legal document structure.
 */

const MAX_TOKENS = 1200; // Approx 4000 chars

/**
 * Split text into structure-aware chunks
 * @param {string} text - Full document text
 * @returns {string[]} Array of semantic chunks
 */
const splitTextStructurally = (text) => {
    // 1. Identify major sections (Headings, Articles, capitalized headers)
    // Regex matches lines that look like headings (ALL CAPS, Numbered Sections)
    // Example: "ARTICLE 1", "1. DEFINITIONS", "SECTION A"
    
    const lines = text.split('\n');
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    const isHeading = (line) => {
        const trimmed = line.trim();
        // Check for common legal headings pattern
        if (/^(ARTICLE|SECTION|CLAUSE)\s+\d+/i.test(trimmed)) return true;
        if (/^\d+\.\s+[A-Z\s]+$/.test(trimmed)) return true; // 1. DEFINITIONS
        // Short all-caps lines might be headings
        if (trimmed.length < 50 && trimmed.length > 3 && trimmed === trimmed.toUpperCase()) return true; 
        return false;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLen = line.length;

        // If line is a heading and current chunk is substantial, push current chunk
        if (isHeading(line) && currentSize > 100) { // arbitrary min size to avoid fragmenting
             chunks.push(currentChunk.join('\n'));
             currentChunk = [line];
             currentSize = lineLen;
        } else {
            // Check if adding this line exceeds max size
            if (currentSize + lineLen > 4000) { // Approx char limit for 1000 tokens
                 chunks.push(currentChunk.join('\n'));
                 currentChunk = [line];
                 currentSize = lineLen;
            } else {
                currentChunk.push(line);
                currentSize += lineLen + 1; // +1 for newline
            }
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
    }

    return chunks;
};

module.exports = { splitTextStructurally };
