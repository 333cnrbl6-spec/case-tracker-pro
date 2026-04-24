import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import jsPDF from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { case_id, narrative } = await req.json();
    if (!case_id || !narrative) {
      return Response.json({ error: 'case_id and narrative required' }, { status: 400 });
    }

    // Fetch case and evidence
    const [caseRecords, evidence] = await Promise.all([
      base44.entities.LegalCase.filter({ id: case_id }),
      base44.entities.Evidence.list('-date_collected', 20)
    ]);

    const legalCase = caseRecords[0];
    if (!legalCase) return Response.json({ error: 'Case not found' }, { status: 404 });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);

    // Set default font
    pdf.setFont('Helvetica');

    // Title
    pdf.setFontSize(18);
    pdf.setTextColor(20, 20, 40);
    pdf.text('LEGAL BRIEF', margin, yPos);
    yPos += 12;

    // Case header
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 80);
    pdf.text(`Case Ref: ${legalCase.case_ref}`, margin, yPos);
    yPos += 6;
    pdf.text(`Client: ${legalCase.client_name}`, margin, yPos);
    yPos += 6;
    pdf.text(`Opponent: ${legalCase.opponent_name || 'Not specified'}`, margin, yPos);
    yPos += 6;
    pdf.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, margin, yPos);
    yPos += 12;

    // Horizontal line
    pdf.setDrawColor(180, 180, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Helper function to add section
    const addSection = (title, content) => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(12);
      pdf.setTextColor(20, 20, 40);
      pdf.setFont('Helvetica', 'bold');
      pdf.text(title, margin, yPos);
      yPos += 8;

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(40, 40, 60);

      if (typeof content === 'string') {
        const lines = pdf.splitTextToSize(content, contentWidth);
        pdf.text(lines, margin, yPos);
        yPos += lines.length * 5 + 4;
      } else if (Array.isArray(content)) {
        content.forEach(item => {
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = 20;
          }
          const lines = pdf.splitTextToSize(`• ${item}`, contentWidth - 5);
          pdf.text(lines, margin + 2, yPos);
          yPos += lines.length * 5 + 2;
        });
        yPos += 4;
      }
    };

    // Add narrative sections
    if (narrative.background_parties) {
      addSection('Background & Parties', narrative.background_parties);
    }

    if (narrative.chronology) {
      addSection('Chronology of Events', narrative.chronology);
    }

    if (narrative.liability_analysis) {
      addSection('Liability Analysis', narrative.liability_analysis);
    }

    if (narrative.quantum_assessment) {
      addSection('Quantum Assessment', narrative.quantum_assessment);
    }

    if (narrative.legal_framework) {
      addSection('Legal Framework', narrative.legal_framework);
    }

    // Applicable statutes
    if (narrative.applicable_statutes?.length > 0) {
      addSection('Applicable Statutes & Case Law', narrative.applicable_statutes);
    }

    // Strengths
    if (narrative.strengths?.length > 0) {
      addSection('Case Strengths', narrative.strengths);
    }

    // Weaknesses
    if (narrative.weaknesses?.length > 0) {
      addSection('Weaknesses / Risks', narrative.weaknesses);
    }

    // Risk assessment
    if (narrative.risk_assessment) {
      addSection('Risk Assessment', narrative.risk_assessment);
    }

    // Evidence summary
    const evidenceSummary = evidence
      .slice(0, 10)
      .map(e => `${e.title} (${e.evidence_type}, strength: ${e.strength})`)
      .filter(Boolean);

    if (evidenceSummary.length > 0) {
      addSection('Summary of Evidence on File', evidenceSummary);
    }

    // Recommended actions
    if (narrative.recommended_actions?.length > 0) {
      addSection('Recommended Actions', narrative.recommended_actions);
    }

    // Footer notice
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = 20;
    }
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 140);
    pdf.setFont('Helvetica', 'italic');
    const footerText = 'This legal brief is produced from AI-generated narrative and documented case data. It is intended as a drafting aid for qualified legal practitioners and does not constitute legal advice. Jurisdiction: England & Wales.';
    const footerLines = pdf.splitTextToSize(footerText, contentWidth);
    pdf.text(footerLines, margin, yPos);

    // Generate PDF blob
    const pdfBlob = pdf.output('blob');
    const arrayBuffer = await pdfBlob.arrayBuffer();

    // Return as download
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Legal-Brief-${legalCase.case_ref}.pdf"`
      }
    });
  } catch (error) {
    console.error('generateLegalBriefPDF error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});