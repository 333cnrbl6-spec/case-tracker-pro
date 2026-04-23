import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assessments, surveyorName = 'Malcolm Belcher' } = await req.json();

    const RICS_STANDARDS = [
      {
        id: 'competence',
        title: 'Competence & Fitness',
        description: 'Providing services only within competence and ensuring fitness for professional conduct',
        indicators: [
          'Claims expertise outside qualifications',
          'Provides services without proper professional indemnity insurance',
          'Lacks relevant professional standards or up-to-date knowledge',
          'Unable to demonstrate competence in specific technical areas'
        ]
      },
      {
        id: 'conflict_of_interest',
        title: 'Conflicts of Interest',
        description: 'Managing or avoiding conflicts that could prejudice clients',
        indicators: [
          'Acts for multiple parties with conflicting interests without disclosure',
          'Personal financial interest in the outcome of the transaction',
          'Fails to disclose material conflicts to all parties',
          'Uses position to gain unfair advantage'
        ]
      },
      {
        id: 'communication',
        title: 'Clear Communication',
        description: 'Communicating openly and honestly with all parties',
        indicators: [
          'Withholds information from relevant parties',
          'Acts as sole communication channel to isolate decision-makers',
          'Misrepresents findings or advice',
          'Fails to provide clear scope of work or terms'
        ]
      },
      {
        id: 'honesty',
        title: 'Honesty & Integrity',
        description: 'Acting with honesty and integrity in all professional dealings',
        indicators: [
          'Misrepresents credentials or experience',
          'Provides false or misleading reports',
          'Engages in deceptive practices',
          'Violates client confidentiality improperly'
        ]
      },
      {
        id: 'gatekeeping',
        title: 'Gatekeeping & Access Control (Behavioral Red Flag)',
        description: 'Preventing inappropriate gatekeeping or isolation tactics',
        indicators: [
          'Controls all communication between principal and other advisors',
          'Restricts contractor or expert access to client/asset',
          'Creates information asymmetry deliberately',
          'Uses position to prevent scrutiny or independent advice',
          'Implements unreasonable communication restrictions'
        ]
      },
      {
        id: 'professionalism',
        title: 'Professional Conduct & Respect',
        description: 'Treating others professionally and respectfully',
        indicators: [
          'Harassment or bullying behavior toward colleagues or parties',
          'Aggressive or threatening communication',
          'Disrespectful conduct toward other professionals',
          'Abusive language or conduct patterns'
        ]
      },
      {
        id: 'transparency',
        title: 'Transparency & Disclosure',
        description: 'Being transparent about fees, interests, and processes',
        indicators: [
          'Lack of transparency in fee structures',
          'Undisclosed commissions or benefits',
          'Failure to disclose professional limitations',
          'Hiding material information from clients'
        ]
      }
    ];

    // Calculate assessment levels
    const getStandardStatus = (standardId) => {
      const standard = RICS_STANDARDS.find(s => s.id === standardId);
      const flaggedCount = standard.indicators.filter((_, i) => assessments[`${standardId}-${i}`]).length;
      
      if (flaggedCount === 0) return 'none';
      if (flaggedCount <= 1) return 'minor';
      if (flaggedCount <= 2) return 'moderate';
      return 'severe';
    };

    const statuses = RICS_STANDARDS.map(s => getStandardStatus(s.id));
    const severeCount = statuses.filter(s => s === 'severe').length;
    const moderateCount = statuses.filter(s => s === 'moderate').length;
    
    let overallLevel = 'minor';
    if (severeCount >= 2) overallLevel = 'critical';
    else if (severeCount >= 1 && moderateCount >= 1) overallLevel = 'serious';
    else if (moderateCount >= 2) overallLevel = 'concerning';

    // Create PDF
    const doc = new jsPDF();
    doc.setFont('helvetica');

    // Title
    doc.setFontSize(20);
    doc.text('RICS Code of Conduct Assessment Report', 105, 20, { align: 'center' });

    // Date and surveyor
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Subject: ${surveyorName}`, 20, 42);
    doc.text(`Prepared by: ${user.full_name}`, 20, 49);

    let y = 60;

    // Overall Assessment
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Overall Assessment', 20, y);
    y += 8;

    doc.setFontSize(10);
    const overallText = overallLevel === 'critical' ? 'Multiple serious breaches of RICS standards identified. Strong grounds for formal complaint.' :
                        overallLevel === 'serious' ? 'Significant violations of RICS code. Reasonable basis for complaint and investigation.' :
                        overallLevel === 'concerning' ? 'Multiple breaches identified. Sufficient grounds to consider formal complaint.' :
                        'Limited evidence of standards violations.';
    
    const overallLines = doc.splitTextToSize(overallText, 170);
    overallLines.forEach(line => {
      doc.text(line, 20, y);
      y += 5;
    });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(
      overallLevel === 'critical' ? 220 : overallLevel === 'serious' ? 180 : overallLevel === 'concerning' ? 150 : 100,
      50,
      50
    );
    doc.text(`Level: ${overallLevel.toUpperCase()}`, 20, y + 5);

    y += 15;

    // Standards Assessment
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('Standards Assessment', 20, y);
    y += 10;

    RICS_STANDARDS.forEach((standard, idx) => {
      const status = getStandardStatus(standard.id);
      const flaggedIndicators = standard.indicators.filter((_, i) => assessments[`${standard.id}-${i}`]);

      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${standard.title}`, 20, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Status: ${status.toUpperCase()}`, 20, y);
      y += 5;

      doc.setTextColor(0, 0, 0);
      const descLines = doc.splitTextToSize(standard.description, 170);
      descLines.forEach(line => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(8);
        doc.text(line, 20, y);
        y += 4;
      });

      if (flaggedIndicators.length > 0) {
        y += 2;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Identified Issues:', 20, y);
        y += 4;

        flaggedIndicators.forEach(indicator => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          const indLines = doc.splitTextToSize(`• ${indicator}`, 165);
          indLines.forEach(line => {
            doc.text(line, 25, y);
            y += 4;
          });
        });
      } else {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('No violations identified', 25, y);
        doc.setTextColor(0, 0, 0);
        y += 4;
      }

      y += 5;
    });

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${totalPages}`, 105, 285, { align: 'center' });
    }

    // Upload PDF
    const pdfBuffer = doc.output('arraybuffer');
    const uint8Array = new Uint8Array(pdfBuffer);
    const blob = new Blob([uint8Array], { type: 'application/pdf' });

    const uploadRes = await base44.integrations.Core.UploadFile({
      file: blob,
    });

    return Response.json({
      file_url: uploadRes.file_url,
      overall_level: overallLevel,
      severe_count: severeCount,
      moderate_count: moderateCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});