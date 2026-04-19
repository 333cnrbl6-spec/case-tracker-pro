/**
 * 💝 CharityHub — App-Specific Compliance Standards
 * Date: April 2026
 * Domain: UK Charity & Third Sector Compliance
 * 
 * Compliance requirements for charity governance, fundraising,
 * Gift Aid, safeguarding, and regulatory reporting.
 */

// =============================================================================
// PRIMARY LEGISLATION & REGULATORS
// =============================================================================

export const PRIMARY_LEGISLATION = {
  CHARITIES_ACT_2011: {
    name: 'Charities Act 2011',
    description: 'Primary legislation governing charities in England and Wales',
    keyParts: [
      'Part 1: Meaning of charity',
      'Part 2: Charity Commission',
      'Part 3: Registration and names',
      'Part 4: Charity accounts and reports',
      'Part 6: Cy-près powers',
      'Part 7: Charity land',
      'Part 8: Transactions',
      'Part 10: Mergers',
      'Part 11: Dissolution',
      'Part 12: Regulation',
      'Part 17: Charitable Incorporated Organisations (CIOs)'
    ],
    complianceRequirements: [
      'Must be established for charitable purposes only',
      'Must provide public benefit',
      'Must register with Charity Commission if income > £5,000',
      'Annual return and accounts submission',
      'Trustee duties and responsibilities'
    ]
  },

  CHARITIES_ACT_2022: {
    name: 'Charities Act 2022',
    description: 'Major reforms to charity law (phased implementation)',
    keyChanges: [
      'Streamlined charity reporting (new thresholds)',
      'Enhanced Charity Commission powers',
      'Simplified charity mergers',
      'Updated cy-près rules',
      'New fundraising regulations',
      'Protected charity names and logos',
      'Trustee indemnity insurance clarified',
      'Permanent endowment flexibility'
    ],
    implementationStatus: 'Most provisions in force from 2023-2024'
  },

  FUNDRAISING_REGULATIONS: {
    name: 'Fundraising Regulator Code of Fundraising Practice',
    description: 'Self-regulatory framework for charity fundraising',
    updated: 'November 2025 (new Code)',
    keyPrinciples: [
      'Legal',
      'Open',
      'Honest',
      'Respectful',
      'Supportive'
    ],
    standards: [
      'Fundraising with the public',
      'Fundraising with vulnerable people',
      'Donations and financial transactions',
      'Supervised volunteers',
      'Monitoring and reporting',
      'Data protection and privacy',
      'Complaints handling'
    ],
    enforcement: 'Fundraising Regulator can investigate complaints and require remedial action'
  },

  GDPR_DATA_PROTECTION_ACT_2018: {
    name: 'UK GDPR and Data Protection Act 2018',
    description: 'Data protection and privacy legislation',
    charitySpecifics: [
      'Donor data must be processed lawfully and fairly',
      'Explicit consent required for marketing communications',
      'Right to erasure (with some exceptions for legal obligations)',
      'Data sharing agreements with processors',
      'Data Protection Officer required for large-scale processing',
      'Breach notification to ICO within 72 hours'
    ],
    fundraisingGuidance: 'ICO and Fundraising Regulator joint guidance on donor privacy'
  }
};

// =============================================================================
// HMRC & TAX COMPLIANCE
// =============================================================================

