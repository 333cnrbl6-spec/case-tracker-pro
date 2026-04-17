import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { PDFDocument, rgb, degrees } from 'npm:pdf-lib@1.11.1';
import { StandardFonts } from 'npm:pdf-lib@1.11.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incidentIds, incidentDetails, evidenceDetails, title } = await req.json();

    if (!incidentDetails || incidentDetails.length === 0) {
      return Response.json({ error: 'No incidents provided' }, { status: 400 });
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

    let page = pdfDoc.addPage([595, 842]); // A4
    let yPosition = 750;
    const margin = 40;
    const pageWidth = 595 - 2 * margin;

    function addNewPageIfNeeded(requiredSpace) {
      if (yPosition - requiredSpace < 50) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = 750;
        return true;
      }
      return false;
    }

    function drawText(text, x, y, size, font, color = rgb(0, 0, 0)) {
      page.drawText(text, { x, y, size, font, color });
    }

    function drawHeading(text, size = 16) {
      addNewPageIfNeeded(size + 20);
      drawText(text, margin, yPosition, size, timesRomanBoldFont, rgb(0, 0, 0));
      yPosition -= size + 10;
    }

    function drawSubHeading(text, size = 12) {
      addNewPageIfNeeded(size + 15);
      drawText(text, margin, yPosition, size, timesRomanBoldFont, rgb(0.2, 0.2, 0.8));
      yPosition -= size + 8;
    }

    function drawParagraph(text, size = 10, indent = 0) {
      const words = text.split(' ');
      let line = '';
      const maxWidth = pageWidth - indent;

      words.forEach(word => {
        const testLine = line + word + ' ';
        const width = timesRomanFont.widthOfTextAtSize(testLine, size);

        if (width > maxWidth) {
          if (line) {
            addNewPageIfNeeded(size + 5);
            drawText(line.trim(), margin + indent, yPosition, size, timesRomanFont);
            yPosition -= size + 3;
          }
          line = word + ' ';
        } else {
          line = testLine;
        }
      });

      if (line) {
        addNewPageIfNeeded(size + 5);
        drawText(line.trim(), margin + indent, yPosition, size, timesRomanFont);
        yPosition -= size + 3;
      }
    }

    // Header
    drawHeading('FORMAL RICS REGULATORY BREACH NOTIFICATION', 18);
    yPosition -= 10;

    // Title
    drawSubHeading(title, 14);
    yPosition -= 5;

    // Date and reference
    const today = new Date().toISOString().split('T')[0];
    drawParagraph(`Date of Notification: ${today}`, 10);
    drawParagraph(`Number of Incidents: ${incidentDetails.length}`, 10);
    yPosition -= 10;

    // Executive Summary
    drawSubHeading('1. EXECUTIVE SUMMARY', 12);
    const criticalCount = incidentDetails.filter(i => i.severity === 'critical').length;
    const highCount = incidentDetails.filter(i => i.severity === 'high').length;
    const totalViolations = incidentDetails.reduce((acc, i) => acc + (i.rics_violations?.length || 0), 0);

    drawParagraph(
      `This notification documents ${incidentDetails.length} serious incidents involving breaches of RICS Professional Standards and Rules of Conduct. ` +
      `Of these, ${criticalCount} are of critical severity and ${highCount} are of high severity. ` +
      `In aggregate, these incidents involve ${totalViolations} distinct RICS rule violations. ` +
      `This notification is submitted for formal investigation and disciplinary action.`,
      10
    );
    yPosition -= 15;

    // Incidents Summary
    drawSubHeading('2. INCIDENTS SUMMARY', 12);
    
    incidentDetails.forEach((incident, idx) => {
      addNewPageIfNeeded(80);
      
      const severity = (incident.severity || 'medium').toUpperCase();
      const severityColor = incident.severity === 'critical' ? rgb(1, 0, 0) : rgb(1, 0.5, 0);
      
      drawText(`${idx + 1}. ${incident.title}`, margin, yPosition, 11, timesRomanBoldFont);
      yPosition -= 12;
      
      drawText(`Severity: ${severity}`, margin + 20, yPosition, 9, courierFont, severityColor);
      drawText(`Date: ${incident.date || 'N/A'}`, margin + 280, yPosition, 9, courierFont);
      yPosition -= 10;
      
      drawText(`Type: ${incident.incident_type || 'N/A'}`, margin + 20, yPosition, 9, timesRomanFont);
      yPosition -= 10;
      
      drawParagraph(incident.description || '', 9, 20);
      yPosition -= 5;
    });

    yPosition -= 10;

    // RICS Violations Summary
    drawSubHeading('3. RICS RULES OF CONDUCT — VIOLATIONS SUMMARY', 12);

    const violationsMap = {};
    incidentDetails.forEach(incident => {
      (incident.rics_violations || []).forEach(violation => {
        if (!violationsMap[violation]) {
          violationsMap[violation] = [];
        }
        violationsMap[violation].push(incident.title);
      });
    });

    Object.entries(violationsMap).forEach(([violation, incidents], idx) => {
      addNewPageIfNeeded(40);
      
      drawText(`${idx + 1}. ${violation}`, margin, yPosition, 10, timesRomanBoldFont);
      yPosition -= 11;
      
      drawParagraph(`Identified in: ${incidents.join('; ')}`, 9, 20);
      yPosition -= 8;
    });

    yPosition -= 10;

    // Legal Issues
    drawSubHeading('4. ASSOCIATED LEGAL ISSUES', 12);

    const legalIssuesMap = {};
    incidentDetails.forEach(incident => {
      (incident.legal_issues || []).forEach(issue => {
        if (!legalIssuesMap[issue]) {
          legalIssuesMap[issue] = [];
        }
        legalIssuesMap[issue].push(incident.title);
      });
    });

    Object.entries(legalIssuesMap).forEach(([issue, incidents], idx) => {
      addNewPageIfNeeded(35);
      
      drawText(`${idx + 1}. ${issue}`, margin, yPosition, 10, timesRomanBoldFont);
      yPosition -= 11;
      
      drawParagraph(`Related to: ${incidents.join('; ')}`, 9, 20);
      yPosition -= 8;
    });

    yPosition -= 10;

    // Supporting Evidence
    if (evidenceDetails.length > 0) {
      drawSubHeading('5. SUPPORTING EVIDENCE', 12);

      evidenceDetails.forEach((evidence, idx) => {
        addNewPageIfNeeded(50);
        
        drawText(`${idx + 1}. ${evidence.title}`, margin, yPosition, 10, timesRomanBoldFont);
        yPosition -= 11;
        
        drawText(`Type: ${evidence.evidence_type}`, margin + 20, yPosition, 9, timesRomanFont);
        drawText(`Date: ${evidence.date_collected || 'N/A'}`, margin + 280, yPosition, 9, timesRomanFont);
        yPosition -= 10;
        
        if (evidence.description) {
          drawParagraph(evidence.description, 9, 20);
          yPosition -= 5;
        }
        
        if (evidence.strength) {
          drawText(`Strength: ${evidence.strength}`, margin + 20, yPosition, 8, courierFont);
          yPosition -= 8;
        }
        
        yPosition -= 5;
      });

      yPosition -= 10;
    }

    // Conclusion
    drawSubHeading('6. CONCLUSION', 12);
    drawParagraph(
      `This notification documents a serious pattern of professional misconduct involving breaches of RICS Standards. ` +
      `The documented evidence demonstrates systematic failures to comply with RICS Rules of Conduct, including failures in independence, objectivity, and professional integrity. ` +
      `This matter is referred for formal investigation and disciplinary action.`,
      10
    );

    yPosition -= 15;

    // Footer
    page.drawText(
      `Report Generated: ${today} | CaseNarrative System | Confidential`,
      margin,
      20,
      8,
      timesRomanFont,
      rgb(0.5, 0.5, 0.5)
    );

    // Save PDF to bytes
    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="RICS_Breach_Notification_${today}.pdf"`,
        'Content-Length': pdfBytes.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});