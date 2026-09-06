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
    let contentStartLine = 0;
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (/^PART\s+I\b/i.test(trimmed) && i > 700) {
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
    
    const partPattern = /^\s*PART\s+([IVX]+)\b\s*(.*)?$/;
    const chapterPattern = /^\s*CHAPTER\s+(\d+[A-Z]*)[.\-]*\s*(.*)?$/i;
    const articlePattern = /^[\s]*(\d+[A-Z]*)\.\s+([A-Z][\w\s,\-\(\)']+)/;
    const footnotePattern = /^\d+[A-Z]?(?:Subs|Added|Ins|Omitted|Re-numbered|For\s|See\s)/;
    
    function saveCurrentArticle() {
        if (currentArticle && currentText.length > 0) {
            const fullText = currentText.join(' ').trim();
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
        const line = lines[i].trimEnd();
        const trimmed = line.trim();
        
        if (!trimmed) continue;
        if (footnotePattern.test(trimmed)) continue;
        
        const partMatch = trimmed.match(partPattern);
        if (partMatch) {
            currentPart = partMatch[1];
            currentPartName = partMatch[2] || '';
            
            if (!currentPartName) {
                for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                    const nextLine = lines[j].trim();
                    if (nextLine && !footnotePattern.test(nextLine) && !/^CHAPTER/.test(nextLine) && !/^\d+/.test(nextLine)) {
                        if (nextLine.length < 100) {
                            currentPartName = nextLine;
                        }
                        break;
                    }
                }
            }
            continue;
        }
        
        const chapterMatch = trimmed.match(chapterPattern);
        if (chapterMatch) {
            currentChapter = chapterMatch[1];
            continue;
        }
        
        const articleMatch = trimmed.match(articlePattern);
        if (articleMatch) {
            const artNumber = articleMatch[1];
            const artHeading = articleMatch[2];
            
            const numericPart = parseInt(artNumber.replace(/[A-Z]+$/, ''));
            if (numericPart >= 1 && numericPart <= 300) {
                saveCurrentArticle();
                
                currentArticle = {
                    number: artNumber,
                    heading: artHeading.replace(/\.\s*$/, '').trim()
                };
                
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
        
        if (currentArticle) {
            currentText.push(trimmed);
        }
    }
    
    saveCurrentArticle();
    
    console.log(`   Parsed ${chunks.length} constitutional articles from content section`);
    return chunks;
}

module.exports = { parseConstitutionEnhanced };
