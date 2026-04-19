/**
 * 🏠 Premiso — App-Specific Compliance Standards
 * Date: April 2026
 * Domain: UK Property & Landlord Compliance
 * 
 * Compliance requirements for residential lettings, property management,
 * landlord regulations, and tenant safety.
 */

// =============================================================================
// PRIMARY LEGISLATION
// =============================================================================

export const PRIMARY_LEGISLATION = {
  HOUSING_ACT_2004: {
    name: 'Housing Act 2004',
    description: 'Primary legislation governing residential property standards',
    keyParts: [
      'Part 1: Housing conditions (HHSRS)',
      'Part 2: Licensing of HMOs',
      'Part 3: Additional licensing',
      'Part 4: Home information packs (repealed)',
      'Part 5: Empty dwelling management orders'
    ],
    complianceRequirements: [
      'Housing Health and Safety Rating System (HHSRS) assessments',
      'HMO licensing for properties with 5+ occupants',
      'Additional licensing schemes (local authority discretion)',
      'Improvement notices and prohibition orders for hazards'
    ]
  },

  HOUSING_ACT_2016: {
    name: 'Housing Act 2016',
    description: 'Strengthened enforcement powers and new offences',
    keySections: [
      'Section 21: Retaliatory eviction protection',
      'Section 22: Enhanced local authority enforcement',
      'Part 2: Rogue landlords and property agents'
    ],
    complianceRequirements: [
      'Section 21 notice invalid if prescribed documents not served',
      'Retaliatory eviction defence for tenants',
      'Banning orders for serious offences',
      'Database of rogue landlords (local authority discretion)'
    ]
  },

  TENANT_FEES_ACT_2019: {
    name: 'Tenant Fees Act 2019',
    description: 'Prohibits most letting fees and caps deposits',
    permittedPayments: [
      'Rent',
      'Tenancy deposit (capped at 5 weeks rent where annual rent < £50,000, 6 weeks otherwise)',
      'Holding deposit (capped at 1 week rent)',
      'Changes to tenancy requested by tenant (capped at £50)',
      'Early termination requested by tenant',
      'Utilities, council tax, communication services',
      'Default fees for lost keys/late rent (reasonable costs only)'
    ],
    prohibitedPayments: [
      'Viewing fees',
      'Administration fees',
      'Reference fees',
      'Inventory fees',
      'Check-out fees',
      'Professional cleaning fees',
      'Gardening fees (unless included in rent)'
    ],
    penalties: {
      firstOffence: 'Up to £5,000 civil penalty',
      repeatOffence: 'Up to £30,000 civil penalty OR criminal offence'
    }
  },

  HOMES_FIT_FOR_HUMAN_HABITATION_ACT_2018: {
    name: 'Homes (Fitness for Human Habitation) Act 2018',
    description: 'Requires all rental properties to be fit for human habitation',
    effectiveDate: 'March 2019 (new tenancies), March 2020 (all tenancies)',
    hazards: [
      'Damp and mould growth',
      'Excess cold or heat',
      'Asbestos and biocides',
      'Biocides and carbon monoxide',
      'Lead and radiation',
      'Uncombusted fuel gas',
      'Structural collapse',
      'Falls, fires, electrical hazards',
      'Hot water provision',
      'Food preparation facilities',
      'Sanitation and drainage',
      'Water supply',
      'Entry and security',
      'Space and lighting',
      'Noise and pests'
    ],
    tenantRights: 'Tenants can take direct legal action against landlords'
  },

  RENTERS_REFORMS_ACT_2024: {
    name: 'Renters (Reform) Act 2024',
    description: 'Major reforms to private rented sector (phased implementation)',
    keyChanges: [
      'Abolition of Section 21 "no-fault" evictions (expected 2025)',
      'All tenancies become periodic (rolling)',
      'Landlord possession grounds strengthened',
      'Decent Homes Standard extended to PRS',
      'Ombudsman scheme mandatory',
      'Property Portal for all landlords',
      'Pet rights for tenants (with insurance)'
    ],
    implementationStatus: 'Expected 2025-2026 (check current status)'
  }
};

// =============================================================================
// SAFETY CERTIFICATES & INSPECTIONS
// =============================================================================

