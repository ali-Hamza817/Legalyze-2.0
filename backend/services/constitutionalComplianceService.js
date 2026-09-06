const openai = require('../config/openai');
const { generateEmbedding } = require('../utils/documentProcessor');
const { queryAuthoritativeLaws } = require('./pineconeService');

/**
 * Query Constitution for relevant articles based on legal text
 * @param {string} queryText - Legal text to query against Constitution
 * @param {number} topK - Number of constitutional articles to retrieve
 */
/**
 * Query Authoritative Laws for relevant provisions base on legal text
 * @param {string} queryText - Legal text to query against authoritative laws
 * @param {number} topK - Number of provisions to retrieve
 */
async function findRelevantLegalProvisions(queryText, topK = 15) {
    try {
        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(queryText);
        
        // Query Authoritative Laws in Pinecone
        const provisions = await queryAuthoritativeLaws(queryEmbedding, topK);
        
        return provisions;
    } catch (error) {
        console.error('Error finding legal provisions:', error);
        throw error;
    }
}

/**
 * Perform enhanced constitutional compliance check with section-by-section analysis
 * @param {string} documentText - Full text of legal document
 * @param {string} documentName - Name of the document
 */
async function checkConstitutionalCompliance(documentText, documentName) {
    try {
        console.log(`⚖️  Starting ENHANCED Multi-Law compliance check for: ${documentName}`);
        
        // Step 1: Find relevant legal provisions for the entire document
        console.log('📖 Finding relevant legal provisions (Constitution, PPC, CrPC, etc.)...');
        const relevantProvisions = await findRelevantLegalProvisions(
            documentText.substring(0, 8000), 
            15
        );
        
        console.log(`✅ Found ${relevantProvisions.length} relevant legal provisions`);
        
        // Step 2: Prepare comprehensive legal context
        const legalContext = relevantProvisions.map((prov, index) => 
            `[${prov.fullCitation}] (Source: ${prov.source})\n` +
            `Content: ${prov.text.substring(0, 1000)}${prov.text.length > 1000 ? '...' : ''}\n` 
        ).join('\n---\n');
        
        // Step 3: Generate ultra-detailed compliance analysis using refined AI prompt
        console.log('🧠 Generating comprehensive legal compliance analysis...');
        
        const enhancedPrompt = `You are Pakistan's most respected Legal Expert and Constitutional Jurist. Your task is to perform a rigorous compliance check of the provided document against Pakistan's authoritative laws (Constitution, PPC, CrPC, CPC, etc.).

DOCUMENT TO ANALYZE:
Title: ${documentName}
Full Text:
${documentText.substring(0, 8000)}

RELEVANT LEGAL PROVISIONS FROM KNOWLEDGE BASE:
${legalContext}

═══════════════════════════════════════════════════════════════════

CRITICAL INSTRUCTIONS FOR ACCURACY AND AUTHENTICITY:

1. USE SPECIFIC CITATIONS: Never provide generic references. Use the exact "fullCitation" from the context (e.g., "Section 302 PPC", "Article 19 Constitution").
2. NO HALLUCINATIONS: If no specific section fits, mention the most relevant legal principle, but never invent article/section numbers.
3. DETECT CONFLICTS: Identify if the document violates statutory law (PPC/CrPC) OR constitutional fundamental rights.
4. QUOTE EXACT TEXT: From both the Document and the Law.
5. PROFESSIONAL TONE: Sound like a Supreme Court Justice. Be precise, critical, and authoritative.

═══════════════════════════════════════════════════════════════════


REQUIRED JSON OUTPUT:

{
  "complianceStatus": "FULLY_COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT",
  "complianceScore": <number 0-100>,
  "executiveSummary": "<concise 3-4 sentence overview>",
  
  "compliantSections": [
    {
      "sectionTitle": "<descriptive title for this compliant part>",
      "exactQuoteFromDocument": "<EXACT sentence/paragraph from uploaded document that is compliant>",
      "constitutionalSupport": [
        {
          "articleNumber": "<e.g., 'Section 302'>",
          "articleHeading": "<e.g., 'Punishment of qatl-i-amd'>",
          "specificClause": "<e.g., 'Section 302(a) PPC'>",
          "exactConstitutionalText": "<EXACT TEXT from the Law that supports this>",
          "alignment": "EXCELLENT" | "GOOD" | "ADEQUATE",
          "factualEvidence": "<EXPLAIN EXACTLY how the quoted document text aligns with the constitutional provision. BE SPECIFIC.>",
          "legalReasoning": "<Professional legal analysis of why this is compliant>"
        }
      ],
      "strengthScore": <1-10>,
      "professionalCommentary": "<Expert commentary on constitutional soundness>"
    }
  ],
  
  "nonCompliantSections": [
    {
      "sectionTitle": "<descriptive title for this problematic part>",
      "exactQuoteFromDocument": "<EXACT sentence/paragraph from uploaded document that violates Constitution>",
      "constitutionalConflicts": [
        {
          "articleNumber": "<e.g., '10'>",
          "articleHeading": "<e.g., 'Safeguards as to arrest and detention'>",
          "specificClause": "<e.g., 'Article 10(2)' or 'Article 10 clause (a)'>",
          "exactConstitutionalText": "<EXACT TEXT from Constitution that is violated>",
          "conflictType": "DIRECT_VIOLATION" | "PROCEDURAL_ISSUE" | "AMBIGUITY" | "OMISSION",
          "severityLevel": "CRITICAL" | "HIGH" | "MODERATE" | "LOW",
          "factualEvidence": "<EXPLAIN EXACTLY how the quoted document text violates the constitutional provision. BE SPECIFIC AND CRITICAL.>",
          "specificViolation": "<State PRECISELY what is wrong. Example: 'The document states X, but Article Y requires Z'>",
          "legalConsequence": "<What could happen due to this violation>"
        }
      ],
      "riskScore": <1-10>,
      "mandatoryCorrection": "<EXACT text that should replace the problematic text to achieve compliance>",
      "legalPrecedent": "<Relevant Supreme Court case if applicable, or 'None identified'>"
    }
  ],
  
  "fundamentalRightsAnalysis": {
    "rightsEngaged": ["<list specific fundamental rights from Part II>"],
    "complianceAssessment": "<detailed assessment>",
    "specificConcerns": [
      {
        "right": "<e.g., 'Article 9 - Security of person'>",
        "documentQuote": "<exact quote from document>",
        "issue": "<specific issue>",
        "severity": "CRITICAL" | "HIGH" | "MODERATE" | "LOW"
      }
    ]
  },
  
  "proceduralCompliance": {
    "dueProcess": {
      "status": "COMPLIANT" | "NON_COMPLIANT" | "UNCLEAR",
      "evidence": "<specific evidence from document>",
      "constitutionalRequirement": "<what Article 10A requires>"
    },
    "fairTrial": {
      "status": "COMPLIANT" | "NON_COMPLIANT" | "N/A",
      "evidence": "<specific evidence>",
      "constitutionalRequirement": "<what Constitution requires>"
    }
  },
  
  "keyFindings": [
    "<Very specific finding with article references>",
    "<Another specific finding>",
    "<Another specific finding>"
  ],
  
  "criticalRecommendations": [
    {
      "priority": "URGENT" | "HIGH" | "MEDIUM" | "LOW",
      "specificIssue": "<exact issue identified>",
      "currentText": "<problematic text from document>",
      "proposedText": "<suggested replacement text>",
      "constitutionalBasis": "<which article/clause requires this change>",
      "rationale": "<why this change is necessary>"
    }
  ],
  
  "overallAssessment": "<Comprehensive final assessment with specific references>"
}

═══════════════════════════════════════════════════════════════════

EXAMPLE OF EXPECTED OUTPUT QUALITY:

GOOD EXAMPLE - Compliant Section:
{
  "exactQuoteFromDocument": "The court recognizes that every citizen shall have the right to freedom of speech and expression, subject to reasonable restrictions in the interest of national security.",
  "articleNumber": "19",
  "articleHeading": "Freedom of speech, etc.",
  "specificClause": "Article 19(1) and 19(3)",
  "exactConstitutionalText": "Every citizen shall have the right to freedom of speech and expression, subject to any reasonable restrictions imposed by law in the interest of the glory of Islam or the integrity, security or defence of Pakistan",
  "factualEvidence": "The document's text 'every citizen shall have the right to freedom of speech' directly mirrors Article 19(1)'s language. The document also correctly acknowledges 'reasonable restrictions in the interest of national security' which aligns with Article 19(3)'s provision for restrictions for Pakistan's security and defence. This demonstrates textual and substantive compliance."
}

GOOD EXAMPLE - Non-Compliant Section:
{
  "exactQuoteFromDocument": "Any person may be detained for investigation purposes for up to 90 days without being produced before a magistrate.",
  "articleNumber": "10",
  "articleHeading": "Safeguards as to arrest and detention",
  "specificClause": "Article 10(2)",
  "exactConstitutionalText": "Every person who is arrested and detained in custody shall be produced before a magistrate within a period of twenty-four hours of such arrest",
  "factualEvidence": "The document permits detention for 90 days without magistrate production. Article 10(2) explicitly requires production within 24 hours. This is a direct mathematical and procedural violation: 90 days (2,160 hours) exceeds the constitutional maximum of 24 hours by 2,136 hours or 8,900%.",
  "specificViolation": "Document allows 90-day detention without judicial oversight, directly violating Article 10(2)'s mandatory 24-hour production requirement"
}

═══════════════════════════════════════════════════════════════════

CRITICAL REQUIREMENTS:
✓ Quote EXACT text from uploaded document
✓ Quote EXACT text from Constitution
✓ Provide FACTUAL, measurable evidence
✓ Be CRITICAL and thorough in analysis
✓ State violations EXPLICITLY with numbers/specifics
✓ Provide PRECISE recommendations
✓ Return ONLY valid JSON`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Changed to gpt-4o-mini for cost savings
            messages: [
                {
                    role: 'system',
                    content: 'You are Pakistan\'s premier constitutional law expert and Supreme Court judge. Provide METICULOUS, FACTUAL, CRITICAL constitutional analysis. Quote exact text. Provide specific evidence. Be thorough and precise. Return only valid JSON.'
                },
                {
                    role: 'user',
                    content: enhancedPrompt
                }
            ],
            temperature: 0.1, // Even lower for maximum precision and factual accuracy
            max_tokens: 4096, // Maximum for detailed analysis
            response_format: { type: "json_object" }
        });

        const analysisText = completion.choices[0].message.content;
        const analysis = JSON.parse(analysisText);
        
        console.log(`✅ Enhanced compliance analysis complete. Status: ${analysis.complianceStatus}`);
        console.log(`   Compliant sections: ${analysis.compliantSections?.length || 0}`);
        console.log(`   Non-compliant sections: ${analysis.nonCompliantSections?.length || 0}`);
        
        // Return comprehensive result
        return {
            success: true,
            documentName: documentName,
            timestamp: new Date(),
            relevantArticles: relevantProvisions,
            analysis: analysis
        };
        
    } catch (error) {
        console.error('❌ Error in constitutional compliance check:', error);
        throw new Error(`Constitutional compliance check failed: ${error.message}`);
    }
}

