/**
 * Comprehensive Case Type Structures
 * Based on UK Law, Regulations, and Professional Standards
 * Ensures compliance and best practice across all case types
 */

export const CASE_TYPE_STRUCTURES = {
  personal_injury: {
    name: 'Personal Injury',
    description: 'Claims for damages arising from negligence or breach of duty',
    governing_framework: [
      'Law of Tort (Negligence)',
      'Limitation Act 1980 (3 year limitation)',
      'Civil Procedure Rules 1998',
      'Pre-action Protocol for Personal Injury Claims',
      'Damages Act 1996 (structured settlements)',
    ],
    professional_bodies: ['Law Society', 'Bar Council', 'Association of Personal Injury Lawyers (APIL)'],
    essential_elements: {
      duty_of_care: {
        description: 'Defendant owed claimant a duty of care',
        guidance:
          'Establish using Caparo v Dickman test: (1) foreseeable harm, (2) proximity, (3) fair/just/reasonable',
        evidence_types: [
          'expert_reports',
          'witness_statements',
          'occupiers_liability_evidence',
          'professional_standards_documents',
        ],
      },
      breach_of_duty: {
        description: 'Defendant breached that duty',
        guidance:
          'Show defendant fell below standard of reasonable person. Compare to Bolam test or professional standards.',
        evidence_types: ['breach_evidence', 'expert_assessment', 'professional_standards_violation'],
      },
      causation: {
        description: 'Breach caused damage to claimant',
        guidance:
          'Establish "but for" causation: but for the breach, injury would not have occurred',
        evidence_types: [
          'medical_evidence',
          'accident_investigation',
          'expert_causation_report',
        ],
      },
      quantifiable_loss: {
        description: 'Claimant suffered quantifiable loss',
        guidance:
          'Cover special damages (medical costs, lost wages) and general damages (pain and suffering)',
        evidence_types: ['medical_records', 'wage_loss_evidence', 'cost_schedules'],
      },
    },
    key_deadlines: {
      limitation_period: '3 years from date of injury',
      pre_action_protocol: '3-6 months (defendant response)',
      allocation_questionnaire: 'Within 14 days of allocation',
    },
    limitation_rules: {
      standard: '3 years from date of injury (Limitation Act 1980, s.2)',
      minors: 'Time does not run until 18th birthday (then 3 years)',
      incapacity: 'Suspended during incapacity, runs from recovery',
    },
    damages_structure: [
      {
        name: 'Special Damages',
        description: 'Quantifiable financial losses before trial',
        items: [
          'Medical treatment costs',
          'Lost earnings to date',
          'Travel expenses',
          'Care costs',
          'Equipment/adaptation costs',
        ],
      },
      {
        name: 'General Damages',
        description: 'Non-pecuniary losses (pain, suffering, loss of amenity)',
        items: [
          'Pain and suffering',
          'Loss of amenity',
          'Loss of earnings (future)',
          'Loss of earning capacity',
          'Cost of care (future)',
        ],
        guidance: 'Reference Judicial College Guidelines for quantum',
      },
    ],
    critical_checkpoints: [
      'Medical evidence obtained within 6 months',
      'Limitation period tracked and flagged',
      'Pre-action protocol completed before proceedings',
      'Expert reports obtained for complex cases',
      'Settlement negotiation attempted (CPR requirement)',
    ],
  },

  employment: {
    name: 'Employment',
    description: 'Claims arising from employment relationship disputes',
    governing_framework: [
      'Employment Rights Act 1996',
      'Equality Act 2010',
      'Employment Tribunals Act 1996',
      "Employment Tribunals (Constitution and Rules of Procedure) Regulations 2013",
      'ACAS Code of Practice on Disciplinary and Grievance Procedures',
    ],
    professional_bodies: [
      'Law Society',
      'Bar Council',
      'Employment Lawyers Association',
      'ACAS',
    ],
    essential_elements: {
      employment_relationship: {
        description: 'Valid employment contract exists',
        guidance:
          'Establish by contract, offer letter, or implied terms. Check worker vs employee status.',
        evidence_types: [
          'employment_contract',
          'offer_letter',
          'payroll_records',
          'tax_records',
        ],
      },
      statutory_right: {
        description: 'Claimant had applicable statutory right/protection',
        guidance:
          'Identify specific statutory breach: unfair dismissal, discrimination, deduction of wages, etc.',
        evidence_types: ['statute_reference', 'contract_terms', 'policy_documents'],
      },
      breach_or_dismissal: {
        description: 'Employer breached statutory duty or dismissed unfairly',
        guidance:
          'For unfair dismissal: show lack of fair reason and/or unfair procedure. Reference ACAS Code.',
        evidence_types: [
          'dismissal_letter',
          'discipline_meeting_notes',
          'grievance_responses',
          'witness_statements',
        ],
      },
      causal_link: {
        description: 'Breach/dismissal caused loss to employee',
        guidance: 'Establish direct causal link between breach and detriment suffered',
        evidence_types: ['loss_evidence', 'payroll_records', 'reference_impact'],
      },
    },
    key_deadlines: {
      et_claim: '3 months less 1 day from effective date of termination',
      acas_conciliation: 'Must attempt ACAS conciliation (early conciliation)',
      et_response: 'Employer has 28 days to respond',
      hearing: 'Typically 16-26 weeks from claim to hearing',
    },
    limitation_rules: {
      unfair_dismissal: '3 months from EDT (Employment Tribunal only)',
      discrimination: '3 months from act of discrimination',
      grievance_response: 'Time does not normally extend beyond 3 months',
    },
    damages_structure: [
      {
        name: 'Compensatory Award',
        description: 'Loss caused by unfair dismissal',
        items: [
          'Loss of earnings',
          'Loss of statutory rights (cap £507 as of 2024)',
          'Loss of pension rights',
          'Loss of concessional loans',
          'Other losses flowing from dismissal',
        ],
        guidance: 'Subject to 2-year cap. Must mitigate losses. 10-50% reduction for contributory fault.',
      },
      {
        name: 'Basic Award',
        description: 'Statutory minimum for unfair dismissal',
        calculation: '0.5 × weekly pay × years worked (capped)',
      },
    ],
    critical_checkpoints: [
      'Employment status confirmed (employee vs worker vs self-employed)',
      'Effective date of termination established',
      'ACAS early conciliation completed before ET claim',
      'All documentation collected from HR file',
      'Breach of ACAS Code assessed for procedural fairness',
      'Relevant statutory protection identified',
    ],
  },

  professional_negligence: {
    name: 'Professional Negligence',
    description: 'Claims against professionals (solicitors, surveyors, accountants, etc.)',
    governing_framework: [
      'Law of Tort (Negligence)',
      'Solicitors Regulation Authority Code of Conduct',
      'Royal Institution of Chartered Surveyors (RICS) Professional Standards',
      'Accountancy professional body standards',
      'Bolam Test (professional standard of care)',
      'Limitation Act 1980 (6 years for breach of contract, 3 years for tort)',
    ],
    professional_bodies: [
      'Law Society / SRA',
      'RICS',
      'ICAEW / ACCA',
      'Bar Council',
      'Professional Indemnity Insurance Association',
    ],
    essential_elements: {
      retainer_terms: {
        description: 'Valid retainer agreement establishing duty of care',
        guidance:
          'Show professional engaged and terms of engagement. Scope of services critical.',
        evidence_types: [
          'retainer_letter',
          'terms_of_engagement',
          'correspondence_accepting_instructions',
          'fee_agreement',
        ],
      },
      professional_standard: {
        description: 'Professional breached expected standard of care',
        guidance:
          'Compare to ordinary competent professional in same field. Use expert evidence.',
        evidence_types: [
          'expert_report',
          'professional_standards_documents',
          'guidance_documents',
          'comparable_cases',
        ],
      },
      causation_and_loss: {
        description: 'Breach caused quantifiable loss to client',
        guidance:
          'Show "lost opportunity" or "transaction loss" depending on context. Use expert evidence.',
        evidence_types: [
          'financial_records',
          'alternative_transaction_analysis',
          'expert_valuation',
          'lost_opportunity_calculation',
        ],
      },
    },
    key_deadlines: {
      breach_of_contract: '6 years from date of breach (Limitation Act 1980, s.5)',
      tort: '3 years from date of damage (Limitation Act 1980, s.2)',
      acknowledgement: 'Can reset clock with written acknowledgement of liability',
    },
    limitation_rules: {
      primary_limitation: '6 years from breach of contract',
      latent_damage: '3 years from when damage discoverable (s.14A)',
      knowledge_test: 'Damage must be discoverable by reasonable diligence',
    },
    damages_structure: [
      {
        name: 'Direct Loss',
        description: 'Direct financial loss caused by professional error',
        items: [
          'Loss on transaction',
          'Costs of remedying error',
          'Lost opportunity',
          'Wasted professional fees',
        ],
      },
      {
        name: 'Consequential Loss',
        description: 'Secondary losses flowing from primary loss',
        items: ['Interest', 'Additional professional fees for remedying error'],
      },
    ],
    critical_checkpoints: [
      'Scope of professional engagement clearly identified',
      'Date professional took on retainer established',
      'Breach of professional standard evidenced by expert',
      'Causation clearly established (lost opportunity test)',
      'Quantum expert obtained',
      'Limitation period checked (6 years or 3 years + s.14A)',
    ],
  },

  insurance_claim: {
    name: 'Insurance Claim',
    description: 'Disputes arising from insurance policies and claims',
    governing_framework: [
      'Insurance Act 2015',
      'Marine Insurance Act 1906',
      'Third Parties (Rights Against Insurers) Act 2010',
      'Unfair Contract Terms Act 1977',
      'Financial Conduct Authority (FCA) rules',
      'Consumer Rights Act 2015 (for consumer policies)',
    ],
    professional_bodies: [
      'Chartered Insurance Institute',
      'Insurance Loss Management Association',
      'Law Society',
      'Bar Council',
    ],
    essential_elements: {
      valid_policy: {
        description: 'Valid insurance policy in force at time of loss',
        guidance:
          'Check policy inception date, renewal date, and scope of cover. Verify premium payment.',
        evidence_types: ['policy_document', 'schedule_of_insurance', 'premium_records'],
      },
      insured_peril: {
        description: 'Loss falls within insured perils',
        guidance:
          'Compare loss to policy wording. Check exclusions and conditions carefully.',
        evidence_types: [
          'policy_wording',
          'loss_documentation',
          'expert_assessment_of_cause',
        ],
      },
      duty_of_disclosure: {
        description: 'Policyholder complied with disclosure obligations',
        guidance:
          'Under Insurance Act 2015, policyholder must disclose material facts known. Insurer must prove non-disclosure.',
        evidence_types: [
          'proposal_form',
          'correspondence',
          'knowledge_evidence',
          'materiality_evidence',
        ],
      },
      claim_notification: {
        description: 'Claim properly notified within time limits',
        guidance: 'Check policy for notification requirements. Most require prompt notification.',
        evidence_types: [
          'notice_letter',
          'email_notification',
          'witness_to_notification',
          'policy_conditions',
        ],
      },
      quantum_assessment: {
        description: 'Loss properly quantified with supporting evidence',
        guidance: 'Insured must prove loss to reasonable standard. Expert reports usual.',
        evidence_types: [
          'receipts',
          'invoices',
          'expert_reports',
          'replacement_cost_evidence',
        ],
      },
    },
    key_deadlines: {
      notification: 'Varies by policy (typically prompt/reasonable time)',
      claim_presentation: 'Varies by policy (typically within 3-6 months)',
      limitation: '6 years from date of claim denial or loss occurrence',
    },
    limitation_rules: {
      standard: '6 years from loss occurrence or claim denial',
      contribution: '1 year from making payment for subrogation claims',
    },
    damages_structure: [
      {
        name: 'Indemnity',
        description: 'Restore insured to position before loss',
        items: [
          'Replacement cost',
          'Reinstatement cost',
          'Repair cost',
          'Consequential losses (if covered)',
        ],
        guidance: 'Subject to sum insured limit and policy conditions',
      },
    ],
    critical_checkpoints: [
      'Policy in force at date of loss confirmed',
      'Material facts disclosed or materiality of non-disclosure assessed',
      'Loss falls within insured peril (not excluded)',
      'Claim notified within policy timeframes',
      'Quantum properly evidenced with documentation',
      'Insurer response and any denial fully documented',
    ],
  },

  contractual_dispute: {
    name: 'Contractual Dispute',
    description: 'Breach of contract claims',
    governing_framework: [
      'Law of Contract',
      'Unfair Contract Terms Act 1977',
      'Consumer Rights Act 2015',
      'Sale of Goods Act 1979',
      'Supply of Goods and Services Act 1982',
      'Civil Procedure Rules 1998',
    ],
    professional_bodies: ['Law Society', 'Bar Council'],
    essential_elements: {
      contract_formation: {
        description: 'Valid contract exists with all parties',
        guidance:
          'Establish: offer, acceptance, consideration, intention to create legal relations, certainty of terms',
        evidence_types: [
          'written_contract',
          'correspondence',
          'performance_evidence',
          'payment_records',
        ],
      },
      terms_of_contract: {
        description: 'Clear identification of contractual terms',
        guidance:
          'Include express terms and material implied terms. Check for incorporation of terms.',
        evidence_types: ['contract_document', 'correspondence', 'course_of_dealing'],
      },
      breach: {
        description: 'Defendant breached specific contract term',
        guidance:
          'Show failure to perform obligation. Distinguish between condition, warranty, and innominate term.',
        evidence_types: [
          'non_performance_evidence',
          'defective_performance_evidence',
          'correspondence_demanding_performance',
        ],
      },
      causation_and_loss: {
        description: 'Breach caused quantifiable loss',
        guidance:
          'Loss must be reasonably foreseeable. Claimant must mitigate loss (duty to minimize).',
        evidence_types: [
          'loss_evidence',
          'invoices',
          'quotes',
          'mitigation_evidence',
          'expert_reports',
        ],
      },
    },
    key_deadlines: {
      limitation: '6 years from date of breach',
      part_payment: 'Clock can reset if defendant makes part payment with acknowledgement',
    },
    limitation_rules: {
      standard: '6 years from date of breach of contract',
      acknowledgement: 'Written acknowledgement resets limitation period',
    },
    damages_structure: [
      {
        name: 'Expectation Damages',
        description: 'Put claimant in position they would have been in if contract performed',
        items: ['Lost profit', 'Cost of completion', 'Diminished value'],
      },
      {
        name: 'Reliance Damages',
        description: 'Recover losses incurred in reliance on contract',
        items: ['Pre-contract expenditure', 'Wasted costs'],
      },
    ],
    critical_checkpoints: [
      'Contract terms clearly identified and interpreted',
      'Specific breach identified and proven',
      'Causation established between breach and loss',
      'Quantum properly calculated',
      'Mitigation steps assessed',
      'Remoteness not an issue under Hadley v Baxendale',
    ],
  },

  rics_complaint: {
    name: 'RICS Complaint / Professional Standards Breach',
    description: 'Claims against RICS-regulated surveyors for professional breaches',
    governing_framework: [
      'Royal Institution of Chartered Surveyors (RICS) Professional Standards',
      'RICS Conduct and Discipline Rules',
      'RICS Global Professional Standards',
      'Law of Tort (Negligence)',
      'Limitation Act 1980',
      'RICS Client Money Protection Rules',
    ],
    professional_bodies: ['RICS', 'Law Society', 'Bar Council'],
    essential_elements: {
      surveyor_engagement: {
        description: 'Surveyor engaged to provide valuation or survey services',
        guidance:
          'Establish engagement, scope of work, and standard report expected. Check for limitation of liability clauses.',
        evidence_types: [
          'engagement_letter',
          'survey_report',
          'terms_and_conditions',
          'fee_agreement',
        ],
      },
      rics_standards_breach: {
        description: 'Breach of RICS Professional Standards',
        guidance:
          'Identify specific standard breached: valuation methodology, survey scope, disclosure of conflicts, etc.',
        evidence_types: [
          'rics_professional_standards',
          'valuation_report',
          'expert_evidence',
          'market_evidence',
        ],
      },
      causation: {
        description: 'Breach caused loss to client',
        guidance:
          'Typical losses: overvaluation causing purchase overpayment, survey missing defects. Use valuation expert.',
        evidence_types: [
          'independent_valuation',
          'defect_evidence',
          'purchase_price_evidence',
          'actual_value_evidence',
        ],
      },
      quantifiable_loss: {
        description: 'Loss properly quantified',
        guidance:
          'Loss = difference between price paid and actual value (overvaluation) or cost of remedying missed defects.',
        evidence_types: ['valuation_expert_report', 'repair_quotes', 'loss_calculation'],
      },
    },
    key_deadlines: {
      limitation: '6 years from date of valuation/survey (breach of contract) or 3 years from knowledge (tort)',
      rics_complaint: 'No statutory time limit but typically within 6 years',
    },
    limitation_rules: {
      contract: '6 years from date of report (Limitation Act 1980, s.5)',
      tort: '3 years from date of knowledge of loss (Limitation Act 1980, s.2)',
      latent_defect: '3 years from date defect discoverable by reasonable diligence',
    },
    damages_structure: [
      {
        name: 'Overvaluation Loss',
        description: 'Loss from purchasing at inflated valuation',
        calculation: 'Actual current value - price paid',
      },
      {
        name: 'Defect Remediation Cost',
        description: 'Cost of remedying defects missed by survey',
        calculation: 'Cost of repairs required',
      },
      {
        name: 'Consequential Loss',
        description: 'Secondary losses from defect discovery',
        items: [
          'Inability to remortgage',
          'Reduced marketability',
          'Inconvenience and distress',
        ],
      },
    ],
    critical_checkpoints: [
      'Surveyor qualified and registered with RICS',
      'Engagement letter reviewed for scope and limitations',
      'Valuation methodology assessed against RICS standards',
      'Survey standards compliance assessed',
      'Independent valuation obtained for comparison',
      'Causation clearly linked to breach',
      'Loss quantified by qualified valuation expert',
    ],
  },
};

/**
 * Case structure helper - returns specific case type requirements
 */
export function getCaseTypeStructure(caseType) {
  return CASE_TYPE_STRUCTURES[caseType] || null;
}

/**
 * Get all case types available
 */
export function getAllCaseTypes() {
  return Object.entries(CASE_TYPE_STRUCTURES).map(([key, value]) => ({
    id: key,
    ...value,
  }));
}

/**
 * Validate case completeness based on case type
 */
export function validateCaseCompleteness(caseData) {
  const structure = CASE_TYPE_STRUCTURES[caseData.case_type];
  if (!structure) return { valid: false, errors: ['Unknown case type'] };

  const errors = [];

  // Check essential elements are present
  Object.keys(structure.essential_elements).forEach((element) => {
    // This would be checked against actual case data
    if (!caseData[element]) {
      errors.push(`Missing essential element: ${element}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    checklist: Object.keys(structure.essential_elements),
  };
}