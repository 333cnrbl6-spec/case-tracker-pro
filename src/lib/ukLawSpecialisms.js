/**
 * Comprehensive UK Law Specialisms
 * Researched frameworks covering all major practice areas
 * Includes statutory law, regulations, professional bodies, and government guidance
 */

export const REGULATORY_BODIES = {
  // Judiciary & Courts
  judiciary: {
    name: 'Judiciary of England and Wales',
    type: 'Court System',
    oversight: 'Lord Chancellor & Secretary of State for Justice',
    website: 'www.judiciary.uk',
  },
  senior_courts: {
    name: 'Senior Courts of England and Wales',
    type: 'Higher Court Authority',
    divisions: ['Supreme Court', 'Court of Appeal', 'High Court'],
    website: 'www.judiciary.uk',
  },
  civil_procedure_rules: {
    name: 'Civil Procedure Rules',
    type: 'Court Procedure Rules',
    issued_by: 'Ministry of Justice',
    last_updated: '2024',
    website: 'www.justice.gov.uk',
  },

  // Legal Profession
  sra: {
    name: 'Solicitors Regulation Authority',
    type: 'Professional Regulator',
    regulates: 'Solicitors and Law Firms',
    website: 'www.sra.org.uk',
    code: 'SRA Standards and Regulations',
  },
  bar_council: {
    name: 'Bar Council',
    type: 'Professional Body',
    regulates: 'Barristers',
    website: 'www.barcouncil.org.uk',
    code: 'Bar Standards Board Code of Conduct',
  },
  law_society: {
    name: 'Law Society of England and Wales',
    type: 'Professional Body',
    represents: 'Solicitors',
    website: 'www.lawsociety.org.uk',
  },

  // Specialised Regulators
  rics: {
    name: 'Royal Institution of Chartered Surveyors',
    type: 'Professional Body & Regulator',
    regulates: 'Chartered Surveyors',
    website: 'www.rics.org',
    standards: 'RICS Professional Standards',
  },
  cfa: {
    name: 'Financial Conduct Authority',
    type: 'Financial Regulator',
    regulates: 'Financial Services & Insurance',
    website: 'www.fca.org.uk',
  },
  pra: {
    name: 'Prudential Regulation Authority',
    type: 'Financial Regulator',
    regulates: 'Prudential Requirements',
    website: 'www.bankofengland.co.uk/pra',
  },
  acas: {
    name: 'Advisory, Conciliation and Arbitration Service',
    type: 'Government Agency',
    regulates: 'Employment Disputes',
    website: 'www.acas.org.uk',
  },
  ico: {
    name: 'Information Commissioner\'s Office',
    type: 'Data Protection Authority',
    enforces: 'Data Protection Act 2018, GDPR',
    website: 'www.ico.org.uk',
  },
  cqc: {
    name: 'Care Quality Commission',
    type: 'Healthcare Regulator',
    regulates: 'Health & Social Care Providers',
    website: 'www.cqc.org.uk',
  },
  gmc: {
    name: 'General Medical Council',
    type: 'Professional Regulator',
    regulates: 'Doctors',
    website: 'www.gmc-uk.org',
  },
  nmc: {
    name: 'Nursing and Midwifery Council',
    type: 'Professional Regulator',
    regulates: 'Nurses and Midwives',
    website: 'www.nmc.org.uk',
  },
  hcpc: {
    name: 'Health and Care Professions Council',
    type: 'Professional Regulator',
    regulates: 'Allied Health Professionals',
    website: 'www.hcpc-uk.org',
  },

  // Competition & Antitrust
  cma: {
    name: 'Competition and Markets Authority',
    type: 'Competition Regulator',
    enforces: 'Competition Act 1998, Enterprise Act 2002',
    website: 'www.gov.uk/cma',
  },

  // Environmental
  ea: {
    name: 'Environment Agency',
    type: 'Environmental Regulator',
    enforces: 'Environmental regulations',
    website: 'www.environment-agency.gov.uk',
  },
  defra: {
    name: 'Department for Environment, Food and Rural Affairs',
    type: 'Government Department',
    website: 'www.gov.uk/defra',
  },

  // Financial Crime
  nca: {
    name: 'National Crime Agency',
    type: 'Law Enforcement',
    enforces: 'Financial Crimes',
    website: 'www.nationalcrimeagency.gov.uk',
  },
};