/**
 * Generate beautifully formatted professional compliance report
 * @param {Object} complianceResult - Result from checkConstitutionalCompliance
 */
function formatComplianceReport(complianceResult) {
    const { documentName, analysis, relevantArticles, timestamp } = complianceResult;
    
    const report = `
╔════════════════════════════════════════════════════════════════════════════╗
║                   CONSTITUTIONAL COMPLIANCE REPORT                         ║
║           THE ISLAMIC REPUBLIC OF PAKISTAN - CONSTITUTION 1973            ║
╚════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────── DOCUMENT INFORMATION ──────────────────────────┐
│ Document Title      : ${documentName}
│ Analysis Date       : ${timestamp.toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}
│ Compliance Status   : ${analysis.complianceStatus}
│ Compliance Score    : ${analysis.complianceScore}/100
│ Overall Rating      : ${getComplianceRating(analysis.complianceScore)}
└────────────────────────────────────────────────────────────────────────────┘

${'═'.repeat(80)}
EXECUTIVE SUMMARY
${'═'.repeat(80)}

${analysis.executiveSummary || 'Analysis completed successfully.'}

${analysis.overallAssessment || ''}

${'═'.repeat(80)}
KEY FINDINGS
${'═'.repeat(80)}

${analysis.keyFindings && analysis.keyFindings.length > 0 
    ? analysis.keyFindings.map((finding, i) => `${i + 1}. ${finding}`).join('\n\n')
    : 'No specific findings listed.'}

${'═'.repeat(80)}
PART A: CONSTITUTIONALLY COMPLIANT SECTIONS
${'═'.repeat(80)}

${formatCompliantSections(analysis.compliantSections)}

${'═'.repeat(80)}
PART B: NON-COMPLIANT SECTIONS & CONSTITUTIONAL CONFLICTS
${'═'.repeat(80)}

${formatNonCompliantSections(analysis.nonCompliantSections)}

${'═'.repeat(80)}
FUNDAMENTAL RIGHTS ANALYSIS
${'═'.repeat(80)}

${formatFundamentalRightsAnalysis(analysis.fundamentalRightsAnalysis)}

${'═'.repeat(80)}
PROCEDURAL COMPLIANCE ASSESSMENT
${'═'.repeat(80)}

${formatProceduralCompliance(analysis.proceduralCompliance)}

${'═'.repeat(80)}
RECOMMENDATIONS
${'═'.repeat(80)}

${formatRecommendations(analysis.recommendations)}

${'═'.repeat(80)}
CONSTITUTIONAL PROVISIONS REFERENCED
${'═'.repeat(80)}

${formatConstitutionalReferences(relevantArticles)}

${'═'.repeat(80)}
LEGAL DISCLAIMER
${'═'.repeat(80)}

This constitutional compliance report is generated using advanced AI-powered
legal analysis and is intended for informational and advisory purposes only.

⚖️  NOT LEGAL ADVICE: This report does not constitute formal legal advice or
    legal opinion. It is an analytical tool to assist legal professionals.

⚖️  PROFESSIONAL REVIEW: All findings should be reviewed by a qualified lawyer
    admitted to practice in Pakistan before taking any legal action.

⚖️  NO WARRANTY: While every effort has been made to ensure accuracy, no
    warranty is provided regarding the completeness or correctness of analysis.

⚖️  CONSULT COUNSEL: For specific legal guidance, consult with a licensed
    attorney specializing in constitutional law.

${'─'.repeat(80)}
Generated by: Legalyze Constitutional Compliance Checker
Powered by: AI-Enhanced Constitutional Analysis Engine
Report ID: ${generateReportId()}
${'═'.repeat(80)}
`;

    return report;
}