export const HMRC_COMPLIANCE = {
  GIFT_AID: {
    legislation: 'Income Tax Act 2007 + Finance Act provisions',
    scheme: 'Gift Aid allows charities to reclaim basic rate tax on donations',
    currentRate: '25% (basic rate tax reclaimed)',
    donorEligibility: [
      'Must be UK taxpayer',
      'Must have paid sufficient income/capital gains tax to cover claim',
      'Must make Gift Aid declaration',
      'Cannot receive more than minimal benefits from donation'
    ],
    charityRequirements: [
      'Recognised by HMRC as charity or CASC',
      'Maintain valid Gift Aid declarations',
      'Keep records for 6 years',
      'Submit Gift Aid claims (online or paper)',
      'Report changes in circumstances'
    ],
    declarationRequirements: {
      mustInclude: [
        'Donor name',
        'Home address',
        'Postcode',
        'Name of charity',
        'Statement that donor is UK taxpayer',
        'Confirmation that donor understands tax implications'
      ],
      formats: ['Written', 'Oral (recorded)', 'Online (with audit trail)']
    },
    benefits: {
      description: 'Donors can receive certain benefits and still Gift Aid',
      limits: {
        under100: '25% of donation amount',
        under1000: '£25 maximum',
        over1000: '5% of donation, maximum £2,500'
      },
      examples: ['Tote bags', 'Badges', 'Annual reports', 'Free entry to events (limited)']
    },
    smallDonationsScheme: {
      name: 'Gift Aid Small Donations Scheme (GASDS)',
      description: 'Claim top-up payments on cash donations under £30 without declarations',
      limit: 'Up to £8,000 of small donations per year (£6,000 before April 2023)',
      eligibility: 'Must have made Gift Aid claims in 2 of previous 2 years'
    },
    auditRisk: 'HMRC conducts compliance checks - must maintain proper records'
  },

  CORPORATION_TAX: {
    description: 'Charities generally exempt from corporation tax on charitable activities',
    taxableActivities: [
      'Non-charitable trading',
      'Investment income (unless covered by exemptions)',
      'Property income (unless covered by exemptions)'
    ],
    thresholds: {
      tradingAllowance: 'Small-scale trading may be exempt',
      investmentIncome: 'Must be applied for charitable purposes'
    },
    filingRequirement: 'Company Tax Return required if taxable income exists'
  },

  VAT: {
    description: 'Charities may be VAT registered if taxable supplies exceed threshold',
    currentThreshold: '£90,000 taxable turnover (2024/25)',
    charityReliefs: [
      'Zero-rating for certain goods and services',
      'Exemptions for education, health, welfare services',
      'Partial exemption rules for mixed activities',
      'VAT repayment schemes for some charities'
    ],
    commonIssues: [
      'Business vs non-business activities',
      'Input tax recovery on overheads',
      'Fundraising event VAT treatment',
      'Grant vs supply distinction'
    ]
  },

  PAYE: {
    description: 'Charities must operate PAYE for employees',
    requirements: [
      'Register as employer with HMRC',
      'Operate PAYE on salaries',
      'Submit RTI returns',
      'Pay employer NICs',
      'Auto-enrolment pension duties'
    ],
    volunteerExpenses: 'Can be reimbursed tax-free if qualifying expenses'
  },

  BUSINESS_RATES: {
    description: 'Charities entitled to 80% mandatory relief on charitable premises',
    discretionaryRelief: 'Local councils can grant up to 100% additional relief',
    eligibility: [
      'Property must be used for charitable purposes',
      'Next use must be charitable if temporarily vacant'
    ],
    application: 'Apply to local council for relief'
  }
};

// =============================================================================
// CHARITY COMMISSION REPORTING
// =============================================================================

export const CHARITY_COMMISSION_REPORTING = {
  ANNUAL_RETURN: {
    dueDate: 'Within 10 months of financial year end',
    submissionMethod: 'Online via Charity Commission portal',
    contents: [
      'Financial information (income, expenditure, assets)',
      'Trustee information',
      'Activities and achievements',
      'Governance information',
      'Public benefit reporting',
      'Serious incident reporting (if applicable)'
    ]
  },

  ANNUAL_ACCOUNTS: {
    requirements: 'Must prepare accounts in accordance with Charities SORP',
    thresholds: {
      under25k: {
        income: 'Under £25,000',
        requirement: 'Receipts and payments accounts',
        externalReview: 'Not required (but recommended)',
        submission: 'Annual return information only'
      },
      under250k: {
        income: '£25,000 - £250,000',
        requirement: 'Receipts and payments or accruals accounts',
        externalReview: 'Independent examination required',
        submission: 'Accounts and annual return'
      },
      under1m: {
        income: '£250,000 - £1 million',
        requirement: 'Accruals accounts (SORP-compliant)',
        externalReview: 'Independent examination or audit',
        submission: 'Accounts and annual return'
      },
      over1m: {
        income: 'Over £1 million',
        requirement: 'Accruals accounts (SORP-compliant)',
        externalReview: 'Full audit required',
        submission: 'Accounts and annual return'
      },
      over250k_assets: {
        assets: 'Gross assets over £3.26m OR income over £250k',
        requirement: 'Accruals accounts',
        externalReview: 'Audit required regardless of income'
      }
    }
  },

  SORP: {
    name: 'Statement of Recommended Practice',
    description: 'Accounting framework for charities',
    currentVersion: 'FRS 102 SORP (Charities)',
    keyRequirements: [
      'Accruals basis of accounting',
      'Statement of Financial Activities (SOFA)',
      'Balance sheet',
      'Cash flow statement',
      'Notes to accounts',
      'Trustees annual report',
      'Going concern assessment',
      'Fund accounting (restricted/unrestricted/endowment)'
    ]
  },

  SERIOUS_INCIDENT_REPORTING: {
    description: 'Must report serious incidents to Charity Commission',
    examples: [
      'Fraud or theft',
      'Significant financial loss',
      'Safeguarding incidents',
      'Terrorism links or extremism',
      'Criminal activity within charity',
      'Regulatory breaches',
      'Reputational damage',
      'Cyber security incidents',
      'Data breaches'
    ],
    timeline: 'Report as soon as discovered, even if details incomplete',
    method: 'Online serious incident report form'
  }
};

