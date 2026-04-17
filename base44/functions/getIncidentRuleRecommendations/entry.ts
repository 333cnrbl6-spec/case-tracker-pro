import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incident, evidence } = await req.json();

    if (!incident) {
      return Response.json({ error: 'Incident data is required' }, { status: 400 });
    }

    const rulePrompt = `You are a RICS conduct expert. Analyze this incident and recommend the most relevant RICS rules of conduct that may have been violated.

INCIDENT:
Title: ${incident.title}
Type: ${incident.incident_type}
Description: ${incident.description}
Severity: ${incident.severity}
${incident.evidence_notes ? `Evidence Notes: ${incident.evidence_notes}` : ''}

${evidence && evidence.length > 0 ? `SUPPORTING EVIDENCE:\n${evidence.map(e => `- ${e.title} (${e.evidence_type}): ${e.description}`).join('\n')}` : ''}

Analyze this situation and recommend the top 3-5 most relevant RICS conduct rules that appear to be implicated. For each rule, explain:
1. Why it's relevant
2. The specific conduct that violates it
3. Severity of the violation (minor/moderate/serious/critical)

Return a JSON array like:
[
  {
    "rule_category": "Professional Standards",
    "rule_name": "PS-1.1",
    "title": "General Conduct Standard",
    "relevance_score": 95,
    "explanation": "Why this rule is relevant",
    "violated_conduct": "The specific behavior that violates this",
    "severity": "critical"
  }
]`;

    const recommendations = await base44.integrations.Core.InvokeLLM({
      prompt: rulePrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rule_category: { type: 'string' },
                rule_name: { type: 'string' },
                title: { type: 'string' },
                relevance_score: { type: 'number' },
                explanation: { type: 'string' },
                violated_conduct: { type: 'string' },
                severity: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      recommendations: recommendations.recommendations || []
    });
  } catch (error) {
    console.error('Error getting rule recommendations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});