/**
 * Helper function to format compliant sections
 */
function formatCompliantSections(sections) {
    if (!sections || sections.length === 0) {
        return 'No specific compliant sections identified.\n';
    }

    return sections.map((section, index) => {
        const support = section.constitutionalSupport || [];
        const supportText = support.map((sup, i) => 
            `   ${String.fromCharCode(97 + i)}. ${sup.specificClause || `Article ${sup.articleNumber}`} - ${sup.articleHeading}
      
      📜 EXACT CONSTITUTIONAL TEXT:
      "${sup.exactConstitutionalText || sup.specificProvision || 'See full article text'}"
      
      ✓ ALIGNMENT: ${sup.alignment}
      
      📊 FACTUAL EVIDENCE OF COMPLIANCE:
      ${sup.factualEvidence || sup.explanation}
      
      ⚖️  LEGAL REASONING:
      ${sup.legalReasoning || 'This section demonstrates constitutional alignment.'}
      `
        ).join('\n');

        return `
┌─ ✅ COMPLIANT SECTION ${index + 1} ──────────────────────────────────────┐

📋 Section: ${section.sectionTitle}

📄 EXACT QUOTE FROM UPLOADED DOCUMENT:
"${section.exactQuoteFromDocument || section.sectionText}"

🏛️ CONSTITUTIONAL SUPPORT:
${supportText}

💪 Strength Score: ${section.strengthScore}/10 ${getStrengthIndicator(section.strengthScore)}

💬 PROFESSIONAL COMMENTARY:
${section.professionalCommentary || section.commentary || 'This section demonstrates good constitutional alignment.'}

└──────────────────────────────────────────────────────────────────────────┘
`;
    }).join('\n');
}

