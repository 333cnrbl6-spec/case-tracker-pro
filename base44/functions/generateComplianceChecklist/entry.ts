import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rules, incidents } = await req.json();

    if (!rules || rules.length === 0) {
      return Response.json({ error: 'Rules are required' }, { status: 400 });
    }

    const rulesSummary = rules.map(r => 
      `- ${r.rule_number}: ${r.title}\n  Description: ${r.description}\n  Compliance Points: ${r.compliance_points?.join(', ') || 'None'}`
    ).join('\n');

    const incidentsSummary = incidents.map(i =>
      `- ${i.title}: ${i.description}`
    ).join('\n');

    const prompt = `Generate a detailed compliance checklist based on the following RICS rules and incidents.

RICS RULES TO REVIEW:
${rulesSummary}

INCIDENTS TO ASSESS:
${incidentsSummary}

Create a compliance checklist that:
1. Lists specific, actionable compliance items
2. Maps items to relevant RICS rules
3. Describes what action must be taken
4. Identifies risk areas based on incidents
5. Is practical and easy to follow

Respond with a JSON structure containing:
{
  "items": [
    {
      "id": "unique_id",
      "description": "What needs to be checked/done",
      "relatedRule": "Rule number (e.g., PS-1.1)",
      "action": "Specific action required",
      "priority": "high/medium/low"
    }
  ],
  "overallRiskLevel": "critical/high/medium/low",
  "summary": "Brief summary of compliance status"
}`;

    const checklistData = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                description: { type: 'string' },
                relatedRule: { type: 'string' },
                action: { type: 'string' },
                priority: { type: 'string' }
              }
            }
          },
          overallRiskLevel: { type: 'string' },
          summary: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      checklist: {
        items: checklistData.items || [],
        ruleCount: rules.length,
        incidentCount: incidents.length,
        overallRiskLevel: checklistData.overallRiskLevel || 'medium',
        summary: checklistData.summary || 'Compliance checklist generated'
      }
    });
  } catch (error) {
    console.error('Error generating checklist:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});