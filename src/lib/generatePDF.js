import { jsPDF } from 'jspdf';

function addHeader(doc, title) {
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RICS Compliance Monitor', 10, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 140, 12);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 10, 32);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(10, 36, 200, 36);
}

function addFooter(doc, pageNum, totalPages) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(10, pageHeight - 12, 200, pageHeight - 12);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text('CONFIDENTIAL – RICS Compliance Monitor', 10, pageHeight - 6);
  doc.text(`Page ${pageNum} of ${totalPages}`, 185, pageHeight - 6, { align: 'right' });
}

function checkPageBreak(doc, y, margin = 20) {
  const pageHeight = doc.internal.pageSize.height;
  if (y > pageHeight - margin) {
    doc.addPage();
    return 42;
  }
  return y;
}

export function generateEvidenceReport(evidence) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  addHeader(doc, 'Evidence & Documents Report');

  let y = 44;

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, y, 190, 20, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Items: ${evidence.length}`, 16, y + 7);
  const critical = evidence.filter(e => e.strength === 'critical').length;
  const strong = evidence.filter(e => e.strength === 'strong').length;
  doc.text(`Critical: ${critical}`, 60, y + 7);
  doc.text(`Strong: ${strong}`, 100, y + 7);
  const ricsViol = evidence.filter(e => e.relevance === 'rics_violation').length;
  doc.text(`RICS Violations: ${ricsViol}`, 140, y + 7);
  y += 28;

  evidence.forEach((item, idx) => {
    y = checkPageBreak(doc, y, 55);

    // Item header band
    const strengthColors = { critical: [254, 226, 226], strong: [220, 252, 231], moderate: [254, 249, 195], weak: [241, 245, 249] };
    const [r, g, b] = strengthColors[item.strength] ?? [241, 245, 249];
    doc.setFillColor(r, g, b);
    doc.roundedRect(10, y, 190, 9, 1, 1, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${item.title || 'Untitled'}`, 14, y + 6);

    const strengthLabel = item.strength ? item.strength.charAt(0).toUpperCase() + item.strength.slice(1) : '';
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(strengthLabel, 192, y + 6, { align: 'right' });
    y += 12;

    // Meta row
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const typeLabel = item.evidence_type ? item.evidence_type.replace(/_/g, ' ') : '';
    const relevanceLabel = item.relevance ? item.relevance.replace(/_/g, ' ') : '';
    doc.text(`Type: ${typeLabel}  |  Relevance: ${relevanceLabel}  |  Collected: ${item.date_collected || '—'}`, 14, y);
    y += 6;

    if (item.description) {
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(item.description, 182);
      lines.forEach(line => {
        y = checkPageBreak(doc, y, 15);
        doc.text(line, 14, y);
        y += 5;
      });
    }

    if (item.notes) {
      y = checkPageBreak(doc, y, 15);
      doc.setFillColor(239, 246, 255);
      const notesLines = doc.splitTextToSize(`Notes: ${item.notes}`, 178);
      doc.roundedRect(12, y - 2, 186, notesLines.length * 5 + 4, 1, 1, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 64, 175);
      notesLines.forEach(line => {
        doc.text(line, 16, y + 2);
        y += 5;
      });
      y += 2;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(10, y + 2, 200, y + 2);
    y += 8;
  });

  // Add footers
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  doc.save(`evidence-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function generateCaseOverviewReport({ incidents, evidence, communications }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  addHeader(doc, 'Case Overview Report');

  let y = 44;

  // ── Stats Summary ────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Summary Statistics', 10, y);
  y += 8;

  const stats = [
    ['Total Incidents', incidents.length],
    ['Critical Incidents', incidents.filter(i => i.severity === 'critical').length],
    ['High Severity', incidents.filter(i => i.severity === 'high').length],
    ['Open / Unresolved', incidents.filter(i => i.status === 'open').length],
    ['With RICS Violations', incidents.filter(i => Array.isArray(i.rics_violations) && i.rics_violations.length > 0).length],
    ['Evidence Items', evidence.length],
    ['Communications', communications.length],
  ];

  const colW = 90;
  stats.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = 10 + col * colW;
    const sy = y + row * 10;
    doc.setFillColor(col === 0 ? 248 : 241, 250, 252);
    doc.roundedRect(sx, sy - 4, colW - 4, 9, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(label, sx + 4, sy + 1);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), sx + colW - 8, sy + 1, { align: 'right' });
  });

  y += Math.ceil(stats.length / 2) * 10 + 12;

  // ── Incidents ─────────────────────────────────────────────
  y = checkPageBreak(doc, y, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Incident Log', 10, y);
  y += 8;

  const severityColors = {
    critical: [254, 226, 226],
    high: [255, 237, 213],
    medium: [254, 249, 195],
    low: [220, 252, 231],
  };

  incidents.forEach((incident, idx) => {
    y = checkPageBreak(doc, y, 30);
    const sev = incident.severity ?? 'medium';
    const [r, g, b] = severityColors[sev] ?? [241, 245, 249];
    doc.setFillColor(r, g, b);
    doc.roundedRect(10, y - 3, 190, 8, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${incident.title || 'Untitled'}`, 14, y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${sev.toUpperCase()}  |  ${incident.incident_type?.replace(/_/g, ' ') ?? ''}  |  ${incident.date ?? ''}  |  Status: ${incident.status ?? ''}`, 14, y + 7);
    y += 13;

    if (incident.description) {
      const lines = doc.splitTextToSize(incident.description, 182);
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 50);
      lines.slice(0, 3).forEach(line => {
        y = checkPageBreak(doc, y, 12);
        doc.text(line, 14, y);
        y += 5;
      });
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(10, y + 1, 200, y + 1);
    y += 6;
  });

  // ── Evidence Summary ──────────────────────────────────────
  y = checkPageBreak(doc, y, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Evidence Summary', 10, y);
  y += 8;

  evidence.slice(0, 20).forEach((item, idx) => {
    y = checkPageBreak(doc, y, 14);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${item.title || 'Untitled'}`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`  [${item.strength ?? ''}]  ${item.evidence_type?.replace(/_/g, ' ') ?? ''}  |  ${item.relevance?.replace(/_/g, ' ') ?? ''}`, 14, y + 5);
    y += 11;
  });

  // Add footers
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  doc.save(`case-overview-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}