/**
 * Helper function to format non-compliant sections
 */
function formatNonCompliantSections(sections) {
    if (!sections || sections.length === 0) {
        return '✅ NO CONSTITUTIONAL CONFLICTS IDENTIFIED\n\nThis document appears to be in full compliance with the Constitution.\n';
    }

    return sections.map((section, index) => {
        const conflicts = section.constitutionalConflicts || [];
        const conflictText = conflicts.map((conf, i) => 
            `   ${i + 1}. ${conf.specificClause || `Article ${conf.articleNumber}`} - ${conf.articleHeading}
      
      📜 EXACT CONSTITUTIONAL TEXT VIOLATED:
      "${conf.exactConstitutionalText || conf.violatedProvision || 'See full article text'}"
      
      ⚠️  CONFLICT TYPE: ${conf.conflictType}
      ⚠️  SEVERITY: ${conf.severityLevel} ${getSeverityIcon(conf.severityLevel)}
      
      📊 FACTUAL EVIDENCE OF VIOLATION:
      ${conf.factualEvidence || conf.explanation}
      
      🔴 SPECIFIC VIOLATION:
      ${conf.specificViolation || 'Constitutional provision not met'}
      
      ⚖️  LEGAL CONSEQUENCE:
      ${conf.legalConsequence || 'May be subject to constitutional challenge'}
      `
        ).join('\n');

        return `
┌─ ❌ NON-COMPLIANT SECTION ${index + 1} ──────────────────────────────────┐
⚠️  CONSTITUTIONAL CONFLICT IDENTIFIED

📋 Section: ${section.sectionTitle}

📄 EXACT QUOTE FROM UPLOADED DOCUMENT (PROBLEMATIC):
"${section.exactQuoteFromDocument || section.sectionText}"

🏛️ CONSTITUTIONAL CONFLICTS:
${conflictText}

⚠️  Risk Assessment: ${section.riskScore}/10 ${getRiskIndicator(section.riskScore)}

✏️  MANDATORY CORRECTION (Exact Text to Replace):
${section.mandatoryCorrection || section.suggestedAmendment || 'Professional legal review recommended.'}

${section.legalPrecedent && section.legalPrecedent !== 'N/A' && section.legalPrecedent !== 'None identified'
    ? `📚 Legal Precedent: ${section.legalPrecedent}` 
    : ''}

└──────────────────────────────────────────────────────────────────────────┘
`;
    }).join('\n');
}

