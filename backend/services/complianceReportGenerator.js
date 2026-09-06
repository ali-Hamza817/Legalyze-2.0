const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Compliance Report Generator
 * Generates comprehensive compliance reports in the specified format
 */

/**
 * Generate executive summary for the compliance report
 */
async function generateExecutiveSummary(documentName, documentText, mappings) {
    try {
        const prompt = `Summarize this legal document for a constitutional compliance report.
        
Document Name: "${documentName}"
Document Text (Excerpt): "${documentText.substring(0, 5000)}"

Provide a highly efficient, thorough summary (3-4 sentences) outlining the directives, procedural background, and final instructions. Do NOT mention compliance yet.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: 'You are a legal summarizer.' }, { role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 300
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating summary:', error);
        return `Constitutional analysis of ${documentName}. (Summary unavailable due to error)`;
    }
}


/**
 * Analyze compliance statistics
 */
function analyzeComplianceStats(mappings) {
    const yesCount = mappings.filter(m => m.decision === 'YES').length;
    const noCount = mappings.filter(m => m.decision === 'NO').length;
    const partialCount = mappings.filter(m => m.decision === 'PARTIAL').length;
    
    const highConfidence = mappings.filter(m => m.confidence >= 85).length;
    const mediumConfidence = mappings.filter(m => m.confidence >= 70 && m.confidence < 85).length;
    const lowConfidence = mappings.filter(m => m.confidence < 70).length;
    
    let overallStatus = 'PARTIALLY_COMPLIANT';
    if (yesCount === mappings.length) {
        overallStatus = 'FULLY_COMPLIANT';
    } else if (noCount >= mappings.length * 0.5) {
        overallStatus = 'NON_COMPLIANT';
    }
    
    return {
        yesCount,
        noCount,
        partialCount,
        highConfidence,
        mediumConfidence,
        lowConfidence,
        overallStatus,
        total: mappings.length
    };
}

/**
 * Identify violations from non-compliant mappings
 */
async function identifyViolations(mappings) {
    const violations = [];
    const nonCompliantMappings = mappings.filter(m => m.decision === 'NO');
    
    // Process violations with detailed corrective actions
    for (let i = 0; i < Math.min(nonCompliantMappings.length, 10); i++) {
        const mapping = nonCompliantMappings[i];
        
        // Determine severity based on confidence
        let severity, suggestedFix, nextSteps;
        if (mapping.confidence < 60) {
            severity = 'HIGH';
            suggestedFix = `Critical violation requiring immediate attention. Recommend complete redrafting of this provision to align with ${mapping.constitution_match.article}. Suggested language: Remove or substantially revise the clause to ensure it complies with constitutional requirements. Cite explicit statutory authority and add procedural safeguards including notice, hearing rights, and time-limited measures subject to judicial review.`;
            nextSteps = 'Immediate judicial review required; seek urgent legal counsel; consider temporary suspension of enforcement pending constitutional review.';
        } else if (mapping.confidence < 80) {
            severity = 'MEDIUM';
            suggestedFix = `Moderate compliance issue detected. Recommend revising the provision to include: (1) Explicit citation to ${mapping.constitution_match.article}, (2) Clear definition of key terms, (3) Procedural safeguards consistent with due process requirements. Consider adding language that: "This provision shall be interpreted consistently with ${mapping.constitution_match.article} and shall not be construed to limit constitutional rights."`;
            nextSteps = 'Schedule legal review within 30 days; prepare amendment proposal; consult with constitutional experts.';
        } else {
            severity = 'LOW';
            suggestedFix = `Minor compliance concern. Recommend clarifying language to explicitly reference ${mapping.constitution_match.article}. Add footnote or preamble stating: "This provision is enacted pursuant to and in accordance with ${mapping.constitution_match.article} of the Constitution of Pakistan."`;
            nextSteps = 'Include in next periodic review; document the compliance concern; no immediate action required.';
        }
        
        violations.push({
            violation_id: i + 1,
            severity: severity,
            description: `Violation of ${mapping.constitution_match.article}`,
            offending_snippet: mapping.uploaded_text_snippet,
            snippet_location: mapping.snippet_location || { page: 'Thematic Scan' },
            constitution_reference: `${mapping.constitution_match.article}`,
            constitution_text: mapping.constitution_match.text,
            constitution_location: mapping.constitution_match.location || { startChar: 0 },
            why_violates: mapping.loophole || mapping.rationale,
            suggested_corrective_language: suggestedFix,
            next_steps: nextSteps,
            confidence: mapping.confidence,
            similarity_score: mapping.similarity_score
        });
    }
    
    return violations;
}

/**
 * Generate confidence summary section
 */
function generateConfidenceSummary(mappings) {
    const total = mappings.length;
    const highConfidence = mappings.filter(m => m.confidence >= 85).length;
    const partialPending = mappings.filter(m => m.confidence >= 70 && m.confidence < 85).length;
    const nonCompliant = mappings.filter(m => m.confidence < 70).length;
    
    return {
        total_snippets_reviewed: total,
        high_confidence_findings: highConfidence,
        partial_pending_findings: partialPending,
        non_compliant_findings: nonCompliant,
        evidence_stored: {
            constitution_file: 'Constitution of Pakistan.txt',
            constitution_version: 'v1.0',
            pinecone_namespace: 'constitution-pk',
            uploaded_doc_stored: true
        }
    };
}

/**
 * Generate provenance log (examples)
 */
function generateProvenanceLog(mappings) {
    const examples = mappings.slice(0, 3).map((mapping, index) => ({
        mapping_id: mapping.mapping_id,
        constitution_chunk_id: mapping.provenance?.pinecone_chunk_id || 'N/A',
        constitution_article: mapping.constitution_match.article,
        constitution_location: `chars ${mapping.constitution_match.location?.startChar || 0}-${mapping.constitution_match.location?.endChar || 0}`,
        pinecone_match_id: mapping.provenance?.pinecone_chunk_id || 'N/A',
        retrieval_score: mapping.provenance?.retrieval_score || mapping.similarity_score || 0,
        query_used: mapping.provenance?.query_used || mapping.uploaded_text_snippet.substring(0, 100) + '...'
    }));
    
    return {
        examples: examples,
        total_mappings: mappings.length,
        note: 'All matched chunk IDs and Pinecone retrieval metadata are stored in the full report JSON'
    };
}

/**
 * Generate detailed violation information
 */
async function generateViolationDetail(mapping, violationId) {
    try {
        const prompt = `Analyze this constitutional violation and provide corrective guidance.

PROBLEMATIC TEXT FROM DOCUMENT:
"${mapping.uploaded_text_snippet}"

VIOLATED CONSTITUTIONAL PROVISION:
${mapping.constitution_match.article}: ${mapping.constitution_match.articleHeading}
"${mapping.constitution_match.text}"

CURRENT ANALYSIS:
${mapping.rationale}

Provide:
1. Severity (HIGH/MEDIUM/LOW)
2. Clear explanation of WHY it violates (2 sentences)
3. Specific corrective language to replace the problematic text
4. Next steps for remediation

Return as JSON:
{
  "severity": "HIGH|MEDIUM|LOW",
  "why_violates": "...",
  "suggested_fix": "...",
  "next_steps": "..."
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'system',
                content: 'You are a constitutional lawyer providing precise remediation guidance.'
            }, {
                role: 'user',
                content: prompt
            }],
            temperature: 0.2,
            max_tokens: 600,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        
        return {
            violation_id: violationId,
            severity: result.severity || 'MEDIUM',
            description: `Violation of ${mapping.constitution_match.article}`,
            offending_snippet: mapping.uploaded_text_snippet,
            snippet_location: mapping.snippet_location,
            constitution_reference: mapping.constitution_match.article,
            constitution_text: mapping.constitution_match.text,
            why_violates: result.why_violates || mapping.rationale,
            suggested_fix: result.suggested_fix || 'Consult constitutional lawyer for specific corrective language.',
            next_steps: result.next_steps || 'Seek legal review and amendment.'
        };
    } catch (error) {
        console.error('Error generating violation detail:', error);
        return {
            violation_id: violationId,
            severity: 'MEDIUM',
            description: `Potential violation of ${mapping.constitution_match.article}`,
            offending_snippet: mapping.uploaded_text_snippet,
            snippet_location: mapping.snippet_location,
            constitution_reference: mapping.constitution_match.article,
            constitution_text: mapping.constitution_match.text,
            why_violates: mapping.rationale,
            suggested_fix: 'Professional legal review recommended.',
            next_steps: 'Consult constitutional lawyer.'
        };
    }
}

