import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { evidenceIds = [], incidentIds = [], bundleName = 'Disclosure Bundle', bundleDescription = '' } = await req.json();

    if (evidenceIds.length === 0 && incidentIds.length === 0) {
      return Response.json({ error: 'No evidence or incidents selected' }, { status: 400 });
    }

    // Fetch selected items
    const evidence = await Promise.all(
      evidenceIds.map(id => base44.entities.Evidence.get(id))
    );

    const incidents = await Promise.all(
      incidentIds.map(id => base44.entities.Incident.get(id))
    );

    // Create PDF
    const doc = new jsPDF();
    let pageNum = 1;
    let yPosition = 20;

    // Title Page
    doc.setFontSize(24);
    doc.text(bundleName, 105, 50, { align: 'center' });
    
    if (bundleDescription) {
      doc.setFontSize(12);
      doc.text(bundleDescription, 105, 70, { align: 'center', maxWidth: 180 });
    }

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 260, { align: 'center' });
    doc.text(`User: ${user.full_name}`, 105, 270, { align: 'center' });

    // Table of Contents Page
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Table of Contents', 20, 20);

    let tocY = 40;
    let tocPageNum = 3; // Start content numbering from page 3

    const addTocEntry = (title, type) => {
      if (tocY > 270) {
        doc.addPage();
        tocY = 20;
      }
      doc.setFontSize(10);
      doc.text(`${title} (${type})`, 20, tocY);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${tocPageNum}`, 200, tocY, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      tocY += 8;
      tocPageNum++;
    };

    // Add TOC entries
    evidence.forEach(e => addTocEntry(e.title, 'Evidence'));
    incidents.forEach(i => addTocEntry(i.title, 'Incident'));

    // Content Pages
    // Add Evidence
    evidence.forEach((item, idx) => {
      doc.addPage();
      doc.setFontSize(14);
      doc.text(`${idx + 1}. ${item.title}`, 20, 20);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);

      let y = 35;
      doc.text(`Type: ${item.evidence_type}`, 20, y);
      y += 6;
      
      if (item.date_collected) {
        doc.text(`Date: ${new Date(item.date_collected).toLocaleDateString()}`, 20, y);
        y += 6;
      }

      if (item.relevance) {
        doc.text(`Relevance: ${item.relevance}`, 20, y);
        y += 6;
      }

      if (item.strength) {
        doc.text(`Strength: ${item.strength}`, 20, y);
        y += 6;
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      y += 8;
      doc.text('Description:', 20, y);
      y += 5;

      if (item.description) {
        const lines = doc.splitTextToSize(item.description, 170);
        doc.setFontSize(9);
        lines.forEach(line => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 5;
        });
      }

      if (item.notes) {
        y += 3;
        doc.setFontSize(10);
        doc.text('Notes:', 20, y);
        y += 5;
        doc.setFontSize(9);
        const noteLines = doc.splitTextToSize(item.notes, 170);
        noteLines.forEach(line => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 5;
        });
      }
    });

    // Add Incidents
    evidence.forEach((item, idx) => {
      idx; // Mark as used for linter
    });

    incidents.forEach((item, idx) => {
      doc.addPage();
      doc.setFontSize(14);
      doc.text(`${evidence.length + idx + 1}. ${item.title}`, 20, 20);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);

      let y = 35;
      doc.text(`Date: ${new Date(item.date).toLocaleDateString()}`, 20, y);
      y += 6;
      doc.text(`Type: ${item.incident_type}`, 20, y);
      y += 6;
      doc.text(`Severity: ${item.severity}`, 20, y);
      y += 6;
      doc.text(`Status: ${item.status}`, 20, y);
      y += 6;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      y += 8;
      doc.text('Description:', 20, y);
      y += 5;

      if (item.description) {
        const lines = doc.splitTextToSize(item.description, 170);
        doc.setFontSize(9);
        lines.forEach(line => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 5;
        });
      }

      if (item.rics_violations && item.rics_violations.length > 0) {
        y += 3;
        doc.setFontSize(10);
        doc.text('RICS Violations:', 20, y);
        y += 5;
        doc.setFontSize(9);
        item.rics_violations.forEach(v => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`• ${v}`, 25, y);
          y += 5;
        });
      }

      if (item.legal_issues && item.legal_issues.length > 0) {
        y += 3;
        doc.setFontSize(10);
        doc.text('Legal Issues:', 20, y);
        y += 5;
        doc.setFontSize(9);
        item.legal_issues.forEach(l => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`• ${l}`, 25, y);
          y += 5;
        });
      }
    });

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${totalPages}`, 105, 285, { align: 'center' });
    }

    // Generate PDF as data URL
    const pdfDataUrl = doc.output('dataurlstring');

    return Response.json({
      pdf_data: pdfDataUrl,
      bundle_name: bundleName,
      total_items: evidence.length + incidents.length,
      total_pages: totalPages,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});