/**
 * Helper function to format fundamental rights analysis
 */
function formatFundamentalRightsAnalysis(analysis) {
    if (!analysis) {
        return 'Fundamental rights analysis not available.\n';
    }

    let output = `
Rights Engaged: ${analysis.rightsEngaged?.join(', ') || 'None specified'}

Compliance Assessment:
${analysis.complianceAssessment || analysis.compliance || 'Not assessed'}
`;

    if (analysis.specificConcerns && analysis.specificConcerns.length > 0) {
        output += `\n⚠️  SPECIFIC CONCERNS IDENTIFIED:\n`;
        analysis.specificConcerns.forEach((concern, i) => {
            output += `\n  ${i + 1}. ${concern.right}
     Document Quote: "${concern.documentQuote}"
     Issue: ${concern.issue}
     Severity: ${concern.severity} ${getSeverityIcon(concern.severity)}\n`;
        });
    } else if (analysis.concerns && analysis.concerns.length > 0) {
        output += `\nConcerns Identified:\n${analysis.concerns.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}`;
    } else {
        output += '\n✅ No fundamental rights concerns identified';
    }

    return output;
}

/**
 * Helper function to format procedural compliance
 */
function formatProceduralCompliance(procedural) {
    if (!procedural) {
        return 'Procedural compliance assessment not available.\n';
    }

    let output = '';

    if (procedural.dueProcess) {
        if (typeof procedural.dueProcess === 'object') {
            output += `Due Process (Article 10A):\n`;
            output += `  Status: ${procedural.dueProcess.status}\n`;
            if (procedural.dueProcess.evidence) {
                output += `  Evidence from Document: "${procedural.dueProcess.evidence}"\n`;
            }
            if (procedural.dueProcess.constitutionalRequirement) {
                output += `  Constitutional Requirement: ${procedural.dueProcess.constitutionalRequirement}\n`;
            }
        } else {
            output += `Due Process: ${procedural.dueProcess}\n`;
        }
    }

    if (procedural.fairTrial) {
        if (typeof procedural.fairTrial === 'object') {
            output += `\nRight to Fair Trial:\n`;
            output += `  Status: ${procedural.fairTrial.status}\n`;
            if (procedural.fairTrial.evidence) {
                output += `  Evidence from Document: "${procedural.fairTrial.evidence}"\n`;
            }
            if (procedural.fairTrial.constitutionalRequirement) {
                output += `  Constitutional Requirement: ${procedural.fairTrial.constitutionalRequirement}\n`;
            }
        } else {
            output += `Right to Fair Trial: ${procedural.fairTrial}\n`;
        }
    }

    if (procedural.legalFramework) {
        output += `\nLegal Framework Assessment:\n${procedural.legalFramework}`;
    }

    return output || 'Procedural compliance assessment not available.\n';
}

