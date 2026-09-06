const fs = require('fs').promises;
const path = require('path');
const { generateEmbedding } = require('../utils/documentProcessor');
const { upsertConstitution } = require('../services/pineconeService');

/**
 * Enhanced Constitution Indexing Script
 * Indexes Constitution of Pakistan with detailed provenance metadata:
 * - Character ranges for exact citation
 * - Article/Section/Clause structure
 * - Paragraph and line numbers
 * - Full text preservation
 */

async function indexConstitutionEnhanced() {
    try {
        console.log('🏛️  Starting ENHANCED Constitution indexing with provenance metadata...\n');

        // Read Constitution file
        const constitutionPath = path.join(__dirname, '../../Constitution of Pakistan.txt');
        const constitutionText = await fs.readFile(constitutionPath, 'utf-8');
        
        console.log(`📖 Constitution loaded: ${constitutionText.length} characters`);
        console.log(`📊 Total lines: ${constitutionText.split('\n').length}\n`);

        // Parse constitution into structured articles with metadata
        const articles = parseConstitutionWithProvenance(constitutionText);
        console.log(`✅ Parsed ${articles.length} articles with provenance metadata\n`);

        // Generate embeddings and prepare vectors
        console.log('🔢 Generating embeddings for each article...');
        const vectors = [];
        
        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            
            if (i % 10 === 0) {
                console.log(`   Processing article ${i + 1}/${articles.length}...`);
            }

            try {
                // Generate embedding for the article text
                const embedding = await generateEmbedding(article.text);
                
                // Create vector with enhanced metadata
                vectors.push({
                    id: `const_art_${article.articleNumber}_${article.paragraph || 1}`,
                    values: embedding,
                    metadata: {
                        // Core identification
                        source: 'constitution',
                        articleNumber: article.articleNumber,
                        articleHeading: article.heading,
                        
                        // Structural metadata
                        part: article.part,
                        partName: article.partName,
                        chapter: article.chapter || null,
                        chapterName: article.chapterName || null,
                        
                        // Provenance metadata
                        startChar: article.startChar,
                        endChar: article.endChar,
                        lineStart: article.lineStart,
                        lineEnd: article.lineEnd,
                        paragraph: article.paragraph || 1,
                        
                        // Content
                        text: article.text.substring(0, 40000), // Pinecone metadata limit
                        
                        // File reference
                        file: 'Constitution of Pakistan.txt'
                    }
                });

                // Small delay to respect rate limits
                if (i % 20 === 0 && i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`   ❌ Error processing article ${article.articleNumber}:`, error.message);
            }
        }

        console.log(`\n✅ Generated ${vectors.length} embeddings\n`);

        // Upsert to Pinecone in batches
        console.log('📤 Upserting vectors to Pinecone...');
        const BATCH_SIZE = 100;
        
        for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
            const batch = vectors.slice(i, i + BATCH_SIZE);
            await upsertConstitution(batch);
            console.log(`   Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(vectors.length / BATCH_SIZE)}`);
            
            // Delay between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n✅ Constitution indexing complete!');
        console.log(`📊 Total articles indexed: ${vectors.length}`);
        console.log(`🏛️  Namespace: constitution-pakistan`);
        console.log('\n🎉 Enhanced constitution index ready for compliance checking!\n');

    } catch (error) {
        console.error('❌ Error indexing constitution:', error);
        throw error;
    }
}

/**
 * Parse constitution text into articles with detailed provenance metadata
 */
function parseConstitutionWithProvenance(text) {
    const articles = [];
    const lines = text.split('\n');
    
    let currentPart = null;
    let currentPartName = null;
    let currentChapter = null;
    let currentChapterName = null;
    let currentArticle = null;
    let currentArticleText = [];
    let currentCharPosition = 0;
    let articleStartChar = 0;
    let articleStartLine = 0;
    
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        const trimmedLine = line.trim();
        
        // Track character position
        const lineLength = line.length + 1; // +1 for newline
        
        // Detect Part headings (e.g., "PART I")
        const partMatch = trimmedLine.match(/^PART\s+([IVX]+)/i);
        if (partMatch) {
            currentPart = partMatch[1];
            // Next line usually contains part name
            if (lineNum + 1 < lines.length) {
                currentPartName = lines[lineNum + 1].trim();
            }
            currentCharPosition += lineLength;
            continue;
        }
        
        // Detect Chapter headings
        const chapterMatch = trimmedLine.match(/^CHAPTER\s+(\d+|[IVX]+)/i);
        if (chapterMatch) {
            currentChapter = chapterMatch[1];
            if (lineNum + 1 < lines.length) {
                currentChapterName = lines[lineNum + 1].trim();
            }
            currentCharPosition += lineLength;
            continue;
        }
        
        // Detect Article headings (e.g., "1. Definitions" or "Article 19")
        const articleMatch = trimmedLine.match(/^(\d+[A-Z]?)\.\s+(.+)/);
        const articleAltMatch = trimmedLine.match(/^Article\s+(\d+[A-Z]?)/i);
        
        if (articleMatch || articleAltMatch) {
            // Save previous article if exists
            if (currentArticle && currentArticleText.length > 0) {
                articles.push({
                    articleNumber: currentArticle.number,
                    heading: currentArticle.heading,
                    part: currentPart,
                    partName: currentPartName,
                    chapter: currentChapter,
                    chapterName: currentChapterName,
                    text: currentArticleText.join('\n').trim(),
                    startChar: articleStartChar,
                    endChar: currentCharPosition,
                    lineStart: articleStartLine,
                    lineEnd: lineNum - 1,
                    paragraph: 1
                });
            }
            
            // Start new article
            const number = articleMatch ? articleMatch[1] : articleAltMatch[1];
            const heading = articleMatch ? articleMatch[2] : trimmedLine;
            
            currentArticle = { number, heading };
            currentArticleText = [line];
            articleStartChar = currentCharPosition;
            articleStartLine = lineNum;
        } else if (currentArticle && trimmedLine) {
            // Add line to current article
            currentArticleText.push(line);
        }
        
        currentCharPosition += lineLength;
    }
    
    // Add last article
    if (currentArticle && currentArticleText.length > 0) {
        articles.push({
            articleNumber: currentArticle.number,
            heading: currentArticle.heading,
            part: currentPart,
            partName: currentPartName,
            chapter: currentChapter,
            chapterName: currentChapterName,
            text: currentArticleText.join('\n').trim(),
            startChar: articleStartChar,
            endChar: currentCharPosition,
            lineStart: articleStartLine,
            lineEnd: lines.length - 1,
            paragraph: 1
        });
    }
    
    return articles;
}

// Run if called directly
if (require.main === module) {
    indexConstitutionEnhanced()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { indexConstitutionEnhanced, parseConstitutionWithProvenance };
