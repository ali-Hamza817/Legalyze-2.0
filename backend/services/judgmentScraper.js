/**
 * Supreme Court of Pakistan Judgment Scraper & Indexer
 * 
 * This module scrapes judgments from the Supreme Court of Pakistan website
 * and indexes them into Pinecone for RAG-based legal research.
 * 
 * Data Source: https://www.supremecourt.gov.pk/judgements/
 */

const axios = require('axios');
const cheerio = require('cheerio');
const pdf = require('pdf-parse');
const { generateEmbedding } = require('../utils/documentProcessor');
const pineconeService = require('./pineconeService');
const openai = require('../config/openai');

// Configuration
const SC_BASE_URL = 'https://www.supremecourt.gov.pk';
const SC_JUDGMENTS_URL = `${SC_BASE_URL}/judgements/`;

/**
 * Judgment metadata structure
 */
const createJudgmentRecord = (data) => ({
    citation: data.citation || '',           // e.g., "2023 SCMR 123"
    caseTitle: data.caseTitle || '',         // e.g., "Ali v. State"
    caseNumber: data.caseNumber || '',       // e.g., "Criminal Appeal No. 123/2023"
    court: 'Supreme Court of Pakistan',
    bench: data.bench || '',                 // e.g., "3-member bench"
    judge: data.judge || '',                 // Lead justice name
    date: data.date || new Date(),
    caseType: data.caseType || 'Other',      // Criminal, Civil, Constitutional, etc.
    summary: data.summary || '',
    ratio: data.ratio || '',                 // Key legal principle
    statutes: data.statutes || [],           // Array of cited laws
    pdfUrl: data.pdfUrl || '',
    text: data.text || '',
    createdAt: new Date()
});

/**
 * Scrape judgment links from the SC website
 * @param {number} page - Page number to scrape
 * @returns {Promise<Array>} Array of judgment links
 */
