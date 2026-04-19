/**
 * 🏛️ Portfolio Compliance & AI Processing Standards
 * Date: April 2026 | Applies to: CaseNarrative (RICS Conduct Investigation)
 * 
 * Universal directive implementing board-mandated compliance and AI processing standards.
 * Every feature MUST follow these patterns for consistency, quality, and regulatory compliance.
 */

// =============================================================================
// AI MODEL SELECTION — BEST-IN-CLASS FOR EACH USE CASE
// =============================================================================

export const AI_MODELS = {
  // Default for professional document generation (legal, compliance, regulatory)
  PROFESSIONAL_DOCUMENTS: "claude_sonnet_4_6",
  
  // Complex multi-document analysis, compliance audits, risk assessments
  COMPLEX_ANALYSIS: "claude_opus_4_6",
  
  // When web search context is needed (RICS rules updates, legal precedents)
  WEB_SEARCH: "gemini_3_1_pro",
  
  // Simple tasks, internal classifications, non-critical summaries
  SIMPLE_TASKS: "automatic",
};

// Model selection helper based on task type
export const selectModel = (taskType) => {
  const modelMap = {
    'legal_narrative': AI_MODELS.PROFESSIONAL_DOCUMENTS,
    'compliance_checklist': AI_MODELS.PROFESSIONAL_DOCUMENTS,
    'breach_notification': AI_MODELS.PROFESSIONAL_DOCUMENTS,
    'solicitor_brief': AI_MODELS.PROFESSIONAL_DOCUMENTS,
    'evidence_analysis': AI_MODELS.COMPLEX_ANALYSIS,
    'incident_correlation': AI_MODELS.COMPLEX_ANALYSIS,
    'risk_assessment': AI_MODELS.COMPLEX_ANALYSIS,
    'document_classification': AI_MODELS.COMPLEX_ANALYSIS,
    'simple_summary': AI_MODELS.SIMPLE_TASKS,
    'internal_classification': AI_MODELS.SIMPLE_TASKS,
  };
  return modelMap[taskType] || AI_MODELS.PROFESSIONAL_DOCUMENTS;
};

// =============================================================================
// UNIVERSAL AI DOCUMENT INTELLIGENCE PATTERN
// =============================================================================

/**
 * Standard prompt template for legal document processing
 * @param {string} documentType - Type of document being processed
 * @param {Array} keyFields - Fields to extract
 * @param {Array} complianceRules - RICS rules to validate against
 * @param {Array} riskIndicators - Risk flags to check for
 */
export const createLegalDocumentPrompt = (documentType, keyFields, complianceRules, riskIndicators) => {
  return `You are a UK legal compliance expert specializing in RICS professional conduct investigations.
Process this ${documentType} for CaseNarrative legal case management system.

Extract: ${keyFields.join(', ')}
Validate against RICS Rules: ${complianceRules.join(', ')}
Flag risk indicators: ${riskIndicators.join(', ')}

Output structured JSON with confidence scores and recommended actions.
Ensure all extracted data is precise, verifiable, and audit-ready.`;
};

// Universal response schema for compliance document processing
export const complianceResponseSchema = {
  type: "object",
  properties: {
    extracted_data: { 
      type: "object",
      description: "Structured data extracted from the document"
    },
    compliance_status: { 
      type: "string", 
      enum: ["compliant", "review_required", "non_compliant"],
      description: "Overall compliance assessment"
    },
    risk_flags: { 
      type: "array", 
      items: { type: "string" },
      description: "Specific compliance risks identified"
    },
    confidence_score: { 
      type: "number", 
      minimum: 0, 
      maximum: 1,
      description: "AI confidence in the analysis (0-1)"
    },
    recommended_actions: { 
      type: "array", 
      items: { type: "string" },
      description: "Specific actions required to address issues"
    },
    rics_rules_referenced: {
      type: "array",
      items: { type: "string" },
      description: "RICS rule numbers referenced in analysis"
    }
  },
  required: ["extracted_data", "compliance_status", "confidence_score", "recommended_actions"]
};

// =============================================================================
// UNIVERSAL FILE UPLOAD & AI SORTING PATTERN
// =============================================================================

/**
 * Prompt for classifying and sorting uploaded evidence documents
 */