// =============================================================================
// SAFEGUARDING
// =============================================================================

export const SAFEGUARDING = {
  legislation: 'Safeguarding Vulnerable Groups Act 2006 + Care Act 2014',
  applies: 'All charities working with children or vulnerable adults',
  
  children: {
    legislation: 'Working Together to Safeguard Children (2018, updated 2023)',
    requirements: [
      'Safeguarding policy and procedures',
      'Designated Safeguarding Lead (DSL)',
      'DBS checks for staff and volunteers in regulated activity',
      'Safeguarding training for all trustees and staff',
      'Safe recruitment practices',
      'Reporting concerns to local authority/MASH',
      'Record-keeping of concerns and incidents'
    ],
    regulatedActivity: [
      'Unsupervised contact with children',
      'Teaching, training, instructing',
      'Personal care',
      'Healthcare',
      'Registered childminding',
      'Driving children for specified purposes'
    ]
  },

  vulnerableAdults: {
    legislation: 'Care Act 2014',
    requirements: [
      'Safeguarding adults policy',
      'Designated lead for safeguarding adults',
      'DBS checks where appropriate',
      'Training for staff and volunteers',
      'Reporting to local authority safeguarding team',
      'Record-keeping'
    ],
    categoriesOfAbuse: [
      'Physical',
      'Emotional/psychological',
      'Financial',
      'Sexual',
      'Neglect',
      'Discriminatory',
      'Organisational',
      'Domestic violence',
      'Modern slavery',
      'Self-neglect'
    ]
  },

  DBS_CHECKS: {
    levels: {
      BASIC: 'Unspent convictions only - any role',
      STANDARD: 'Spent and unspent convictions - specified roles',
      ENHANCED: 'Enhanced check + barred lists - regulated activity',
      ENHANCED_BARRED: 'Enhanced + check of barred lists - regulated activity with children/vulnerable adults'
    },
    updateService: 'DBS Update Service allows portability of certificates',
    frequency: 'Recommended every 3 years for ongoing roles'
  }
};

// =============================================================================
// FUNDRAISING COMPLIANCE
// =============================================================================

export const FUNDRAISING_COMPLIANCE = {
  CODE_OF_FUNDRAISING_PRACTICE: {
    updated: 'November 2025',
    principles: ['Legal', 'Open', 'Honest', 'Respectful', 'Supportive'],
    keyStandards: [
      'Clear information about charity and cause',
      'No undue pressure on donors',
      'Respect for vulnerable people',
      'Transparent about how donations used',
      'Clear complaints process',
      'Data protection compliance',
      'Supervised volunteers'
    ]
  },

  STREET_AND_DOOR_TO_DOOR: {
    legislation: 'Police, Factories, etc. (Miscellaneous Provisions) Act 1916',
    requirement: 'Permit required from local authority',
    conditions: [
      'Specified dates and areas',
      'Identification badges must be worn',
      'Collection boxes must be sealed and numbered',
      'Accounts must be kept and submitted'
    ]
  },

  LOTTERIES_AND_RAFFLES: {
    legislation: 'Gambling Act 2005',
    societyLottery: {
      description: 'Lotteries to raise funds for good causes',
      limits: {
        ticketSales: 'Maximum £5 million per year',
        singleLottery: 'Maximum £500,000 per lottery',
        prizes: 'Maximum 55% of proceeds to prizes, minimum 20% to good cause'
      },
      registration: 'Must register with Gambling Commission if annual turnover > £20,000',
      localRegistration: 'Local authority registration if under £20,000'
    },
    smallLottery: {
      description: 'Incidental lotteries at events',
      conditions: [
        'Tickets sold only at event',
        'Results announced at event',
        'No rollovers',
        'Maximum £500 in prizes (or £3,000 for series)'
      ]
    }
  },

  ONLINE_FUNDRAISING: {
    requirements: [
      'Clear charity registration details',
      'Secure payment processing (PCI DSS)',
      'GDPR compliance for donor data',
      'Clear terms and conditions',
      'Accessible complaints process',
      'Platform due diligence (if using third parties)'
    ],
    platforms: [
      'JustGiving',
      'Virgin Money Giving',
      'GoFundMe Charity',
      'Crowdfunder',
      'Facebook Fundraising'
    ]
  },

  PROFESSIONAL_FUNDRAISERS: {
    legislation: 'Charities (Protection and Social Investment) Act 2016',
    requirement: 'Written agreement required with professional fundraisers and commercial participators',
    mustInclude: [
      'Charity name and registration number',
      'How fundraiser is being paid',
      'If payment is by commission or percentage',
      'If there is a maximum donation amount'
    ],
    cancellation: 'Donors have right to cancel within 14 days for contracts made away from charity premises'
  }
};