/**
 * Generate article-by-article breakdown
 */
function generateArticleBreakdown(mappings) {
    const articleGroups = {};
    
    // Group mappings by constitutional article
    mappings.forEach(mapping => {
        const articleKey = mapping.constitution_match.article || 'Unknown Article';
        if (!articleGroups[articleKey]) {
            articleGroups[articleKey] = {
                article: articleKey,
                articleHeading: mapping.constitution_match.articleHeading || 'No heading',
                part: mapping.constitution_match.part || null,
                partName: mapping.constitution_match.partName || null,
                constitutionText: mapping.constitution_match.text || '',
                mappings: []
            };
        }
        articleGroups[articleKey].mappings.push(mapping);
    });
    
    // Categorize articles
    const compliantArticles = [];
    const nonCompliantArticles = [];
    const partiallyCompliantArticles = [];
    
    Object.values(articleGroups).forEach(group => {
        const decisions = group.mappings.map(m => m.decision);
        const allCompliant = decisions.every(d => d === 'YES');
        const allNonCompliant = decisions.every(d => d === 'NO');
        
        const articleSummary = {
            article: group.article,
            articleHeading: group.articleHeading,
            part: group.part,
            partName: group.partName,
            constitutionText: group.constitutionText.substring(0, 500) + (group.constitutionText.length > 500 ? '...' : ''),
            totalFindings: group.mappings.length,
            compliantFindings: decisions.filter(d => d === 'YES').length,
            nonCompliantFindings: decisions.filter(d => d === 'NO').length,
            partialFindings: decisions.filter(d => d === 'PARTIAL').length,
            averageConfidence: Math.round(group.mappings.reduce((sum, m) => sum + m.confidence, 0) / group.mappings.length),
            relatedSnippets: group.mappings.map(m => ({
                snippet: m.uploaded_text_snippet,
                location: m.snippet_location || { page: 'Rapid Scan' },
                decision: m.decision,
                confidence: m.confidence,
                rationale: m.rationale
            }))
        };
        
        if (allCompliant) {
            compliantArticles.push(articleSummary);
        } else if (allNonCompliant) {
            nonCompliantArticles.push(articleSummary);
        } else {
            partiallyCompliantArticles.push(articleSummary);
        }
    });
    
    return {
        compliantArticles,
        nonCompliantArticles,
        partiallyCompliantArticles,
        totalArticlesReviewed: Object.keys(articleGroups).length
    };
}

