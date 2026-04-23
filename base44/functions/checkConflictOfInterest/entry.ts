import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { witnessName, documentContent, incidentId } = await req.json();

    if (!witnessName && !documentContent) {
      return Response.json({ error: 'Witness name or document content required' }, { status: 400 });
    }

    // Fetch all incidents and case parties
    const allIncidents = await base44.asServiceRole.entities.Incident.list('-updated_date', 100);
    const allParties = await base44.asServiceRole.entities.CaseParty.list('-updated_date', 200);
    const allCases = await base44.asServiceRole.entities.LegalCase.list('-updated_date', 100);

    // Build context of existing participants
    const existingParticipants = allParties.map(p => `${p.name} (${p.party_type})`).join(', ');
    const existingCaseClients = allCases.map(c => `${c.client_name} vs ${c.opponent_name}`).join(' | ');
    const incidentWitnesses = allIncidents.flatMap(i => i.witnesses || []).join(', ');

    // Use AI to detect conflicts
    const analysisPrompt = `You are a professional conduct and conflict of interest analyzer for legal cases.

Analyze the following for potential professional conduct breaches and conflicts of interest:

NEW WITNESS/PARTICIPANT: ${witnessName || 'N/A'}
DOCUMENT SNIPPET: ${documentContent?.substring(0, 500) || 'N/A'}

EXISTING CASE PARTICIPANTS:
${existingParticipants}

EXISTING LEGAL CASES:
${existingCaseClients}

EXISTING INCIDENT WITNESSES:
${incidentWitnesses}

RULES TO CHECK:
- Direct involvement in opposing parties (conflict of interest)
- Dual representation conflicts
- Prior relationships with other parties in cases
- Business relationships with litigants
- Connections to organizations involved
- Name similarity or potential impersonation
- Professional conduct rule violations (RICS standards)

Return a JSON object with:
{
  "conflicts_detected": boolean,
  "severity": "low|medium|high|critical",
  "conflicts": [
    {
      "type": "string describing conflict type",
      "details": "specific details",
      "related_party": "name of conflicted party",
      "rule_violated": "potential RICS/legal rule"
    }
  ],
  "recommendations": ["list of actions to take"],
  "confidence_score": number 0-100
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          conflicts_detected: { type: 'boolean' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          conflicts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                details: { type: 'string' },
                related_party: { type: 'string' },
                rule_violated: { type: 'string' }
              }
            }
          },
          recommendations: { type: 'array', items: { type: 'string' } },
          confidence_score: { type: 'number' }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: response,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Conflict check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});