async function scrapeJudgmentLinks(page = 1) {
    try {
        console.log(`📄 Scraping judgment links from page ${page}...`);
        
        const response = await axios.get(`${SC_JUDGMENTS_URL}?page=${page}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });

        const $ = cheerio.load(response.data);
        const judgments = [];

        // Parse judgment entries (adjust selectors based on actual website structure)
        $('table tr, .judgment-item, .case-item').each((i, elem) => {
            const $row = $(elem);
            
            // Try to extract data from table or list format
            const link = $row.find('a[href*=".pdf"]').attr('href') ||
                        $row.find('a[href*="judgment"]').attr('href');
            const title = $row.find('td:first-child, .title, .case-title').text().trim();
            const date = $row.find('td:nth-child(2), .date').text().trim();

            if (link) {
                judgments.push({
                    pdfUrl: link.startsWith('http') ? link : `${SC_BASE_URL}${link}`,
                    title: title,
                    date: date
                });
            }
        });

        console.log(`✅ Found ${judgments.length} judgments on page ${page}`);
        return judgments;

    } catch (error) {
        console.error(`❌ Error scraping page ${page}:`, error.message);
        return [];
    }
}

/**
 * Download and parse PDF judgment
 * @param {string} pdfUrl - URL to the PDF file
 * @returns {Promise<string>} Extracted text from PDF
 */
async function downloadAndParsePDF(pdfUrl) {
    try {
        console.log(`📥 Downloading PDF: ${pdfUrl}`);
        
        const response = await axios.get(pdfUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const buffer = Buffer.from(response.data);
        const data = await pdf(buffer);
        
        console.log(`✅ Extracted ${data.text.length} characters from PDF`);
        return data.text;

    } catch (error) {
        console.error(`❌ Error parsing PDF ${pdfUrl}:`, error.message);
        return '';
    }
}

/**
 * Extract judgment metadata using AI
 * @param {string} text - Judgment text
 * @returns {Promise<Object>} Extracted metadata
 */
async function extractJudgmentMetadata(text) {
    try {
        const prompt = `
You are a Pakistani legal expert. Extract the following metadata from this Supreme Court of Pakistan judgment:

Return a JSON object with:
{
    "citation": "e.g., 2023 SCMR 123 or PLD 2023 SC 45",
    "caseTitle": "e.g., Muhammad Ali v. State",
    "caseNumber": "e.g., Criminal Appeal No. 123 of 2023",
    "bench": "e.g., 3-member bench",
    "judge": "Lead justice name",
    "date": "YYYY-MM-DD format",
    "caseType": "Criminal | Civil | Constitutional | Review | Appeal | Other",
    "summary": "2-3 sentence summary of the case",
    "ratio": "The key legal principle established (ratio decidendi)",
    "statutes": ["List of cited sections, e.g., 'Section 302 PPC', 'Article 10-A Constitution'"]
}

Judgment Text (first 5000 chars):
${text.substring(0, 5000)}
`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0
        });

        return JSON.parse(response.choices[0].message.content);

    } catch (error) {
        console.error('❌ Error extracting metadata:', error.message);
        return {};
    }
}

/**
 * Index a single judgment into Pinecone
 * @param {Object} judgment - Judgment record
 * @returns {Promise<boolean>} Success status
 */
async function indexJudgment(judgment) {
    try {
        if (!judgment.text || judgment.text.length < 100) {
            console.warn('⚠️ Judgment text too short, skipping');
            return false;
        }

        // Split text into chunks for embedding
        const chunkSize = 1000;
        const overlap = 200;
        const chunks = [];
        
        for (let i = 0; i < judgment.text.length; i += (chunkSize - overlap)) {
            const chunk = judgment.text.substring(i, i + chunkSize);
            if (chunk.length > 50) { // Minimum chunk size
                chunks.push(chunk);
            }
        }

        console.log(`📊 Indexing ${chunks.length} chunks for: ${judgment.caseTitle || judgment.citation}`);

        // Generate embeddings and prepare for Pinecone
        const vectors = [];
        for (let i = 0; i < chunks.length; i++) {
            const embedding = await generateEmbedding(chunks[i]);
            
            vectors.push({
                id: `sc-judgment-${judgment.citation.replace(/\s+/g, '-')}-chunk-${i}`,
                values: embedding,
                metadata: {
                    text: chunks[i],
                    citation: judgment.citation,
                    caseTitle: judgment.caseTitle,
                    caseNumber: judgment.caseNumber,
                    court: judgment.court,
                    judge: judgment.judge,
                    date: judgment.date?.toString() || '',
                    caseType: judgment.caseType,
                    ratio: judgment.ratio,
                    statutes: JSON.stringify(judgment.statutes),
                    chunkIndex: i,
                    totalChunks: chunks.length,
                    source: 'supremecourt'
                }
            });
        }

        // Upsert to Pinecone in batches
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await pineconeService.upsertRawVectors(batch);
        }

        console.log(`✅ Indexed judgment: ${judgment.citation}`);
        return true;

    } catch (error) {
        console.error(`❌ Error indexing judgment:`, error.message);
        return false;
    }
}

/**
 * Process and index a single judgment from URL
 * @param {Object} judgmentInfo - Basic judgment info with pdfUrl
 * @returns {Promise<Object>} Processed judgment record
 */
async function processJudgment(judgmentInfo) {
    try {
        // Download and extract text
        const text = await downloadAndParsePDF(judgmentInfo.pdfUrl);
        if (!text) return null;

        // Extract metadata using AI
        const metadata = await extractJudgmentMetadata(text);

        // Create complete judgment record
        const judgment = createJudgmentRecord({
            ...metadata,
            pdfUrl: judgmentInfo.pdfUrl,
            text: text
        });

        // Index into Pinecone
        await indexJudgment(judgment);

        return judgment;

    } catch (error) {
        console.error(`❌ Error processing judgment:`, error.message);
        return null;
    }
}

/**
 * Run the full scraping and indexing pipeline
 * @param {Object} options - Configuration options
 * @param {number} options.maxPages - Maximum pages to scrape
 * @param {number} options.delay - Delay between requests (ms)
 * @returns {Promise<Object>} Statistics
 */
async function runScrapingPipeline(options = {}) {
    const { maxPages = 5, delay = 2000 } = options;
    
    console.log('🚀 Starting Supreme Court Judgment Scraping Pipeline...');
    console.log(`📋 Configuration: maxPages=${maxPages}, delay=${delay}ms`);

    const stats = {
        pagesScraped: 0,
        judgmentsFound: 0,
        judgmentsProcessed: 0,
        judgmentsIndexed: 0,
        errors: []
    };

    try {
        for (let page = 1; page <= maxPages; page++) {
            // Scrape judgment links
            const judgments = await scrapeJudgmentLinks(page);
            stats.pagesScraped++;
            stats.judgmentsFound += judgments.length;

            // Process each judgment
            for (const judgmentInfo of judgments) {
                try {
                    const result = await processJudgment(judgmentInfo);
                    if (result) {
                        stats.judgmentsIndexed++;
                    }
                    stats.judgmentsProcessed++;

                    // Rate limiting
                    await new Promise(r => setTimeout(r, delay));

                } catch (err) {
                    stats.errors.push(err.message);
                }
            }

            // Delay between pages
            await new Promise(r => setTimeout(r, delay * 2));
        }

    } catch (error) {
        console.error('❌ Pipeline error:', error);
        stats.errors.push(error.message);
    }

    console.log('\n📊 Scraping Pipeline Complete!');
    console.log(`   Pages Scraped: ${stats.pagesScraped}`);
    console.log(`   Judgments Found: ${stats.judgmentsFound}`);
    console.log(`   Judgments Processed: ${stats.judgmentsProcessed}`);
    console.log(`   Judgments Indexed: ${stats.judgmentsIndexed}`);
    console.log(`   Errors: ${stats.errors.length}`);

    return stats;
}

/**
 * Search for relevant judgments
 * @param {string} query - Search query
 * @param {Object} filters - Optional filters (caseType, year, etc.)
 * @param {number} topK - Number of results
 * @returns {Promise<Array>} Matching judgment chunks
 */
async function searchJudgments(query, filters = {}, topK = 10) {
    try {
        const queryEmbedding = await generateEmbedding(query);
        
        // Build filter object
        const pineconeFilter = { source: 'supremecourt' };
        if (filters.caseType) pineconeFilter.caseType = filters.caseType;
        if (filters.year) pineconeFilter.date = { $gte: `${filters.year}-01-01` };

        const results = await pineconeService.queryVectorsWithFilter(
            queryEmbedding,
            topK,
            pineconeFilter
        );

        // Group by judgment citation
        const groupedResults = {};
        for (const result of results) {
            const citation = result.metadata.citation;
            if (!groupedResults[citation]) {
                groupedResults[citation] = {
                    citation: citation,
                    caseTitle: result.metadata.caseTitle,
                    court: result.metadata.court,
                    judge: result.metadata.judge,
                    date: result.metadata.date,
                    caseType: result.metadata.caseType,
                    ratio: result.metadata.ratio,
                    score: result.score,
                    relevantExcerpts: []
                };
            }
            groupedResults[citation].relevantExcerpts.push(result.metadata.text);
        }

        return Object.values(groupedResults);

    } catch (error) {
        console.error('❌ Error searching judgments:', error);
        return [];
    }
}

/**
 * Get judgment context for RAG
 * @param {string} query - User's legal query
 * @param {string} caseType - Detected case type
 * @returns {Promise<string>} Formatted context string
 */
async function getJudgmentContext(query, caseType = null) {
    try {
        const judgments = await searchJudgments(query, { caseType }, 5);
        
        if (judgments.length === 0) {
            return '';
        }

        let context = '\n=== RELEVANT SUPREME COURT PRECEDENTS ===\n';
        
        for (const judgment of judgments) {
            context += `\n--- ${judgment.citation}: ${judgment.caseTitle} ---\n`;
            context += `Court: ${judgment.court}\n`;
            context += `Judge: ${judgment.judge}\n`;
            context += `Date: ${judgment.date}\n`;
            context += `Case Type: ${judgment.caseType}\n`;
            if (judgment.ratio) {
                context += `\nRatio Decidendi (Legal Principle):\n${judgment.ratio}\n`;
            }
            context += `\nRelevant Excerpts:\n`;
            judgment.relevantExcerpts.slice(0, 2).forEach((excerpt, i) => {
                context += `[${i + 1}] ${excerpt.substring(0, 500)}...\n`;
            });
        }

        context += '\n=== END PRECEDENTS ===\n';
        
        return context;

    } catch (error) {
        console.error('❌ Error getting judgment context:', error);
        return '';
    }
}

module.exports = {
    scrapeJudgmentLinks,
    downloadAndParsePDF,
    extractJudgmentMetadata,
    indexJudgment,
    processJudgment,
    runScrapingPipeline,
    searchJudgments,
    getJudgmentContext
};
