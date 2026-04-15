import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all case data
    const [incidents, communications, evidence, ricsAssessment] = await Promise.all([
      base44.entities.Incident.list('-date'),
      base44.entities.Communication.list('-date'),
      base44.entities.Evidence.list('-date_collected'),
      base44.entities.RICSSurveyorProfile.list()
    ]);

    // Build evidence matrix
    const evidenceMatrix = evidence.map(e => ({
      id: e.id,
      title: e.title,
      type: e.evidence_type,
      date: e.date_collected,
      relevance: e.relevance,
      strength: e.strength,
      fileUrl: e.file_url,
      relatedIncidents: e.related_incidents || [],
      description: e.description,
      notes: e.notes
    }));

    // Build chronological timeline
    const timeline = [];
    
    incidents.forEach(inc => {
      timeline.push({
        date: inc.date,
        type: 'INCIDENT',
        title: inc.title,
        description: inc.description,
        severity: inc.severity,
        details: {
          incidentType: inc.incident_type,
          violations: inc.rics_violations || [],
          legalIssues: inc.legal_issues || [],
          status: inc.status
        }
      });
    });

    communications.forEach(comm => {
      timeline.push({
        date: comm.date,
        type: 'COMMUNICATION',
        title: `${comm.type.toUpperCase()}: ${comm.subject}`,
        from: comm.from,
        to: comm.to,
        tone: comm.tone,
        details: {
          content: comm.content,
          concerningElements: comm.concerning_elements || [],
          witnesses: comm.witnesses || []
        }
      });
    });

    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate damages
    const damagesBreakdown = calculateDamages(incidents, communications, evidence);

    // RICS violations analysis
    const ricsViolations = extractRICSViolations(incidents);

    // Build the bundle
    const bundle = {
      generatedDate: new Date().toISOString(),
      parties: {
        claimant: 'Sean Powell',
        defendant: 'Malcolm Belcher (RICS Surveyor)',
        relatedParties: ricsAssessment.map(r => r.surveyor_name) || []
      },
      caseSummary: {
        title: 'Professional Misconduct & Breach of Contract Claim',
        description: 'Claim against RICS-registered surveyor for breach of contract, negligence, and professional misconduct',
        jurisdiction: 'England (County Court)',
        totalValue: damagesBreakdown.totalClaim
      },
      timeline: timeline,
      evidenceMatrix: evidenceMatrix,
      incidentsCount: incidents.length,
      communicationsCount: communications.length,
      evidenceCount: evidence.length,
      damagesCalculation: damagesBreakdown,
      ricsViolations: ricsViolations,
      legalClaims: extractLegalClaims(incidents),
      strengths: identifyStrengths(evidence, communications),
      weaknesses: identifyWeaknesses(evidence, communications),
      settlementStrategy: generateSettlementStrategy(damagesBreakdown)
    };

    return Response.json(bundle);
  } catch (error) {
    console.error('Bundle generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateDamages(incidents, communications, evidence) {
  let directLoss = 40000; // Fee reduction £185k - £145k
  let consequentialLoss = 0;
  
  // Analyze evidence for consequential losses
  const criticalEvidence = evidence.filter(e => e.strength === 'critical' || e.strength === 'strong');
  
  // Each critical piece of supporting evidence adds credibility to consequential claims
  if (criticalEvidence.length >= 3) {
    consequentialLoss += 8000; // Replacement certification costs
  }
  if (incidents.some(i => i.severity === 'critical')) {
    consequentialLoss += 3000; // Project delay costs (estimated)
  }
  
  const legalCosts = 1200; // Dispute resolution
  const totalClaim = directLoss + consequentialLoss + legalCosts;

  return {
    directLoss: {
      label: 'Fee Reduction (£185k agreed - £145k paid)',
      amount: directLoss,
      evidence: 'Email confirmation of both amounts'
    },
    consequentialLoss: {
      label: 'Replacement Certification & Project Delays',
      amount: consequentialLoss,
      breakdown: [
        { item: 'Replacement architect certificates', amount: consequentialLoss >= 8000 ? 8000 : 0 },
        { item: 'Project delay costs (6 weeks @ £500/week)', amount: consequentialLoss >= 3000 ? 3000 : 0 }
      ]
    },
    legalCosts: {
      label: 'Dispute Resolution (Solicitor Correspondence)',
      amount: legalCosts
    },
    totalClaim: totalClaim,
    settlementRange: {
      conservative: directLoss,
      reasonable: directLoss + (consequentialLoss * 0.5),
      aggressive: totalClaim
    }
  };
}

function extractRICSViolations(incidents) {
  const violations = new Map();
  
  incidents.forEach(inc => {
    if (inc.rics_violations && Array.isArray(inc.rics_violations)) {
      inc.rics_violations.forEach(v => {
        violations.set(v, (violations.get(v) || 0) + 1);
      });
    }
  });

  return Array.from(violations.entries()).map(([violation, count]) => ({
    standard: violation,
    frequency: count,
    severity: count > 1 ? 'pattern' : 'single_incident'
  }));
}

function extractLegalClaims(incidents) {
  const claims = [];
  const claimTypes = new Set();

  incidents.forEach(inc => {
    if (inc.legal_issues && Array.isArray(inc.legal_issues)) {
      inc.legal_issues.forEach(issue => claimTypes.add(issue));
    }
  });

  claimTypes.forEach(claim => {
    claims.push({
      type: claim,
      strength: claim.includes('Breach') ? 'strong' : claim.includes('Negligence') ? 'moderate-strong' : 'moderate'
    });
  });

  return claims;
}

function identifyStrengths(evidence, communications) {
  return [
    {
      point: 'Clear written agreement on fee',
      evidence: 'Email correspondence confirming £185k fee'
    },
    {
      point: 'Unilateral variation without consent',
      evidence: 'Email trail showing £145k reduction and unilateral conditions'
    },
    {
      point: 'Contemporaneous objection',
      evidence: 'Dec 20, 2023 email objecting to post-completion conditions'
    },
    {
      point: 'Conflict of interest',
      evidence: 'Dual role (valuer + selling agent) undisclosed to client'
    },
    {
      point: 'Pattern of controlling behaviour',
      evidence: `${communications.filter(c => c.tone === 'aggressive' || c.tone === 'dismissive').length} documented communications with concerning tone`
    }
  ];
}

function identifyWeaknesses(evidence, communications) {
  return [
    {
      point: 'No formal written contract',
      mitigation: 'Compensated by multiple confirming emails establishing terms'
    },
    {
      point: 'Delay in escalation',
      mitigation: 'Client objected immediately (Dec 20); not unreasonable delay'
    },
    {
      point: 'Consequential losses require third-party invoices',
      mitigation: 'Gather invoices from replacement QS/contractors immediately'
    }
  ];
}

function generateSettlementStrategy(damages) {
  return {
    openingPosition: damages.settlementRange.aggressive,
    negotiationPhases: [
      {
        phase: 'Initial Demand Letter',
        target: damages.settlementRange.aggressive,
        rationale: 'Full recovery including consequentials'
      },
      {
        phase: 'First Counter-Offer (Expected)',
        anticipate: damages.settlementRange.conservative,
        respond: damages.settlementRange.reasonable,
        rationale: 'Defend consequentials with invoices; stand firm on direct loss'
      },
      {
        phase: 'Settlement Zone',
        range: `£${damages.settlementRange.reasonable.toLocaleString()} - £${(damages.settlementRange.reasonable * 1.1).toLocaleString()}`,
        likelihood: 'High - defendant likely to avoid trial due to email evidence'
      }
    ],
    walkAwayNumber: damages.settlementRange.conservative,
    trialRisk: {
      winProbability: '75-80%',
      rationale: 'Strong written evidence, clear breach, pattern of misconduct'
    }
  };
}