export const SAFETY_REQUIREMENTS = {
  GAS_SAFETY: {
    legislation: 'Gas Safety (Installation and Use) Regulations 1998',
    requirement: 'Annual gas safety check by Gas Safe registered engineer',
    certificate: 'CP12 (Gas Safety Certificate)',
    validity: '12 months (must be renewed before expiry)',
    tenantAccess: 'Copy must be provided to tenants within 28 days of check and to new tenants before move-in',
    penalties: 'Unlimited fine and/or imprisonment for non-compliance',
    appliances: ['Boilers', 'Gas fires', 'Cookers', 'Gas pipes and flues']
  },

  EICR: {
    legislation: 'Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020',
    requirement: 'Electrical Installation Condition Report (EICR) every 5 years',
    certificate: 'EICR (Electrical Installation Condition Report)',
    validity: '5 years (or sooner if recommended by engineer)',
    tenantAccess: 'Copy must be provided within 28 days of inspection and to new tenants before move-in',
    qualifications: 'Must be carried out by qualified and competent person',
    codes: {
      C1: 'Danger present - immediate action required',
      C2: 'Potentially dangerous - urgent remedial action',
      C3: 'Improvement recommended',
      FI: 'Further investigation required'
    },
    localAuthorityPowers: 'Can serve remedial notice and arrange repairs if landlord fails to act'
  },

  EPC: {
    legislation: 'Energy Performance of Buildings (England and Wales) Regulations 2012',
    requirement: 'Energy Performance Certificate required for all rental properties',
    minimumRating: 'Minimum EPC rating E (MEES Regulations)',
    validity: '10 years',
    exemptions: [
      'Listed buildings where compliance would unacceptably alter character',
      'Temporary buildings (<2 years)',
      'Stand-alone buildings (<50m²)',
      'Buildings due for demolition',
      'No improvement measures can raise rating above E (7 exemptions)'
    ],
    penalties: {
      breachLessThan3Months: 'Up to £2,000',
      breachMoreThan3Months: 'Up to £4,000',
      publicationNotice: 'Additional £1,000 for non-compliance'
    },
    upcomingChanges: {
      proposal: 'Minimum EPC rating C by 2025 for new tenancies, 2028 for all tenancies',
      status: 'Consultation ongoing (2025) - check current status'
    }
  },

  SMOKE_AND_CARBON_MONOXIDE: {
    legislation: 'Smoke and Carbon Monoxide Alarm (England) Regulations 2015 (amended 2022)',
    smokeAlarms: {
      requirement: 'At least one smoke alarm on every storey with a room used as living accommodation',
      type: 'Must be fixed to ceiling/wall and in working order',
      testing: 'Landlord must repair or replace once informed of fault'
    },
    carbonMonoxideAlarms: {
      requirement: 'In any room with fixed combustion appliance (excluding gas cookers)',
      type: 'Must be fixed to wall/ceiling and in working order',
      locations: ['Boiler rooms', 'Fireplaces', 'Wood burners', 'Gas heaters']
    },
    penalties: 'Civil penalty up to £5,000'
  },

  LEGIONELLA: {
    legislation: 'Health and Safety at Work etc. Act 1974 + Control of Substances Hazardous to Health Regulations 2002',
    requirement: 'Legionella risk assessment for all rental properties',
    frequency: 'Every 2 years or on change of tenancy',
    qualifiedAssessor: 'Not legally required but recommended (ACOP L8 compliance)',
    riskFactors: ['Water temperature 20-45°C', 'Stagnant water', 'Nutrients (rust, sludge, scale)', 'Aerosol production'],
    controlMeasures: [
      'Store hot water at 60°C minimum',
      'Cold water below 20°C',
      'Flush infrequently used outlets',
      'Remove dead legs in pipework',
      'Descale showerheads regularly'
    ]
  },

  FIRE_SAFETY: {
    legislation: 'Regulatory Reform (Fire Safety) Order 2005 + Fire Safety Act 2021',
    hmoRequirement: 'Fire risk assessment mandatory for all HMOs',
    standardHouses: 'Recommended but not legally required (except common parts in flats)',
    requirements: [
      'Fire doors (FD30 minimum) for HMOs',
      'Fire extinguishers and fire blankets',
      'Emergency lighting (HMOs)',
      'Clear escape routes',
      'Fire-resistant furnishings (furniture regulations)'
    ],
    furnitureRegulations: 'Furniture and Furnishings (Fire) (Safety) Regulations 1988 - all upholstered furniture must meet ignition resistance requirements'
  }
};

