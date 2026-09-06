require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { checkConstitutionalCompliance } = require('../services/constitutionalComplianceService');
const mongoose = require('mongoose');

// Mock Document Text (Simulated Complaint)
const MOCK_DOCUMENT = `
FIRST INFORMATION REPORT (FIR) - SAMPLE
The accused, Mr. Aslam, was arrested by the police on suspicion of theft. 
He has been detained in the police cell for 7 days without being produced before any magnitude.
The police officer claims he has the right to interrogate him indefinitely.
This is a clear violation of his rights.
Furthermore, the accused is charged under Section 302 for murder, although no evidence was found.
`;

async function verifyMultiLawCompliance() {
    console.log('🚀 Starting Multi-Law Compliance Verification...');

    try {
        // Connect to MongoDB (needed for models if any are used, though service mostly uses Pinecone/OpenAI)
        // Adjust URI as per env but this script might run standalone if we mock DB or if service doesn't hard-require DB for this function.
        // Actually checkConstitutionalCompliance doesn't use Mongoose directly, it returns an object.
        // But pineconeService might need initialization.

        console.log('📄 Analyzing mock document against Authoritative Laws...');
        const result = await checkConstitutionalCompliance(MOCK_DOCUMENT, 'Mock FIR Verification');

        console.log('\n═══════════════════════════════════════════════════════════════════');
        console.log('📝 VERIFICATION RESULTS');
        console.log('═══════════════════════════════════════════════════════════════════');
        
        console.log(`\n✅ Compliance Status: ${result.analysis.complianceStatus}`);
        console.log(`✅ Compliance Score: ${result.analysis.complianceScore}`);

        console.log('\n🔍 CITATION CHECK (Looking for "Section ... PPC" or "Article ..."):');
        
        let hasAuthenticCitations = false;
        
        // Check Compliant Sections
        if (result.analysis.compliantSections) {
            result.analysis.compliantSections.forEach(section => {
                section.constitutionalSupport.forEach(support => {
                    console.log(`   - Citation: ${support.specificClause} / ${support.articleNumber}`);
                    if (support.specificClause.includes('Section') || support.specificClause.includes('Article')) {
                        hasAuthenticCitations = true;
                    }
                });
            });
        }

        // Check Non-Compliant Sections
        if (result.analysis.nonCompliantSections) {
            result.analysis.nonCompliantSections.forEach(section => {
                section.constitutionalConflicts.forEach(conflict => {
                    console.log(`   - Violation: ${conflict.specificClause} / ${conflict.articleNumber}`);
                    console.log(`     Evidence: ${conflict.factualEvidence}`);
                    if (conflict.specificClause.includes('Section') || conflict.specificClause.includes('Article')) {
                        hasAuthenticCitations = true;
                    }
                });
            });
        }

        console.log('\n📜 RELEVANT LEGAL PROVISIONS RETRIEVED (RAG Context):');
        result.relevantArticles.forEach(prov => {
            console.log(`   - ${prov.fullCitation} (${prov.source})`);
        });

        if (hasAuthenticCitations) {
            console.log('\n✅ TEST PASSED: Authentic citations detected.');
        } else {
            console.log('\n⚠️ TEST WARNING: No specific citations found. Check indexing or prompt.');
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

// Run the verification
verifyMultiLawCompliance();
