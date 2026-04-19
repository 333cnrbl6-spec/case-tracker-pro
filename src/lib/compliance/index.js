/**
 * 🏛️ Portfolio Compliance Standards — Master Index
 * Date: April 2026
 * 
 * Central hub for app-specific compliance standards across all 4 portfolio apps.
 * Each app is 100% standalone with domain-specific compliance requirements.
 * 
 * Apps:
 * - Species Explorer: Conservation ecology & biodiversity surveying
 * - Premiso: UK property & landlord compliance
 * - CharityHub: Charity governance, fundraising & tax compliance
 * - CaseNarrative: RICS professional conduct & legal compliance
 */

// Import app-specific compliance modules
import SpeciesExplorerCompliance from './SpeciesExplorerCompliance.js';
import PremisoCompliance from './PremisoCompliance.js';
import CharityHubCompliance from './CharityHubCompliance.js';
import CaseNarrativeCompliance from './complianceStandards.js';

// =============================================================================
// UNIVERSAL COMPLIANCE PATTERNS
// =============================================================================

/**
 * Universal AI model selection pattern across all apps
 * Higher quality models for compliance-critical documents
 */
export const UNIVERSAL_AI_MODELS = {
  // Professional document generation (legal, property, conservation, charity)
  PROFESSIONAL_DOCUMENTS: 'claude_sonnet_4_6',
  
  // Complex multi-document analysis, compliance audits, risk assessments
  COMPLEX_ANALYSIS: 'claude_opus_4_6',
  
  // When web search context is needed (regulations, guidance updates)
  WEB_SEARCH: 'gemini_3_1_pro',
  
  // Simple tasks, internal classifications, non-critical summaries
  SIMPLE_TASKS: 'automatic'
};

/**
 * Universal compliance checklist categories (all apps must implement)
 */
export const UNIVERSAL_COMPLIANCE_CATEGORIES = {
  DATA_PROTECTION: 'dataProtection',
  AUDIT_TRAIL: 'auditTrail',
  ACCESS_CONTROL: 'accessControl',
  ERROR_HANDLING: 'errorHandling',
  FILE_VALIDATION: 'fileValidation',
  PERFORMANCE: 'performance',
  RETENTION_POLICY: 'retentionPolicy',
  EXPORT_RIGHTS: 'exportRights'
};

/**
 * Universal acceptance criteria for all features
 */
export const UNIVERSAL_ACCEPTANCE_CRITERIA = {
  FUNCTIONAL: 'Works as specified, no errors in console or logs',
  COMPLIANCE: 'Meets domain-specific regulations',
  SECURITY: 'No data leaks, proper auth checks on all endpoints',
  EDGE_CASES: 'Handles empty states, invalid inputs, network failures gracefully',
  PERFORMANCE: 'Page loads in <2s, AI calls complete in <10s',
  USER_EXPERIENCE: 'Clear UI, helpful error messages, onboarding included'
};

// =============================================================================
// APP-SPECIFIC COMPLIANCE MODULES
// =============================================================================

