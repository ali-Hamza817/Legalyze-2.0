const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { extractDeepMetadata } = require('../services/legalIntelligence');

async function testDeepExtraction() {
    console.log('🧪 Testing Deep Metadata Extraction...');

    const mockText = `
    IN THE HIGH COURT OF SINDH, KARACHI
    C.P. No. D-1234 of 2024

    Ali Hamza ... Petitioner
    Versus
    Province of Sindh & Others ... Respondents

    CORAM:
    Mr. Justice Muhammad Shafi Siddiqui
    Mr. Justice Agha Faisal

    Date of Hearing: 15.05.2024
    Date of Order: 15.05.2024

    ORDER
    Muhammad Shafi Siddiqui, J: Through this constitutional petition, the petitioner has challenged the order dated 10.02.2024 passed by the Learning Sessions Judge in FIR No. 55/2023 under section 302, 324 PPC registered at PS Defence. 

    The main contention is that the petitioner was not named in the FIR.
    
    We have heard the counsel. Since the challan has been submitted, the petitioner may approach the trial court for remedy under section 265-K CrPC.
    
    Petition disposed of accordingly.
    `;

    try {
        const metadata = await extractDeepMetadata(mockText);
        console.log('✅ Extraction Result:');
        console.log(JSON.stringify(metadata, null, 2));

        if (metadata.parties.petitioner === "Ali Hamza" && metadata.statutes.includes("302 PPC")) {
             console.log('✨ Verification PASSED');
        } else {
             console.log('⚠️ Verification Warning: Check output');
        }

    } catch (e) {
        console.error('❌ Test Failed:', e);
    }
}

testDeepExtraction();
