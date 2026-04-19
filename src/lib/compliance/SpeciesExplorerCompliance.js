/**
 * 🦋 Species Explorer — App-Specific Compliance Standards
 * Date: April 2026
 * Domain: Conservation Ecology & Biodiversity Surveying
 * 
 * Compliance requirements for UK conservation surveying, species protection,
 * and biodiversity net gain regulations.
 */

// =============================================================================
// REGULATORY FRAMEWORKS
// =============================================================================

export const REGULATORY_FRAMEWORKS = {
  // Primary legislation
  WILDLIFE_AND_COUNTRYSIDE_ACT_1981: {
    name: 'Wildlife and Countryside Act 1981',
    description: 'Primary legislation protecting wildlife and habitats in England',
    keySections: [
      'Section 1: Protection of wild birds',
      'Section 2: Protection of other animals',
      'Section 5: Protection of plants',
      'Section 9: Protected species offences',
      'Schedule 5: Animals protected under section 9',
      'Schedule 8: Plants protected under section 13'
    ],
    complianceRequirements: [
      'Licence required for surveys affecting protected species',
      'No disturbance of breeding sites or resting places',
      'No taking, killing, or handling of protected species without licence',
      'Survey methods must minimize impact on species and habitat'
    ]
  },

  CONSERVATION_OF_HABITATS_AND_SPECIES_REGULATIONS_2017: {
    name: 'Conservation of Habitats and Species Regulations 2017',
    description: 'Implements EU Habitats Directive in England',
    keySections: [
      'European protected species (EPS) licensing',
      'Special Areas of Conservation (SAC)',
      'Special Protection Areas (SPA)'
    ],
    complianceRequirements: [
      'European Protected Species licence for bats, great crested newts, dormice, etc.',
      'Habitat assessment before development',
      'Mitigation hierarchy: Avoid → Minimize → Compensate → Offset'
    ]
  },

  ENVIRONMENT_ACT_2021: {
    name: 'Environment Act 2021',
    description: 'Post-Brexit environmental governance framework',
    keySections: [
      'Part 6: Biodiversity gain in planning',
      'Section 90: Biodiversity net gain requirement',
      'Schedule 7A: Biodiversity gain in planning'
    ],
    complianceRequirements: [
      'Minimum 10% biodiversity net gain for developments (mandatory from Feb 2024)',
      'BNG assessment using Defra Statutory Biodiversity Metric',
      'Habitat management plan for minimum 30 years',
      'Post-development monitoring and reporting'
    ]
  },

  CROW_AND_WILDLIFE_ACT_1981: {
    name: 'Countryside and Rights of Way Act 2000 (CROW Act)',
    description: 'Strengthens wildlife protection and public access',
    keySections: [
      'Section 81: Protection of SSSIs',
      'Section 84: Duty to take reasonable steps to further conservation'
    ]
  },

  // Professional standards
  BTO_SURVEY_STANDARDS: {
    name: 'British Trust for Ornithology (BTO) Survey Standards',
    description: 'Professional standards for bird surveys',
    requirements: [
      'Standardized survey methods (e.g., Breeding Bird Survey protocols)',
      'Licensed bird ringers for handling',
      'Data submission to BTO/National databases',
      'Seasonal timing constraints respected'
    ]
  },

  CIEEM_GUIDANCE: {
    name: 'CIEEM Professional Standards',
    description: 'Chartered Institute of Ecology and Environmental Management guidelines',
    requirements: [
      'Preliminary Ecological Appraisal before detailed surveys',
      'Seasonal survey windows (e.g., bat surveys May-Sept)',
      'Competent ecologist qualifications',
      'Data protection for sensitive species locations'
    ]
  },

  NATURAL_ENGLAND_LICENSING: {
    name: 'Natural England Wildlife Licensing',
    description: 'Government licensing for protected species work',
    requirements: [
      'Class licences for low-impact activities',
      'Individual licences for development work',
      'Annual returns and monitoring data',
      'Adherence to licence conditions and methods'
    ]
  }
};

// =============================================================================
// PROTECTED SPECIES CATEGORIES
// =============================================================================