// =============================================================================
// LICENSING REQUIREMENTS
// =============================================================================

export const LICENSING = {
  HMO_LICENSING: {
    legislation: 'Housing Act 2004',
    mandatory: {
      appliesTo: 'Properties with 5+ occupants forming 2+ households, sharing facilities, 3+ storeys',
      licenceDuration: 'Up to 5 years',
      fee: 'Varies by local authority (£500-£1,500 typical)',
      requirements: [
        'Fit and proper person test',
        'Property meets minimum standards',
        'Maximum occupancy specified',
        'Annual return required'
      ]
    },
    additional: {
      description: 'Local authorities can extend licensing to smaller HMOs',
      checkRequired: 'Always check with local authority'
    },
    penalties: {
      operatingWithoutLicence: 'Unlimited fine',
      civilPenalty: 'Up to £30,000 as alternative to prosecution',
      rentRepaymentOrder: 'Tenants can claim up to 12 months rent back'
    }
  },

  SELECTIVE_LICENSING: {
    description: 'Local authority designation requiring all private rented properties in area to be licensed',
    checkRequired: 'Must check with local authority if property is in selective licensing area',
    typicalRequirements: [
      'Fit and proper person test',
      'Property conditions met',
      'Anti-social behaviour management',
      'Tenancy management standards'
    ]
  },

  SCOTLAND_WALES_NORTHERN_IRELAND: {
    scotland: {
      name: 'Landlord Registration Scheme',
      requirement: 'All landlords must register with local authority',
      renewal: 'Every 3 years'
    },
    wales: {
      name: 'Rent Smart Wales',
      requirement: 'All landlords must be licensed (not just registered)',
      training: 'Must complete approved training course',
      renewal: 'Every 5 years'
    },
    northernIreland: {
      name: 'Landlord Registration Scheme NI',
      requirement: 'Registration required with local council'
    }
  }
};

// =============================================================================
// DEPOSIT PROTECTION
// =============================================================================

export const DEPOSIT_PROTECTION = {
  legislation: 'Housing Act 2004 (as amended by Localism Act 2011)',
  requirement: 'All tenancy deposits must be protected in government-approved scheme',
  schemes: [
    'Deposit Protection Service (DPS)',
    'MyDeposits',
    'Tenancy Deposit Scheme (TDS)'
  ],
  timeline: 'Must be protected within 30 days of receipt',
  prescribedInformation: {
    requirement: 'Must serve prescribed information within 30 days',
    includes: [
      'Scheme details and contact information',
      'Landlord/agent details',
      'Property address',
      'Deposit amount',
      'Tenancy start and end dates',
      'Repayment process',
      'Dispute resolution process'
    ]
  },
  penalties: {
    tenantClaim: 'Tenant can claim 1-3x deposit amount',
    section21Invalid: 'Cannot serve valid Section 21 notice until compliant'
  }
};

// =============================================================================
// RIGHT_TO_RENT
// =============================================================================

export const RIGHT_TO_RENT = {
  legislation: 'Immigration Act 2014',
  requirement: 'Landlords must check all adult tenants have right to rent in UK',
  checks: [
    'Obtain original documents (passport, visa, biometric residence permit)',
    'Check documents in presence of holder',
    'Make and retain copies',
    'Record date of check'
  ],
  timing: 'Before tenancy starts (or within 28 days for some cases)',
  followUp: 'Required for tenants with time-limited permission (repeat before expiry or after 12 months)',
  penalties: {
    civilPenalty: 'Up to £3,000 per adult tenant',
    criminalOffence: 'If landlord knew or had reasonable cause to believe tenant had no right to rent'
  },
  digitalChecks: 'Online right to rent share code checks accepted'
};

// =============================================================================
// COMPLIANCE CHECKLIST — PREMISO
// =============================================================================

