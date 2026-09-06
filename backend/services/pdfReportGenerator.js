const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * PDF Report Generator
 * Generates professional PDF compliance reports
 */

/**
 * Generate PDF report from JSON report data
 * @param {Object} reportData - Complete JSON report
 * @param {string} outputPath - Path to save PDF
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generatePDFReport(reportData, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            
            const writeStream = fs.createWriteStream(outputPath);
            doc.pipe(writeStream);
            
            // Title Page
            addTitlePage(doc, reportData);
            doc.addPage();
            
            // Executive Summary
            addExecutiveSummary(doc, reportData);
            doc.addPage();
            
            // Article-by-Article Analysis
            if (reportData.article_analysis) {
                addArticleAnalysis(doc, reportData);
                doc.addPage();
            }
            
            // Compliance Mappings
            addComplianceMappings(doc, reportData);
            
            // Violations Section
            if (reportData.violations && reportData.violations.length > 0) {
                doc.addPage();
                addViolationsSection(doc, reportData);
            }
            
            addConfidenceSummary(doc, reportData);
            
            // Verified References
            if (reportData.verified_references && reportData.verified_references.length > 0) {
                doc.addPage();
                addVerifiedReferencesSection(doc, reportData);
            }
            
            // Suggested Actions
            addSuggestedActions(doc, reportData);
            
            // Finalize PDF
            doc.end();
            
            writeStream.on('finish', () => {
                resolve(outputPath);
            });
            
            writeStream.on('error', (error) => {
                reject(error);
            });
            
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Add title page
 */
function addTitlePage(doc, data) {
    doc.fontSize(24)
        .font('Helvetica-Bold')
        .text('CONSTITUTIONAL COMPLIANCE REPORT', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(16)
        .font('Helvetica')
        .text('The Islamic Republic of Pakistan', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(14)
        .text('Constitution 1973', { align: 'center' });
    
    doc.moveDown(3);
    
    // Report metadata
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Report ID: ', { continued: true })
        .font('Helvetica')
        .text(data.report_id);
    
    doc.moveDown();
    doc.font('Helvetica-Bold')
        .text('Document: ', { continued: true })
        .font('Helvetica')
        .text(data.uploaded_file_meta.name);
    
    doc.moveDown();
    doc.font('Helvetica-Bold')
        .text('Analysis Date: ', { continued: true })
        .font('Helvetica')
        .text(new Date(data.timestamp).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }));
    
    doc.moveDown();
    doc.font('Helvetica-Bold')
    .text('Overall Compliance: ', { continued: true })
    .font('Helvetica')
    .text(data.summary.overallCompliance.replace('_', ' '));

    doc.moveDown();
    doc.font('Helvetica-Bold')
    .text('Legal Classification: ', { continued: true })
    .font('Helvetica')
    .text(data.document_meta?.classification || 'Legal Document');
    
    doc.moveDown();
    doc.font('Helvetica-Bold')
        .text('Verified References: ', { continued: true })
        .font('Helvetica')
        .text(data.summary.verifiedReferencesCount !== undefined ? data.summary.verifiedReferencesCount : 'N/A');

    doc.moveDown();
    doc.font('Helvetica-Bold')
        .text(`Compliance Score: `, { continued: true })
        .font('Helvetica')
        .text(`${data.summary.highConfidenceFindings} / ${data.summary.totalSnippets} sections (${data.summary.totalSnippets > 0 ? Math.round(data.summary.highConfidenceFindings / data.summary.totalSnippets * 100) : 0}%)`);
}

/**
 * Add executive summary section
 */
function addExecutiveSummary(doc, data) {
    doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('1. EXECUTIVE SUMMARY');
    
    doc.moveDown();
    doc.fontSize(12)
        .font('Helvetica')
        .text(data.summary.executiveSummary, { align: 'justify' });
    
    doc.moveDown(2);
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('Key Findings:');
    
    doc.moveDown();
    data.summary.keyFindings.forEach(finding => {
        doc.fontSize(11)
            .font('Helvetica')
            .text(`• ${finding}`, { indent: 20 });
    });
}

/**
 * Add article-by-article analysis section
 */