export const APP_COMPLIANCE = {
  /**
   * 🦋 Species Explorer
   * Domain: Conservation Ecology & Biodiversity Surveying
   * Regulators: Natural England, DEFRA, CIEEM, BTO
   */
  SPECIES_EXPLORER: {
    appName: 'Species Explorer',
    domain: 'Conservation Ecology',
    icon: '🦋',
    primaryRegulators: ['Natural England', 'DEFRA', 'CIEEM', 'BTO'],
    keyLegislation: [
      'Wildlife and Countryside Act 1981',
      'Conservation of Habitats and Species Regulations 2017',
      'Environment Act 2021 (Biodiversity Net Gain)',
      'Countryside and Rights of Way Act 2000'
    ],
    criticalRequirements: [
      'Protected species licensing (bats, great crested newts, dormice)',
      'Seasonal survey windows compliance',
      'Biodiversity Net Gain (10% minimum)',
      'Sensitive species location data protection',
      'CIEEM survey standards',
      'Data sharing with Local Records Centres'
    ],
    complianceModule: SpeciesExplorerCompliance,
    aiModelGuidance: SpeciesExplorerCompliance.AI_MODEL_GUIDANCE
  },

  /**
   * 🏠 Premiso
   * Domain: UK Property & Landlord Compliance
   * Regulators: Local Authorities, MHCLG, HSE, ICO
   */
  PREMISO: {
    appName: 'Premiso',
    domain: 'Property & Landlord Compliance',
    icon: '🏠',
    primaryRegulators: ['Local Authorities', 'MHCLG', 'HSE', 'ICO', 'Gas Safe Register'],
    keyLegislation: [
      'Housing Act 2004',
      'Housing Act 2016',
      'Tenant Fees Act 2019',
      'Homes (Fitness for Human Habitation) Act 2018',
      'Renters (Reform) Act 2024'
    ],
    criticalRequirements: [
      'Gas Safety Certificate (CP12) - annual',
      'EICR - every 5 years',
      'EPC minimum rating E (proposed C by 2025)',
      'Smoke & carbon monoxide alarms',
      'HMO licensing (5+ occupants)',
      'Deposit protection (30 days)',
      'Right to Rent checks',
      'Tenant Fees Act compliance'
    ],
    complianceModule: PremisoCompliance,
    aiModelGuidance: PremisoCompliance.AI_MODEL_GUIDANCE
  },

  /**
   * 💝 CharityHub
   * Domain: Charity Governance & Fundraising
   * Regulators: Charity Commission, HMRC, ICO, Fundraising Regulator
   */
  CHARITYHUB: {
    appName: 'CharityHub',
    domain: 'Charity & Third Sector',
    icon: '💝',
    primaryRegulators: ['Charity Commission', 'HMRC', 'ICO', 'Fundraising Regulator'],
    keyLegislation: [
      'Charities Act 2011',
      'Charities Act 2022',
      'UK GDPR / Data Protection Act 2018',
      'Fundraising Regulator Code of Practice'
    ],
    criticalRequirements: [
      'Charity Commission registration (income > £5,000)',
      'Annual return and accounts (SORP-compliant)',
      'Gift Aid declarations and claims',
      'Safeguarding policies (children/vulnerable adults)',
      'DBS checks for regulated activity',
      'Fundraising Code compliance',
      'Serious incident reporting',
      'Trustee duties and governance'
    ],
    complianceModule: CharityHubCompliance,
    aiModelGuidance: CharityHubCompliance.AI_MODEL_GUIDANCE
  },

  /**
   * ⚖️ CaseNarrative
   * Domain: Legal Practice & RICS Professional Conduct
   * Regulators: SRA, RICS, Legal Ombudsman, ICO
   */
  CASENARRATIVE: {
    appName: 'CaseNarrative',
    domain: 'Legal & RICS Compliance',
    icon: '⚖️',
    primaryRegulators: ['SRA', 'RICS', 'Legal Ombudsman', 'ICO'],
    keyLegislation: [
      'SRA Code of Conduct',
      'RICS Rules of Conduct',
      'Legal Services Act 2007',
      'Limitation Act 1980'
    ],
    criticalRequirements: [
      'Limitation date tracking (negligence risk)',
      'Client care letter requirements',
      'RICS Professional Standards (PS-1 to PS-7)',
      'Audit trail for all case actions',
      'Data retention (7+ years)',
      'Client confidentiality',
      'Conflict of interest checks',
      'Costs transparency'
    ],
    complianceModule: CaseNarrativeCompliance,
    aiModelGuidance: CaseNarrativeCompliance.AI_MODELS
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get compliance requirements for a specific app
 * @param {string} appName - One of: 'SPECIES_EXPLORER', 'PREMISO', 'CHARITYHUB', 'CASENARRATIVE'
 * @returns {Object} Compliance configuration for the app
 */
export const getAppCompliance = (appName) => {
  const config = APP_COMPLIANCE[appName];
  if (!config) {
    throw new Error(`Unknown app: ${appName}. Valid options: ${Object.keys(APP_COMPLIANCE).join(', ')}`);
  }
  return config;
};

/**
 * Get AI model recommendation for a specific app and task
 * @param {string} appName - App name
 * @param {string} taskType - Type of task (e.g., 'document_generation', 'compliance_audit')
 * @returns {string} Recommended AI model
 */
export const getAIModelForApp = (appName, taskType) => {
  const config = getAppCompliance(appName);
  const guidance = config.aiModelGuidance;
  
  if (!guidance) {
    return UNIVERSAL_AI_MODELS.PROFESSIONAL_DOCUMENTS;
  }

  const taskGuidance = guidance[taskType.toUpperCase()];
  return taskGuidance?.model || UNIVERSAL_AI_MODELS.PROFESSIONAL_DOCUMENTS;
};

/**
 * Get critical compliance checklist for an app
 * @param {string} appName - App name
 * @returns {Array} List of critical compliance requirements
 */
export const getCriticalComplianceChecks = (appName) => {
  const config = getAppCompliance(appName);
  const module = config.complianceModule;
  
  if (!module?.COMPLIANCE_CHECKLIST) {
    return [];
  }

  // Flatten checklist into single array
  return Object.entries(module.COMPLIANCE_CHECKLIST)
    .flatMap(([category, checks]) => 
      checks.map(check => ({
        category,
        check,
        critical: config.criticalRequirements.some(req => check.toLowerCase().includes(req.toLowerCase()))
      }))
    );
};

/**
 * Validate feature compliance for an app
 * @param {string} appName - App name
 * @param {string} featureName - Name of feature being validated
 * @param {Object} checklistResults - Results of compliance checks
 * @returns {Object} Validation result
 */
export const validateFeatureCompliance = (appName, featureName, checklistResults) => {
  const config = getAppCompliance(appName);
  const passedChecks = Object.values(checklistResults).filter(v => v === true).length;
  const totalChecks = Object.keys(checklistResults).length;
  
  return {
    app: config.appName,
    domain: config.domain,
    feature: featureName,
    passed: passedChecks === totalChecks,
    score: Math.round((passedChecks / totalChecks) * 100),
    timestamp: new Date().toISOString(),
    criticalRequirements: config.criticalRequirements,
    details: checklistResults
  };
};

/**
 * Get regulator contact information for an app
 * @param {string} appName - App name
 * @returns {Array} List of regulators with descriptions
 */
export const getAppRegulators = (appName) => {
  const config = getAppCompliance(appName);
  return config.primaryRegulators.map(regulator => ({
    name: regulator,
    role: getRegulatorRole(regulator, appName)
  }));
};

/**
 * Get regulator role description
 * @param {string} regulator - Regulator name
 * @param {string} appName - App name
 * @returns {string} Description of regulator's role
 */
const getRegulatorRole = (regulator, appName) => {
  const roles = {
    'Natural England': 'Government body for environmental protection, issues wildlife licences',
    'DEFRA': 'Department for Environment, Food & Rural Affairs - policy and legislation',
    'CIEEM': 'Chartered Institute of Ecology and Environmental Management - professional standards',
    'BTO': 'British Trust for Ornithology - bird survey standards and data',
    'Local Authorities': 'Enforcement of housing standards, HMO licensing, selective licensing',
    'MHCLG': 'Ministry of Housing, Communities & Local Government - housing policy',
    'HSE': 'Health and Safety Executive - gas safety, legionella',
    'Gas Safe Register': 'Gas engineering registration and certification',
    'ICO': 'Information Commissioner\'s Office - data protection enforcement',
    'Charity Commission': 'Regulator for charities in England and Wales',
    'HMRC': 'HM Revenue & Customs - Gift Aid, tax compliance',
    'Fundraising Regulator': 'Self-regulatory body for charity fundraising',
    'SRA': 'Solicitors Regulation Authority - legal practice regulation',
    'RICS': 'Royal Institution of Chartered Surveyors - professional standards',
    'Legal Ombudsman': 'Independent complaints handling for legal services'
  };
  return roles[regulator] || 'Regulatory oversight';
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  UNIVERSAL_AI_MODELS,
  UNIVERSAL_COMPLIANCE_CATEGORIES,
  UNIVERSAL_ACCEPTANCE_CRITERIA,
  APP_COMPLIANCE,
  getAppCompliance,
  getAIModelForApp,
  getCriticalComplianceChecks,
  validateFeatureCompliance,
  getAppRegulators
};