export const UK_LAW_SPECIALISMS = {
  clinical_negligence: {
    name: 'Clinical Negligence / Medical Malpractice',
    description: 'Claims for injuries caused by negligent medical treatment',
    category: 'Medical Law',
    governing_framework: [
      'Law of Tort (Negligence)',
      'Limitation Act 1980 (3 years)',
      'NHS Redress Act 2006',
      'Health and Social Care (Quality and Safety) Act 2015',
      'Pre-action Protocol for Clinical Negligence',
      'Civil Procedure Rules 1998',
    ],
    regulatory_bodies: ['General Medical Council (GMC)', 'Nursing & Midwifery Council (NMC)', 'HCPC', 'Care Quality Commission (CQC)'],
    professional_bodies: ['Medical Defence Union (MDU)', 'Medical Protection Society', 'Nursing & Midwifery Council'],
    standard_of_care: {
      test: 'Bolam Test (or Bolitho refinement)',
      guidance: 'Standard of reasonably competent professional in same field at time of treatment',
      reference: 'Bolam v Friern Hospital Management Committee [1957]',
    },
    essential_elements: {
      duty_of_care: {
        description: 'Healthcare professional owed duty of care to patient',
        guidance: 'Established once doctor-patient relationship created. No requirement for formal retainer.',
        evidence_types: ['patient_records', 'appointment_evidence', 'treatment_records'],
      },
      breach_of_duty: {
        description: 'Treatment fell below standard of reasonably competent healthcare professional',
        guidance: 'Use expert medical evidence. Compare to professional standards and guidelines.',
        evidence_types: ['expert_medical_report', 'treatment_protocols', 'professional_guidelines', 'GMC_standards'],
      },
      causation: {
        description: 'Breach caused injury to patient',
        guidance: 'Establish on balance of probabilities. Consider alternative causes.',
        evidence_types: ['medical_causation_expert', 'clinical_records', 'treatment_timeline'],
      },
      quantifiable_loss: {
        description: 'Patient suffered measurable loss (injury, pain, cost)',
        guidance: 'Include medical treatment, lost earnings, pain and suffering, future care needs',
        evidence_types: ['medical_records', 'loss_schedules', 'life_care_plan'],
      },
    },
    limitation_rules: {
      standard: '3 years from date of knowledge of injury (Limitation Act 1980, s.14)',
      date_of_knowledge: 'When claimant knew/should have known injury was significant and attributable to negligence',
      minors: '3 years from 18th birthday',
      incapacity: 'Time does not run whilst patient lacks capacity',
    },
    critical_checkpoints: [
      'Expert medical evidence obtained from appropriate specialist',
      'GMC/NMC records checked for practitioner',
      'Clinical records obtained in full',
      'Deviation from professional guidelines identified',
      'Causation clearly established by medical expert',
      'NHS Redress scheme eligibility assessed',
      'Structured settlement/future care plan prepared',
    ],
    government_guidance: 'NHS Resolution (formerly NHS Litigation Authority) handles NHS claims',
  },

  product_liability: {
    name: 'Product Liability',
    description: 'Claims for injuries caused by defective products',
    category: 'Consumer & Commercial Law',
    governing_framework: [
      'Consumer Protection from Unfair Trading Regulations 2008',
      'Consumer Rights Act 2015',
      'Sale of Goods Act 1979',
      'Supply of Goods and Services Act 1982',
      'Product Liability Directive 85/374/EEC (UK retained law)',
      'Common Law Negligence (Donoghue v Stevenson)',
    ],
    regulatory_bodies: ['Health & Safety Executive (HSE)', 'Trading Standards', 'Consumer Protection from Unfair Trading'],
    professional_bodies: ['Law Society', 'Bar Council', 'Institution of Product Safety'],
    liability_types: {
      design_defect: 'Product designed unsafely',
      manufacturing_defect: 'Product manufactured incorrectly',
      inadequate_warnings: 'Insufficient warnings or instructions provided',
    },
    essential_elements: {
      defective_product: {
        description: 'Product had defect making it unsafe',
        guidance: 'Compare to reasonable expectations. Consider design, manufacture, and warnings.',
        evidence_types: ['product_inspection', 'expert_report', 'test_results', 'design_documents'],
      },
      causation: {
        description: 'Defect caused injury to claimant',
        guidance: 'Establish chain of causation from product defect to injury',
        evidence_types: ['expert_analysis', 'accident_investigation', 'medical_evidence'],
      },
    },
    critical_checkpoints: [
      'Product obtained and preserved for expert inspection',
      'Manufacturing/design defect clearly identified',
      'Manufacturer/distributor traced',
      'Product safety regulations checked',
      'Consumer Protection Act remedies considered',
    ],
  },

  construction_disputes: {
    name: 'Construction & Building Disputes',
    description: 'Claims arising from construction defects, delays, and disputes',
    category: 'Commercial & Construction Law',
    governing_framework: [
      'Building Regulations 2016 (as amended)',
      'Construction (Design and Management) Regulations 2015',
      'Defective Premises Act 1972',
      'Late Payment of Commercial Debts (Interest) Act 1998',
      'Housing Grants, Construction and Regeneration Act 1996 (Part 2)',
      'Standard Construction Contracts (NEC, JCT, FIDIC)',
      'Common Law Contract',
    ],
    regulatory_bodies: ['Health & Safety Executive (HSE)', 'Local Authority Building Control', 'Planning Authority'],
    professional_bodies: ['Royal Institution of British Architects (RIBA)', 'Chartered Institution of Building Services Engineers (CIBSE)', 'Institution of Civil Engineers (ICE)', 'Royal Institution of Chartered Surveyors (RICS)'],
    standard_of_care: {
      test: 'Fitness for purpose vs ordinary skill and care',
      guidance: 'Depends on contract terms. Contractors usually liable for fitness for purpose.',
      reference: 'Supply of Goods and Services Act 1982',
    },
    essential_elements: {
      construction_contract: {
        description: 'Valid construction contract exists',
        guidance: 'Identify contract terms, specification, completion dates, payment terms',
        evidence_types: ['contract_documents', 'specifications', 'drawings', 'variation_orders'],
      },
      breach: {
        description: 'Defects or failure to complete identified',
        guidance: 'Compare work to contract specifications and standard building practice',
        evidence_types: ['snag_lists', 'inspection_reports', 'expert_surveys', 'photographic_evidence'],
      },
      causation: {
        description: 'Breach caused measurable loss',
        guidance: 'Remedial cost or diminished value of property',
        evidence_types: ['repair_quotes', 'expert_valuation', 'reinstatement_plans'],
      },
    },
    critical_checkpoints: [
      'Contract terms clearly identified (NEC, JCT, custom)',
      'Defects documented with photographs and expert survey',
      'Building Regulations compliance assessed',
      'Remedial cost estimates obtained',
      'Delay analysis completed (if relevant)',
      'Variations and change orders reviewed',
    ],
    government_guidance: 'Building Regulations guidance from Department for Levelling Up, Housing & Communities',
  },

  intellectual_property: {
    name: 'Intellectual Property (IP)',
    description: 'Claims involving patents, trademarks, copyrights, and designs',
    category: 'Intellectual Property Law',
    governing_framework: [
      'Patents Act 1977',
      'Trade Marks Act 1994',
      'Copyright, Designs and Patents Act 1988',
      'Designs Right (Semiconductor Topographies) Regulations 1989',
      'Trade Secrets (Protection in Case of Unlawful Obtaining, etc.) Regulations 2018',
      'Enforcement Directive 2004/48/EC',
    ],
    regulatory_bodies: ['UK Intellectual Property Office (UKIPO)', 'European Union Intellectual Property Office (EUIPO)'],
    professional_bodies: ['Chartered Institute of Patent Attorneys (CIPA)', 'Institute of Intellectual Property Attorneys (IIPA)'],
    ip_types: {
      patents: 'Technical inventions (20-year protection)',
      trademarks: 'Brand names, logos, signs (indefinite protection with renewal)',
      copyrights: 'Literary, artistic, musical works (life + 70 years)',
      designs: 'Product appearance (15 years)',
      trade_secrets: 'Confidential business information',
    },
    essential_elements: {
      ip_right_ownership: {
        description: 'Valid IP right exists and claimant owns it',
        guidance: 'Check registration, assignment documents, employment contracts',
        evidence_types: ['ip_registration_certificate', 'assignment_documents', 'employment_contracts'],
      },
      infringement: {
        description: 'Defendant infringed the IP right',
        guidance: 'Depends on type of IP. Patents: claim scope vs defendant product. Trademarks: confusing similarity.',
        evidence_types: ['defendant_product_evidence', 'expert_comparison', 'market_evidence'],
      },
      loss: {
        description: 'Infringement caused measurable loss',
        guidance: 'Lost sales, license fee damages, or account of profits',
        evidence_types: ['sales_records', 'pricing_evidence', 'market_analysis'],
      },
    },
    critical_checkpoints: [
      'IP registration status confirmed (UKIPO, EPO, EUIPO)',
      'Scope of protection clearly defined',
      'Ownership chain verified',
      'Defendant conduct documented',
      'Technical/market expert obtained',
      'Damages calculation method identified',
    ],
    government_guidance: 'UKIPO provides guidance on all UK IP rights',
  },

  data_protection_gdpr: {
    name: 'Data Protection & GDPR',
    description: 'Claims for data protection breaches and privacy violations',
    category: 'Regulatory & Data Law',
    governing_framework: [
      'UK General Data Protection Regulation (UK GDPR)',
      'Data Protection Act 2018',
      'Privacy and Electronic Communications Regulations 2003',
      'PECR (Privacy and Electronic Communications)',
      'Data Subject Rights Regulations',
      'Automated Decision-Making Regulations',
    ],
    regulatory_bodies: ['Information Commissioner\'s Office (ICO)', 'Supervisory Authorities (EU)'],
    professional_bodies: ['Law Society', 'Bar Council', 'International Association of Privacy Professionals (IAPP)'],
    breach_types: {
      unauthorized_processing: 'Processing personal data without legal basis',
      data_breach: 'Accidental or unlawful loss/access to personal data',
      right_violation: 'Failure to respect data subject rights',
      consent_failure: 'Processing without valid consent',
    },
    essential_elements: {
      personal_data_processing: {
        description: 'Personal data was processed',
        guidance: 'Any operation on personal data (collection, storage, use, disclosure)',
        evidence_types: ['processing_records', 'privacy_policy', 'system_logs'],
      },
      breach_of_duty: {
        description: 'Processing violated GDPR principles or rights',
        guidance: 'Lawfulness, fairness, transparency, purpose limitation, etc.',
        evidence_types: ['gdpr_analysis', 'processing_audit', 'data_subject_rights_request'],
      },
      damage: {
        description: 'Data subject suffered material/non-material damage',
        guidance: 'Can include financial loss, distress, discrimination, identity theft risk',
        evidence_types: ['evidence_of_damage', 'medical_reports', 'financial_records'],
      },
    },
    limitation_rules: {
      claim_period: '3 years from when claimant became aware of loss',
      enforcement: 'ICO can issue fines up to €20m or 4% annual turnover (whichever higher)',
    },
    critical_checkpoints: [
      'Legal basis for processing identified (or lack thereof)',
      'Data subject rights assessed',
      'Data breach notification timeline reviewed',
      'ICO investigation status checked',
      'Damage causation clearly established',
      'Privacy impact assessment reviewed',
    ],
    government_guidance: 'ICO guidance and decision notices at www.ico.org.uk',
  },

  defamation_libel: {
    name: 'Defamation, Libel & Slander',
    description: 'Claims for false statements causing reputational damage',
    category: 'Media & Reputation Law',
    governing_framework: [
      'Defamation Act 2013',
      'Online Safety Bill 2023',
      'Common Law of Defamation',
      'Limitation Act 1980 (1 year limitation)',
      'Civil Procedure Rules 1998 (Part 53)',
    ],
    regulatory_bodies: ['Ofcom (Broadcasting)', 'Press Regulation (IPSO)', 'Online Safety Regulator (OFCOM)'],
    professional_bodies: ['Law Society', 'Bar Council', 'Media Lawyers Association'],
    defamation_elements: [
      'Statement is defamatory (lowers reputation)',
      'Published to third party',
      'Identifies claimant',
      'Causes serious harm',
      'Defendant cannot rely on defence',
    ],
    defences: {
      truth: 'Statement is substantially true (burden on defendant)',
      honest_opinion: 'Fair comment on matter of public interest',
      privilege: 'Absolute or qualified privilege',
      peer_reviewed_statement: 'Scientific/academic peer review',
      website_operators: 'Limited liability for user-generated content',
    },
    critical_checkpoints: [
      'Statement identified and date of publication recorded',
      'Serious harm causation established',
      'Identification of claimant clear',
      'Reputational damage documented',
      'Truth of statement assessed (if defendant may claim)',
      'Privilege analysis completed',
    ],
    limitation_rules: {
      standard: '1 year from date of publication',
      exception: 'Court discretion to extend where appropriate',
    },
    government_guidance: 'Online Safety Bill guidance from Department for Science, Innovation and Technology',
  },

  family_law: {
    name: 'Family Law',
    description: 'Matrimonial and family disputes including divorce, children, maintenance',
    category: 'Family Law',
    governing_framework: [
      'Family Law Act 1996',
      'Matrimonial Causes Act 1973',
      'Children Act 1989',
      'Domestic Abuse Act 2021',
      'Finance Orders, Child Support, Ancillary Relief',
      'Family Court Rules 2010',
    ],
    regulatory_bodies: ['Family Court', 'Cafcass (Children and Family Court Advisory Service)', 'National Domestic Abuse Helpline'],
    professional_bodies: ['Law Society Family Law Panel', 'Bar Council Family Law', 'Resolution'],
    case_types: ['Divorce', 'Financial Orders', 'Child Arrangements', 'Domestic Abuse Injunctions'],
    critical_checkpoints: [
      'Domicile/jurisdiction established',
      'Petition/application grounds identified',
      'Matrimonial property assessed',
      'Child arrangement agreements negotiated',
      'Domestic abuse history documented (if relevant)',
      'Financial disclosure obtained',
    ],
  },

  probate_wills: {
    name: 'Probate, Wills & Estate Law',
    description: 'Intestate succession, will disputes, and estate administration',
    category: 'Probate & Trust Law',
    governing_framework: [
      'Wills Act 1837',
      'Administration of Estates Act 1925',
      'Inheritance (Provision for Family and Dependants) Act 1975',
      'Trusts of Land and Appointment of Trustees Act 1996',
      'Senior Courts Act 1981',
    ],
    regulatory_bodies: ['Probate Service', 'Court of Protection'],
    professional_bodies: ['Law Society Probate Section', 'Society of Trust and Estate Practitioners (STEP)'],
    critical_checkpoints: [
      'Will validity assessed (formalities under Wills Act)',
      'Testamentary capacity proven',
      'Undue influence excluded',
      'Estate assets identified and valued',
      'Debts and liabilities calculated',
      'Beneficiaries identified',
      'Succession rules (intestacy) applied if applicable',
    ],
  },

  conveyancing_property: {
    name: 'Conveyancing & Property Law',
    description: 'Residential and commercial property transactions and disputes',
    category: 'Property Law',
    governing_framework: [
      'Law of Property Act 1925',
      'Land Registration Act 2002',
      'Land Registration Rules 2003',
      'Leasehold Reform Act 1967',
      'Stamp Duty Land Tax (SDLT)',
      'Consumer Rights Act 2015',
      'Housing Act 1988 (Tenancies)',
    ],
    regulatory_bodies: ['Land Registry', 'HMRC (SDLT)', 'Trading Standards'],
    professional_bodies: ['Law Society Conveyancing Section', 'National Association of Estate Agents', 'Royal Institution of Chartered Surveyors (RICS)'],
    transaction_types: ['Residential purchase', 'Commercial purchase', 'Remortgage', 'Leasehold extension'],
    critical_checkpoints: [
      'Title verified at Land Registry',
      'Searches completed (local authority, environmental, water)',
      'Survey obtained',
      'Mortgage arrangements confirmed',
      'SDLT liability calculated',
      'Insurance requirements identified',
      'Occupiers\' rights checked',
    ],
    government_guidance: 'Land Registry practice guides at www.gov.uk/land-registry',
  },

  environmental_law: {
    name: 'Environmental Law',
    description: 'Environmental damage, pollution, regulatory breaches',
    category: 'Environmental Law',
    governing_framework: [
      'Environmental Protection Act 1990',
      'Environmental Damage Regulations 2015',
      'Water Resources Act 1991',
      'Environmental Information Regulations 2004',
      'Waste and Contaminated Land Regime',
      'Pollution Prevention and Control Act 1999',
    ],
    regulatory_bodies: ['Environment Agency', 'Local Authority Environmental Health', 'Ofwat (Water)', 'Defra'],
    professional_bodies: ['Law Society Environmental Law Section', 'UK Environmental Law Association'],
    critical_checkpoints: [
      'Environmental damage identified and quantified',
      'Responsible party traced',
      'Regulatory approvals/breaches assessed',
      'Remediation requirements calculated',
      'Government environmental assessment considered',
    ],
  },

  competition_law: {
    name: 'Competition & Antitrust Law',
    description: 'Cartels, abuse of dominance, merger control',
    category: 'Commercial & Competition Law',
    governing_framework: [
      'Competition Act 1998',
      'Enterprise Act 2002',
      'Chapter I - Anticompetitive agreements',
      'Chapter II - Abuse of dominance',
      'Merger Regulations',
      'UK GDPR (consent decrees)',
    ],
    regulatory_bodies: ['Competition and Markets Authority (CMA)', 'National competition authorities (EU)'],
    professional_bodies: ['Law Society Competition & Regulatory Law Section', 'UK Competition Forum'],
    critical_checkpoints: [
      'Anticompetitive agreement or dominant position identified',
      'Effect on competition assessed',
      'CMA guidance reviewed',
      'Exemption or safe harbour availability assessed',
    ],
  },

  immigration_law: {
    name: 'Immigration & Asylum Law',
    description: 'Visa applications, asylum claims, deportation',
    category: 'Immigration Law',
    governing_framework: [
      'Immigration Act 2016',
      'Immigration Act 2014',
      'Immigration Rules (maintained)',
      'Points-Based System',
      'Refugee Convention 1951',
      'Human Rights Act 1998 (Article 8)',
    ],
    regulatory_bodies: ['Home Office', 'UKVI (UK Visas and Immigration)', 'Immigration Tribunal'],
    professional_bodies: ['Law Society Immigration Section', 'Immigration Law Practitioners\' Association'],
    critical_checkpoints: [
      'Visa category and requirements identified',
      'Points calculation completed',
      'Maintenance and accommodation requirements met',
      'Documentation gathered',
      'English language requirement satisfied',
    ],
  },

  regulatory_administrative: {
    name: 'Regulatory & Administrative Law',
    description: 'Judicial review, licensing, disciplinary proceedings',
    category: 'Administrative & Regulatory Law',
    governing_framework: [
      'Senior Courts Act 1981 (Part 54 - Judicial Review)',
      'Civil Procedure Rules 1998 (Part 54)',
      'Human Rights Act 1998',
      'Aarhus Convention (Environmental)',
      'Various regulatory schemes',
    ],
    regulatory_bodies: ['Administrative Court', 'Upper Tribunal', 'Various Regulators'],
    professional_bodies: ['Law Society Public Law Section', 'Bar Association Public Law Bar'],
    critical_checkpoints: [
      'Public law element established',
      'Justiciability assessed',
      'Standing to challenge established',
      'Alternative remedy exhausted',
      '3-month limitation compliance',
      'Grounds of review (illegality, irrationality, procedural unfairness) identified',
    ],
  },

  insolvency_bankruptcy: {
    name: 'Insolvency & Bankruptcy Law',
    description: 'Corporate insolvency, personal bankruptcy, creditor disputes',
    category: 'Commercial & Insolvency Law',
    governing_framework: [
      'Insolvency Act 1986',
      'Insolvency Rules 2016',
      'Corporate Insolvency and Governance Act 2020',
      'Debt Relief Orders',
      'Individual Voluntary Arrangements',
    ],
    regulatory_bodies: ['Insolvency Service', 'Official Receiver', 'Insolvency Practitioners Association (IPA)'],
    professional_bodies: ['Insolvency Lawyers Association', 'Insolvency Practitioners Regulation'],
    critical_checkpoints: [
      'Insolvency status established',
      'Debts and creditors identified',
      'Preferential debts categorized',
      'Assets identified and valued',
      'Procedure selected (CVA, Administration, Liquidation)',
      'Antecedent transaction review completed',
    ],
  },

  landlord_tenant: {
    name: 'Landlord & Tenant Law',
    description: 'Lease disputes, rent arrears, forfeiture, eviction',
    category: 'Property Law',
    governing_framework: [
      'Law of Property Act 1925',
      'Landlord and Tenant Act 1927',
      'Landlord and Tenant Act 1954',
      'Housing Act 1988 (Assured Tenancies)',
      'Housing Act 1996 (Introductory Tenancies)',
      'Leasehold Reform, Housing and Urban Development Act 1993',
    ],
    regulatory_bodies: ['County Court', 'First-tier Tribunal (Property Chamber)', 'Trading Standards'],
    professional_bodies: ['Law Society Property Section', 'RICS'],
    critical_checkpoints: [
      'Tenancy type identified (assured, AST, commercial)',
      'Lease terms reviewed',
      'Rent arrears calculated',
      'Service charge disputes assessed',
      'Repairing obligations identified',
      'Notice requirements checked',
    ],
  },

  consumer_rights: {
    name: 'Consumer Rights & Consumer Law',
    description: 'Consumer protection, unfair contract terms, cancellation rights',
    category: 'Consumer Law',
    governing_framework: [
      'Consumer Rights Act 2015',
      'Unfair Contract Terms Act 1977',
      'Consumer Contracts Regulations 2013',
      'Sale of Goods Act 1979',
      'Consumer Protection from Unfair Trading Regulations 2008',
      'Unfair Terms in Consumer Contracts Regulations 1999',
    ],
    regulatory_bodies: ['Trading Standards', 'Consumer Rights Enforcement Agency', 'Courts'],
    professional_bodies: ['Law Society Consumer Law Section', 'Consumer Rights Council'],
    critical_checkpoints: [
      'Consumer status of party established',
      'Goods/services purchased identified',
      'Defect or breach of statutory rights shown',
      'Remedies sought (repair, replacement, refund)',
      'Time limits for complaint checked',
      'Unfair contract term identified (if relevant)',
    ],
  },

  debt_recovery: {
    name: 'Debt Recovery & Debt Law',
    description: 'Debt collection, credit disputes, county court claims',
    category: 'Commercial & Recovery Law',
    governing_framework: [
      'County Courts Act 1984',
      'Civil Procedure Rules 1998',
      'Debt Relief Act 2015',
      'Money Laundering, Terrorist Financing and Transfer of Funds Regulations 2017',
      'Late Payment of Commercial Debts (Interest) Act 1998',
    ],
    regulatory_bodies: ['County Court', 'Financial Conduct Authority (Consumer Credit)'],
    professional_bodies: ['Law Society Commercial Law Section', 'Credit Industry Council'],
    critical_checkpoints: [
      'Debt quantum established',
      'Legal cause of action (contract, statute, unjust enrichment)',
      'Debtor identification',
      'Notice of claim requirements met',
      'Jurisdiction and venue appropriate',
      'Interest and costs calculations',
    ],
  },
};

/**
 * Get all UK law specialisms
 */
export function getAllSpecialisms() {
  return Object.entries(UK_LAW_SPECIALISMS).map(([key, value]) => ({
    id: key,
    ...value,
  }));
}

/**
 * Get specialism by ID
 */
export function getSpecialismById(specialismId) {
  return UK_LAW_SPECIALISMS[specialismId] || null;
}

/**
 * Get specialism by category
 */
export function getSpecialismsByCategory(category) {
  return Object.entries(UK_LAW_SPECIALISMS)
    .filter(([_, value]) => value.category === category)
    .map(([key, value]) => ({ id: key, ...value }));
}

/**
 * Get all unique categories
 */
export function getAllCategories() {
  return [...new Set(Object.values(UK_LAW_SPECIALISMS).map(s => s.category))];
}

/**
 * Get regulatory body details
 */
export function getRegulatoryBody(bodyId) {
  return REGULATORY_BODIES[bodyId] || null;
}

/**
 * Get all regulatory bodies
 */
export function getAllRegulatoryBodies() {
  return Object.entries(REGULATORY_BODIES).map(([key, value]) => ({
    id: key,
    ...value,
  }));
}