function addArticleAnalysis(doc, data) {
    doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('2. ARTICLE-BY-ARTICLE CONSTITUTIONAL ANALYSIS');
    
    doc.moveDown();
    
    const analysis = data.article_analysis;
    
    // Statistics Overview
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Analysis Overview:');
    
    doc.moveDown(0.5);
    doc.fontSize(11)
        .font('Helvetica')
        .text(`Total Constitutional Articles Reviewed: ${analysis.statistics.total_articles}`);
    doc.fillColor('green')
        .text(`✅ Fully Compliant: ${analysis.statistics.compliant_count}`)
        .fillColor('black');
    doc.fillColor('red')
        .text(`❌ Non-Compliant: ${analysis.statistics.non_compliant_count}`)
        .fillColor('black');
    doc.fillColor('orange')
        .text(`⚠️  Partially Compliant: ${analysis.statistics.partially_compliant_count}`)
        .fillColor('black');
    
    // COMPLIANT ARTICLES
    if (analysis.compliant_articles.length > 0) {
        doc.moveDown(2);
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('green')
            .text('✅ FULLY COMPLIANT ARTICLES')
            .fillColor('black');
        
        doc.moveDown();
        
        (analysis.compliant_articles || []).forEach((article, index) => {
            if (doc.y > 650) {
                doc.addPage();
            }
            
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text(`${index + 1}. ${article.article}: ${article.articleHeading}`);
            
            if (article.part) {
                doc.fontSize(9)
                    .font('Helvetica-Oblique')
                    .text(`   Part ${article.part}: ${article.partName || 'N/A'}`);
            }
            
            doc.fontSize(9)
                .font('Helvetica')
                .text(`   Confidence: ${article.averageConfidence}% | Findings: ${article.totalFindings}`, { indent: 20 });
            
            doc.moveDown(0.3);
        });
    }
    
    // NON-COMPLIANT ARTICLES
    if (analysis.non_compliant_articles.length > 0) {
        if (doc.y > 600) {
            doc.addPage();
        }
        
        doc.moveDown(2);
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('red')
            .text('❌ NON-COMPLIANT ARTICLES')
            .fillColor('black');
        
        doc.moveDown();
        
        (analysis.non_compliant_articles || []).forEach((article, index) => {
            if (doc.y > 650) {
                doc.addPage();
            }
            
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text(`${index + 1}. ${article.article}: ${article.articleHeading}`);
            
            if (article.part) {
                doc.fontSize(9)
                    .font('Helvetica-Oblique')
                    .text(`   Part ${article.part}: ${article.partName || 'N/A'}`);
            }
            
            doc.fontSize(9)
                .font('Helvetica')
                .text(`   Violations: ${article.nonCompliantFindings} | Confidence: ${article.averageConfidence}%`, { indent: 20 });
            
            doc.fontSize(8)
                .font('Helvetica-Oblique')
                .fillColor('gray')
                .text(`   Constitutional Text: "${article.constitutionText.substring(0, 150)}..."`, { indent: 20 })
                .fillColor('black');
            
            doc.moveDown(0.3);
        });
    }
    
    // PARTIALLY COMPLIANT ARTICLES
    if (analysis.partially_compliant_articles.length > 0) {
        if (doc.y > 600) {
            doc.addPage();
        }
        
        doc.moveDown(2);
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('orange')
            .text('⚠️  PARTIALLY COMPLIANT ARTICLES')
            .fillColor('black');
        
        doc.moveDown();
        
        analysis.partially_compliant_articles.forEach((article, index) => {
            if (doc.y > 650) {
                doc.addPage();
            }
            
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text(`${index + 1}. ${article.article}: ${article.articleHeading}`);
            
            if (article.part) {
                doc.fontSize(9)
                    .font('Helvetica-Oblique')
                    .text(`   Part ${article.part}: ${article.partName || 'N/A'}`);
            }
            
            doc.fontSize(9)
                .font('Helvetica')
                .text(`   Compliant: ${article.compliantFindings} | Non-Compliant: ${article.nonCompliantFindings} | Partial: ${article.partialFindings}`, { indent: 20 });
            
            doc.moveDown(0.3);
        });
    }
    
    doc.moveDown();
    doc.fontSize(9)
        .font('Helvetica-Oblique')
        .text('Note: See Section 3 for detailed snippet-level mappings and Section 4 for specific violations.');
}

/**
 * Add compliance mappings section
 */
function addComplianceMappings(doc, data) {
    doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('3. DETAILED COMPLIANCE MAPPING');
    
    doc.moveDown();
    doc.fontSize(11)
        .font('Helvetica-Oblique')
        .text(`Total mappings: ${data.mappings.length}`, { align: 'right' });
    
    doc.moveDown();
    
    // Show first 10 mappings in detail
    const mappingsToShow = data.mappings.slice(0, 10);
    
    mappingsToShow.forEach((mapping, index) => {
        if (doc.y > 650) { // Check if we need a new page
            doc.addPage();
        }
        
        doc.moveDown();
        doc.fontSize(13)
            .font('Helvetica-Bold')
            .text(`Mapping #${mapping.mapping_id}`);
        
        doc.moveDown(0.5);
        doc.fontSize(10)
        const page = mapping.snippet_location?.page || 'N/A';
        const para = mapping.snippet_location?.paragraph || 'N/A';
        
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text(`Document Text (Loc: ${page}, ${para}):`);
        
        doc.fontSize(10)
            .font('Helvetica')
            .text(`"${mapping.uploaded_text_snippet}"`, { indent: 20, align: 'justify' });
        
        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Constitutional Match:');
        
        doc.fontSize(10)
            .font('Helvetica')
            .text(`${mapping.constitution_match.article}: ${mapping.constitution_match.articleHeading}`, { indent: 20 });
        
        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .text(`"${mapping.constitution_match.text.substring(0, 200)}..."`, { indent: 20 });
        
        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Decision: ', { continued: true })
            .font('Helvetica')
            .fillColor(mapping.decision === 'YES' ? 'green' : mapping.decision === 'NO' ? 'red' : 'orange')
            .text(mapping.decision)
            .fillColor('black');
        
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Confidence: ', { continued: true })
            .font('Helvetica')
            .text(`${mapping.confidence}/100 (Similarity: ${(mapping.similarity_score * 100).toFixed(1)}%)`);
        
        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica-Oblique')
            .text(mapping.rationale, { indent: 20, align: 'justify' });
        
        doc.moveDown();
        doc.moveTo(doc.x, doc.y)
            .lineTo(doc.page.width - 100, doc.y)
            .stroke();
    });
    
    if (data.mappings.length > 10) {
        doc.moveDown();
        doc.fontSize(10)
            .font('Helvetica-Oblique')
            .text(`... and ${data.mappings.length - 10} more mappings (see full JSON report)`);
    }
}

