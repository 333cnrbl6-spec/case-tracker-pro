import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { fileUrl, fileName } = await req.json();

    if (!fileUrl || !fileName) {
      return Response.json({ error: 'fileUrl and fileName required' }, { status: 400 });
    }

    // Step 1: Extract content from document using LLM
    const extractionPrompt = `You are a legal document analyzer. Analyze this document and extract:
1. Document title
2. Content summary (2-3 sentences)
3. Evidence type (document, communication, report, valuation, contract, witness_statement, photograph, recording_transcript, or other)
4. Relevance (rics_violation, legal_violation, pattern, credibility, context, or other)
5. Key findings (list of critical points)

Return ONLY valid JSON with these exact fields: title, description, evidence_type, relevance, key_findings`;

    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: extractionPrompt,
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          evidence_type: { type: 'string' },
          relevance: { type: 'string' },
          key_findings: { type: 'array', items: { type: 'string' } }
        },
        required: ['title', 'description', 'evidence_type']
      }
    });

    // Step 2: Get all incidents to match potential incident IDs
    const incidents = await base44.asServiceRole.entities.Incident.list('-updated_date', 100);

    // Step 3: Use LLM to identify related incidents and severity
    const matchingPrompt = `Given these incidents:
${incidents.map((i, idx) => `${idx + 1}. [ID: ${i.id}] ${i.title} - Type: ${i.incident_type} - Severity: ${i.severity}`).join('\n')}

And this document content:
Title: ${extractionResult.title}
Description: ${extractionResult.description}
Key findings: ${extractionResult.key_findings?.join('; ') || 'None'}

1. List the TOP 3 most relevant incident IDs (or "none" if no matches)
2. Determine appropriate severity level (low, medium, high, critical) based on content
3. Provide a brief reason for each match

Return ONLY valid JSON with: related_incident_ids (array), severity (string), severity_reason (string)`;

    const matchResult = await base44.integrations.Core.InvokeLLM({
      prompt: matchingPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          related_incident_ids: { type: 'array', items: { type: 'string' } },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          severity_reason: { type: 'string' }
        },
        required: ['related_incident_ids', 'severity']
      }
    });

    // Step 4: Validate incident IDs exist
    const validIncidentIds = [];
    if (matchResult.related_incident_ids && matchResult.related_incident_ids.length > 0) {
      for (const incId of matchResult.related_incident_ids) {
        if (incId && incId !== 'none') {
          try {
            await base44.asServiceRole.entities.Incident.get(incId);
            validIncidentIds.push(incId);
          } catch {
            // Incident not found, skip
          }
        }
      }
    }

    // Step 5: Determine strength based on evidence type and findings count
    let strength = 'moderate';
    if (extractionResult.evidence_type === 'communication' || extractionResult.evidence_type === 'contract') {
      strength = 'strong';
    } else if (extractionResult.evidence_type === 'photograph' || extractionResult.evidence_type === 'witness_statement') {
      strength = 'strong';
    } else if (extractionResult.evidence_type === 'report') {
      strength = extractionResult.key_findings?.length >= 3 ? 'strong' : 'moderate';
    } else if (extractionResult.evidence_type === 'other') {
      strength = 'weak';
    }

    return Response.json({
      success: true,
      title: extractionResult.title,
      description: extractionResult.description,
      evidence_type: extractionResult.evidence_type,
      relevance: extractionResult.relevance,
      strength,
      related_incidents: validIncidentIds,
      severity: matchResult.severity,
      severity_reason: matchResult.severity_reason,
      key_findings: extractionResult.key_findings || [],
      confidence_score: 85
    });
  } catch (error) {
    console.error('Auto-tagging error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});