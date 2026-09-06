const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { extractText, generateEmbedding } = require('../utils/documentProcessor');
const { upsertRawVectors } = require('../services/pineconeService');
const { splitTextStructurally } = require('../services/structureAwareChunker');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ROOT_DIR = path.join(__dirname, '..', '..');

const AUTHORITATIVE_LAWS = [
    { filename: 'Constitution of Pakistan.txt', title: 'Constitution of Pakistan, 1973', shortName: 'Constitution', skipTo: 'PREAMBLE' },
    { filename: 'Pakistan Panel Code.pdf', title: 'Pakistan Penal Code, 1860', shortName: 'PPC' },
    { filename: 'THE CODE OF CRIMINAL PROCEDURE, 1898.pdf', title: 'Code of Criminal Procedure, 1898', shortName: 'CrPC' },
    { filename: 'THE CODE OF CIVIL PROCEDURE, 1908.pdf', title: 'Code of Civil Procedure, 1908', shortName: 'CPC' },
    { filename: 'THE QANUN-E-SHAHADAT, 1984.pdf', title: 'Qanun-e-Shahadat Order, 1984', shortName: 'QSO' },
    { filename: 'THE LIMITATION ACT, 1908.pdf', title: 'Limitation Act, 1908', shortName: 'Limitation Act' },
    { filename: 'Supreme Court Rules.pdf', title: 'Supreme Court Rules', shortName: 'SC Rules' }
];

const NAMESPACE = 'authoritative-laws';

async function indexLaws() {
    console.log('🚀 Starting ENHANCED Authoritative Law Indexing...');
    
    for (const law of AUTHORITATIVE_LAWS) {
        const filePath = path.join(ROOT_DIR, law.filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  File not found: ${filePath}`);
            continue;
        }

        console.log(`\n📄 Processing: ${law.title}...`);
        
        try {
            const buffer = fs.readFileSync(filePath);
            const mimeType = law.filename.endsWith('.pdf') ? 'application/pdf' : 'text/plain';
            
            let text;
            if (mimeType === 'text/plain') {
                text = buffer.toString('utf8');
            } else {
                text = await extractText(buffer, mimeType);
            }

            // Optional: Skip to content (e.g. skip TOC)
            if (law.skipTo) {
                const startIndex = text.indexOf(law.skipTo);
                if (startIndex !== -1) {
                    console.log(`   ✂️ Skipping to ${law.skipTo}...`);
                    text = text.substring(startIndex);
                }
            }

            const textChunks = splitTextStructurally(text);
            console.log(`   Extracted ${textChunks.length} chunks.`);

            const vectors = [];
            for (let i = 0; i < textChunks.length; i++) {
                const chunkText = textChunks[i];
                if (i % 50 === 0) console.log(`   [${i+1}/${textChunks.length}] Processing chunks...`);
                
                try {
                    const embedding = await generateEmbedding(chunkText);
                    
                    // Robust Citation Detection
                    // Matches: Article 1, Section 1, Rule 1, Order 1, Rule 1.
                    const sectionMatch = chunkText.match(/^(ARTICLE|SECTION|RULE|ORDER|CLAUSE)\s+([\d\w\-]+)/i);
                    const sectionType = sectionMatch ? sectionMatch[1].toUpperCase() : null;
                    const sectionNumber = sectionMatch ? sectionMatch[2] : null;

                    vectors.push({
                        id: `${law.shortName.replace(/\s+/g, '_')}_${Date.now()}_${i}`,
                        values: embedding,
                        metadata: {
                            source: law.title,
                            shortName: law.shortName,
                            text: chunkText,
                            chunkIndex: i,
                            sectionType: sectionType || "GENERAL",
                            sectionNumber: sectionNumber || "N/A",
                            fullCitation: sectionNumber ? `${sectionType} ${sectionNumber} (${law.shortName})` : `${law.shortName} (Part ${i})`,
                            isAuthoritative: true,
                            lawType: law.shortName === 'Constitution' ? 'CONSTITUTIONAL' : 'STATUTORY'
                        }
                    });

                    if (vectors.length >= 50) {
                        await upsertRawVectors(vectors, NAMESPACE);
                        vectors.length = 0;
                    }
                } catch (embErr) {
                    console.error(`   ❌ Embedding error for chunk ${i}:`, embErr.message);
                }
            }

            if (vectors.length > 0) {
                await upsertRawVectors(vectors, NAMESPACE);
            }

            console.log(`✅ Indexed ${law.title} successfully with ${textChunks.length} vectors.`);

        } catch (error) {
            console.error(`❌ Error indexing ${law.title}:`, error.message);
        }
    }

    console.log('\n✨ All authoritative laws indexed into Pinecone namespace: authoritative-laws!');
}

indexLaws().catch(console.error);

