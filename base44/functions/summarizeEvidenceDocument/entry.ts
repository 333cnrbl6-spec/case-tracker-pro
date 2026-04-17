import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { evidence_id, file_url, evidence_title, evidence_type } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url required' }, { status: 400 });
    }

    // Use InvokeLLM with the file to generate summary
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a legal document analyzer. Analyze this ${evidence_type || 'evidence'} document titled "${evidence_title}".

Provide a structured summary in the following format:

EXECUTIVE SUMMARY:
[2-3 sentence overview of the document's key content]

KEY POINTS:
- [Point 1]
- [Point 2]
- [Point 3]
- [Point 4 if applicable]

IMPORTANT DATES:
[List any significant dates mentioned (e.g., "Date of incident: 15 March 2024", "Email sent: 22 April 2024")]

POTENTIAL RICS RULE VIOLATIONS:
[Identify any conduct that might breach RICS Professional Standards]

RELEVANCE TO CASE:
[Explain how this evidence supports the case against Malcolm Belcher]

CREDIBILITY & STRENGTH:
[Assess the evidentiary strength - is it direct evidence, corroborating, circumstantial?]`,
      file_urls: [file_url],
      add_context_from_internet: false,
      model: 'gemini_3_flash'
    });

    return Response.json({
      success: true,
      summary: response,
      evidence_id,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error summarizing evidence:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});