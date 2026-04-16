import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { evidence_id, file_url, title } = await req.json();

    // Step 1: Extract raw content from PDF via AI vision
    const extraction = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a legal document analyst. Carefully read this PDF document and extract ALL content from it.

This is a fragment of a larger legal evidence bundle relating to a professional misconduct case involving a RICS surveyor.

For every distinct document, email, letter, report, invoice, photograph description, or record you can identify within this PDF, extract:
1. The document type (email, letter, invoice, report, photograph, contract, valuation, other)
2. Date (as precise as possible — day/month/year if visible, otherwise month/year or year only)
3. Who it is FROM
4. Who it is TO (if applicable)
5. Subject or title
6. Full content / key text verbatim where possible
7. Any monetary amounts mentioned
8. Any RICS, legal, or professional conduct issues it reveals
9. Strength as evidence: weak / moderate / strong / critical

Return a JSON object with this structure:
{
  "documents": [
    {
      "doc_type": "email|letter|invoice|report|photograph|contract|valuation|other",
      "date": "YYYY-MM-DD or YYYY-MM or YYYY or null",
      "from": "name or organisation",
      "to": "name or organisation or null",
      "subject": "brief subject line",
      "content": "full extracted text or detailed description",
      "monetary_amounts": ["£123", "£456"],
      "conduct_issues": ["specific issue identified"],
      "strength": "weak|moderate|strong|critical",
      "page_reference": "page X or pages X-Y within this fragment"
    }
  ],
  "fragment_summary": "2-3 sentence overview of what this fragment covers",
  "date_range": "earliest to latest date visible in this fragment",
  "key_parties": ["names of all people/organisations mentioned"]
}`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          documents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                doc_type: { type: "string" },
                date: { type: "string" },
                from: { type: "string" },
                to: { type: "string" },
                subject: { type: "string" },
                content: { type: "string" },
                monetary_amounts: { type: "array", items: { type: "string" } },
                conduct_issues: { type: "array", items: { type: "string" } },
                strength: { type: "string" },
                page_reference: { type: "string" }
              }
            }
          },
          fragment_summary: { type: "string" },
          date_range: { type: "string" },
          key_parties: { type: "array", items: { type: "string" } }
        }
      },
      model: "claude_sonnet_4_6"
    });

    // Step 2: Save extracted documents as Evidence records
    const savedRecords = [];
    for (const doc of (extraction.documents || [])) {
      const docTypeMap = {
        email: 'communication',
        letter: 'document',
        invoice: 'document',
        report: 'report',
        photograph: 'photograph',
        contract: 'contract',
        valuation: 'valuation',
        other: 'other'
      };

      const evidenceRecord = await base44.asServiceRole.entities.Evidence.create({
        date_collected: doc.date || new Date().toISOString().split('T')[0],
        title: doc.subject || `${doc.doc_type} — ${doc.from || 'Unknown'}`,
        description: doc.content?.substring(0, 1000) || '',
        evidence_type: docTypeMap[doc.doc_type] || 'document',
        file_url: file_url,
        relevance: doc.conduct_issues?.length > 0 ? 'rics_violation' : 'context',
        strength: doc.strength || 'moderate',
        notes: [
          doc.content && doc.content.length > 1000 ? `[Full content continues] ${doc.content.substring(1000)}` : '',
          doc.monetary_amounts?.length ? `Amounts: ${doc.monetary_amounts.join(', ')}` : '',
          doc.conduct_issues?.length ? `Conduct issues: ${doc.conduct_issues.join('; ')}` : '',
          doc.page_reference ? `Source: ${title} — ${doc.page_reference}` : `Source: ${title}`,
          doc.from ? `From: ${doc.from}` : '',
          doc.to ? `To: ${doc.to}` : '',
        ].filter(Boolean).join('\n')
      });

      savedRecords.push({ id: evidenceRecord.id, subject: doc.subject, date: doc.date });
    }

    // Step 3: Update the original evidence record with the fragment summary
    await base44.asServiceRole.entities.Evidence.update(evidence_id, {
      description: extraction.fragment_summary || 'Bundle fragment processed',
      notes: `PROCESSED FRAGMENT\nDate range: ${extraction.date_range || 'unknown'}\nKey parties: ${(extraction.key_parties || []).join(', ')}\nDocuments extracted: ${savedRecords.length}`
    });

    return Response.json({
      success: true,
      documents_extracted: savedRecords.length,
      fragment_summary: extraction.fragment_summary,
      date_range: extraction.date_range,
      key_parties: extraction.key_parties,
      saved_records: savedRecords
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});