// =============================================================================
// COMPLIANCE CHECKLIST — CHARITYHUB
// =============================================================================

export const COMPLIANCE_CHECKLIST = {
  governance: [
    'Charity registered with Charity Commission (if required)',
    'Governing document up to date and followed',
    'Trustees understand and fulfill duties',
    'Trustee meetings held regularly with minutes',
    'Conflicts of interest declared and managed',
    'Trustee indemnity insurance in place',
    'Charity objects being fulfilled'
  ],
  financialReporting: [
    'Accounts prepared in accordance with SORP',
    'Appropriate level of external scrutiny (audit/examination)',
    'Annual return submitted on time',
    'Accounts filed with Charity Commission',
    'Fund accounting correctly applied',
    'Reserves policy in place and reviewed',
    'Going concern assessment completed'
  ],
  hmrcCompliance: [
    'Gift Aid declarations obtained and valid',
    'Gift Aid records maintained (6 years)',
    'Gift Aid claims submitted accurately',
    'GASDS claims (if applicable)',
    'PAYE operated correctly for employees',
    'VAT registration (if required)',
    'Business rates relief claimed',
    'Corporation tax exemption claimed (if applicable)'
  ],
  safeguarding: [
    'Safeguarding policy in place (children and/or adults)',
    'Designated Safeguarding Lead appointed',
    'DBS checks completed for eligible roles',
    'Safeguarding training provided',
    'Safe recruitment practices followed',
    'Incidents reported appropriately',
    'Records of concerns maintained'
  ],
  fundraising: [
    'Fundraising follows Code of Fundraising Practice',
    'Street collection permits obtained (if applicable)',
    'Lottery registration (if applicable)',
    'Professional fundraiser agreements in place',
    'Online fundraising secure and compliant',
    'Complaints process accessible',
    'Fundraising complaints logged and addressed'
  ],
  dataProtection: [
    'Data protection policy in place',
    'Privacy notices provided to donors and beneficiaries',
    'Lawful basis for processing documented',
    'Consent obtained where required',
    'Data sharing agreements with processors',
    'Subject access request process',
    'Data breach procedure',
    'ICO registration (if required)'
  ],
  seriousIncidents: [
    'Serious incident reporting procedure',
    'Incidents reported to Charity Commission promptly',
    'Remedial action taken',
    'Lessons learned documented'
  ]
};

// =============================================================================
// AI MODEL SELECTION — CHARITYHUB
// =============================================================================

export const AI_MODEL_GUIDANCE = {
  ANNUAL_REPORT_DRAFTING: {
    model: 'claude_sonnet_4_6',
    reason: 'Professional document requiring SORP compliance and public benefit reporting',
    useCase: 'Drafting Trustees Annual Report, impact reports'
  },
  GIFT_AID_AUDIT: {
    model: 'claude_opus_4_6',
    reason: 'Complex multi-year compliance review with HMRC requirements',
    useCase: 'Reviewing Gift Aid declarations and claims for compliance'
  },
  SAFEGUARDING_POLICY: {
    model: 'claude_sonnet_4_6',
    reason: 'Legal document requiring precision and regulatory knowledge',
    useCase: 'Drafting safeguarding policies and procedures'
  },
  DONOR_COMMUNICATION: {
    model: 'automatic',
    reason: 'Simple communication task, no regulatory implications',
    useCase: 'Generating thank you letters, newsletters'
  },
  LEGISLATION_RESEARCH: {
    model: 'gemini_3_1_pro',
    reason: 'Need current information on charity law and tax rules',
    useCase: 'Checking latest Charity Commission guidance, HMRC rates, fundraising regulations'
  },
  FINANCIAL_ANALYSIS: {
    model: 'claude_opus_4_6',
    reason: 'Complex financial data analysis across multiple funds',
    useCase: 'Analyzing restricted vs unrestricted funds, reserves levels'
  },
  GRANT_APPLICATION: {
    model: 'claude_sonnet_4_6',
    reason: 'Professional document requiring clarity and alignment with funder criteria',
    useCase: 'Drafting grant applications, funding proposals'
  }
};

// Export all compliance standards
export default {
  PRIMARY_LEGISLATION,
  HMRC_COMPLIANCE,
  CHARITY_COMMISSION_REPORTING,
  SAFEGUARDING,
  FUNDRAISING_COMPLIANCE,
  COMPLIANCE_CHECKLIST,
  AI_MODEL_GUIDANCE
};