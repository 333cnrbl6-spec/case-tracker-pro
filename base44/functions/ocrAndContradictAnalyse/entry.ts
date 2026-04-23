import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { file_url, file_name } = await req.json();
  if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

  // Step 1: OCR – extract raw text from the uploaded document
  const ocrResult = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert document analyst. Extract ALL text content from this document/image.
Return a JSON object with:
- "extracted_text": the full verbatim text extracted from the document
- "document_summary": a concise 2-3 sentence summary of what the document contains
- "key_facts": array of the most important factual statements (dates, figures, names, assessments, decisions)
- "dates_mentioned": array of any dates found (ISO format where possible)
- "people_mentioned": array of any person or organisation names found
- "document_type": your best guess at the document type (e.g. survey report, email, letter, contract, valuation)

File name hint: ${file_name || 'unknown'}`,
    file_urls: [file_url],
    response_json_schema: {
      type: 'object',
      properties: {
        extracted_text: { type: 'string' },
        document_summary: { type: 'string' },
        key_facts: { type: 'array', items: { type: 'string' } },
        dates_mentioned: { type: 'array', items: { type: 'string' } },
        people_mentioned: { type: 'array', items: { type: 'string' } },
        document_type: { type: 'string' },
      },
    },
  });

  // Step 2: Fetch existing incidents and communications to cross-reference
  const [incidents, communications] = await Promise.all([
    base44.entities.Incident.list(),
    base44.entities.Communication.list(),
  ]);

  const incidentDigest = incidents.slice(0, 20).map((r, i) =>
    `INCIDENT ${i + 1} [ID:${r.id}] — "${r.title}" (${r.date}) — Severity: ${r.severity} — ${r.description || ''}${r.evidence_notes ? ' | Evidence notes: ' + r.evidence_notes : ''}`
  ).join('\n');

  const commDigest = communications.slice(0, 20).map((r, i) =>
    `COMMUNICATION ${i + 1} [ID:${r.id}] — Subject: "${r.subject}" (${r.date}) — From: ${r.from} → To: ${r.to} — Tone: ${r.tone} — ${r.content ? r.content.slice(0, 300) : ''}`
  ).join('\n');

  // Step 3: Contradiction & cross-reference analysis
  const analysis = await base44.integrations.Core.InvokeLLM({
    model: 'claude_sonnet_4_6',
    prompt: `You are a RICS compliance expert and legal analyst performing a document cross-reference audit.

UPLOADED DOCUMENT:
Type: ${ocrResult.document_type}
Summary: ${ocrResult.document_summary}
Key Facts:
${(ocrResult.key_facts || []).map((f, i) => `  ${i + 1}. ${f}`).join('\n')}

Full Extracted Text (first 3000 chars):
${(ocrResult.extracted_text || '').slice(0, 3000)}

---
EXISTING INCIDENTS ON FILE:
${incidentDigest || 'None recorded.'}

EXISTING COMMUNICATIONS ON FILE:
${commDigest || 'None recorded.'}

---
TASK: Carefully cross-reference the uploaded document against every existing incident and communication.

Return a JSON object with:
- "contradictions": array of objects, each with:
    - "type": "incident" | "communication"
    - "record_id": the ID from above (e.g. the [ID:xxx] value)
    - "record_title": human-readable title/subject
    - "contradiction_summary": clear 1-2 sentence description of the contradiction
    - "document_claim": the exact or paraphrased claim from the uploaded document
    - "existing_claim": the exact or paraphrased claim from the existing record
    - "severity": "minor" | "moderate" | "significant" | "critical"
    - "legal_significance": brief note on why this matters legally or for RICS compliance
- "corroborations": array of objects where the document SUPPORTS or CONFIRMS existing records:
    - "type": "incident" | "communication"
    - "record_id": string
    - "record_title": string
    - "corroboration_summary": what the document confirms
- "new_facts": array of strings — important facts in the document NOT referenced in any existing record
- "rics_flags": array of strings — potential RICS code violations evidenced by this document
- "overall_assessment": a 2-3 sentence expert assessment of the document's significance to this case`,
    response_json_schema: {
      type: 'object',
      properties: {
        contradictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              record_id: { type: 'string' },
              record_title: { type: 'string' },
              contradiction_summary: { type: 'string' },
              document_claim: { type: 'string' },
              existing_claim: { type: 'string' },
              severity: { type: 'string' },
              legal_significance: { type: 'string' },
            },
          },
        },
        corroborations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              record_id: { type: 'string' },
              record_title: { type: 'string' },
              corroboration_summary: { type: 'string' },
            },
          },
        },
        new_facts: { type: 'array', items: { type: 'string' } },
        rics_flags: { type: 'array', items: { type: 'string' } },
        overall_assessment: { type: 'string' },
      },
    },
  });

  return Response.json({
    ocr: ocrResult,
    analysis,
  });
});