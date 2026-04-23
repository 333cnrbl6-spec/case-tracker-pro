import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';
import 'npm:jspdf/dist/jspdf.umd.min.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incidentIds, communicationIds, evidenceIds, reportTitle, reportScope } = await req.json();

    // Fetch all selected records
    const incidents = await Promise.all(
      incidentIds.map(id => base44.asServiceRole.entities.Incident.get(id))
    );
    const communications = await Promise.all(
      communicationIds.map(id => base44.asServiceRole.entities.Communication.get(id))
    );
    const evidence = await Promise.all(
      evidenceIds.map(id => base44.asServiceRole.entities.Evidence.get(id))
    );

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Helper: Add page if needed
    const checkPage = (space) => {
      if (yPos + space > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    // Helper: Add heading
    const addHeading = (text, level = 1) => {
      checkPage(10);
      doc.setFont('helvetica', level === 1 ? 'bold' : 'bold');
      doc.setFontSize(level === 1 ? 18 : 12);
      doc.text(text, margin, yPos);
      yPos += level === 1 ? 12 : 8;
    };

    // Helper: Add body text
    const addText = (text, size = 10, style = 'normal') => {
      checkPage(5);
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4 + 1;
    };

    // Header
    doc.setDrawColor(13, 27, 42);
    doc.setFillColor(13, 27, 42);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(reportTitle, margin, 15);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, margin, 24);
    
    doc.setTextColor(0, 0, 0);
    yPos = 40;

    // Executive Summary
    if (reportScope) {
      addHeading('Executive Summary');
      addText(reportScope);
      yPos += 2;
    }

    // Incidents Section
    if (incidents.length > 0) {
      addHeading('Incidents');
      incidents.forEach((inc, idx) => {
        checkPage(8);
        addText(`${idx + 1}. ${inc.title}`, 11, 'bold');
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const details = [
          `Date: ${inc.date}`,
          `Severity: ${inc.severity?.toUpperCase()}`,
          `Type: ${inc.incident_type?.replace(/_/g, ' ')}`,
          `Status: ${inc.status || 'Open'}`,
        ];
        doc.text(details, margin + 5, yPos);
        yPos += details.length * 3 + 1;

        if (inc.description) {
          addText(inc.description, 9);
        }

        if (inc.rics_violations?.length > 0) {
          addText(`RICS Violations: ${inc.rics_violations.join(', ')}`, 9, 'bold');
        }

        if (inc.legal_issues?.length > 0) {
          addText(`Legal Issues: ${inc.legal_issues.join(', ')}`, 9);
        }

        yPos += 2;
      });
    }

    // Communications Section
    if (communications.length > 0) {
      addHeading('Communications');
      communications.forEach((comm, idx) => {
        checkPage(6);
        addText(`${idx + 1}. ${comm.subject}`, 11, 'bold');
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text([
          `Type: ${comm.type?.replace(/_/g, ' ')}`,
          `From: ${comm.from} | To: ${comm.to}`,
          `Date: ${comm.date}`,
          comm.tone ? `Tone: ${comm.tone}` : '',
        ].filter(Boolean), margin + 5, yPos);
        
        const lines = comm.tone ? 4 : 3;
        yPos += lines * 3 + 1;

        if (comm.content) {
          addText(comm.content, 9);
        }
        yPos += 1;
      });
    }

    // Evidence Section
    if (evidence.length > 0) {
      addHeading('Evidence');
      evidence.forEach((ev, idx) => {
        checkPage(6);
        addText(`${idx + 1}. ${ev.title}`, 11, 'bold');
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text([
          `Type: ${ev.evidence_type?.replace(/_/g, ' ')}`,
          `Strength: ${ev.strength}`,
          `Date Collected: ${ev.date_collected}`,
          `Relevance: ${ev.relevance?.replace(/_/g, ' ')}`,
        ], margin + 5, yPos);
        yPos += 12;

        if (ev.description) {
          addText(ev.description, 9);
        }
        yPos += 1;
      });
    }

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    // Generate and upload PDF
    const pdfBytes = doc.output('arraybuffer');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], `incident_brief_${Date.now()}.pdf`, { type: 'application/pdf' });

    const uploadResult = await base44.integrations.Core.UploadFile({ file });

    return Response.json({
      success: true,
      pdf_url: uploadResult.file_url,
      incidents: incidents.length,
      communications: communications.length,
      evidence: evidence.length,
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});