/**
 * Helper function to format recommendations
 */
function formatRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
        return 'No specific recommendations at this time.\n';
    }

    return recommendations.map((rec, index) => {
        // Handle both criticalRecommendations format and regular recommendations format
        if (rec.specificIssue) {
            // New critical format
            return `
${index + 1}. ${getPriorityIcon(rec.priority)} ${rec.priority} PRIORITY

   🔍 Specific Issue Identified:
   ${rec.specificIssue}
   
   📄 Current Problematic Text:
   "${rec.currentText || 'Not specified'}"
   
   ✏️  Proposed Replacement Text:
   "${rec.proposedText || 'See mandatory correction above'}"
   
   📜 Constitutional Basis:
   ${rec.constitutionalBasis}
   
   💡 Rationale:
   ${rec.rationale}
`;
        } else {
            // Original format
            return `
${index + 1}. ${getPriorityIcon(rec.priority)} ${rec.priority} PRIORITY

   Action Required:
   ${rec.action}
   
   Rationale:
   ${rec.rationale}
   
   Constitutional Basis: ${rec.constitutionalBasis}
`;
        }
    }).join('\n');
}

/**
 * Helper function to format constitutional references
 */
function formatConstitutionalReferences(articles) {
    if (!articles || articles.length === 0) {
        return 'No constitutional articles referenced.\n';
    }

    return articles.slice(0, 15).map((article, index) => 
        `${(index + 1).toString().padStart(2, ' ')}. Article ${article.articleNumber.padEnd(4, ' ')} - ${article.heading}\n     Part ${article.part}: ${article.partName || 'N/A'}`
    ).join('\n');
}

// Helper functions for visual indicators
function getComplianceRating(score) {
    if (score >= 90) return '★★★★★ EXCELLENT';
    if (score >= 80) return '★★★★☆ VERY GOOD';
    if (score >= 70) return '★★★☆☆ GOOD';
    if (score >= 60) return '★★☆☆☆ FAIR';
    return '★☆☆☆☆ POOR';
}

function getStrengthIndicator(score) {
    if (score >= 9) return '🟢🟢🟢 STRONG';
    if (score >= 7) return '🟢🟢⚪ GOOD';
    if (score >= 5) return '🟡🟡⚪ MODERATE';
    return '🔴⚪⚪ WEAK';
}

function getRiskIndicator(score) {
    if (score >= 8) return '🔴🔴🔴 HIGH RISK';
    if (score >= 6) return '🟠🟠⚪ MODERATE RISK';
    if (score >= 4) return '🟡⚪⚪ LOW RISK';
    return '🟢⚪⚪ MINIMAL RISK';
}

function getSeverityIcon(severity) {
    const icons = {
        'CRITICAL': '🔴 ‼️',
        'HIGH': '🟠 ⚠️',
        'MODERATE': '🟡 ⚡',
        'LOW': '🟢 ℹ️'
    };
    return icons[severity] || '';
}

function getPriorityIcon(priority) {
    const icons = {
        'URGENT': '🔴',
        'HIGH': '🟠',
        'MEDIUM': '🟡',
        'LOW': '🟢'
    };
    return icons[priority] || '⚪';
}

function generateReportId() {
    return `CC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
}

module.exports = {
    checkConstitutionalCompliance,
    findRelevantLegalProvisions,
    formatComplianceReport
};
