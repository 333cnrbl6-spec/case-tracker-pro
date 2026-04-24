import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all communications and RICS rules
    const communications = await base44.asServiceRole.entities.Communication.list('-date', 500);
    const ricsRules = await base44.asServiceRole.entities.RICSRule.list();

    if (!communications.length) {
      return Response.json({ breaches: [], total_analyzed: 0 });
    }

    // Build context of RICS rules for the LLM
    const rulesContext = ricsRules
      .slice(0, 30) // Limit to top 30 rules to avoid token explosion
      .map(r => `${r.rule_number} (${r.category}): ${r.title} - ${r.description}`)
      .join('\n');

    // Prepare communications for analysis
    const commsText = communications
      .map(c => `[${c.date}] From: ${c.from}, To: ${c.to}\nSubject: ${c.subject}\nContent: ${c.content}\nTone: ${c.tone || 'neutral'}\n---`)
      .join('\n\n');

    // Call Claude to analyze
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a RICS compliance expert. Analyze the following communications for potential breaches of RICS Professional Standards.

RICS RULES TO CHECK AGAINST:
${rulesContext}

COMMUNICATIONS TO ANALYZE:
${commsText}

For each communication that contains a potential breach, respond in JSON format with:
{
  "breaches": [
    {
      "date": "YYYY-MM-DD",
      "from": "sender name",
      "to": "recipient name",
      "subject": "subject line",
      "breach_type": "rule number (e.g., PS-1.1)",
      "rule_category": "category name",
      "rule_title": "title of breached rule",
      "issue_description": "Describe the specific non-compliant phrase or behavior",
      "problematic_text": "Quote the exact problematic phrase from the communication",
      "severity": "low|medium|high|critical",
      "recommendation": "What should be done to remedy this"
    }
  ]
}

Only include communications with actual breaches. Be conservative - only flag clear violations, not ambiguous cases.`,
      response_json_schema: {
        type: "object",
        properties: {
          breaches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                from: { type: "string" },
                to: { type: "string" },
                subject: { type: "string" },
                breach_type: { type: "string" },
                rule_category: { type: "string" },
                rule_title: { type: "string" },
                issue_description: { type: "string" },
                problematic_text: { type: "string" },
                severity: { type: "string" },
                recommendation: { type: "string" }
              },
              required: ["breach_type", "severity", "issue_description"]
            }
          }
        }
      }
    });

    return Response.json({
      breaches: analysis.breaches || [],
      total_analyzed: communications.length,
      analysis_date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Breach analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});