/**
 * Add violations section
 */
function addViolationsSection(doc, data) {
    doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('red')
        .text('4. VIOLATIONS & LOOPHOLES')
        .fillColor('black');
    
    doc.moveDown();
    
    data.violations.forEach(violation => {
        if (doc.y > 600) {
            doc.addPage();
        }
        
        doc.moveDown();
        doc.fontSize(13)
            .font('Helvetica-Bold')
            .text(`Violation #${violation.violation_id} - ${violation.severity} SEVERITY`);
        
        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Offending Text:');
        
        doc.fontSize(10)
            .font('Helvetica')
            .text(`"${violation.offending_snippet}"`, { indent: 20 });
        
        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Constitutional Reference:');
        
        doc.fontSize(10)
            .font('Helvetica')
            .text(violation.constitution_reference, { indent: 20 });
        
        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .text(`"${violation.constitution_text.substring(0, 150)}..."`, { indent: 20 });
        
        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Why it Violates:');
        
        doc.fontSize(10)
            .font('Helvetica')
            .text(violation.why_violates, { indent: 20, align: 'justify' });
        
        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Suggested Fix:');
        
        doc.fontSize(10)
            .font('Helvetica')
            .text(violation.suggested_fix, { indent: 20, align: 'justify' });
        
        doc.moveDown();
        doc.moveTo(doc.x, doc.y)
            .lineTo(doc.page.width - 100, doc.y)
            .stroke();
    });
}

function addVerifiedReferencesSection(doc, data) {
    doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('5. LEGAL VERIFICATION & CITATIONS');
    
    doc.moveDown();
    doc.fontSize(12)
        .font('Helvetica-Oblique')
        .text('Verification of external legal authorities referenced in the document.');
    
    doc.moveDown();
    
    data.verified_references.forEach(ref => {
        if (doc.y > 700) doc.addPage();
        
        const statusColor = ref.status === 'VALID' ? 'green' : ref.status === 'MISCITED' ? 'red' : 'orange';
        
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor(statusColor)
            .text(`• ${ref.reference}`, { continued: true })
            .fillColor('black')
            .font('Helvetica')
            .text(` (${ref.source})`);
        
        doc.fontSize(10)
            .font('Helvetica-Oblique')
            .text(`   Status: ${ref.status} | Context: ${ref.context}`, { indent: 20 });
        
        doc.moveDown(0.5);
    });
}

/**
 * Add confidence summary
 */
function addConfidenceSummary(doc, data) {
    doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('5. CONFIDENCE & EVIDENCE SUMMARY');
    
    doc.moveDown();
    
    const confidence = data.confidence_summary;
    
    doc.fontSize(12)
        .font('Helvetica')
        .text(`Total snippets reviewed: ${confidence.total_snippets_reviewed}`);
    
    doc.text(`High confidence (>=85): ${confidence.high_confidence_findings || 0}`);
    doc.text(`Medium confidence (70-84): ${confidence.partial_pending_findings || 0}`);
    doc.text(`Low confidence (<70): ${confidence.non_compliant_findings || 0}`);
    
    doc.moveDown();
    doc.fontSize(11)
        .font('Helvetica-Oblique')
        .text('All evidence is stored with constitutional chunk IDs and Pinecone retrieval metadata.');
}

/**
 * Add suggested actions
 */
function addSuggestedActions(doc, data) {
    doc.moveDown(2);
    doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('6. SUGGESTED NEXT STEPS');
    
    doc.moveDown();
    
    data.suggested_actions.forEach((action, index) => {
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${action.priority} PRIORITY:`, { continued: true })
            .font('Helvetica')
            .text(` ${action.action}`);
        
        doc.moveDown(0.5);
    });
}

module.exports = {
    generatePDFReport
};
