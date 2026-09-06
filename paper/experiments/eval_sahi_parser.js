/**
 * SAHI Parser Accuracy Evaluation
 * 
 * This script evaluates the accuracy of the parseConstitution() function
 * from indexConstitution.js by comparing its output against a manually
 * verified ground truth of known constitutional articles.
 * 
 * NO FABRICATED DATA. All results come from running the actual parser
 * against the actual Constitution of Pakistan text file.
 */

const path = require('path');
const fs = require('fs');

// Import the actual parser
const { parseConstitution } = require('../../backend/scripts/indexConstitution');

const CONSTITUTION_FILE = path.join(__dirname, '../../supporting_documentation/Constitution of Pakistan.txt');

// ============================================================
// GROUND TRUTH: Manually verified constitutional articles
// These are articles whose Part, Chapter, and Article numbers
// are independently verified from the official Constitution text.
// ============================================================
const GROUND_TRUTH = [
    // Part I: Introductory (Articles 1-6)
    { articleNumber: '1', expectedPart: 'I', description: 'The Republic and its territories' },
    { articleNumber: '2', expectedPart: 'I', description: 'Islam to be State religion' },
    { articleNumber: '2A', expectedPart: 'I', description: 'Objectives Resolution' },
    { articleNumber: '3', expectedPart: 'I', description: 'Elimination of exploitation' },
    { articleNumber: '4', expectedPart: 'I', description: 'Right of individuals' },
    { articleNumber: '5', expectedPart: 'I', description: 'Loyalty to State' },
    { articleNumber: '6', expectedPart: 'I', description: 'High treason' },
    
    // Part II: Fundamental Rights (Articles 7-28)
    { articleNumber: '7', expectedPart: 'II', description: 'Definition of the State' },
    { articleNumber: '8', expectedPart: 'II', description: 'Laws inconsistent with Fundamental Rights' },
    { articleNumber: '9', expectedPart: 'II', description: 'Security of person' },
    { articleNumber: '10', expectedPart: 'II', description: 'Safeguards as to arrest' },
    { articleNumber: '10A', expectedPart: 'II', description: 'Right to fair trial' },
    { articleNumber: '11', expectedPart: 'II', description: 'Slavery prohibited' },
    { articleNumber: '14', expectedPart: 'II', description: 'Inviolability of dignity of man' },
    { articleNumber: '17', expectedPart: 'II', description: 'Freedom of association' },
    { articleNumber: '18', expectedPart: 'II', description: 'Freedom of trade' },
    { articleNumber: '19', expectedPart: 'II', description: 'Freedom of speech' },
    { articleNumber: '20', expectedPart: 'II', description: 'Freedom to profess religion' },
    { articleNumber: '25', expectedPart: 'II', description: 'Equality of citizens' },
    { articleNumber: '25A', expectedPart: 'II', description: 'Right to education' },
    
    // Part II, Chapter 2: Principles of Policy (Articles 29-40)
    { articleNumber: '29', expectedPart: 'II', description: 'Principles of Policy' },
    { articleNumber: '37', expectedPart: 'II', description: 'Promotion of social justice' },
    { articleNumber: '38', expectedPart: 'II', description: 'Promotion of social and economic well-being' },
    
    // Part III: Federation of Pakistan
    { articleNumber: '41', expectedPart: 'III', description: 'The President' },
    { articleNumber: '44', expectedPart: 'III', description: 'Oath of President' },
    { articleNumber: '48', expectedPart: 'III', description: 'President to act on advice' },
    { articleNumber: '50', expectedPart: 'III', description: 'Majlis-e-Shoora (Parliament)' },
    { articleNumber: '51', expectedPart: 'III', description: 'National Assembly' },
    { articleNumber: '62', expectedPart: 'III', description: 'Qualifications for membership' },
    { articleNumber: '63', expectedPart: 'III', description: 'Disqualifications for membership' },
    { articleNumber: '63A', expectedPart: 'III', description: 'Disqualification on defection' },
    { articleNumber: '89', expectedPart: 'III', description: 'Ordinance-making power' },
    { articleNumber: '90', expectedPart: 'III', description: 'Federal Government' },
    { articleNumber: '91', expectedPart: 'III', description: 'Cabinet' },
    
    // Part IV: Provinces
    { articleNumber: '101', expectedPart: 'IV', description: 'Governor' },
    { articleNumber: '112', expectedPart: 'IV', description: 'Provincial Assembly' },
    { articleNumber: '130', expectedPart: 'IV', description: 'Provincial Government' },
    
    // Part V: Relations between Federation and Provinces
    { articleNumber: '141', expectedPart: 'V', description: 'Extent of executive authority' },
    { articleNumber: '142', expectedPart: 'V', description: 'Subject-matter of laws' },
    { articleNumber: '143', expectedPart: 'V', description: 'Inconsistency between laws' },
    { articleNumber: '144', expectedPart: 'V', description: 'Power of Majlis-e-Shoora' },
    
    // Part VII: The Judicature (Articles 175-212)
    { articleNumber: '175', expectedPart: 'VII', description: 'Establishment and jurisdiction of courts' },
    { articleNumber: '176', expectedPart: 'VII', description: 'Composition of Supreme Court' },
    { articleNumber: '184', expectedPart: 'VII', description: 'Original jurisdiction of Supreme Court' },
    { articleNumber: '185', expectedPart: 'VII', description: 'Appellate jurisdiction' },
    { articleNumber: '186', expectedPart: 'VII', description: 'Advisory jurisdiction' },
    { articleNumber: '187', expectedPart: 'VII', description: 'Issue and execution of Supreme Court processes' },
    { articleNumber: '189', expectedPart: 'VII', description: 'Decisions of Supreme Court binding' },
    { articleNumber: '190', expectedPart: 'VII', description: 'Action in aid of Supreme Court' },
    { articleNumber: '199', expectedPart: 'VII', description: 'Jurisdiction of High Court' },
    { articleNumber: '203A', expectedPart: 'VII', description: 'Provisions relating to Federal Shariat Court' },
    
    // Part IX: Islamic Provisions
    { articleNumber: '227', expectedPart: 'IX', description: 'Provisions relating to Holy Quran and Sunnah' },
    
    // Part XII: Miscellaneous
    { articleNumber: '260', expectedPart: 'XII', description: 'Definitions' },
    { articleNumber: '270AA', expectedPart: 'XII', description: 'Declaration and continuance of laws' },
];

