import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { case_id } = body;

    if (!case_id) {
      return Response.json({ error: 'Missing case_id' }, { status: 400 });
    }

    // Fetch case and related evidence
    const legalCase = await base44.entities.LegalCase.read(case_id);
    const allEvidence = await base44.entities.Evidence.filter({ 
      related_incidents: legalCase.case_ref 
    });

    // Fetch RICS rules for reference
    const ricsRules = await base44.entities.RICSRule.list();

    // Prepare evidence data for analysis
    const evidenceData = allEvidence.map(e => ({
      id: e.id,
      title: e.title,
      type: e.evidence_type,
      strength: e.strength,
      relevance: e.relevance,
      description: e.description,
      rics_violations: e.rics_violations || []
    }));

    // Prepare RICS rules reference
    const rulesData = ricsRules.map(r => ({
      rule_number: r.rule_number,
      title: r.title,
      severity: r.severity_if_breached
    }));

    // Use AI to analyze evidence against RICS benchmarks
    const prompt = `You are a legal risk assessment expert specializing in RICS (Royal Institution of Chartered Surveyors) compliance.

Analyze the following evidence items for a legal case and calculate an overall compliance risk score (0-100, where 100 is highest risk).

AVAILABLE RICS RULES:
${rulesData.map(r => `- ${r.rule_number}: ${r.title} (Severity if breached: ${r.severity})`).join('\n')}

CASE EVIDENCE:
${evidenceData.map((e, idx) => `
Evidence ${idx + 1}: ${e.title}
Type: ${e.type}
Strength: ${e.strength}
Relevance: ${e.relevance}
Description: ${e.description}
${e.rics_violations.length > 0 ? `Flagged RICS Violations: ${e.rics_violations.join(', ')}` : 'No violations flagged'}
`).join('\n')}

Calculate and return a JSON response with:
1. **overall_risk_score** (0-100): Overall compliance risk
2. **risk_level** (low/medium/high/critical): Classification
3. **category_scores**: Breakdown by risk category (documentation_risk, conduct_risk, timeline_risk, evidence_gaps)
4. **violation_count**: Number of RICS violations identified
5. **critical_findings**: Array of critical risk factors
6. **evidence_gap_risks**: What evidence is missing or weak
7. **confidence_score** (0-100): How confident the assessment is
8. **remediation_priority**: Top 3 actions to reduce risk`;

    const riskAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_risk_score: { type: 'number' },
          risk_level: { type: 'string' },
          category_scores: {
            type: 'object',
            properties: {
              documentation_risk: { type: 'number' },
              conduct_risk: { type: 'number' },
              timeline_risk: { type: 'number' },
              evidence_gaps: { type: 'number' }
            }
          },
          violation_count: { type: 'number' },
          critical_findings: { type: 'array', items: { type: 'string' } },
          evidence_gap_risks: { type: 'array', items: { type: 'string' } },
          confidence_score: { type: 'number' },
          remediation_priority: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    // Store the risk assessment
    const riskRecord = await base44.asServiceRole.entities.ComplianceRisk.create({
      case_id,
      assessment_date: new Date().toISOString().split('T')[0],
      overall_risk_score: riskAnalysis.overall_risk_score,
      risk_level: riskAnalysis.risk_level,
      risk_categories: JSON.stringify(riskAnalysis.category_scores),
      predicted_failures: JSON.stringify(riskAnalysis.critical_findings),
      risk_factors: JSON.stringify({
        violations: riskAnalysis.violation_count,
        gaps: riskAnalysis.evidence_gap_risks,
        findings: riskAnalysis.critical_findings
      }),
      recommended_actions: JSON.stringify(riskAnalysis.remediation_priority),
      confidence_score: riskAnalysis.confidence_score,
      analyzed_by: user.email
    });

    return Response.json({
      risk_score: riskAnalysis,
      risk_record_id: riskRecord.id,
      evidence_analyzed: allEvidence.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Risk calculation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});