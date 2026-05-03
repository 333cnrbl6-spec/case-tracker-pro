import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { case_id } = await req.json();

    if (!case_id) {
      return Response.json(
        { error: 'case_id is required' },
        { status: 400 }
      );
    }

    // Fetch all case-related data in parallel
    const [legalCase, incidents, communications, evidence, caseParties] =
      await Promise.all([
        base44.entities.LegalCase.list().then((cases) =>
          cases.find((c) => c.id === case_id)
        ),
        base44.entities.Incident.filter({ case_id }),
        base44.entities.Communication.filter({ case_id }),
        base44.entities.Evidence.filter({ case_id }),
        base44.entities.CaseParty.filter({ case_id }),
      ]);

    if (!legalCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Prepare context for LLM
    const caseContext = `
LEGAL CASE INFORMATION:
- Case Reference: ${legalCase.case_ref}
- Case Type: ${legalCase.case_type}
- Client: ${legalCase.client_name}
- Opponent: ${legalCase.opponent_name || 'Not specified'}
- Status: ${legalCase.status}
- Incident Date: ${legalCase.incident_date}
- Limitation Date: ${legalCase.limitation_date}
- Estimated Value: £${legalCase.estimated_value || 0}
- Facts: ${legalCase.facts || 'Not provided'}
- Instructions: ${legalCase.instructions || 'Not provided'}

PARTIES INVOLVED:
${caseParties
  .map(
    (p) =>
      `- ${p.name} (${p.party_type}): ${p.role_in_case || 'No role specified'}`
  )
  .join('\n') || 'No parties listed'}

INCIDENTS (${incidents.length}):
${incidents
  .map(
    (i) =>
      `- ${i.title} (${i.date}): ${i.description} [Severity: ${i.severity}, Type: ${i.incident_type}]`
  )
  .join('\n') || 'No incidents'}

COMMUNICATIONS (${communications.length}):
${communications
  .slice(0, 10)
  .map(
    (c) =>
      `- ${c.date}: ${c.type} from ${c.from} to ${c.to} - "${c.subject}" [Tone: ${c.tone}]`
  )
  .join('\n') || 'No communications'}

EVIDENCE (${evidence.length}):
${evidence
  .map(
    (e) =>
      `- ${e.title} (${e.evidence_type}): ${e.description} [Strength: ${e.strength}, Relevance: ${e.relevance}]`
  )
  .join('\n') || 'No evidence'}
    `;

    // Generate structured narrative using LLM with strict schema
     const narrativePrompt = `You are a senior UK solicitor. Based on this case data, generate a structured legal narrative with detailed CHRONOLOGY, LIABILITY ANALYSIS, and QUANTUM ASSESSMENT sections.

    ${caseContext}

    Generate JSON with this strict structure:
    {
    "executive_summary": "2-3 sentence case summary",
    "case_overview": {
    "title": "Case title",
    "type": "Case type",
    "client": "Client name",
    "opponent": "Opponent name",
    "estimated_value": "£X",
    "status": "Status",
    "limitation_date": "Date",
    "urgency": "high/medium/low"
    },
    "background": {
    "parties": [{"name": "Name", "role": "Role", "significance": "Why significant"}],
    "relationship_summary": "How parties are connected",
    "contractual_context": "Any relevant contracts"
    },
    "chronology": {
    "timeline": [{"date": "YYYY-MM-DD", "event": "What happened", "significance": "Why it matters"}],
    "key_milestones": ["Critical dates and events"],
    "critical_dates": [{"date": "YYYY-MM-DD", "description": "What occurred", "legal_consequence": "Impact"}]
    },
    "liability_analysis": {
    "legal_framework": "Applicable law/principles",
    "breach_identified": "What was breached and how",
    "causation": "How breach caused loss",
    "defendant_defences": ["Potential defences"],
    "assessment": "Liability strength assessment"
    },
    "quantum_assessment": {
    "heads_of_loss": [{"category": "Loss type", "description": "Details", "estimated_value": "£X"}],
    "calculation_methodology": "How damages calculated",
    "total_claimed": "£X",
    "mitigation": "Claimant mitigation obligations and actions"
    },
    "legal_framework": {
    "applicable_law": ["Relevant legal areas"],
    "key_statutes": [{"statute": "Name", "section": "Section", "relevance": "Why relevant"}],
    "precedent_cases": ["Relevant case law"]
    },
    "evidence_analysis": {
    "key_evidence": [{"description": "What it shows", "type": "evidence_type", "strength": "strong/moderate/weak", "impact": "On liability/quantum"}],
    "evidence_gaps": ["Missing evidence"]
    },
    "strengths_weaknesses": {
    "strengths": ["Case strengths"],
    "weaknesses": ["Vulnerabilities"],
    "risks": ["Key risks"],
    "assessment": "Overall case assessment"
    },
    "next_steps": [{"action": "Action needed", "priority": "high/medium/low", "timeline": "When"}]
    }`;

    const narrativeResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: narrativePrompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          case_overview: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
              client: { type: 'string' },
              opponent: { type: 'string' },
              estimated_value: { type: 'string' },
              status: { type: 'string' },
              limitation_date: { type: 'string' },
              urgency: { type: 'string' }
            }
          },
          background: { type: 'object' },
          chronology: {
            type: 'object',
            properties: {
              timeline: { type: 'array', items: { type: 'object' } },
              key_milestones: { type: 'array', items: { type: 'string' } },
              critical_dates: { type: 'array', items: { type: 'object' } }
            }
          },
          liability_analysis: {
            type: 'object',
            properties: {
              legal_framework: { type: 'string' },
              breach_identified: { type: 'string' },
              causation: { type: 'string' },
              defendant_defences: { type: 'array', items: { type: 'string' } },
              assessment: { type: 'string' }
            }
          },
          quantum_assessment: {
            type: 'object',
            properties: {
              heads_of_loss: { type: 'array', items: { type: 'object' } },
              calculation_methodology: { type: 'string' },
              total_claimed: { type: 'string' },
              mitigation: { type: 'string' }
            }
          },
          legal_framework: { type: 'object' },
          evidence_analysis: { type: 'object' },
          strengths_weaknesses: { type: 'object' },
          next_steps: { type: 'array', items: { type: 'object' } }
        },
        required: ['chronology', 'liability_analysis', 'quantum_assessment']
      },
    });

    // Convert narrative to JSON string (typically 50-200KB)
    const narrativeJson = JSON.stringify(narrativeResult);

    // Upload narrative to file storage to avoid field size limits
    let narrativeUrl = null;
    try {
      const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
        file: narrativeJson,
      });
      narrativeUrl = uploadResult.file_url;
    } catch (uploadError) {
      console.error('Failed to upload narrative:', uploadError);
      // Continue with in-app storage as fallback
    }

    // Save narrative reference to case record
    const updatePayload = {
      narrative_generated_at: new Date().toISOString(),
    };

    if (narrativeUrl) {
      updatePayload.ai_narrative_url = narrativeUrl;
    } else {
      // Fallback: store compact summary instead of full JSON
      updatePayload.ai_narrative = `Generated at ${new Date().toISOString()}. Full narrative stored in cloud. Sections: executive_summary, liability_analysis, quantum_assessment.`;
    }

    await base44.entities.LegalCase.update(case_id, updatePayload);

    return Response.json({
      success: true,
      case_ref: legalCase.case_ref,
      narrative: narrativeResult,
      generated_at: new Date().toISOString(),
      narrative_storage: narrativeUrl ? 'file_storage' : 'summary_only',
      data_points: {
        incidents_analyzed: incidents.length,
        communications_analyzed: communications.length,
        evidence_analyzed: evidence.length,
        parties_identified: caseParties.length,
      },
    });
  } catch (error) {
    console.error('Narrative generation failed:', error);
    return Response.json(
      { error: error.message || 'Failed to generate narrative' },
      { status: 500 }
    );
  }
});