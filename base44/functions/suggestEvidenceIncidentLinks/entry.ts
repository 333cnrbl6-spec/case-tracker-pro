import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { evidence, incidents } = await req.json();

    if (!evidence || !incidents || incidents.length === 0) {
      return Response.json({
        success: true,
        suggestions: []
      });
    }

    const prompt = `You are an expert at analyzing legal documents and incident reports. Analyze this evidence and determine which incidents it likely relates to.

EVIDENCE DOCUMENT:
Title: ${evidence.title}
Type: ${evidence.evidence_type}
Date: ${evidence.date_collected}
Description: ${evidence.description}
Relevance: ${evidence.relevance}

INCIDENT REPORTS TO MATCH:
${incidents.map(i => 
  `- ID: ${i.id}, Date: ${i.date}, Title: ${i.title}, Type: ${i.incident_type}, Description: ${i.description}`
).join('\n')}

For each incident that this evidence likely relates to, analyze:
1. Date proximity (is the evidence date near the incident date?)
2. Keyword overlap (do they mention similar people, events, or issues?)
3. Content relevance (does the evidence support or relate to the incident?)
4. Logical connection (does this evidence make sense as supporting documentation for this incident?)

Return a JSON array like:
[
  {
    "incident_id": "id",
    "confidence": 95,
    "reason": "Why this evidence relates to this incident",
    "keywords_matched": ["keyword1", "keyword2"]
  }
]

Only include incidents with confidence >= 60. Sort by confidence descending.`;

    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                incident_id: { type: 'string' },
                confidence: { type: 'number' },
                reason: { type: 'string' },
                keywords_matched: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      suggestions: (suggestions.suggestions || []).filter(s => s.confidence >= 60).slice(0, 5)
    });
  } catch (error) {
    console.error('Error suggesting evidence links:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});