/**
 * Generate complete compliance report
 */
async function generateComplianceReport(documentMeta, sentences, mappings, verifiedReferences = []) {
    console.log('📝 Generating comprehensive compliance report...');
    
    try {
        // Generate report ID
        const reportId = `RPT-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        // Analyze compliance statistics
        const stats = analyzeComplianceStats(mappings);
        
        // Generate article-by-article breakdown
        const articleBreakdown = generateArticleBreakdown(mappings);
        
        // Generate executive summary
        const executiveSummary = await generateExecutiveSummary(
            documentMeta.name,
            documentMeta.fullText || '',
            mappings
        );
        
        // Identify violations
        const violations = await identifyViolations(mappings);
        
        // Create detailed key findings
        const keyFindings = [
            `Overall compliance: ${stats.overallStatus.replace('_', ' ')}`,
            `Total constitutional articles reviewed: ${articleBreakdown.totalArticlesReviewed}`,
            `✅ Fully compliant articles: ${articleBreakdown.compliantArticles.length}`,
            `❌ Non-compliant articles: ${articleBreakdown.nonCompliantArticles.length}`,
            `⚠️ Partially compliant articles: ${articleBreakdown.partiallyCompliantArticles.length}`,
            `Total document snippets analyzed: ${stats.total}`,
            violations.length > 0 ? `Required actions: ${violations.filter(v => v.severity === 'HIGH').length} high-priority remediations` : 'No critical violations identified'
        ];
        
        // Build complete report
        const report = {
            report_id: reportId,
            uploaded_file: documentMeta.s3Path || documentMeta.name,
            uploaded_file_meta: {
                name: documentMeta.name,
                size: documentMeta.size,
                type: documentMeta.mimeType,
                uploadedBy: documentMeta.userId,
                uploadTimestamp: documentMeta.timestamp || new Date().toISOString()
            },
            timestamp: new Date().toISOString(),
            
            summary: {
                documentTitle: documentMeta.name,
                executiveSummary,
                keyFindings,
                overallCompliance: stats.overallStatus,
                totalArticlesReviewed: articleBreakdown.totalArticlesReviewed,
                totalSnippets: stats.total,
                highConfidenceFindings: stats.highConfidence,
                partialComplianceFindings: stats.partialCount,
                violationsCount: stats.noCount,
                verifiedReferencesCount: verifiedReferences.length
            },
            
            // DETAILED ARTICLE-BY-ARTICLE BREAKDOWN
            article_analysis: {
                compliant_articles: articleBreakdown.compliantArticles,
                non_compliant_articles: articleBreakdown.nonCompliantArticles,
                partially_compliant_articles: articleBreakdown.partiallyCompliantArticles,
                statistics: {
                    total_articles: articleBreakdown.totalArticlesReviewed,
                    compliant_count: articleBreakdown.compliantArticles.length,
                    non_compliant_count: articleBreakdown.nonCompliantArticles.length,
                    partially_compliant_count: articleBreakdown.partiallyCompliantArticles.length
                }
            },
            
            // Raw mappings for detailed analysis
            mappings: mappings.map((m, idx) => ({
                ...m,
                mapping_id: idx + 1,
                snippet_location: m.snippet_location || { page: 'Rapid Scan', paragraph: 'N/A' },
                similarity_score: m.similarity_score || 0
            })),
            
            violations: violations,
            verified_references: verifiedReferences,
            
            // Enhanced confidence summary
            confidence_summary: generateConfidenceSummary(mappings),
            
            // Enhanced provenance log  
            provenance_log: generateProvenanceLog(mappings),
            
            suggested_actions: generateSuggestedActions(violations, stats),
            
            metadata: {
                generatedBy: 'Legalyze Constitutional Compliance Checker',
                version: '2.0',
                modelUsed: 'gpt-4o-mini',
                constitutionSource: 'Constitution of Pakistan.txt',
                analysisDate: new Date().toISOString()
            }
        };
        
        console.log(`✅ Report generated: ${reportId}`);
        console.log(`   Articles Reviewed: ${articleBreakdown.totalArticlesReviewed}`);
        console.log(`   ✅ Compliant: ${articleBreakdown.compliantArticles.length}`);
        console.log(`   ❌ Non-Compliant: ${articleBreakdown.nonCompliantArticles.length}`);
        console.log(`   ⚠️  Partial: ${articleBreakdown.partiallyCompliantArticles.length}`);
        console.log(`   Violations: ${violations.length}`);
        console.log(`   Overall: ${stats.overallStatus}`);
        
        return report;
        
    } catch (error) {
        console.error('Error generating compliance report:', error);
        throw error;
    }
}

/**
 * Generate suggested actions based on violations and statistics
 */
function generateSuggestedActions(violations, stats) {
    const actions = [];
    
    const highSeverityViolations = violations.filter(v => v.severity === 'HIGH');
    const mediumSeverityViolations = violations.filter(v => v.severity === 'MEDIUM');
    
    if (highSeverityViolations.length > 0) {
        actions.push({
            priority: 'URGENT',
            action: `Request expedited judicial review or legal amendment for ${highSeverityViolations.length} high-severity violation${highSeverityViolations.length > 1 ? 's' : ''}`,
            references: highSeverityViolations.map(v => `Violation #${v.violation_id}`)
        });
    }
    
    if (mediumSeverityViolations.length > 0) {
        actions.push({
            priority: 'HIGH',
            action: `Amendment recommended for ${mediumSeverityViolations.length} moderate violation${mediumSeverityViolations.length > 1 ? 's' : ''}`,
            references: mediumSeverityViolations.map(v => `Violation #${v.violation_id}`)
        });
    }
    
    if (stats.lowConfidence > 0) {
        actions.push({
            priority: 'MEDIUM',
            action: `Professional legal review recommended for ${stats.lowConfidence} low-confidence finding${stats.lowConfidence > 1 ? 's' : ''}`,
            references: ['See mappings with confidence < 70']
        });
    }
    
    if (violations.length > 0) {
        actions.push({
            priority: 'MEDIUM',
            action: 'Re-run automated compliance check after implementing suggested corrections',
            references: ['All violation sections']
        });
    }
    
    if (actions.length === 0) {
        actions.push({
            priority: 'LOW',
            action: 'Document appears constitutionally sound. Periodic review recommended.',
            references: []
        });
    }
    
    return actions;
}

