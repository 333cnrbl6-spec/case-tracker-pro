import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incidents, communications, evidence } = await req.json();

    if (!incidents || incidents.length === 0) {
      return Response.json({ error: 'At least one incident is required' }, { status: 400 });
    }

    // Prepare summary for AI
    const incidentSummary = incidents.map(i => 
      `- ${i.title} (${i.date}, ${i.severity}): ${i.description}\n  RICS Violations: ${i.rics_violations?.join(', ') || 'None'}\n  Legal Issues: ${i.legal_issues?.join(', ') || 'None'}`
    ).join('\n');

    const commSummary = communications.map(c =>
      `- ${c.subject} (${c.date}, ${c.type}): From ${c.from} to ${c.to}\n  Content: ${c.content}\n  Tone: ${c.tone}`
    ).join('\n');

    const evidenceSummary = evidence.map(e =>
      `- ${e.title} (${e.evidence_type}, ${e.date_collected}): ${e.description}\n  Strength: ${e.strength}`
    ).join('\n');

    // Use AI to generate the brief
    const briefAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior solicitor. Analyze this case and generate a detailed legal brief.

INCIDENTS:
${incidentSummary}

COMMUNICATIONS:
${commSummary || 'None provided'}

EVIDENCE:
${evidenceSummary || 'None provided'}

Generate a JSON legal brief with these exact fields:

1. executive_summary: 2-3 paragraph summary of the case and potential claims
2. factual_background: Detailed chronological narrative of events
3. claims: Array of objects with {claim_type, basis, elements: [array of legal elements]}
4. evidence_strength: One of "Strong", "Moderate", "Weak"
5. evidence_analysis: Detailed assessment of evidence reliability and relevance
6. evidence_gaps: Array of missing evidence or documentation needed
7. damages_categories: Array of {type, estimated_range, description}
8. total_damages_range: Overall estimated damages range (e.g. "£50,000 - £150,000")
9. strategy_phase1: Pre-litigation strategy (negotiations, settlement, regulatory complaints)
10. strategy_phase2: Litigation strategy if court proceedings are necessary
11. risk_assessment: Key risks and mitigation strategies

Be specific, practical, and grounded in the evidence provided. Focus on actionable legal strategies.`,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          factual_background: { type: 'string' },
          claims: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                claim_type: { type: 'string' },
                basis: { type: 'string' },
                elements: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          evidence_strength: { type: 'string' },
          evidence_analysis: { type: 'string' },
          evidence_gaps: { type: 'array', items: { type: 'string' } },
          damages_categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                estimated_range: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          total_damages_range: { type: 'string' },
          strategy_phase1: { type: 'string' },
          strategy_phase2: { type: 'string' },
          risk_assessment: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      brief: briefAnalysis
    });
  } catch (error) {
    console.error('Error generating solicitor brief:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});