export const COMPLIANCE_CHECKLIST = {
  safetyCertificates: [
    'Gas Safety Certificate (CP12) - current and renewed annually',
    'Electrical Installation Condition Report (EICR) - valid (within 5 years)',
    'Energy Performance Certificate (EPC) - minimum rating E, valid (within 10 years)',
    'Smoke alarms installed and tested on every floor',
    'Carbon monoxide alarms in rooms with combustion appliances',
    'Legionella risk assessment completed',
    'Fire risk assessment (HMOs mandatory, others recommended)',
    'Furniture meets fire safety regulations'
  ],
  licensing: [
    'HMO licence obtained if applicable (5+ occupants)',
    'Additional/selective licensing checked with local authority',
    'Landlord registration (Scotland/Wales/NI if applicable)',
    'Licence conditions understood and followed',
    'Annual returns submitted on time'
  ],
  tenancyCompliance: [
    'Deposit protected in government scheme within 30 days',
    'Prescribed information served within 30 days',
    'Right to rent checks completed and documented',
    'How to Rent guide provided to tenants',
    'Gas safety certificate provided before tenancy',
    'EPC provided before tenancy',
    'Tenant Fees Act compliance (no prohibited fees)',
    'Section 21 notice only served if all documents served'
  ],
  propertyStandards: [
    'HHSRS assessment - no Category 1 hazards',
    'Property meets Decent Homes Standard',
    'Fitness for Human Habitation - no hazards identified',
    'Repairs completed within reasonable timescales',
    'Annual gas safety inspection completed',
    'Electrical inspection every 5 years'
  ],
  upcomingReforms: [
    'Prepared for abolition of Section 21 (check current status)',
    'Property Portal registration ready (when launched)',
    'Ombudsman scheme membership ready (when mandatory)',
    'EPC C standard pathway planned (if proposed)'
  ]
};

// =============================================================================
// AI MODEL SELECTION — PREMISO
// =============================================================================

export const AI_MODEL_GUIDANCE = {
  TENANCY_AGREEMENT_GENERATION: {
    model: 'claude_sonnet_4_6',
    reason: 'Legal document requiring precision and regulatory compliance',
    useCase: 'Generating AST agreements, HMO agreements, guarantor forms'
  },
  COMPLIANCE_AUDIT: {
    model: 'claude_opus_4_6',
    reason: 'Complex multi-document analysis across multiple regulations',
    useCase: 'Reviewing property compliance across all certificates and regulations'
  },
  DEPOSIT_DISPUTE_ANALYSIS: {
    model: 'claude_sonnet_4_6',
    reason: 'Legal analysis requiring knowledge of TDP scheme rules',
    useCase: 'Analyzing deposit disputes and adjudication cases'
  },
  PROPERTY_DESCRIPTION: {
    model: 'automatic',
    reason: 'Simple descriptive task, no regulatory implications',
    useCase: 'Generating property listings, feature descriptions'
  },
  LEGISLATION_RESEARCH: {
    model: 'gemini_3_1_pro',
    reason: 'Need current information on regulations and case law',
    useCase: 'Checking latest Housing Act updates, local licensing schemes, EPC proposals'
  },
  HHSRS_ASSESSMENT: {
    model: 'claude_opus_4_6',
    reason: 'Complex hazard assessment across 29 categories',
    useCase: 'Analyzing property conditions against HHSRS standards'
  },
  SECTION_21_VALIDITY: {
    model: 'claude_sonnet_4_6',
    reason: 'Legal document requiring precision',
    useCase: 'Validating Section 21 notice compliance with all prerequisites'
  }
};

// =============================================================================
// DOCUMENT TEMPLATES
// =============================================================================

export const REQUIRED_DOCUMENTS = {
  BEFORE_TENANCY: [
    'Tenancy Agreement (AST or HMO)',
    'Deposit Protection Certificate + Prescribed Information',
    'Gas Safety Certificate (CP12)',
    'Energy Performance Certificate (EPC)',
    'How to Rent Guide',
    'Right to Rent check records',
    'EICR (if available)',
    'Inventory and Schedule of Condition'
  ],
  DURING_TENANCY: [
    'Gas Safety Certificate (annual renewal)',
    'Section 21 or Section 8 notices (if applicable)',
    'Notice of rent increase',
    'Access notices for inspections/repairs'
  ],
  END_OF_TENANCY: [
    'Check-out report',
    'Deposit reconciliation',
    'Utility final readings',
    'Notice to subsequent tenants (if reletting)'
  ]
};

// Export all compliance standards
export default {
  PRIMARY_LEGISLATION,
  SAFETY_REQUIREMENTS,
  LICENSING,
  DEPOSIT_PROTECTION,
  RIGHT_TO_RENT,
  COMPLIANCE_CHECKLIST,
  AI_MODEL_GUIDANCE,
  REQUIRED_DOCUMENTS
};