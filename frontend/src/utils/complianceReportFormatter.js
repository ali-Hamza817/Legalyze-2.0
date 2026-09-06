/**
 * Format constitutional compliance report data for display
 */
export function formatComplianceReport(data, filename) {
    let report = '';
    
    // Header
    report += `# ⚖️ Constitutional Compliance Report\n\n`;
    report += `**Document:** *${data.documentName || filename}*  \n`;
    report += `**Score:** **${data.complianceScore}/100** | Status: \`${data.complianceStatus || 'ANALYZED'}\`  \n`;
    report += `**Report ID:** \`${data.report_id || 'N/A'}\`\n\n`;
    report += `---\n\n`;
    
    // Executive Summary
    report += `## Executive Summary\n\n`;
    report += `${data.executiveSummary || '*Analysis complete*'}\n\n`;
    
    // Key Stats
    if (data.keyFindings && data.keyFindings.length > 0) {
        report += `**Key Statistics:**\n`;
        data.keyFindings.forEach((finding) => {
            report += `- ${finding}\n`;
        });
        report += `\n`;
    }
    
    // Sample Findings (simplified)
    if (data.mappings && data.mappings.length > 3) {
        report += `---\n\n`;
        report += `## Sample Findings (${data.mappings.length} total)\n\n`;
        
        // Show only compliant and non-compliant examples
        const compliant = data.mappings.find(m => m.decision === 'YES');
        const nonCompliant = data.mappings.find(m => m.decision === 'NO');
        
        if (compliant) {
            report += `✅ **Compliant Example**\n`;
            report += `*"${compliant.uploaded_text_snippet.substring(0, 120)}..."*\n`;
            report += `→ Aligns with **${compliant.constitution_match.article}** (${compliant.confidence}% confidence)\n\n`;
        }
        
        if (nonCompliant) {
            report += `❌ **Non-Compliant Example**\n`;
            report += `*"${nonCompliant.uploaded_text_snippet.substring(0, 120)}..."*\n`;
            report += `→ Violates **${nonCompliant.constitution_match.article}** (${nonCompliant.confidence}% confidence)\n\n`;
        }
    }
    
    // Violations Summary
    if (data.violations && data.violations.length > 0) {
        report += `---\n\n`;
        report += `## Violations Summary\n\n`;
        
        const highSeverity = data.violations.filter(v => v.severity === 'HIGH');
        const mediumSeverity = data.violations.filter(v => v.severity === 'MEDIUM');
        const lowSeverity = data.violations.filter(v => v.severity === 'LOW');
        
        if (highSeverity.length > 0) {
            report += `### 🔴 High Priority (${highSeverity.length})\n\n`;
            highSeverity.slice(0, 2).forEach((v) => {
                report += `**${v.constitution_reference}**\n`;
                report += `*Issue:* ${v.why_violates.substring(0, 150)}...\n`;
                report += `*Action:* ${v.next_steps}\n\n`;
            });
        }
        
        if (mediumSeverity.length > 0) {
            report += `### 🟡 Medium Priority (${mediumSeverity.length})\n`;
            mediumSeverity.slice(0, 2).forEach((v) => {
                report += `- **${v.constitution_reference}**: ${v.next_steps}\n`;
            });
            report += `\n`;
        }
        
        if (lowSeverity.length > 0) {
            report += `### 🟢 Low Priority (${lowSeverity.length})\n`;
            report += `Minor issues documented in full report.\n\n`;
        }
    }
    
    // Analysis Summary
    if (data.confidence_summary) {
        report += `---\n\n`;
        report += `## Analysis Quality\n\n`;
        
        const cs = data.confidence_summary;
        report += `| Level | Count |\n`;
        report += `|-------|-------|\n`;
        report += `| ✅ High Confidence | ${cs.high_confidence_findings || 0} |\n`;
        report += `| ⚠️ Needs Review | ${cs.partial_pending_findings || 0} |\n`;
        report += `| ❌ Non-Compliant | ${cs.non_compliant_findings || 0} |\n`;
        report += `| **Total** | **${cs.total_snippets_reviewed || 0}** |\n\n`;
    }
    
    // Footer
    report += `---\n\n`;
    report += `📥 **Full detailed PDF and JSON reports** with ${data.mappings?.length || 0} complete mappings are available.\n\n`;
    report += `💡 *Download the PDF for comprehensive analysis, detailed recommendations, and corrective language.*\n`;
    
    return report;
}
