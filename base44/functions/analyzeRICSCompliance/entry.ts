import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await req.json();

    if (!caseId) {
      return Response.json({ error: 'Case ID required' }, { status: 400 });
    }

    // Fetch case details
    const legalCase = await base44.entities.LegalCase.get(caseId);
    if (!legalCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Fetch related incidents
    const incidents = await base44.entities.Incident.filter({ 
      case_id: caseId 
    });

    // Fetch related evidence
    const evidence = await base44.entities.Evidence.filter({
      case_id: caseId
    });

    // Fetch communications
    const communications = await base44.entities.Communication.filter({
      case_id: caseId
    });

    // Fetch all RICS rules
    const ricsRules = await base44.asServiceRole.entities.RICSRule.list('', 100);

    // Prepare case analysis prompt
    const caseText = `
CASE DETAILS:
- Reference: ${legalCase.case_ref}
- Type: ${legalCase.case_type}
- Client: ${legalCase.client_name}
- Opponent: ${legalCase.opponent_name}
- Status: ${legalCase.status}
- Limitation Date: ${legalCase.limitation_date}
- Facts: ${legalCase.facts || 'Not provided'}

INCIDENTS (${incidents.length}):
${incidents.map(i => `- ${i.date}: ${i.title} (${i.severity})`).join('\n')}

EVIDENCE (${evidence.length}):
${evidence.slice(0, 10).map(e => `- ${e.title} (${e.evidence_type})`).join('\n')}

COMMUNICATIONS (${communications.length}):
${communications.slice(0, 10).map(c => `- ${c.date}: ${c.type} from ${c.from} to ${c.to}`).join('\n')}
    `;

    const rulesText = ricsRules
      .map(r => `[${r.rule_number}] ${r.title}: ${r.description}`)
      .join('\n');

    // Call LLM for analysis
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a RICS compliance expert. Analyze this legal case against RICS professional standards and identify:

1. POTENTIAL BREACHES: Which RICS rules might be violated based on the case facts, incidents, and communications?
2. RISK AREAS: What compliance gaps exist?
3. RECOMMENDED ACTIONS: What specific steps should be taken to mitigate risks?
4. DOCUMENTATION GAPS: What evidence or documentation is missing?

RICS RULES REFERENCE:
${rulesText}

CASE TO ANALYZE:
${caseText}

Provide a structured analysis with specific rule references and actionable recommendations.`,
      response_json_schema: {
        type: 'object',
        properties: {
          potential_breaches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rule_number: { type: 'string' },
                rule_title: { type: 'string' },
                severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                evidence: { type: 'string' },
                details: { type: 'string' }
              }
            }
          },
          risk_areas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                area: { type: 'string' },
                risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                explanation: { type: 'string' },
                related_rules: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          recommended_actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                deadline_days: { type: 'number' },
                responsible: { type: 'string' }
              }
            }
          },
          compliance_score: { type: 'number', description: 'Overall compliance score 0-100' },
          summary: { type: 'string', description: 'Executive summary of compliance status' }
        }
      }
    });

    return Response.json({
      case_ref: legalCase.case_ref,
      analysis: analysis,
      analysis_date: new Date().toISOString(),
      case_id: caseId
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});