import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import jsPDF from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId, templateType } = await req.json();

    if (!caseId || !templateType) {
      return Response.json({ error: 'Case ID and template type required' }, { status: 400 });
    }

    // Fetch case details
    const legalCase = await base44.entities.LegalCase.get(caseId);
    if (!legalCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Fetch related data
    const incidents = await base44.entities.Incident.filter({ case_id: caseId });
    const evidence = await base44.entities.Evidence.filter({ case_id: caseId });
    const communications = await base44.entities.Communication.filter({ case_id: caseId });
    const tasks = await base44.entities.IncidentTask.filter({ case_id: caseId });

    // Build context for LLM
    const caseContext = `
Case Reference: ${legalCase.case_ref}
Client: ${legalCase.client_name}
Client Email: ${legalCase.client_email}
Opponent: ${legalCase.opponent_name}
Case Type: ${legalCase.case_type}
Incident Date: ${legalCase.incident_date}
Limitation Date: ${legalCase.limitation_date}
Status: ${legalCase.status}
Facts: ${legalCase.facts}
Instructions: ${legalCase.instructions}
Estimated Value: £${legalCase.estimated_value || 0}

INCIDENTS (${incidents.length}):
${incidents.map(i => `- ${i.date}: ${i.title} (${i.severity} severity) - ${i.description}`).join('\n')}

KEY EVIDENCE (${evidence.length}):
${evidence.slice(0, 5).map(e => `- ${e.title} (${e.evidence_type}, ${e.strength} strength)`).join('\n')}

COMMUNICATIONS (${communications.length}):
${communications.slice(0, 5).map(c => `- ${c.date}: ${c.type} from ${c.from} to ${c.to} - "${c.subject}"`).join('\n')}
    `;

    // Generate document based on template type
    let documentContent = '';

    if (templateType === 'letter_of_claim') {
      documentContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional Letter of Claim for a legal case. The letter should:
1. Be formal and structured according to civil procedure rules
2. Set out the facts clearly and concisely
3. Reference relevant evidence
4. State the legal basis for the claim
5. Include a deadline for response (14 days)
6. Request specific remedies (damages of £${legalCase.estimated_value || 'TBD'})

Case Details:
${caseContext}

Generate the full letter ready for printing, with proper formatting, date, and signature block.`,
      });
    } else if (templateType === 'witness_statement') {
      documentContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional Witness Statement for a legal case. The statement should:
1. Begin with standard declaration ("I make oath and say as follows...")
2. Chronologically describe events witnessed
3. Reference specific dates and incidents from the case
4. Include factual observations (what was seen, heard, etc.)
5. Avoid legal conclusions
6. Include signature block
7. Be suitable for court filing

Case Details:
${caseContext}

Generate a detailed witness statement that would be admissible in court.`,
      });
    } else if (templateType === 'statement_of_case') {
      documentContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional Statement of Case for a legal dispute. The statement should:
1. Clearly identify all parties
2. Set out the facts alleged (numbered paragraphs)
3. Identify the legal basis for the claim
4. Set out the relief sought
5. Include a certificate of truth
6. Be structured in the style of civil court pleadings

Case Details:
${caseContext}

Generate a complete Statement of Case suitable for filing with the court.`,
      });
    } else if (templateType === 'demand_letter') {
      documentContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional Demand Letter for settlement. The letter should:
1. Detail the incident and injuries/losses
2. Explain liability
3. Quantify damages (medical, lost wages, pain & suffering)
4. Reference supporting evidence
5. Demand payment of £${legalCase.estimated_value || 'TBD'}
6. Include a 30-day deadline for response
7. Warn of legal proceedings if not settled

Case Details:
${caseContext}

Generate a persuasive demand letter with proper legal structure.`,
      });
    } else if (templateType === 'settlement_agreement') {
      documentContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional Settlement Agreement template. The agreement should:
1. Recite the dispute
2. State the settlement sum (£${legalCase.estimated_value || 'TBD'})
3. Include terms of payment
4. Require release of all claims
5. Include confidentiality clause
6. Address costs
7. State dispute is withdrawn
8. Include signature blocks for both parties

Case Details:
${caseContext}

Generate a legally sound settlement agreement.`,
      });
    } else if (templateType === 'case_summary') {
      documentContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional Case Summary/Brief. The summary should:
1. Executive summary (1 paragraph)
2. Facts (chronological overview)
3. Legal issues
4. Liability analysis
5. Damages assessment
6. Risk assessment
7. Recommended next steps

Case Details:
${caseContext}

Generate a comprehensive case summary suitable for internal review or client advice.`,
      });
    } else {
      return Response.json({ error: 'Unknown template type' }, { status: 400 });
    }

    // Create PDF
    const doc = new jsPDF();
    doc.setFont('Helvetica');
    doc.setFontSize(12);

    // Add header
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    const titleMap = {
      letter_of_claim: 'LETTER OF CLAIM',
      witness_statement: 'WITNESS STATEMENT',
      statement_of_case: 'STATEMENT OF CASE',
      demand_letter: 'DEMAND LETTER',
      settlement_agreement: 'SETTLEMENT AGREEMENT',
      case_summary: 'CASE SUMMARY',
    };
    doc.text(titleMap[templateType] || 'LEGAL DOCUMENT', 105, 20, { align: 'center' });

    // Add case reference
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Case Ref: ${legalCase.case_ref}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 20, 42);

    // Add document content
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(documentContent, 170);
    doc.text(lines, 20, 55);

    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, 105, 280, { align: 'center' });
      doc.text('Confidential - Legal Document', 20, 280);
    }

    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${legalCase.case_ref}_${templateType}.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});