import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { witness_statement_ids, evidence_ids, case_id } = body;

    if (!witness_statement_ids || !evidence_ids) {
      return Response.json(
        { error: 'Missing witness_statement_ids or evidence_ids' },
        { status: 400 }
      );
    }

    // Fetch witness statements and evidence
    const witnessStatements = await Promise.all(
      witness_statement_ids.map(id => base44.entities.Communication.read(id))
    );

    const evidenceItems = await Promise.all(
      evidence_ids.map(id => base44.entities.Evidence.read(id))
    );

    // Prepare data for LLM analysis
    const statementsText = witnessStatements
      .map(s => `From: ${s.from}\nDate: ${s.date}\nContent: ${s.content}\n`)
      .join('\n---\n');

    const evidenceText = evidenceItems
      .map(e => `Title: ${e.title}\nDate: ${e.date_collected}\nDescription: ${e.description}\nNotes: ${e.notes || ''}\n`)
      .join('\n---\n');

    const prompt = `You are a legal analyst specialized in detecting factual inconsistencies and timeline conflicts.

Analyze the following witness statements against the provided evidence documents. Identify:
1. **Date/Timeline Conflicts**: Any inconsistencies in dates, timelines, or sequences of events
2. **Factual Contradictions**: Statements that contradict facts stated in evidence
3. **Missing or Unverified Claims**: Witness claims not supported by any evidence
4. **Corroborations**: Where witness statements align with evidence (positive findings)

WITNESS STATEMENTS:
${statementsText}

EVIDENCE DOCUMENTS:
${evidenceText}

Provide a structured JSON response with the following format:
{
  "contradictions": [
    {
      "type": "date_conflict" | "factual_contradiction" | "unverified_claim",
      "severity": "low" | "moderate" | "high" | "critical",
      "witness_source": "name/identifier of witness",
      "statement_excerpt": "exact quote from witness statement",
      "conflicting_evidence": "description of conflicting evidence or missing corroboration",
      "dates_involved": ["date1", "date2"],
      "legal_significance": "brief explanation of why this matters"
    }
  ],
  "corroborations": [
    {
      "witness_source": "name",
      "corroborated_fact": "description",
      "supporting_evidence": "which evidence supports this",
      "confidence": "high" | "moderate"
    }
  ],
  "summary": {
    "total_contradictions": number,
    "critical_issues": number,
    "overall_reliability_score": 0-100,
    "key_risks": ["risk1", "risk2"]
  }
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          contradictions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                severity: { type: 'string' },
                witness_source: { type: 'string' },
                statement_excerpt: { type: 'string' },
                conflicting_evidence: { type: 'string' },
                dates_involved: { type: 'array', items: { type: 'string' } },
                legal_significance: { type: 'string' }
              }
            }
          },
          corroborations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                witness_source: { type: 'string' },
                corroborated_fact: { type: 'string' },
                supporting_evidence: { type: 'string' },
                confidence: { type: 'string' }
              }
            }
          },
          summary: {
            type: 'object',
            properties: {
              total_contradictions: { type: 'number' },
              critical_issues: { type: 'number' },
              overall_reliability_score: { type: 'number' },
              key_risks: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    });

    // Store analysis result if case_id provided
    if (case_id) {
      await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Log this contradiction analysis for case tracking. Case: ${case_id}`
      });
    }

    return Response.json({
      analysis: result,
      timestamp: new Date().toISOString(),
      witness_count: witness_statement_ids.length,
      evidence_count: evidence_ids.length
    });

  } catch (error) {
    console.error('Witness contradiction analysis failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});