export const evidenceClassificationPrompt = `Analyse this uploaded evidence file for a RICS professional conduct investigation.

File Type: [auto-detect: pdf/docx/xlsx/csv/jpg/png/etc.]
Content Type: [classify: contract/certificate/report/financial/technical/legal/compliance/communication/photograph/transcript]

Extract:
- Document date and parties involved
- Key factual claims or statements
- Any admissions, contradictions, or concerning language
- Relevance to professional conduct issues

Validate:
- Document authenticity indicators
- Chain of custody requirements
- Data protection compliance (redact personal data if needed)

Risk Level: [low/medium/high/critical] based on:
- Legal privilege implications
- Sensitivity of content
- Potential for dispute
- Regulatory significance

Action Required: [none/review/immediate/block]
Auto-sort Destination: [incident/communication/evidence/other]

Output structured JSON with high precision - this evidence may be used in legal proceedings.`;

export const evidenceResponseSchema = {
  type: "object",
  properties: {
    file_type: { type: "string", description: "Detected file format" },
    content_category: { 
      type: "string",
      enum: ["contract", "certificate", "report", "financial", "technical", "legal", "compliance", "communication", "photograph", "transcript", "other"],
      description: "Classification of document content"
    },
    extracted_fields: { 
      type: "object",
      properties: {
        date: { type: "string" },
        parties: { type: "array", items: { type: "string" } },
        key_facts: { type: "array", items: { type: "string" } },
        concerns: { type: "array", items: { type: "string" } }
      }
    },
    compliance_check: {
      type: "object",
      properties: {
        authenticity_score: { type: "number" },
        data_protection_compliant: { type: "boolean" },
        privilege_flagged: { type: "boolean" }
      }
    },
    risk_level: { 
      type: "string", 
      enum: ["low", "medium", "high", "critical"],
      description: "Overall risk assessment"
    },
    action_required: { 
      type: "string", 
      enum: ["none", "review", "immediate", "block"],
      description: "Required action level"
    },
    auto_sort_destination: { 
      type: "string",
      enum: ["incident", "communication", "evidence", "other"],
      description: "Which entity this evidence belongs to"
    },
    suggested_metadata: {
      type: "object",
      properties: {
        evidence_type: { type: "string" },
        relevance: { type: "string" },
        strength: { type: "string" }
      }
    }
  },
  required: ["file_type", "content_category", "risk_level", "action_required", "auto_sort_destination"]
};

// =============================================================================
// UNIVERSAL COMPLIANCE CHECKLIST — CASENARRATIVE
// =============================================================================

export const COMPLIANCE_CHECKLIST = {
  // Data Protection (GDPR)
  dataProtection: [
    "All personal data encrypted at rest",
    "GDPR-compliant storage with clear retention policies",
    "Right to access/export implemented for users",
    "Right to erasure workflow documented",
    "Data processing agreement with Base44 in place",
    "Privacy notice visible to end users"
  ],
  
  // Audit Trail
  auditTrail: [
    "Every create/update/delete logged with timestamp",
    "User email captured for all actions",
    "Audit logs immutable and exportable",
    "Change history visible for critical records (cases, incidents, evidence)"
  ],
  
  // Access Control
  accessControl: [
    "Role-based permissions enforced (admin/user)",
    "User cannot access other firms' data",
    "Sensitive operations require admin role",
    "Session timeout implemented"
  ],
  
  // Retention Policy
  retentionPolicy: [
    "Automated archival after case closure (7 years minimum)",
    "Limitation date tracking with escalating alerts",
    "Client data deletion workflow on request",
    "Backup retention aligned with SRA requirements"
  ],
  
  // Export Rights
  exportRights: [
    "One-click case export (PDF/JSON)",
    "GDPR data portability format available",
    "Export includes full audit trail",
    "Export completes in <30 seconds"
  ],
  
  // Error Handling
  errorHandling: [
    "Graceful failures with user-friendly messages",
    "No sensitive data in error messages or logs",
    "Retry logic for transient failures",
    "Error tracking and alerting configured"
  ],
  
  // Rate Limiting
  rateLimiting: [
    "AI endpoints protected from abuse",
    "File upload size limits enforced (max 10MB)",
    "Concurrent request limits in place",
    "Clear error messages when limits exceeded"
  ],
  
  // File Validation
  fileValidation: [
    "File type validation on upload",
    "Virus/malware scanning (via Base44)",
    "Rejection of executable files",
    "Image sanitization for uploaded photos"
  ],
  
  // Backup & Recovery
  backupRecovery: [
    "Automated daily backups via Base44",
    "Tested restore procedure documented",
    "Disaster recovery plan in place",
    "Business continuity procedures defined"
  ]
};

