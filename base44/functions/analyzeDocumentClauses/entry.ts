import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { case_id, document_name, document_type, file_url } = await req.json();

    if (!case_id || !document_name || !document_type || !file_url) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract text from document using LLM integration
    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the following legal document and extract key information:

DOCUMENT TYPE: ${document_type}
DOCUMENT NAME: ${document_name}

Please extract and structure the following in JSON format:
1. key_clauses: Array of important clauses with clause_type, text, and relevance_score (0-100)
2. key_dates: Array of important dates with date, description, and obligation_type
3. obligations: Array of obligations identifying party, obligation text, deadline, and status
4. parties: Array of parties mentioned in the document
5. summary: Brief executive summary of the document
6. risk_flags: Array of identified risks or concerning clauses
7. extracted_text: The full extracted text from the document

Response must be valid JSON with these exact keys.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          key_clauses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clause_type: { type: "string" },
                text: { type: "string" },
                page_reference: { type: "number" },
                relevance_score: { type: "number" }
              }
            }
          },
          key_dates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                description: { type: "string" },
                obligation_type: { type: "string" }
              }
            }
          },
          obligations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                party: { type: "string" },
                obligation: { type: "string" },
                deadline: { type: "string" },
                status: { type: "string" }
              }
            }
          },
          parties: {
            type: "array",
            items: { type: "string" }
          },
          summary: { type: "string" },
          risk_flags: {
            type: "array",
            items: { type: "string" }
          },
          extracted_text: { type: "string" }
        },
        required: ["key_clauses", "key_dates", "obligations", "parties", "summary", "risk_flags", "extracted_text"]
      }
    });

    // Create document analysis record
    const analysis = await base44.entities.DocumentAnalysis.create({
      case_id,
      document_name,
      document_type,
      file_url,
      extracted_text: extractionResult.extracted_text || '',
      key_clauses: extractionResult.key_clauses || [],
      key_dates: extractionResult.key_dates || [],
      obligations: extractionResult.obligations || [],
      parties: extractionResult.parties || [],
      summary: extractionResult.summary || '',
      risk_flags: extractionResult.risk_flags || [],
      analysis_confidence: 85,
      tags: [document_type, ...extractionResult.parties.slice(0, 3)],
      analyzed_by: user.email
    });

    return Response.json({
      success: true,
      analysis_id: analysis.id,
      document_name,
      summary: analysis.summary,
      clauses_count: analysis.key_clauses.length,
      dates_count: analysis.key_dates.length,
      obligations_count: analysis.obligations.length,
      risk_flags_count: analysis.risk_flags.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});