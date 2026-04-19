import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { case_id } = await req.json();
    if (!case_id) return Response.json({ error: 'case_id required' }, { status: 400 });

    // Fetch case data in parallel
    const [caseRecords, incidents, communications, evidence] = await Promise.all([
      base44.entities.LegalCase.filter({ id: case_id }),
      base44.entities.Incident.list('-date'),
      base44.entities.Communication.list('-date'),
      base44.entities.Evidence.list('-date_collected')
    ]);

    const legalCase = caseRecords[0];
    if (!legalCase) return Response.json({ error: 'Case not found' }, { status: 404 });

    const caseType = legalCase.case_type?.replace(/_/g, ' ') || 'legal';
    const evidenceList = evidence.slice(0, 15).map(e =>
      `- ${e.date_collected}: ${e.title} (${e.evidence_type}, strength: ${e.strength})`
    ).join('\n') || 'No evidence on file';

    const chronology = [
      ...incidents.map(i => ({ date: i.date, desc: `INCIDENT: ${i.title} (${i.severity})` })),
      ...communications.map(c => ({ date: c.date, desc: `COMMUNICATION: ${c.type} from ${c.from} to ${c.to} re: ${c.subject}` }))
    ]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 20)
      .map(e => `${e.date}: ${e.desc}`)
      .join('\n') || 'No chronology events recorded';

    const prompt = `You are a senior UK solicitor specialising in ${caseType}. Build a structured legal case narrative.

Case Ref: ${legalCase.case_ref}
Client: ${legalCase.client_name}
Opponent: ${legalCase.opponent_name || 'Not specified'}
Incident Date: ${legalCase.incident_date || 'Not specified'}
Limitation Date: ${legalCase.limitation_date || 'Not specified'}
Estimated Value: ${legalCase.estimated_value ? '£' + legalCase.estimated_value.toLocaleString() : 'Not assessed'}

Facts: ${legalCase.facts || 'See chronology below'}

Client Instructions: ${legalCase.instructions || 'Standard litigation instructions'}

Evidence on File:
${evidenceList}

Chronology of Events:
${chronology}

Jurisdiction: England & Wales. Produce a comprehensive structured legal narrative.`;

    const narrative = await base44.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          background_parties: { type: 'string' },
          chronology: { type: 'string' },
          liability_analysis: { type: 'string' },
          quantum_assessment: { type: 'string' },
          legal_framework: { type: 'string' },
          recommended_actions: { type: 'array', items: { type: 'string' } },
          risk_assessment: { type: 'string' },
          applicable_statutes: { type: 'array', items: { type: 'string' } },
          strengths: { type: 'array', items: { type: 'string' } },
          weaknesses: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    // Save narrative back to case
    await base44.entities.LegalCase.update(case_id, {
      ai_narrative: JSON.stringify(narrative),
      narrative_generated_at: new Date().toISOString()
    });

    return Response.json({ success: true, narrative, case_ref: legalCase.case_ref });
  } catch (error) {
    console.error('generateLegalNarrative error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});