// ============================================================
// RUN THE ACTUAL PARSER
// ============================================================
async function runEvaluation() {
    console.log('='.repeat(70));
    console.log('SAHI Parser Accuracy Evaluation');
    console.log('Running ACTUAL parser against ACTUAL Constitution of Pakistan text');
    console.log('='.repeat(70));
    console.log('');

    // Read the actual Constitution file
    const constitutionText = fs.readFileSync(CONSTITUTION_FILE, 'utf-8');
    console.log(`📖 Read Constitution file: ${constitutionText.length} characters, ${constitutionText.split('\n').length} lines`);
    
    // Run the actual parser
    const parsedChunks = parseConstitution(constitutionText);
    console.log(`📝 Parser produced ${parsedChunks.length} chunks\n`);
    
    // Build lookup from parsed results
    const parsedArticles = new Map();
    for (const chunk of parsedChunks) {
        parsedArticles.set(chunk.metadata.articleNumber, {
            articleNumber: chunk.metadata.articleNumber,
            heading: chunk.metadata.heading,
            part: chunk.metadata.part,
            partName: chunk.metadata.partName,
            chapter: chunk.metadata.chapter,
            textLength: chunk.text.length
        });
    }
    
    console.log(`📊 Unique articles parsed: ${parsedArticles.size}\n`);

    // ============================================================
    // EVALUATION: Compare parsed output against ground truth
    // ============================================================
    let articlesDetected = 0;
    let articlesNotDetected = 0;
    let partCorrect = 0;
    let partIncorrect = 0;
    let partMissing = 0;
    
    const detailedResults = [];
    
    for (const gt of GROUND_TRUTH) {
        const parsed = parsedArticles.get(gt.articleNumber);
        
        if (parsed) {
            articlesDetected++;
            
            // Check Part assignment
            if (parsed.part === gt.expectedPart) {
                partCorrect++;
                detailedResults.push({
                    article: gt.articleNumber,
                    status: '✅ DETECTED',
                    partMatch: '✅ CORRECT',
                    parsedPart: parsed.part,
                    expectedPart: gt.expectedPart,
                    heading: parsed.heading
                });
            } else if (!parsed.part || parsed.part === '') {
                partMissing++;
                detailedResults.push({
                    article: gt.articleNumber,
                    status: '✅ DETECTED',
                    partMatch: '⚠️ PART MISSING',
                    parsedPart: parsed.part || '(empty)',
                    expectedPart: gt.expectedPart,
                    heading: parsed.heading
                });
            } else {
                partIncorrect++;
                detailedResults.push({
                    article: gt.articleNumber,
                    status: '✅ DETECTED',
                    partMatch: '❌ WRONG PART',
                    parsedPart: parsed.part,
                    expectedPart: gt.expectedPart,
                    heading: parsed.heading
                });
            }
        } else {
            articlesNotDetected++;
            detailedResults.push({
                article: gt.articleNumber,
                status: '❌ NOT DETECTED',
                partMatch: 'N/A',
                parsedPart: 'N/A',
                expectedPart: gt.expectedPart,
                heading: gt.description
            });
        }
    }
    
    // ============================================================
    // COMPUTE METRICS
    // ============================================================
    const totalGT = GROUND_TRUTH.length;
    const articleDetectionRate = (articlesDetected / totalGT * 100).toFixed(1);
    const partAccuracy = articlesDetected > 0 
        ? (partCorrect / articlesDetected * 100).toFixed(1) 
        : '0.0';
    const overallAccuracy = (partCorrect / totalGT * 100).toFixed(1);
    
    // ============================================================
    // PRINT DETAILED RESULTS
    // ============================================================
    console.log('='.repeat(70));
    console.log('DETAILED RESULTS');
    console.log('='.repeat(70));
    
    for (const r of detailedResults) {
        console.log(`Article ${r.article.padEnd(6)} | ${r.status.padEnd(16)} | Part: ${r.parsedPart.padEnd(5)} (expected ${r.expectedPart.padEnd(5)}) | ${r.partMatch}`);
    }
    
    console.log('');
    console.log('='.repeat(70));
    console.log('SUMMARY METRICS');
    console.log('='.repeat(70));
    console.log(`Ground truth articles evaluated:  ${totalGT}`);
    console.log(`Total articles parsed by system:  ${parsedArticles.size}`);
    console.log('');
    console.log(`Articles detected:               ${articlesDetected}/${totalGT} (${articleDetectionRate}%)`);
    console.log(`Articles NOT detected:            ${articlesNotDetected}/${totalGT}`);
    console.log('');
    console.log(`Part assignment correct:          ${partCorrect}/${articlesDetected} (${partAccuracy}% of detected)`);
    console.log(`Part assignment incorrect:        ${partIncorrect}/${articlesDetected}`);
    console.log(`Part assignment missing:          ${partMissing}/${articlesDetected}`);
    console.log('');
    console.log(`Overall accuracy (correct/total): ${partCorrect}/${totalGT} (${overallAccuracy}%)`);
    console.log('='.repeat(70));
    
    // ============================================================
    // SAVE RESULTS TO FILE
    // ============================================================
    const resultsOutput = {
        timestamp: new Date().toISOString(),
        description: 'SAHI Parser Accuracy Evaluation - Real results from actual parser',
        inputFile: CONSTITUTION_FILE,
        inputFileSize: constitutionText.length,
        inputFileLines: constitutionText.split('\n').length,
        totalArticlesParsed: parsedArticles.size,
        groundTruthSize: totalGT,
        metrics: {
            articleDetectionRate: parseFloat(articleDetectionRate),
            partAssignmentAccuracy: parseFloat(partAccuracy),
            overallAccuracy: parseFloat(overallAccuracy),
            articlesDetected: articlesDetected,
            articlesNotDetected: articlesNotDetected,
            partCorrect: partCorrect,
            partIncorrect: partIncorrect,
            partMissing: partMissing
        },
        detailedResults: detailedResults,
        // List all parsed articles for verification
        allParsedArticles: Array.from(parsedArticles.entries()).map(([num, data]) => ({
            articleNumber: num,
            heading: data.heading,
            part: data.part,
            chapter: data.chapter,
            textLength: data.textLength
        }))
    };
    
    const outputPath = path.join(__dirname, 'sahi_parser_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(resultsOutput, null, 2));
    console.log(`\n📁 Full results saved to: ${outputPath}`);
}

runEvaluation().catch(err => {
    console.error('Error running evaluation:', err);
    process.exit(1);
});