/**
 * Generate strict markdown report for chat persistence (Loophole-First V2)
 */
function generateStrictMarkdown(report) {
    let md = '';
    
    // Section 1: Rapid Scorecard
    md += `# 🏛️ Constitutional Compliance: Rapid Scan V2\n\n`;
    md += `> **Status:** ${report.summary.overallCompliance.replace('_', ' ')} | **High Impact Scans:** ${report.summary.totalSnippets}\n\n`;
    
    // Section 2: Summary
    md += `## 📌 Section 1 — Executive Summary\n\n`;
    md += `${report.summary.executiveSummary}\n\n`;
    
    // Section 2: Legal Verification & Accuracy
    if (report.verified_references && report.verified_references.length > 0) {
        md += `## 📚 Section 2 — Legal Verification & Accuracy\n`;
        md += `*Validation of external articles, statutes, and citations referenced in the document.*\n\n`;
        
        report.verified_references.forEach(ref => {
            const icon = ref.status === 'VALID' ? '✅' : ref.status === 'MISCITED' ? '❌' : '❓';
            md += `${icon} **${ref.reference}** (${ref.source})\n`;
            md += `> Status: **${ref.status}** | Context: *${ref.context}*\n\n`;
        });
        
        md += `---\n\n`;
    }

    // Section 3: Constitutional Compliance Breakdown
    md += `## ⚖️ Section 3 — Constitutional Compliance Breakdown\n`;
    md += `*High-impact conflicts requiring immediate legal attention.*\n\n`;
    
    const nonCompliantMappings = report.mappings.filter(m => m.decision === 'NO' || m.decision === 'PARTIAL');
    
    if (nonCompliantMappings.length === 0) {
        md += `✅ **No critical constitutional conflicts identified in this scan.**\n\n`;
    } else {
        nonCompliantMappings.forEach((m, idx) => {
            md += `### ❌ Conflict #${idx + 1}: ${m.section_title || 'Legal Provision'}\n`;
            md += `**Issue:** ${m.loophole || m.rationale}\n\n`;
            md += `**Constitutional Basis:** ${m.constitution_match.article} — *${m.constitution_match.articleHeading}*\n\n`;
            
            if (m.reasoningChain && m.reasoningChain.length > 0) {
                md += `**🧠 Strategic Reasoning:**\n`;
                md += `\`\`\`strategy\n`;
                m.reasoningChain.forEach(step => {
                    md += `- ${step}\n`;
                });
                md += `\`\`\`\n\n`;
            }
            md += `**📝 Actionable Redline (Proposed Fix):**\n`;
            md += `> ${m.proposedFix || 'Recommend redrafting to align with ' + m.constitution_match.article}\n\n`;
            md += `---\n\n`;
        });
    }
    
    // Section 4: Compliant Foundations
    md += `## 📌 Section 4 — Compliant Foundations\n`;
    md += `*Areas demonstrating strong constitutional alignment.*\n\n`;
    
    const compliantMappings = report.mappings.filter(m => m.decision === 'YES');
    if (compliantMappings.length === 0) {
        md += `*No fully compliant sections identified in this thematic scan.*\n\n`;
    } else {
        compliantMappings.forEach(m => {
            md += `- **${m.section_title}:** Aligns with **${m.constitution_match.article}** (${m.constitution_match.articleHeading})\n`;
        });
    }
    
    md += `\n\n*This report focuses on high-impact thematic compliance. For a sentence-level audit, consult the PDF report.*`;
    
    return md;
}

module.exports = {
    generateComplianceReport,
    generateExecutiveSummary,
    identifyViolations,
    analyzeComplianceStats,
    generateStrictMarkdown
};


