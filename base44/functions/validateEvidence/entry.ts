import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { evidence, communications, incidents } = await req.json();

    if (!evidence || evidence.length === 0) {
      return Response.json({ error: 'Evidence is required' }, { status: 400 });
    }

    // Build validation prompt
    const evidenceSummary = evidence.map(e =>
      `- ${e.title} (${e.evidence_type}, ${e.date_collected}): ${e.description || 'N/A'}`
    ).join('\n');

    const communicationsSummary = communications.map(c =>
      `- ${c.date}: ${c.subject} (${c.type}, from ${c.from} to ${c.to})\n  Tone: ${c.tone}\n  Content: ${c.content || 'N/A'}`
    ).join('\n');

    const incidentsSummary = incidents.map(i =>
      `- ${i.date}: ${i.title} (${i.incident_type}, severity: ${i.severity})\n  Description: ${i.description}\n  RICS Violations: ${(i.rics_violations || []).join(', ')}\n  Legal Issues: ${(i.legal_issues || []).join(', ')}`
    ).join('\n');

    const prompt = `You are an expert legal evidence validator for RICS regulatory matters. Analyze the following evidence, communications, and incidents to identify validation issues.

EVIDENCE DOCUMENTS:
${evidenceSummary}

COMMUNICATIONS:
${communicationsSummary}

INCIDENTS REPORTED:
${incidentsSummary}

Perform the following validations:
1. MISSING DOCUMENTATION: Identify any evidence that should exist based on RICS requirements but is missing
2. TIMELINE VERIFICATION: Check all dates are in logical sequence and flag any inconsistencies
3. COMMUNICATION-INCIDENT ALIGNMENT: Flag any contradictions or discrepancies between communications and incident reports
4. RICS COMPLIANCE: Verify evidence supports the claimed RICS violations
5. EVIDENCE STRENGTH: Assess the strength and relevance of evidence to claims

Return a JSON response with this structure:
{
  "issues": [
    {
      "id": "unique_id",
      "type": "missing|sequence|contradiction|compliance|evidence_gap",
      "severity": "critical|high|medium|low",
      "title": "Issue title",
      "description": "Detailed description",
      "evidence": "Supporting details from the submission",
      "recommendation": "How to resolve this issue",
      "relatedItems": ["list of document/communication/incident references"]
    }
  ],
  "documentsAnalyzed": number,
  "ricsRequirementsChecked": number,
  "timelineIntegrity": boolean,
  "communicationAlignment": boolean
}`;

    const validationData = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                severity: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                evidence: { type: 'string' },
                recommendation: { type: 'string' },
                relatedItems: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          documentsAnalyzed: { type: 'number' },
          ricsRequirementsChecked: { type: 'number' },
          timelineIntegrity: { type: 'boolean' },
          communicationAlignment: { type: 'boolean' }
        }
      }
    });

    // Add manual timeline verification
    const allDates = [
      ...evidence.map(e => ({ date: e.date_collected, type: 'evidence', title: e.title })),
      ...communications.map(c => ({ date: c.date, type: 'communication', title: c.subject })),
      ...incidents.map(i => ({ date: i.date, type: 'incident', title: i.title }))
    ];

    const sortedDates = [...allDates].sort((a, b) => new Date(a.date) - new Date(b.date));
    let timelineIntegrity = true;

    // Check for future-dated items before incidents
    for (let i = 0; i < sortedDates.length - 1; i++) {
      if (sortedDates[i].type === 'evidence' && sortedDates[i + 1].type === 'incident') {
        const timeDiff = new Date(sortedDates[i + 1].date) - new Date(sortedDates[i].date);
        if (timeDiff < 0) {
          timelineIntegrity = false;
          validationData.issues.push({
            id: `timeline_${i}`,
            type: 'sequence',
            severity: 'high',
            title: 'Timeline Inconsistency',
            description: `Evidence "${sortedDates[i].title}" is dated ${sortedDates[i].date} but incident "${sortedDates[i + 1].title}" occurred earlier on ${sortedDates[i + 1].date}`,
            evidence: 'Date mismatch between evidence collection and incident occurrence',
            recommendation: 'Verify evidence dates are accurate or adjust incident dates',
            relatedItems: [sortedDates[i].title, sortedDates[i + 1].title]
          });
        }
      }
    }

    // Check for missing corroborating evidence
    const hasSignificantCommunications = communications.length > 0;
    const hasSupportingEvidence = evidence.length > 0;

    if (!hasSupportingEvidence && incidents.length > 0) {
      validationData.issues.unshift({
        id: 'missing_evidence_support',
        type: 'missing',
        severity: 'critical',
        title: 'No Supporting Evidence Found',
        description: 'Incidents are reported but no corroborating documentary evidence has been uploaded',
        evidence: `${incidents.length} incident(s) with 0 supporting evidence documents`,
        recommendation: 'Upload documentary evidence supporting each incident (emails, photos, reports, etc.)',
        relatedItems: incidents.map(i => i.title)
      });
    }

    return Response.json({
      success: true,
      data: {
        issues: validationData.issues || [],
        documentsAnalyzed: evidence.length + communications.length,
        ricsRequirementsChecked: validationData.ricsRequirementsChecked || 8,
        timelineIntegrity: validationData.timelineIntegrity && timelineIntegrity,
        communicationAlignment: validationData.communicationAlignment || true
      }
    });
  } catch (error) {
    console.error('Error validating evidence:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});