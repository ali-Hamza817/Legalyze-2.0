const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

/**
 * End-to-End Test for Enhanced Constitutional Compliance Checker
 * Tests the complete flow from document upload to report generation
 */

async function testEnhancedComplianceChecker() {
    try {
        console.log('🧪 Starting Enhanced Constitutional Compliance Checker Test\n');

        // Step 1: Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@legalyze.com',
            password: 'Admin@123'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');

        // Step 2: Create a test document
        console.log('2️⃣ Creating test document...');
        const testDocument = `
DETENTION ORDER

ORDER NO: DO-2025-001
DATE: December 6, 2025

This order authorizes the detention of any individual suspected of activities contrary to national interest for a period of up to 90 days without judicial review.

The detention shall be without right to legal counsel during the initial investigation period.

The detaining authority shall have sole discretion to determine what constitutes activities contrary to national interest.

This order is issued in the interest of public order and national security.
`;

        const testFilePath = path.join(__dirname, '../temp/test-detention-order.txt');
        await fs.mkdir(path.join(__dirname, '../temp'), { recursive: true });
        await fs.writeFile(testFilePath, testDocument);
        console.log('✅ Test document created\n');

        // Step 3: Upload document for compliance check
        console.log('3️⃣ Uploading document for compliance check...');
        const formData = new FormData();
        formData.append('document', await fs.readFile(testFilePath), {
            filename: 'test-detention-order.txt',
            contentType: 'text/plain'
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
                maxBodyLength: Infinity,
                timeout: 180000 // 3 minutes
            }
        );

        if (!complianceResponse.data.success) {
            throw new Error('Compliance check failed');
        }

        console.log('✅ Compliance check completed\n');

        // Step 4: Display results
        const data = complianceResponse.data.data;
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                    TEST RESULTS');
        console.log('═══════════════════════════════════════════════════════════════\n');
        
        console.log(`📋 Report ID: ${data.report_id}`);
        console.log(`📄 Document: ${data.documentName}`);
        console.log(`⚖️  Overall Compliance: ${data.complianceStatus}`);
        console.log(`📊 Compliance Score: ${data.complianceScore}%`);
        console.log(`🔍 Total Mappings: ${data.totalMappings}\n`);

        console.log('🎯 KEY FINDINGS:');
        data.keyFindings.forEach((finding, i) => {
            console.log(`   ${i + 1}. ${finding}`);
        });
        console.log('');

        console.log('📝 EXECUTIVE SUMMARY:');
        console.log(`   ${data.executiveSummary}\n`);

        if (data.violations && data.violations.length > 0) {
            console.log('❌ VIOLATIONS FOUND:');
            data.violations.forEach((v, i) => {
                console.log(`\n   Violation #${i + 1}: ${v.severity} SEVERITY`);
                console.log(`   Description: ${v.description}`);
                console.log(`   Reference: ${v.constitution_reference}`);
                console.log(`   Why: ${v.why_violates.substring(0, 150)}...`);
            });
            console.log('');
        }

        if (data.mappings && data.mappings.length > 0) {
            console.log('🔍 SAMPLE MAPPINGS (First 3):');
            data.mappings.slice(0, 3).forEach((m, i) => {
                console.log(`\n   Mapping #${i + 1}:`);
                console.log(`   📄 Document: "${m.uploaded_text_snippet.substring(0, 100)}..."`);
                console.log(`   🏛️  Constitution: ${m.constitution_match.article}`);
                console.log(`   ✓ Decision: ${m.decision}`);
                console.log(`   📊 Confidence: ${m.confidence}%`);
                console.log(`   💡 Rationale: ${m.rationale.substring(0, 150)}...`);
            });
            console.log('');
        }

        console.log('💡 SUGGESTED ACTIONS:');
        data.suggested_actions.forEach((action, i) => {
            console.log(`   ${i + 1}. [${action.priority}] ${action.action}`);
        });
        console.log('');

        console.log('📂 REPORTS GENERATED:');
        console.log(`   JSON: ${data.reportUrls.json || 'N/A'}`);
        console.log(`   PDF: ${data.reportUrls.pdf || 'N/A'}`);
        console.log('');

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                   ✅ TEST PASSED!');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Cleanup
        await fs.unlink(testFilePath).catch(() => {});

        return {
            success: true,
            reportId: data.report_id,
            complianceStatus: data.complianceStatus,
            violationsCount: data.violations.length,
            mappingsCount: data.totalMappings
        };

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
        throw error;
    }
}

// Run test if called directly
if (require.main === module) {
    testEnhancedComplianceChecker()
        .then(result => {
            console.log('\n🎉 Test completed successfully!');
            console.log('Result:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test failed!');
            process.exit(1);
        });
}

module.exports = { testEnhancedComplianceChecker };
