import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
// Import compliance standards - using inline constants to avoid cross-file imports in Deno
const AI_MODELS = {
  PROFESSIONAL_DOCUMENTS: "claude_sonnet_4_6",
  COMPLEX_ANALYSIS: "claude_opus_4_6",
  WEB_SEARCH: "gemini_3_1_pro",
  SIMPLE_TASKS: "automatic",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { case_id } = await req.json();
    if (!case_id) return Response.json({ error: 'case_id required' }, { status: 400 });

    // Fetch case data in parallel — incidents/comms/evidence are global for now
    // (no case_id FK on those entities yet)
    const [caseRecords, incidents, communications, evidence] = await Promise.all([
      base44.entities.LegalCase.filter({ id: case_id }),
      base44.entities.Incident.list('-date', 50),
      base44.entities.Communication.list('-date', 30),
      base44.entities.Evidence.list('-date_collected', 30)
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

    // 🏛️ COMPLIANCE STANDARD: Use claude_sonnet_4_6 for professional legal documents
    const narrative = await base44.integrations.Core.InvokeLLM({
      model: AI_MODELS.PROFESSIONAL_DOCUMENTS, // claude_sonnet_4_6 - highest quality for legal work
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
          weaknesses: { type: 'array', items: { type: 'string' } },
          compliance_status: { type: 'string', enum: ["compliant", "review_required", "non_compliant"] },
          confidence_score: { type: 'number', minimum: 0, maximum: 1 }
        },
        required: ['background_parties', 'chronology', 'liability_analysis', 'recommended_actions', 'confidence_score']
      }
    });

    // Audit trail logging - COMPLIANCE REQUIREMENT
    console.log(`[AUDIT] GENERATE | LegalCase:${case_id} | ${user.email} | model:${AI_MODELS.PROFESSIONAL_DOCUMENTS} | type:ai_narrative`);

    // Save narrative JSON to case record
    const narrativeJson = JSON.stringify(narrative);
    await base44.entities.LegalCase.update(case_id, {
      ai_narrative: narrativeJson,
      narrative_generated_at: new Date().toISOString()
    });

    return Response.json({ success: true, narrative, case_ref: legalCase.case_ref });
  } catch (error) {
    console.error('generateLegalNarrative error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});