import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { evidence_id, file_url } = await req.json();

    // Use ExtractDataFromUploadedFile for larger PDFs
    const extractResult = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url: file_url,
      json_schema: {
        type: 'object',
        properties: {
          raw_text: { type: 'string', description: 'All text content extracted from the document' },
          dates_found: { type: 'array', items: { type: 'string' }, description: 'All dates mentioned' },
          names_found: { type: 'array', items: { type: 'string' }, description: 'All person/company names' },
          amounts_found: { type: 'array', items: { type: 'string' }, description: 'All financial amounts' },
          document_types: { type: 'array', items: { type: 'string' }, description: 'Types of documents present' }
        }
      }
    });

    const rawContent = extractResult.status === 'success' ? JSON.stringify(extractResult.output) : 'Could not extract text';

    // Use AI to analyse the extracted content
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a legal case analyst reviewing evidence for a professional misconduct case against a RICS surveyor (Sean Powell / Belcher). 

Here is the extracted content from a scanned PDF document bundle:

${rawContent}

Based on this content, provide a thorough legal analysis. The PDF may contain multiple different pieces of evidence mixed together (invoices, emails, letters, photos descriptions, valuations, contracts etc).

Return structured JSON with:
1. A clear, professional title
2. The actual document date (YYYY-MM-DD, look for dates IN the content, not today)
3. A detailed description of ALL content - list every separate item if it's a bundle
4. evidence_type: one of: document, communication, report, valuation, contract, witness_statement, photograph, recording_transcript, other
5. relevance: one of: rics_violation, legal_violation, pattern, credibility, context, other
6. strength: one of: weak, moderate, strong, critical
7. Detailed notes with financial amounts, names, addresses, significance to the case
8. contains_multiple_documents (true/false)
9. sub_documents array if it's a bundle`,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          date_collected: { type: 'string', description: 'YYYY-MM-DD format, the actual document date' },
          description: { type: 'string' },
          evidence_type: { type: 'string' },
          relevance: { type: 'string' },
          strength: { type: 'string' },
          notes: { type: 'string' },
          contains_multiple_documents: { type: 'boolean' },
          sub_documents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                date: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string' },
                significance: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Update the evidence record with the analysis
    await base44.asServiceRole.entities.Evidence.update(evidence_id, {
      title: analysis.title,
      date_collected: analysis.date_collected,
      description: analysis.description,
      evidence_type: analysis.evidence_type,
      relevance: analysis.relevance,
      strength: analysis.strength,
      notes: analysis.notes + (analysis.contains_multiple_documents ? `\n\n⚠️ BUNDLE: This PDF contains multiple documents. Sub-items:\n${analysis.sub_documents?.map((d, i) => `${i+1}. ${d.title} (${d.date}): ${d.description}`).join('\n')}` : '')
    });

    return Response.json({ 
      success: true, 
      analysis,
      evidence_id
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});