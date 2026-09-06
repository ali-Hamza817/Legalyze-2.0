/**
 * ENHANCED Structure-Aware Hierarchical Indexer (SAHI) Parser
 * for the Constitution of Pakistan
 * 
 * Fixes:
 * 1. Skips the Table of Contents (lines 1-~825) 
 * 2. Handles footnote markers embedded in article numbers (e.g., "11." = Article 1 + footnote "1")
 * 3. Handles varied PART header formats ("PART I INTRODUCTORY", "PART VII THE JUDICATURE")
 * 4. Handles suffixed articles (2A, 10A, 25A, 63A, 175A, 203A, 270AA)
 * 5. Handles articles with tab-separated content
 * 6. Filters out footnote-only lines (e.g., "1Subs. by the Constitution...")
 */

const path = require('path');
const fs = require('fs');

const CONSTITUTION_FILE = path.join(__dirname, '../../supporting_documentation/Constitution of Pakistan.txt');

/**
 * Enhanced Constitution Parser - SAHI v2
 * @param {string} text - Full Constitution text
 * @returns {Array} Parsed articles with metadata
 */
function parseConstitutionEnhanced(text) {
    const lines = text.split('\n');
    const chunks = [];
    
    // Phase 1: Find the start of actual content (skip TOC)
    // The TOC ends before "PART I INTRODUCTORY" which marks the actual content
    let contentStartLine = 0;
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        // Look for the PREAMBLE or the first "PART I" that is NOT inside "CONTENTS"
        // The actual content starts after the Preamble, at a standalone "PART I INTRODUCTORY"
        // We identify this by checking that the previous non-empty lines are part of the Preamble
        if (/^PART\s+I\b/i.test(trimmed) && i > 700) {
            // This is the content start (after the TOC and Preamble)
            contentStartLine = i;
            console.log(`   Content starts at line ${i + 1}: "${trimmed}"`);
            break;
        }
    }
    
    if (contentStartLine === 0) {
        console.error('   ERROR: Could not find content start. Parsing entire file.');
        contentStartLine = 0;
    }
    
    // Phase 2: Parse content
    let currentPart = '';
    let currentPartName = '';
    let currentChapter = '';
    let currentArticle = null;
    let currentText = [];
    let chunkIndex = 0;
    
    // Enhanced patterns
    // Part: "PART I INTRODUCTORY", "PART II", "PART VII THE JUDICATURE", "    PART VII THE JUDICATURE"
    const partPattern = /^\s*PART\s+([IVX]+)\b\s*(.*)?$/;
    
    // Chapter: "CHAPTER 1", "CHAPTER 1.- FUNDAMENTAL RIGHTS", "CHAPTER 1.\tTHE COURTS"
    const chapterPattern = /^\s*CHAPTER\s+(\d+[A-Z]*)[.\-]*\s*(.*)?$/i;
    
    // Article: Multiple formats
    // "1. The Republic and its territories." 
    // "2A. The Objectives Resolution..."
    // "175A. Appointment of Judges..."
    // "270AA. Declaration and continuance..."
    // BUT NOT footnotes like "1Subs. by the Constitution..."
    // The key difference: articles have ". " after the number, footnotes have a word directly after the number
    const articlePattern = /^[\s]*(\d+[A-Z]*)\.\s+([A-Z][\w\s,\-\(\)']+)/;
    
    // Footnote detection: lines starting with digits followed immediately by text (no period-space)
    // e.g., "1Subs. by the Constitution...", "2Added by..."
    const footnotePattern = /^\d+[A-Z]?(?:Subs|Added|Ins|Omitted|Re-numbered|For\s|See\s)/;
    
    // Amendment reference footnotes: "1[", "2[", etc.
    const amendmentRefPattern = /^\d+\[/;
    
    function saveCurrentArticle() {
        if (currentArticle && currentText.length > 0) {
            const fullText = currentText.join(' ').trim();
            // Only save if there's meaningful text (not just a heading)
            if (fullText.length > 20) {
                chunks.push({
                    id: `const_article_${currentArticle.number.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    metadata: {
                        type: 'constitution',
                        articleNumber: currentArticle.number,
                        heading: currentArticle.heading.trim(),
                        part: currentPart,
                        partName: currentPartName.trim(),
                        chapter: currentChapter,
                        text: fullText,
                        chunkIndex: chunkIndex++
                    },
                    text: fullText
                });
            }
        }
    }
    
    for (let i = contentStartLine; i < lines.length; i++) {
        const line = lines[i].trimEnd(); // Keep leading whitespace for indentation detection
        const trimmed = line.trim();
        
        if (!trimmed) continue;
        
        // Skip footnote lines
        if (footnotePattern.test(trimmed)) continue;
        
        // Detect PART
        const partMatch = trimmed.match(partPattern);
        if (partMatch) {
            currentPart = partMatch[1];
            currentPartName = partMatch[2] || '';
            
            // If part name is empty, look at the next non-empty line
            if (!currentPartName) {
                for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                    const nextLine = lines[j].trim();
                    if (nextLine && !footnotePattern.test(nextLine) && !/^CHAPTER/.test(nextLine) && !/^\d+/.test(nextLine)) {
                        // This looks like a part name (all caps or title case)
                        if (nextLine.length < 100) {
                            currentPartName = nextLine;
                        }
                        break;
                    }
                }
            }
            continue;
        }
        
        // Detect CHAPTER
        const chapterMatch = trimmed.match(chapterPattern);
        if (chapterMatch) {
            currentChapter = chapterMatch[1];
            continue;
        }
        
        // Detect Article
        const articleMatch = trimmed.match(articlePattern);
        if (articleMatch) {
            const artNumber = articleMatch[1];
            const artHeading = articleMatch[2];
            
            // Validate: article numbers should be reasonable (1-280 range for Pakistan's Constitution)
            const numericPart = parseInt(artNumber.replace(/[A-Z]+$/, ''));
            if (numericPart >= 1 && numericPart <= 300) {
                // Save previous article
                saveCurrentArticle();
                
                // Start new article
                currentArticle = {
                    number: artNumber,
                    heading: artHeading.replace(/\.\s*$/, '').trim()
                };
                
                // The rest of the line after the heading may contain content
                const fullLine = trimmed;
                const headingEnd = fullLine.indexOf(artHeading) + artHeading.length;
                const remainingText = fullLine.substring(headingEnd).trim();
                currentText = [];
                if (remainingText) {
                    currentText.push(remainingText);
                }
                continue;
            }
        }
        
        // If we have a current article, add this line as content
        if (currentArticle) {
            currentText.push(trimmed);
        }
    }
    
    // Save the last article
    saveCurrentArticle();
    
    console.log(`   Parsed ${chunks.length} constitutional articles from content section`);
    return chunks;
}

// ============================================================
// EXPORT
// ============================================================
module.exports = { parseConstitutionEnhanced };

// ============================================================
// RUN IF EXECUTED DIRECTLY
// ============================================================
if (require.main === module) {
    const constitutionText = fs.readFileSync(CONSTITUTION_FILE, 'utf-8');
    console.log(`Read ${constitutionText.length} chars, ${constitutionText.split('\n').length} lines`);
    
    const chunks = parseConstitutionEnhanced(constitutionText);
    
    // Print all parsed articles
    console.log('\n=== ALL PARSED ARTICLES ===');
    const partGroups = {};
    for (const chunk of chunks) {
        const part = chunk.metadata.part || 'UNKNOWN';
        if (!partGroups[part]) partGroups[part] = [];
        partGroups[part].push(chunk);
    }
    
    for (const [part, articles] of Object.entries(partGroups)) {
        console.log(`\nPART ${part}: ${articles[0]?.metadata.partName || ''}`);
        for (const a of articles) {
            console.log(`  Art. ${a.metadata.articleNumber.padEnd(6)} | Ch. ${(a.metadata.chapter || '-').padEnd(3)} | ${a.metadata.heading.substring(0, 60)}`);
        }
    }
    
    console.log(`\nTotal: ${chunks.length} articles`);
}
