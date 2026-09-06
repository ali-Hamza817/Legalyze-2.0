require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { generateEmbedding } = require('../utils/documentProcessor');
const { Pinecone } = require('@pinecone-database/pinecone');

const CONSTITUTION_FILE = path.join(__dirname, '../../Constitution of Pakistan.txt');
const CONSTITUTION_NAMESPACE = 'constitution-pakistan';

// Initialize Pinecone
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

/**
 * Parse Constitution text into structured chunks by articles
 */
function parseConstitution(text) {
    const chunks = [];
    const lines = text.split('\n');
    
    let currentPart = '';
    let currentPartName = '';
    let currentChapter = '';
    let currentArticle = null;
    let currentText = [];
    let chunkIndex = 0;
    
    // Article pattern: "123. Article heading"
    const articlePattern = /^(\d+[A-Z]*)\.\s+(.+)/;
    // Part pattern: "PART I" or "PART XII"
    const partPattern = /^PART\s+([IVX]+)\s*$/;
    // Part name pattern (line after PART)
    const partNamePattern = /^([A-Z\s,\-]+)$/;
    // Chapter pattern: "CHAPTER 1" or "CHAPTER 1.-"
    const chapterPattern = /^CHAPTER\s+(\d+[A-Z]*)[.\-]*\s*(.*)$/;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) continue;
        
        // Detect PART
        const partMatch = line.match(partPattern);
        if (partMatch) {
            currentPart = partMatch[1];
            // Next non-empty line is usually the part name
            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (nextLine && nextLine.match(partNamePattern)) {
                    currentPartName = nextLine;
                    break;
                }
            }
            continue;
        }
        
        // Detect CHAPTER
        const chapterMatch = line.match(chapterPattern);
        if (chapterMatch) {
            currentChapter = chapterMatch[1];
            continue;
        }
        
        // Detect Article
        const articleMatch = line.match(articlePattern);
        if (articleMatch) {
            // Save previous article if exists
            if (currentArticle && currentText.length > 0) {
                chunks.push({
                    id: `const_article_${currentArticle.number.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    metadata: {
                        type: 'constitution',
                        articleNumber: currentArticle.number,
                        heading: currentArticle.heading,
                        part: currentPart,
                        partName: currentPartName,
                        chapter: currentChapter,
                        text: currentText.join(' ').trim(),
                        chunkIndex: chunkIndex++
                    },
                    text: currentText.join(' ').trim()
                });
            }
            
            // Start new article
            currentArticle = {
                number: articleMatch[1],
                heading: articleMatch[2].trim()
            };
            currentText = [];
        } else if (currentArticle) {
            // Add text to current article
            currentText.push(line);
        }
    }
    
    // Add last article
    if (currentArticle && currentText.length > 0) {
        chunks.push({
            id: `const_article_${currentArticle.number.replace(/[^a-zA-Z0-9]/g, '_')}`,
            metadata: {
                type: 'constitution',
                articleNumber: currentArticle.number,
                heading: currentArticle.heading,
                part: currentPart,
                partName: currentPartName,
                chapter: currentChapter,
                text: currentText.join(' ').trim(),
                chunkIndex: chunkIndex++
            },
            text: currentText.join(' ').trim()
        });
    }
    
    console.log(`📚 Parsed ${chunks.length} constitutional articles`);
    return chunks;
}

/**
 * Index Constitution into Pinecone
 */
async function indexConstitution() {
    try {
        console.log('\n🏛️  Constitutional Compliance - Indexing Constitution of Pakistan\n');
        console.log('='.repeat(70));
        
        // Step 1: Read Constitution file
        console.log('\n📖 Step 1: Reading Constitution file...');
        const constitutionText = await fs.readFile(CONSTITUTION_FILE, 'utf-8');
        console.log(`✅ Read ${constitutionText.length} characters`);
        
        // Step 2: Parse into structured chunks
        console.log('\n📝 Step 2: Parsing Constitution by articles...');
        const chunks = parseConstitution(constitutionText);
        console.log(`✅ Parsed ${chunks.length} articles`);
        
        // Step 3: Generate embeddings
        console.log('\n🧠 Step 3: Generating embeddings for articles...');
        console.log('   This may take several minutes...\n');
        
        const vectors = [];
        let processed = 0;
        
        for (const chunk of chunks) {
            try {
                // Generate embedding for article text
                const embedding = await generateEmbedding(chunk.text);
                
                vectors.push({
                    id: chunk.id,
                    values: embedding,
                    metadata: {
                        ...chunk.metadata,
                        // Truncate text to fit Pinecone metadata limit (40KB)
                        text: chunk.metadata.text.substring(0, 30000)
                    }
                });
                
                processed++;
                if (processed % 10 === 0) {
                    console.log(`   Processed ${processed}/${chunks.length} articles...`);
                }
                
                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`   ⚠️  Error processing article ${chunk.metadata.articleNumber}:`, error.message);
            }
        }
        
        console.log(`✅ Generated ${vectors.length} embeddings\n`);
        
        // Step 4: Upload to Pinecone
        console.log('📤 Step 4: Uploading to Pinecone...');
        const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
        
        // Upsert in batches
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.namespace(CONSTITUTION_NAMESPACE).upsert(batch);
            console.log(`   Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
        }
        
        console.log(`✅ Successfully uploaded ${vectors.length} articles to Pinecone\n`);
        
        // Step 5: Verify indexing
        console.log('🔍 Step 5: Verifying indexing...');
        const stats = await index.describeIndexStats();
        console.log(`✅ Index stats:`, stats);
        
        console.log('\n' + '='.repeat(70));
        console.log('🎉 Constitution indexing completed successfully!');
        console.log(`📊 Total articles indexed: ${vectors.length}`);
        console.log(`🔖 Namespace: ${CONSTITUTION_NAMESPACE}`);
        console.log('='.repeat(70) + '\n');
        
        // Sample some articles
        console.log('\n📋 Sample indexed articles:');
        chunks.slice(0, 5).forEach(chunk => {
            console.log(`   Article ${chunk.metadata.articleNumber}: ${chunk.metadata.heading}`);
        });
        
    } catch (error) {
        console.error('\n❌ Error indexing Constitution:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    indexConstitution()
        .then(() => {
            console.log('\n✅ Script completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { indexConstitution, parseConstitution };
