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

    // Generate structured narrative using LLM
    const narrativePrompt = `You are an expert legal counsel. Based on the following case information, generate a comprehensive, structured legal narrative for a case brief/summary report for partner review.

${caseContext}

Please generate a JSON response with this exact structure:
{
  "executive_summary": "A 2-3 sentence summary of the case",
  "case_overview": {
    "title": "Case title",
    "type": "Type of case",
    "client": "Client name",
    "opponent": "Opponent name",
    "value": "Estimated/settled value",
    "status": "Current status"
  },
  "background_and_facts": "Detailed chronological narrative of facts leading to the claim",
  "key_parties": [
    {
      "name": "Party name",
      "role": "Their role in the case",
      "significance": "Why they are significant"
    }
  ],
  "liability_analysis": "Analysis of liability issues, breaches, and responsibilities",
  "key_evidence": [
    {
      "description": "What the evidence shows",
      "type": "Type of evidence",
      "strength": "How compelling it is",
      "impact": "Its impact on the case"
    }
  ],
  "communication_pattern": "Analysis of communications between parties, tone, and implications",
  "damages_assessment": "Assessment of quantum/damages claim",
  "legal_issues": [
    {
      "issue": "The legal issue",
      "analysis": "How it applies to this case",
      "risk": "Risk level (low/medium/high)"
    }
  ],
  "strengths": ["Key case strengths"],
  "weaknesses": ["Key vulnerabilities"],
  "risks": ["Identified risks"],
  "next_steps": ["Recommended actions"],
  "partner_review_notes": "Any special notes for partner review"
}`;

    const narrativeResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: narrativePrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          case_overview: { type: 'object' },
          background_and_facts: { type: 'string' },
          key_parties: { type: 'array' },
          liability_analysis: { type: 'string' },
          key_evidence: { type: 'array' },
          communication_pattern: { type: 'string' },
          damages_assessment: { type: 'string' },
          legal_issues: { type: 'array' },
          strengths: { type: 'array' },
          weaknesses: { type: 'array' },
          risks: { type: 'array' },
          next_steps: { type: 'array' },
          partner_review_notes: { type: 'string' },
        },
      },
    });

    // Save narrative to case record
    await base44.entities.LegalCase.update(case_id, {
      ai_narrative: JSON.stringify(narrativeResult),
      narrative_generated_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      case_ref: legalCase.case_ref,
      narrative: narrativeResult,
      generated_at: new Date().toISOString(),
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