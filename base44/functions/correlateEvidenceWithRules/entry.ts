import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { evidence, rules } = await req.json();

    if (!evidence || !rules || rules.length === 0) {
      return Response.json({
        success: true,
        correlations: []
      });
    }

    const prompt = `You are a RICS conduct expert. Analyze this evidence document and determine which RICS conduct rules it demonstrates violations of or support claims about.

EVIDENCE DOCUMENT:
Title: ${evidence.title}
Type: ${evidence.evidence_type}
Description: ${evidence.description}
Date: ${evidence.date_collected}
Strength: ${evidence.strength}

AVAILABLE RICS RULES:
${rules.map(r =>
  `- Rule: ${r.rule_number}, Category: ${r.category}, Title: ${r.title}, Description: ${r.description}`
).join('\n')}

Analyze what violations or conduct issues this evidence demonstrates. For each relevant RICS rule:
1. Assess if this evidence demonstrates a violation of that rule
2. Determine the strength of that connection (how directly does this evidence prove the violation?)
3. Explain specifically what in the evidence demonstrates the rule violation

Return a JSON array like:
[
  {
    "rule_number": "PS-1.1",
    "category": "Professional Standards",
    "relevance_score": 85,
    "violation_strength": "strong",
    "explanation": "Specific explanation of how this evidence demonstrates this rule violation"
  }
]

Only include rules with relevance_score >= 60. Sort by relevance_score descending.`;

    const correlations = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          correlations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rule_number: { type: 'string' },
                category: { type: 'string' },
                relevance_score: { type: 'number' },
                violation_strength: { type: 'string' },
                explanation: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      correlations: (correlations.correlations || []).filter(c => c.relevance_score >= 60).slice(0, 5)
    });
  } catch (error) {
    console.error('Error correlating evidence with rules:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});