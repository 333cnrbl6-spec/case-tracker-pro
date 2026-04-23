/**
 * RICS Compliance Risk Scoring
 * 
 * Produces a numerical score (0–100) and risk level for incidents and communications
 * based on RICS Rules of Conduct thresholds.
 */

// ── Incident scoring ──────────────────────────────────────────────────────────
const SEVERITY_SCORES = { low: 10, medium: 30, high: 55, critical: 80 };

const INCIDENT_TYPE_SCORES = {
  harassment: 20,
  professional_conduct: 15,
  information_control: 12,
  gatekeeping: 12,
  document_issue: 10,
  communication: 8,
  other: 5,
};

// High-value RICS rules add bonus points each
const RICS_RULE_BONUS = 5;
const MAX_RICS_BONUS = 15;

export function scoreIncident(incident) {
  let score = 0;

  // Base from severity
  score += SEVERITY_SCORES[incident.severity] ?? 10;

  // Incident type modifier
  score += INCIDENT_TYPE_SCORES[incident.incident_type] ?? 5;

  // RICS violations (capped)
  const ricsCount = incident.rics_violations?.length ?? 0;
  score += Math.min(ricsCount * RICS_RULE_BONUS, MAX_RICS_BONUS);

  // Legal issues add weight
  const legalCount = incident.legal_issues?.length ?? 0;
  score += Math.min(legalCount * 4, 12);

  // Witnesses present — corroborated incidents are more serious
  const witnessCount = incident.witnesses?.length ?? 0;
  if (witnessCount > 0) score += Math.min(witnessCount * 2, 6);

  // Clamp 0–100
  score = Math.min(100, Math.max(0, Math.round(score)));

  return { score, level: scoreToLevel(score) };
}

// ── Communication scoring ─────────────────────────────────────────────────────
const TONE_SCORES = {
  professional: 0,
  neutral: 2,
  dismissive: 20,
  unprofessional: 30,
  aggressive: 50,
  threatening: 70,
};

const COMM_TYPE_SCORES = {
  letter: 2,
  email: 2,
  message: 3,
  phone_call: 4,
  in_person: 5,
  other: 2,
};

export function scoreCommunication(comm) {
  let score = 0;

  // Tone is primary driver
  score += TONE_SCORES[comm.tone] ?? 5;

  // Comm type
  score += COMM_TYPE_SCORES[comm.type] ?? 2;

  // Concerning elements — each phrase flags a risk
  const concernCount = comm.concerning_elements?.length ?? 0;
  score += Math.min(concernCount * 8, 24);

  // Witness/cc list — wider audience amplifies risk
  const witnessCount = comm.witnesses?.length ?? 0;
  if (witnessCount > 0) score += Math.min(witnessCount * 2, 6);

  score = Math.min(100, Math.max(0, Math.round(score)));

  return { score, level: scoreToLevel(score) };
}

// ── Shared helpers ────────────────────────────────────────────────────────────
export function scoreToLevel(score) {
  if (score >= 70) return 'critical';
  if (score >= 45) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

export const LEVEL_STYLES = {
  critical: {
    bg: 'bg-red-600',
    text: 'text-white',
    border: 'border-red-600',
    label: 'bg-red-100 text-red-800 border-red-200',
    ring: 'ring-red-400',
    word: 'Critical Risk',
  },
  high: {
    bg: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-500',
    label: 'bg-orange-100 text-orange-800 border-orange-200',
    ring: 'ring-orange-300',
    word: 'High Risk',
  },
  medium: {
    bg: 'bg-amber-400',
    text: 'text-slate-900',
    border: 'border-amber-400',
    label: 'bg-amber-100 text-amber-800 border-amber-200',
    ring: 'ring-amber-300',
    word: 'Medium Risk',
  },
  low: {
    bg: 'bg-green-500',
    text: 'text-white',
    border: 'border-green-500',
    label: 'bg-green-100 text-green-800 border-green-200',
    ring: 'ring-green-300',
    word: 'Low Risk',
  },
};