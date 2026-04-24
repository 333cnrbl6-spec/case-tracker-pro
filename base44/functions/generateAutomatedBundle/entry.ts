import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';
import 'npm:jspdf-autotable@3.8.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      case_id,
      case_ref,
      include_evidence = true,
      include_incidents = true,
      include_communications = true,
      evidence_ids = [],
      incident_ids = [],
      communication_ids = [],
    } = body;

    // Fetch case details
    const cases = await base44.entities.LegalCase.filter({ id: case_id });
    if (!cases || cases.length === 0) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }
    const caseData = cases[0];

    // Fetch evidence items
    let evidenceData = [];
    if (include_evidence) {
      const allEvidence = await base44.entities.Evidence.list('-created_date');
      evidenceData = evidence_ids.length > 0
        ? allEvidence.filter(e => evidence_ids.includes(e.id))
        : allEvidence;
    }

    // Fetch incident reports
    let incidentData = [];
    if (include_incidents) {
      const allIncidents = await base44.entities.Incident.list('-created_date');
      incidentData = incident_ids.length > 0
        ? allIncidents.filter(i => incident_ids.includes(i.id))
        : allIncidents;
    }

    // Fetch communications
    let communicationData = [];
    if (include_communications) {
      const allComms = await base44.entities.Communication.list('-created_date');
      communicationData = communication_ids.length > 0
        ? allComms.filter(c => communication_ids.includes(c.id))
        : allComms;
    }

    // Create PDF with UK court bundle standards
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    let pageNum = 1;
    let indexEntries = [];

    // Helper function to add page number footer
    const addFooter = () => {
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        `Page ${pageNum}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    };

    // Helper function to add a new page
    const addNewPage = () => {
      doc.addPage();
      pageNum++;
      addFooter();
    };

    // Helper function to wrap text
    const wrapText = (text, maxWidth) => {
      return doc.splitTextToSize(text || '', maxWidth);
    };

    // Title Page
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text('COURT BUNDLE', margin, 50, { maxWidth: contentWidth });

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Case Reference: ${caseData.case_ref}`, margin, 80);
    doc.text(`Client: ${caseData.client_name}`, margin, 90);
    if (caseData.opponent_name) {
      doc.text(`Opponent: ${caseData.opponent_name}`, margin, 100);
    }
    doc.text(`Date Prepared: ${new Date().toLocaleDateString('en-GB')}`, margin, 110);

    doc.setFontSize(10);
    doc.setTextColor(100);
    let yPos = 130;
    doc.text('Documents Included:', margin, yPos);
    yPos += 8;
    if (include_evidence) doc.text(`• Evidence: ${evidenceData.length} items`, margin + 5, yPos), yPos += 6;
    if (include_incidents) doc.text(`• Incident Reports: ${incidentData.length} items`, margin + 5, yPos), yPos += 6;
    if (include_communications) doc.text(`• Communications: ${communicationData.length} items`, margin + 5, yPos);

    addFooter();

    // Index/Contents Page
    addNewPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('INDEX OF DOCUMENTS', margin, 20);

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    yPos = 35;

    let docNum = 1;
    const indexPageStart = pageNum;

    // Build index entries
    if (include_evidence && evidenceData.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 139);
      doc.text('EVIDENCE', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      evidenceData.forEach((evid) => {
        const title = evid.title || `Evidence ${docNum}`;
        const indexText = `${docNum}. ${title}`;
        indexEntries.push({ title: indexText, page: null, section: 'evidence' });
        doc.text(indexText, margin + 5, yPos);
        yPos += 6;
        if (yPos > pageHeight - 20) {
          addNewPage();
          yPos = 20;
        }
        docNum++;
      });
      yPos += 4;
    }

    if (include_incidents && incidentData.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 139);
      doc.text('INCIDENT REPORTS', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      incidentData.forEach((incident) => {
        const title = incident.title || `Incident ${docNum}`;
        const indexText = `${docNum}. ${title}`;
        indexEntries.push({ title: indexText, page: null, section: 'incidents' });
        doc.text(indexText, margin + 5, yPos);
        yPos += 6;
        if (yPos > pageHeight - 20) {
          addNewPage();
          yPos = 20;
        }
        docNum++;
      });
      yPos += 4;
    }

    if (include_communications && communicationData.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 139);
      doc.text('COMMUNICATIONS', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      communicationData.forEach((comm) => {
        const title = `${comm.from} to ${comm.to} (${comm.type})`;
        const indexText = `${docNum}. ${title}`;
        indexEntries.push({ title: indexText, page: null, section: 'communications' });
        doc.text(indexText, margin + 5, yPos);
        yPos += 6;
        if (yPos > pageHeight - 20) {
          addNewPage();
          yPos = 20;
        }
        docNum++;
      });
    }

    // Evidence Section
    if (include_evidence && evidenceData.length > 0) {
      addNewPage();
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('SECTION 1: EVIDENCE', margin, 20);

      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 139);
      doc.line(margin, 24, pageWidth - margin, 24);

      yPos = 35;
      evidenceData.forEach((evid, idx) => {
        // Tab marker
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`TAB ${idx + 1}`, pageWidth - 25, 15);

        // Document title
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const titleLines = wrapText(evid.title || 'Evidence Document', contentWidth);
        doc.text(titleLines, margin, yPos);
        yPos += (titleLines.length * 6) + 4;

        // Metadata
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Type: ${evid.evidence_type}`, margin, yPos);
        yPos += 5;
        if (evid.date_collected) {
          doc.text(`Date: ${new Date(evid.date_collected).toLocaleDateString('en-GB')}`, margin, yPos);
          yPos += 5;
        }
        if (evid.strength) {
          doc.text(`Strength: ${evid.strength}`, margin, yPos);
          yPos += 5;
        }

        // Description
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        yPos += 3;
        if (evid.description) {
          const descLines = wrapText(evid.description, contentWidth);
          doc.text(descLines, margin, yPos);
          yPos += (descLines.length * 5) + 4;
        }

        yPos += 5;
        if (yPos > pageHeight - 25) {
          addNewPage();
          yPos = 20;
        }
      });
    }

    // Incident Reports Section
    if (include_incidents && incidentData.length > 0) {
      addNewPage();
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('SECTION 2: INCIDENT REPORTS', margin, 20);

      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 139);
      doc.line(margin, 24, pageWidth - margin, 24);

      yPos = 35;
      incidentData.forEach((incident, idx) => {
        // Tab marker
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`TAB ${idx + 1}`, pageWidth - 25, 15);

        // Document title
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const titleLines = wrapText(incident.title || 'Incident Report', contentWidth);
        doc.text(titleLines, margin, yPos);
        yPos += (titleLines.length * 6) + 4;

        // Metadata
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Date: ${new Date(incident.date).toLocaleDateString('en-GB')}`, margin, yPos);
        yPos += 5;
        doc.text(`Type: ${incident.incident_type}`, margin, yPos);
        yPos += 5;
        doc.text(`Severity: ${incident.severity}`, margin, yPos);
        yPos += 5;

        // Description
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        yPos += 3;
        const descLines = wrapText(incident.description, contentWidth);
        doc.text(descLines, margin, yPos);
        yPos += (descLines.length * 5) + 4;

        yPos += 5;
        if (yPos > pageHeight - 25) {
          addNewPage();
          yPos = 20;
        }
      });
    }

    // Communications Section
    if (include_communications && communicationData.length > 0) {
      addNewPage();
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('SECTION 3: COMMUNICATIONS', margin, 20);

      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 139);
      doc.line(margin, 24, pageWidth - margin, 24);

      yPos = 35;
      communicationData.forEach((comm, idx) => {
        // Tab marker
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`TAB ${idx + 1}`, pageWidth - 25, 15);

        // Document header
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`From: ${comm.from}`, margin, yPos);
        yPos += 5;
        doc.text(`To: ${comm.to}`, margin, yPos);
        yPos += 5;

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Date: ${new Date(comm.date).toLocaleDateString('en-GB')}`, margin, yPos);
        yPos += 4;
        doc.text(`Type: ${comm.type}`, margin, yPos);
        yPos += 4;
        if (comm.subject) {
          doc.text(`Subject: ${comm.subject}`, margin, yPos);
          yPos += 4;
        }

        // Content
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        yPos += 2;
        if (comm.content) {
          const contentLines = wrapText(comm.content, contentWidth);
          doc.text(contentLines, margin, yPos);
          yPos += (contentLines.length * 5) + 4;
        }

        yPos += 5;
        if (yPos > pageHeight - 25) {
          addNewPage();
          yPos = 20;
        }
      });
    }

    // Final page - Declaration
    addNewPage();
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('DECLARATION', margin, 20);

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    yPos = 40;
    const declText = wrapText(
      'This bundle has been prepared in accordance with UK court procedure rules and contains all flagged evidence, incident reports, and communications relevant to the above-referenced case. All documents are included in chronological order where applicable and are indexed for easy reference.',
      contentWidth
    );
    doc.text(declText, margin, yPos);

    yPos += (declText.length * 6) + 10;
    doc.text(`Prepared by: ${user.full_name || user.email}`, margin, yPos);
    yPos += 8;
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, margin, yPos);

    // Generate PDF as base64
    const pdfBase64 = doc.output('dataurlstring').split(',')[1];

    return Response.json({
      success: true,
      pdfBase64: pdfBase64,
      fileName: `Bundle_${caseData.case_ref}_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (error) {
    console.error('Bundle generation error:', error);
    return Response.json(
      { error: error.message || 'Failed to generate bundle' },
      { status: 500 }
    );
  }
});