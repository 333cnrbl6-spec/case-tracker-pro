import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { case_id, ocr_signals } = await req.json();

  // Fetch all relevant data in parallel
  const [incidents, communications, evidence, tasks, existingRisks] = await Promise.all([
    base44.entities.Incident.filter({}),
    base44.entities.Communication.filter({}),
    base44.entities.Evidence.filter({}),
    base44.entities.IncidentTask.filter({}),
    base44.entities.ComplianceRisk.filter({}),
  ]);

  let caseData = null;
  let caseAlerts = [];
  if (case_id) {
    [caseData, caseAlerts] = await Promise.all([
      base44.entities.LegalCase.get(case_id),
      base44.entities.ComplianceAlert.filter({ case_id }),
    ]);
  }

  // Aggregate RICS violations across all incidents
  const allRicsViolations = incidents.flatMap(i => i.rics_violations || []);
  const violationFrequency = allRicsViolations.reduce((acc, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  // Critical incidents
  const criticalIncidents = incidents.filter(i => i.severity === 'critical');
  const highIncidents = incidents.filter(i => i.severity === 'high');

  // Overdue tasks
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.deadline && t.deadline < today && t.status !== 'completed');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');

  // Communications with concerning tone
  const concerningComms = communications.filter(c =>
    ['aggressive', 'threatening', 'unprofessional', 'dismissive'].includes(c.tone)
  );

  // Evidence strength analysis
  const criticalEvidence = evidence.filter(e => e.strength === 'critical');
  const weakEvidence = evidence.filter(e => e.strength === 'weak');

  // Recurring incident types (pattern detection)
  const incidentTypeFreq = incidents.reduce((acc, i) => {
    acc[i.incident_type] = (acc[i.incident_type] || 0) + 1;
    return acc;
  }, {});
  const recurringPatterns = Object.entries(incidentTypeFreq)
    .filter(([, count]) => count >= 2)
    .map(([type, count]) => `${type.replace(/_/g, ' ')} (${count} occurrences)`);

  const assessment = await base44.integrations.Core.InvokeLLM({
    model: 'claude_sonnet_4_6',
    prompt: `You are a senior RICS compliance risk analyst. Conduct a comprehensive automated risk assessment based on the following data from a professional conduct investigation.

=== CASE DATA ===
${caseData ? JSON.stringify(caseData, null, 2) : 'Portfolio-wide analysis (no specific case)'}

=== INCIDENTS SUMMARY ===
Total: ${incidents.length} | Critical: ${criticalIncidents.length} | High: ${highIncidents.length}
Most recent 10:
${incidents.slice(0, 10).map(i => `- [${i.severity?.toUpperCase()}] ${i.date} | ${i.incident_type?.replace(/_/g, ' ')} | ${i.title} | RICS: ${(i.rics_violations || []).join(', ') || 'none'}`).join('\n')}

=== RICS VIOLATION FREQUENCY MAP ===
${Object.entries(violationFrequency).sort((a, b) => b[1] - a[1]).map(([v, c]) => `${v}: flagged ${c} times`).join('\n') || 'No violations identified yet'}

=== RECURRING INCIDENT PATTERNS ===
${recurringPatterns.join('\n') || 'No recurring patterns yet'}

=== COMMUNICATIONS RISK ===
Total: ${communications.length} | Concerning tone: ${concerningComms.length}
Concerning: ${concerningComms.slice(0, 5).map(c => `[${c.tone}] ${c.subject} (${c.date})`).join(', ')}

=== EVIDENCE STATUS ===
Total: ${evidence.length} | Critical strength: ${criticalEvidence.length} | Weak: ${weakEvidence.length}
Evidence types: ${[...new Set(evidence.map(e => e.evidence_type))].join(', ')}

=== TASK COMPLIANCE ===
Total tasks: ${tasks.length} | Overdue: ${overdueTasks.length} | Blocked: ${blockedTasks.length}

=== ACTIVE COMPLIANCE ALERTS ===
${caseAlerts.slice(0, 5).map(a => `[${a.severity}] ${a.alert_type}: ${a.message}`).join('\n') || 'None'}

${ocr_signals ? `=== OCR DOCUMENT ANALYSIS SIGNALS ===
Contradictions found: ${ocr_signals.contradiction_count || 0}
New facts surfaced: ${ocr_signals.new_fact_count || 0}
RICS flags from documents: ${(ocr_signals.rics_flags || []).join(', ') || 'None'}
Overall document assessment: ${ocr_signals.overall_assessment || 'N/A'}
Contradiction details: ${(ocr_signals.contradictions || []).slice(0, 3).map(c => `[${c.severity}] ${c.contradiction_summary}`).join(' | ')}
` : ''}

Based on all of the above, produce a detailed RICS-specific compliance risk assessment. Focus on:
1. Pattern analysis across incidents (recurring violations, escalating severity)
2. Documentation and evidence gaps
3. Communication conduct risks
4. Regulatory exposure under specific RICS Professional Standards
5. How OCR contradictions (if any) elevate risk
6. Proactive recommendations for further investigation

Return JSON exactly as follows:
{
  "overall_risk_score": <0-100>,
  "risk_level": "low"|"medium"|"high"|"critical",
  "executive_summary": "<2-3 sentence plain-English summary of the risk picture>",
  "risk_categories": {
    "rics_violation_risk": <0-100>,
    "evidence_integrity_risk": <0-100>,
    "communication_conduct_risk": <0-100>,
    "documentation_gap_risk": <0-100>,
    "task_compliance_risk": <0-100>,
    "pattern_escalation_risk": <0-100>
  },
  "predicted_failures": [
    {
      "failure_type": "<string>",
      "probability": <0-100>,
      "timeframe_days": <number>,
      "severity": "low"|"medium"|"high"|"critical",
      "description": "<string>",
      "rics_rule": "<specific RICS PS rule reference>"
    }
  ],
  "risk_factors": [
    {
      "factor": "<string>",
      "impact": "low"|"medium"|"high"|"critical",
      "evidence": "<string>",
      "category": "pattern"|"documentation"|"communication"|"evidence"|"ocr_contradiction"|"rics_violation"
    }
  ],
  "recommended_actions": [
    {
      "action": "<imperative verb + specific action>",
      "priority": "low"|"medium"|"high"|"critical",
      "deadline_days": <number>,
      "rics_rule_reference": "<specific rule>",
      "rationale": "<why this is needed>"
    }
  ],
  "further_investigations": [
    {
      "area": "<investigation area>",
      "reason": "<why this needs investigation>",
      "suggested_method": "<how to investigate>"
    }
  ],
  "ocr_risk_elevation": "<how OCR findings change the risk profile, or 'N/A' if no OCR data>",
  "confidence_score": <0-100>
}`,
    response_json_schema: {
      type: 'object',
      properties: {
        overall_risk_score: { type: 'number' },
        risk_level: { type: 'string' },
        executive_summary: { type: 'string' },
        risk_categories: { type: 'object' },
        predicted_failures: { type: 'array', items: { type: 'object' } },
        risk_factors: { type: 'array', items: { type: 'object' } },
        recommended_actions: { type: 'array', items: { type: 'object' } },
        further_investigations: { type: 'array', items: { type: 'object' } },
        ocr_risk_elevation: { type: 'string' },
        confidence_score: { type: 'number' },
      },
    },
  });

  // Validate LLM response has required fields
  if (!assessment.overall_risk_score || !assessment.risk_level) {
    return Response.json({ 
      error: 'LLM failed to generate required risk fields',
      assessment 
    }, { status: 500 });
  }

  // Persist to database
  const riskRecord = await base44.asServiceRole.entities.ComplianceRisk.create({
    case_id: case_id || 'portfolio',
    assessment_date: new Date().toISOString().split('T')[0],
    overall_risk_score: assessment.overall_risk_score,
    risk_level: assessment.risk_level,
    risk_categories: JSON.stringify(assessment.risk_categories || {}),
    predicted_failures: JSON.stringify(assessment.predicted_failures || []),
    risk_factors: JSON.stringify(assessment.risk_factors || []),
    recommended_actions: JSON.stringify(assessment.recommended_actions || []),
    confidence_score: assessment.confidence_score || 0,
    analyzed_by: user.email,
    details: JSON.stringify({
      executive_summary: assessment.executive_summary || '',
      further_investigations: assessment.further_investigations || [],
      ocr_risk_elevation: assessment.ocr_risk_elevation || 'N/A',
    }),
  });

  return Response.json({ risk_assessment: assessment, risk_record_id: riskRecord.id });
});