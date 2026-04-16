import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all case data in parallel
    const [incidents, communications, evidence, caseParties] = await Promise.all([
      base44.entities.Incident.list('-date'),
      base44.entities.Communication.list('-date'),
      base44.entities.Evidence.list('-date_collected'),
      base44.entities.CaseParty.list()
    ]);

    // Format data for LLM
    const incidentsSummary = incidents
      .slice(0, 10)
      .map(i => `${i.date}: ${i.title} (${i.incident_type}, severity: ${i.severity})`)
      .join('\n');

    const communicationsSummary = communications
      .slice(0, 10)
      .map(c => `${c.date}: ${c.type} from ${c.from} to ${c.to} - "${c.subject}"`)
      .join('\n');

    const evidenceSummary = evidence
      .slice(0, 10)
      .map(e => `${e.date_collected}: ${e.title} (${e.evidence_type}, strength: ${e.strength})`)
      .join('\n');

    const partiesSummary = caseParties
      .map(p => `${p.name} (${p.party_type}) - ${p.role_in_case}`)
      .join('\n');

    const prompt = `You are a legal case analyst. Based on the following case data, generate a concise but comprehensive case summary. Format your response as JSON with these fields:
- overview: 2-3 sentence summary of the case
- key_dates: array of important dates with brief descriptions
- parties_involved: array of key parties and their roles
- critical_evidence: array of the 3-5 most compelling pieces of evidence
- legal_risks: array of identified legal violations or concerns
- next_steps: 2-3 recommended actions

Case Data:

INCIDENTS:
${incidentsSummary || 'No incidents recorded'}

COMMUNICATIONS:
${communicationsSummary || 'No communications recorded'}

EVIDENCE:
${evidenceSummary || 'No evidence recorded'}

PARTIES:
${partiesSummary || 'No parties identified'}

Provide accurate, actionable insights. Be concise but thorough.`;

    const summary = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          overview: { type: 'string' },
          key_dates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          parties_involved: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                role: { type: 'string' }
              }
            }
          },
          critical_evidence: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                why_important: { type: 'string' }
              }
            }
          },
          legal_risks: {
            type: 'array',
            items: { type: 'string' }
          },
          next_steps: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    return Response.json({
      summary: summary,
      metadata: {
        incidents_count: incidents.length,
        communications_count: communications.length,
        evidence_count: evidence.length,
        parties_count: caseParties.length,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});