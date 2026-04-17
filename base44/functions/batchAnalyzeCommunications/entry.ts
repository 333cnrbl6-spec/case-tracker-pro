import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { communicationIds, incidents } = await req.json();

    if (!communicationIds || communicationIds.length === 0) {
      return Response.json({ error: 'No communications provided' }, { status: 400 });
    }

    const allViolations = [...new Set(incidents.flatMap(i => i.rics_violations || []))];
    const allIssues = [...new Set(incidents.flatMap(i => i.legal_issues || []))];

    const results = [];
    let processed = 0;
    let errors = 0;

    // Process communications in batches of 3 to avoid rate limits
    for (let i = 0; i < communicationIds.length; i += 3) {
      const batch = communicationIds.slice(i, i + 3);

      const batchPromises = batch.map(async (commId) => {
        try {
          const communication = await base44.entities.Communication.read(commId);
          if (!communication) return null;

          const comm = communication.data;

          const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this communication and determine which RICS violations and legal issues it relates to.

Communication:
From: ${comm.from}
To: ${comm.to}
Subject: ${comm.subject}
Date: ${comm.date}
Tone: ${comm.tone}
Content: ${comm.content}

Possible RICS Violations: ${allViolations.join(', ')}
Possible Legal Issues: ${allIssues.join(', ')}

Return a JSON object with:
1. mapped_violations: array of RICS violations this communication relates to (empty if none)
2. mapped_legal_issues: array of legal issues this communication relates to (empty if none)
3. discrepancies: array of strings describing any contradictions, missing context, or red flags (empty if none)
4. evidence_gap: boolean - does this communication lack supporting documentation?

Only include violations/issues that are clearly relevant. Be specific and concise.`,
            response_json_schema: {
              type: 'object',
              properties: {
                mapped_violations: {
                  type: 'array',
                  items: { type: 'string' }
                },
                mapped_legal_issues: {
                  type: 'array',
                  items: { type: 'string' }
                },
                discrepancies: {
                  type: 'array',
                  items: { type: 'string' }
                },
                evidence_gap: { type: 'boolean' }
              }
            }
          });

          await base44.entities.Communication.update(commId, {
            mapped_violations: analysis.mapped_violations || [],
            mapped_legal_issues: analysis.mapped_legal_issues || [],
            discrepancies: analysis.discrepancies || [],
            evidence_gap: analysis.evidence_gap || false,
            analysis_timestamp: new Date().toISOString()
          });

          processed++;
          return { communicationId: commId, success: true, analysis };
        } catch (error) {
          errors++;
          console.error(`Error analyzing communication ${commId}:`, error);
          return { communicationId: commId, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null));

      // Small delay between batches
      if (i + 3 < communicationIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return Response.json({
      success: true,
      summary: {
        total: communicationIds.length,
        processed,
        errors,
        results
      }
    });
  } catch (error) {
    console.error('Error in batch analysis:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});