export const PROTECTED_SPECIES_CATEGORIES = {
  BATS: {
    protectionLevel: 'European Protected Species (EPS)',
    legislation: ['Habitats Regulations 2017', 'Wildlife and Countryside Act 1981'],
    offences: [
      'Deliberate capture, injury or killing',
      'Deliberate disturbance',
      'Damage or destruction of breeding sites (roosts)',
      'Keeping, transport, sale or exchange'
    ],
    surveyRequirements: {
      licenceRequired: true,
      surveyWindow: 'May to September (peak activity)',
      visitCount: 'Minimum 3-4 visits for roost assessment',
      methods: ['Dusk emergence surveys', 'Dawn re-entry surveys', 'Internal building inspection', 'Bat detector surveys']
    },
    dataSensitivity: 'HIGH - location data must be obscured in public records'
  },

  GREAT_CRESTED_NEWTS: {
    protectionLevel: 'European Protected Species (EPS)',
    legislation: ['Habitats Regulations 2017', 'Wildlife and Countryside Act 1981'],
    offences: [
      'Deliberate capture, injury or killing',
      'Deliberate disturbance',
      'Damage or destruction of breeding sites (ponds and terrestrial habitat)',
      'Keeping, transport, sale or exchange'
    ],
    surveyRequirements: {
      licenceRequired: true,
      surveyWindow: 'Mid-March to mid-June (peak mid-April to mid-May)',
      visitCount: 'Minimum 6 surveys for presence/likely absence',
      methods: ['Bottle trapping', 'Egg searching', 'Torching', 'Netting', 'eDNA sampling (April-June only)']
    },
    dataSensitivity: 'HIGH - location data must be obscured'
  },

  DORMICE: {
    protectionLevel: 'European Protected Species (EPS)',
    legislation: ['Habitats Regulations 2017', 'Wildlife and Countryside Act 1981'],
    surveyRequirements: {
      licenceRequired: true,
      surveyWindow: 'May to November (active season)',
      visitCount: 'Minimum 4-6 visits',
      methods: ['Nest tube surveys', 'Nest box checks', 'Hair tube surveys', 'Hedgehog tube surveys']
    },
    dataSensitivity: 'HIGH - location data must be obscured'
  },

  REPTILES: {
    protectionLevel: 'Protected under Wildlife and Countryside Act 1981 (Schedule 5)',
    species: ['Adder', 'Grass snake', 'Slow-worm', 'Common lizard', 'Sand lizard', 'Smooth snake'],
    offences: [
      'Killing or injuring',
      'Selling, offering for sale or possessing for sale'
    ],
    surveyRequirements: {
      licenceRequired: 'For development affecting habitat',
      surveyWindow: 'April to September (peak basking periods)',
      methods: ['Refugia surveys', 'Visual encounter surveys', 'Drift fencing and pitfall traps']
    },
    dataSensitivity: 'MEDIUM - sensitive species locations should be protected'
  },

  BIRDS: {
    protectionLevel: 'All wild birds protected under Wildlife and Countryside Act 1981',
    offences: [
      'Killing, injuring or taking',
      'Taking, damaging or destroying nests',
      'Taking or destroying eggs',
      'Disturbance of Schedule 1 species during breeding season'
    ],
    schedule1Species: [
      'Barn owl', 'Kingfisher', 'Grey heron', 'Red kite', 'Goshawk',
      'Hobby', 'Merlin', 'Peregrine', 'Osprey', 'Bittern'
    ],
    surveyRequirements: {
      licenceRequired: 'For Schedule 1 species during breeding season',
      breedingSeason: 'Generally March to August (varies by species)',
      methods: ['Breeding Bird Survey (BBS)', 'Nest recording', 'Winter bird surveys', 'Flight line surveys']
    },
    dataSensitivity: 'HIGH for Schedule 1 - location data must be protected'
  },

  BADGERS: {
    protectionLevel: 'Protected under Protection of Badgers Act 1992',
    offences: [
      'Killing, injuring or taking',
      'Cruel treatment',
      'Interference with setts',
      'Obstruction of access to setts'
    ],
    surveyRequirements: {
      licenceRequired: 'For development affecting setts',
      surveyWindow: 'Year-round (best: dawn/dusk in spring)',
      methods: ['Sett mapping', 'Hair tube surveys', 'Footprint tunnels', 'Camera trapping']
    },
    dataSensitivity: 'MEDIUM - sett locations should be protected'
  },

  OTTERS: {
    protectionLevel: 'European Protected Species (EPS)',
    legislation: ['Habitats Regulations 2017', 'Wildlife and Countryside Act 1981'],
    surveyRequirements: {
      licenceRequired: true,
      surveyWindow: 'Year-round (best: spring and autumn)',
      methods: ['Holt surveying', 'Spraint surveying', 'Camera trapping', 'eDNA sampling']
    },
    dataSensitivity: 'HIGH - holt locations must be obscured'
  },

  WATER_VOLES: {
    protectionLevel: 'Protected under Wildlife and Countryside Act 1981 (Schedule 5)',
    offences: [
      'Damage, destruction or obstruction of burrows',
      'Disturbance while occupying burrows',
      'Killing, injuring or taking'
    ],
    surveyRequirements: {
      licenceRequired: 'For development work',
      surveyWindow: 'April to September',
      methods: ['Burrow mapping', 'Field signs survey', 'Latrine counts']
    },
    dataSensitivity: 'HIGH - location data must be obscured'
  }
};