// Domain-specific compliance for legal practice (SRA/RICS)
export const LEGAL_COMPLIANCE_REQUIREMENTS = {
  SRA: [
    "SRA Code of Conduct compliance",
    "Limitation date tracking (critical — negligence risk)",
    "Client care letter requirements",
    "Costs transparency and client communication",
    "Conflict of interest checks",
    "Professional indemnity insurance awareness"
  ],
  RICS: [
    "RICS Rules of Conduct alignment",
    "Professional Standards compliance (PS-1.x)",
    "Honesty and Integrity (PS-2)",
    "Conflicts of Interest (PS-3)",
    "Client Relations (PS-4)",
    "Complaints Handling (PS-6)",
    "Documentation standards (PS-7)"
  ]
};

// =============================================================================
// TESTING & ACCEPTANCE CRITERIA
// =============================================================================

export const ACCEPTANCE_CRITERIA = {
  functional: "Works as specified, no errors in console or logs",
  compliance: "Meets SRA/RICS regulations and GDPR requirements",
  security: "No data leaks, proper auth checks on all endpoints",
  edgeCases: "Handles empty states, invalid inputs, network failures gracefully",
  performance: "Page loads in <2s, AI calls complete in <10s",
  userExperience: "Clear UI, helpful error messages, onboarding included"
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate that a feature meets all compliance requirements
 * @param {string} featureName - Name of the feature being validated
 * @param {Object} checklistResults - Results of compliance checks
 * @returns {Object} Validation result with pass/fail status
 */
export const validateCompliance = (featureName, checklistResults) => {
  const allChecks = Object.values(COMPLIANCE_CHECKLIST).flat();
  const passedChecks = Object.values(checklistResults).filter(r => r === true).length;
  const totalChecks = Object.values(checklistResults).length;
  
  return {
    feature: featureName,
    passed: passedChecks === totalChecks,
    score: Math.round((passedChecks / totalChecks) * 100),
    timestamp: new Date().toISOString(),
    details: checklistResults
  };
};

/**
 * Log compliance audit trail entry
 * @param {string} action - Action performed (create/update/delete/export)
 * @param {string} entityType - Type of entity affected
 * @param {string} entityId - ID of the entity
 * @param {string} userEmail - Email of user performing action
 * @param {Object} metadata - Additional context
 */
export const logAuditEntry = async (action, entityType, entityId, userEmail, metadata = {}) => {
  // This would integrate with an AuditLog entity if it exists
  // For now, this is a placeholder for the pattern
  console.log(`[AUDIT] ${action.toUpperCase()} | ${entityType}:${entityId} | ${userEmail} | ${JSON.stringify(metadata)}`);
};

/**
 * Get model recommendation for a given task
 * @param {string} taskDescription - Description of the task
 * @returns {string} Recommended model name
 */
export const getModelRecommendation = (taskDescription) => {
  const lowerDesc = taskDescription.toLowerCase();
  
  if (lowerDesc.includes('legal') || lowerDesc.includes('compliance') || lowerDesc.includes('regulatory')) {
    return AI_MODELS.PROFESSIONAL_DOCUMENTS;
  }
  if (lowerDesc.includes('complex') || lowerDesc.includes('multi-document') || lowerDesc.includes('audit')) {
    return AI_MODELS.COMPLEX_ANALYSIS;
  }
  if (lowerDesc.includes('web') || lowerDesc.includes('search') || lowerDesc.includes('current')) {
    return AI_MODELS.WEB_SEARCH;
  }
  return AI_MODELS.SIMPLE_TASKS;
};

// Export all standards for use across the app
export default {
  AI_MODELS,
  selectModel,
  createLegalDocumentPrompt,
  complianceResponseSchema,
  evidenceClassificationPrompt,
  evidenceResponseSchema,
  COMPLIANCE_CHECKLIST,
  LEGAL_COMPLIANCE_REQUIREMENTS,
  ACCEPTANCE_CRITERIA,
  validateCompliance,
  logAuditEntry,
  getModelRecommendation
};