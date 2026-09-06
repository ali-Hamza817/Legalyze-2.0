require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Test Constitutional Compliance Checker with a sample legal document
 */
async function testConstitutionalCompliance() {
    try {
        console.log('\n🏛️  Testing Constitutional Compliance Checker\n');
        console.log('='.repeat(70));

        // Step 1: Login
        console.log('\nStep 1: Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');

        // Step 2: Create a sample legal document (mock judgment)
        console.log('Step 2: Creating sample legal document...');
        const sampleJudgment = `%MOCK-PDF
SUPREME COURT OF PAKISTAN

Case No: 2024/SC/123
Petitioner vs Respondent

JUDGMENT

This court has carefully examined the petition filed by the petitioner seeking 
enforcement of fundamental rights under Article 19 of the Constitution of 
Pakistan, which guarantees freedom of speech and expression.

The petitioner alleges that their right to freedom of speech has been curtailed
by certain provisions of the challenged law. Article 19 of the Constitution 
states that every citizen shall have the right to freedom of speech and expression,
subject to any reasonable restrictions imposed by law in the interest of the glory
of Islam or the integrity, security or defence of Pakistan.

Upon review, this court finds that while the impugned law does impose certain
restrictions on speech, these restrictions are reasonable and necessary for 
maintaining public order and are in accordance with Article 19(3) of the Constitution.

Furthermore, the court notes that the petitioner's rights under Article 9 
(security of person) and Article 10 (safeguards as to arrest and detention) 
remain protected. The law does not violate these fundamental rights.

However, the court observes that certain procedural aspects of the law may need
to be reviewed to ensure compliance with Article 10A, which guarantees the right
to fair trial. The law should provide adequate safeguards for due process.

The court also references Article 25 of the Constitution, which provides for 
equality of citizens. The impugned law must be applied equally to all citizens
without discrimination.

CONCLUSION:
The petition is partially accepted. The law is constitutional in principle but
requires amendments to procedural provisions to ensure full compliance with
Article 10A (Right to Fair Trial) of the Constitution.

The government is directed to review and amend the procedural provisions within
60 days to ensure compliance with constitutional standards.

Dated: December 5, 2025
Chief Justice
Supreme Court of Pakistan
`;

        // Save to temporary file
        const tempFilePath = path.join(__dirname, 'temp_judgment.pdf');
        fs.writeFileSync(tempFilePath, sampleJudgment);
        console.log('✅ Sample judgment created\n');

        // Step 3: Upload for compliance check
        console.log('Step 3: Uploading document for constitutional compliance check...');
        console.log('   This may take 30-60 seconds...\n');
        
        const formData = new FormData();
        formData.append('document', fs.createReadStream(tempFilePath), {
            filename: 'sample_judgment.pdf',
            contentType: 'application/pdf'
        });

        const complianceResponse = await axios.post(
            'http://localhost:5000/api/constitutional-compliance/check',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${token}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        console.log('✅ Compliance check completed!\n');
        console.log('='.repeat(70));
        console.log('COMPLIANCE CHECK RESULTS');
        console.log('='.repeat(70));

        const result = complianceResponse.data.data;

        console.log(`\nDocument: ${result.documentName}`);
        console.log(`Status: ${result.complianceStatus}`);
        console.log(`Score: ${result.complianceScore}/100`);
        console.log(`\n${'-'.repeat(70)}`);
        console.log('EXECUTIVE SUMMARY');
        console.log(`${'-'.repeat(70)}`);
        console.log(result.executiveSummary);

        console.log(`\n${'-'.repeat(70)}`);
        console.log('CONSTITUTIONAL PROVISIONS ANALYZED');
        console.log(`${'-'.repeat(70)}`);
        
        if (result.constitutionalProvisions && result.constitutionalProvisions.length > 0) {
            result.constitutionalProvisions.forEach((prov, index) => {
                console.log(`\n${index + 1}. Article ${prov.articleNumber}: ${prov.heading}`);
                console.log(`   Alignment: ${prov.alignment}`);
                console.log(`   Relevance: ${prov.relevance || 'N/A'}`);
            });
        }

        if (result.potentialIssues && result.potentialIssues.length > 0) {
            console.log(`\n${'-'.repeat(70)}`);
            console.log('POTENTIAL ISSUES');
            console.log(`${'-'.repeat(70)}`);
            result.potentialIssues.forEach((issue, index) => {
                console.log(`\n${index + 1}. ${issue.issue}`);
                console.log(`   Severity: ${issue.severity}`);
                console.log(`   Article: ${issue.constitutionalArticle}`);
            });
        }

        console.log(`\n${'-'.repeat(70)}`);
        console.log('RECOMMENDATIONS');
        console.log(`${'-'.repeat(70)}`);
        console.log(result.recommendations);

        console.log(`\n${'-'.repeat(70)}`);
        console.log('RELEVANT CONSTITUTIONAL ARTICLES');
        console.log(`${'-'.repeat(70)}`);
        
        if (result.relevantArticles && result.relevantArticles.length > 0) {
            result.relevantArticles.forEach((article, index) => {
                console.log(`${index + 1}. Article ${article.articleNumber} - ${article.heading} (Part ${article.part})`);
            });
        }

        console.log('\n' + '='.repeat(70));
        console.log('🎉 TEST COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(70));
        console.log(`\nCompliance Check ID: ${result.checkId}`);
        console.log('You can retrieve this report later using the check ID.\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testConstitutionalCompliance().catch(err => process.exit(1));
}

module.exports = { testConstitutionalCompliance };