// =============================================================================
// BIODIVERSITY NET GAIN REQUIREMENTS
// =============================================================================

export const BIODIVERSITY_NET_GAIN = {
  mandatoryFrom: 'February 2024 (large developments), April 2024 (small sites)',
  minimumGain: '10% net gain required',
  metric: 'Defra Statutory Biodiversity Metric v4.0',
  
  requirements: [
    'Baseline habitat assessment using approved methodology',
    'Post-development biodiversity value calculation',
    'Minimum 10% net gain demonstrated',
    'Habitat enhancement plan with 30+ year management commitment',
    'Securing enhancements through planning conditions or obligations',
    'Monitoring and reporting for minimum 30 years'
  ],

  exemptions: [
    'Developments affecting less than 25m² of priority habitat',
    'Self-build and custom-build projects (exempt until late 2025)',
    'Householder applications',
    'Sites with less than 100m² of existing habitat'
  ],

  habitatBands: {
    areaHabitats: [
      'Grassland (neutral, calcareous, acid, improved)',
      'Woodland (broadleaf, mixed, conifer)',
      'Heathland and shrub',
      'Arable and horticulture',
      'Bare ground, rock, scree'
    ],
    linearHabitats: [
      'Hedgerows (species-rich, species-poor)',
      'Lines of trees',
      'Rivers and streams',
      'Other linear features'
    ],
    wetlandAndWaterHabitats: [
      'Standing water (lakes, ponds, reservoirs)',
      'Fen, marsh and swamp',
      'Bog',
      'Coastal habitats'
    ]
  },

  distinctivenessLevels: {
    HIGH: 'Ancient woodland, species-rich grassland, blanket bog, sand dunes',
    MEDIUM: 'Species-poor grassland, young woodland, species-poor hedgerows',
    LOW: 'Improved grassland, arable land, built structures'
  }
};

// =============================================================================
// DATA PROTECTION REQUIREMENTS
// =============================================================================

export const SPECIES_DATA_PROTECTION = {
  sensitiveSpeciesLocations: {
    description: 'Location data for certain species must be obscured or withheld from public records',
    categories: {
      HIGH_RISK: {
        species: ['Bats (all species)', 'Great crested newts', 'Dormice', 'Sand lizards', 'Smooth snakes', 'Sea eagles'],
        action: 'Remove 6-figure grid reference, provide only 10km square or vague description'
      },
      MEDIUM_RISK: {
        species: ['Badgers', 'Otters', 'Water voles', 'Nesting birds of prey', 'Reptiles (common species)'],
        action: 'Consider obscuring location in public-facing records'
      }
    }
  },

  dataSharingAgreements: {
    required: true,
    partners: [
      'Local Records Centres (LRCs)',
      'National Biodiversity Network (NBN)',
      'Natural England',
      'Local Planning Authorities',
      'Conservation NGOs (e.g., Wildlife Trusts, RSPB, Bat Conservation Trust)'
    ],
    requirements: [
      'Data sharing MOU in place',
      'Sensitive species data flagged and protected',
      'Access controls based on user role',
      'Annual data quality audits'
    ]
  }
};

// =============================================================================
// SURVEY LICENSING REQUIREMENTS
// =============================================================================

