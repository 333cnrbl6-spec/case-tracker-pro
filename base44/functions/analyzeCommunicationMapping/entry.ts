import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { communicationId, incidents } = await req.json();

    const communication = await base44.entities.Communication.read(communicationId);
    if (!communication) {
      return Response.json({ error: 'Communication not found' }, { status: 404 });
    }

    const comm = communication.data;
    const allViolations = [...new Set(incidents.flatMap(i => i.rics_violations || []))];
    const allIssues = [...new Set(incidents.flatMap(i => i.legal_issues || []))];

    // Use LLM to analyze the communication
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
1. mapped_violations: array of RICS violations this communication relates to
2. mapped_legal_issues: array of legal issues this communication relates to
3. discrepancies: array of strings describing any contradictions, missing context, or red flags
4. evidence_gap: boolean - does this communication lack supporting documentation?

Only include violations/issues that are clearly relevant.`,
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

    // Update the communication with mapped data
    await base44.entities.Communication.update(communicationId, {
      mapped_violations: analysis.mapped_violations || [],
      mapped_legal_issues: analysis.mapped_legal_issues || [],
      discrepancies: analysis.discrepancies || [],
      evidence_gap: analysis.evidence_gap || false,
      analysis_timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      analysis: analysis,
      communicationId: communicationId
    });
  } catch (error) {
    console.error('Error analyzing communication:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});