export const LICENSING_REQUIREMENTS = {
  NATURAL_ENGLAND_CLASS_LICENCES: {
    description: 'Low-risk activities covered by class licences',
    activities: [
      'Bat surveys (low impact)',
      'Great crested newt eDNA sampling',
      'Certain development activities with low ecological impact'
    ],
    conditions: [
      'Must be registered ecologist',
      'Must follow prescribed methods',
      'Annual returns required',
      'No significant impact on conservation status'
    ]
  },

  INDIVIDUAL_LICENCES: {
    description: 'Required for higher-risk activities and development work',
    activities: [
      'Development affecting EPS breeding sites',
      'Translocation of protected species',
      'Scientific research involving handling',
      'Conservation management interventions'
    ],
    applicationProcess: [
      'Demonstrate purpose (development, conservation, research)',
      'Show no satisfactory alternative',
      'Maintain favourable conservation status',
      'Provide detailed method statement',
      'Allow 8-12 weeks for determination'
    ]
  }
};

// =============================================================================
// COMPLIANCE CHECKLIST — SPECIES EXPLORER
// =============================================================================

export const COMPLIANCE_CHECKLIST = {
  surveyCompliance: [
    'Survey conducted within appropriate seasonal window',
    'Appropriate licence held for protected species work',
    'Survey methods follow CIEEM/BTO/Natural England guidance',
    'Minimum visit counts achieved for target species',
    'Competent ecologist qualifications verified',
    'Survey report includes all required elements'
  ],
  dataProtection: [
    'Sensitive species locations obscured in public records',
    '6-figure grid references removed for high-risk species',
    'Data sharing agreements in place with partners',
    'Access controls based on user roles',
    'GDPR compliance for personal data'
  ],
  biodiversityNetGain: [
    'Baseline habitat assessment completed',
    'Defra Metric v4.0 calculations verified',
    'Minimum 10% net gain demonstrated',
    'Habitat management plan (30+ years) in place',
    'Monitoring schedule established',
    'Legal mechanisms securing enhancements'
  ],
  licensing: [
    'Natural England licence obtained where required',
    'Licence conditions understood and followed',
    'Annual returns submitted on time',
    'Method statements approved before work begins'
  ],
  reporting: [
    'Survey reports follow CIEEM format',
    'Data submitted to Local Records Centre',
    'NBN Atlas records uploaded (with sensitivity flags)',
    'Client advised of legal obligations',
    'Recommendations clear and actionable'
  ]
};

// =============================================================================
// AI MODEL SELECTION — SPECIES EXPLORER
// =============================================================================

export const AI_MODEL_GUIDANCE = {
  SURVEY_REPORT_GENERATION: {
    model: 'claude_sonnet_4_6',
    reason: 'Professional ecological reports require accuracy and regulatory compliance',
    useCase: 'Preliminary Ecological Appraisals, Protected Species Survey Reports'
  },
  HABITAT_CLASSIFICATION: {
    model: 'claude_opus_4_6',
    reason: 'Complex multi-image habitat analysis with UKHab classification',
    useCase: 'Classifying habitat types from aerial imagery or field photos'
  },
  SPECIES_IDENTIFICATION: {
    model: 'automatic',
    reason: 'Simple classification task, can use automatic model',
    useCase: 'Identifying species from photos (with expert verification required)'
  },
  BNG_CALCULATION_REVIEW: {
    model: 'claude_opus_4_6',
    reason: 'Complex calculations requiring verification against Defra Metric',
    useCase: 'Reviewing and validating BNG calculations'
  },
  LICENCE_APPLICATION_DRAFTING: {
    model: 'claude_sonnet_4_6',
    reason: 'Legal document requiring precision and regulatory knowledge',
    useCase: 'Drafting Natural England licence applications and method statements'
  },
  WEB_SEARCH_REQUIRED: {
    model: 'gemini_3_1_pro',
    reason: 'Need current information on regulations or species status',
    useCase: 'Checking latest Natural England guidance, licence fees, or species conservation status'
  }
};

// Export all compliance standards
export default {
  REGULATORY_FRAMEWORKS,
  PROTECTED_SPECIES_CATEGORIES,
  BIODIVERSITY_NET_GAIN,
  SPECIES_DATA_PROTECTION,
  LICENSING_REQUIREMENTS,
  COMPLIANCE_CHECKLIST,
  AI_MODEL_GUIDANCE
};