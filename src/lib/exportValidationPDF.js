import { jsPDF } from 'jspdf';

const SEVERITY_COLORS = {
  critical: [220, 38, 38],
  high:     [234, 88, 12],
  medium:   [217, 119, 6],
  low:      [37, 99, 235],
};

const VALIDATION_TYPES = {
  missing: 'Missing Documentation',
  sequence: 'Timeline Discrepancy',
  contradiction: 'Factual Contradiction',
  compliance: 'RICS Requirement Gap',
  evidence_gap: 'Evidence Gap',
};

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 5) {
  const lines = doc.splitTextToSize(String(text || ''), maxWidth);
  lines.forEach(line => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

function addSectionHeader(doc, text, y, rgb = [15, 23, 42]) {
  if (y > 265) { doc.addPage(); y = 20; }
  doc.setFillColor(...rgb);
  doc.rect(14, y - 4, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(text, 16, y + 0.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  return y + 10;
}

function addKeyValue(doc, label, value, x, y, maxWidth = 80) {
  if (y > 275) { doc.addPage(); y = 20; }
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(label + ':', x, y);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(String(value || '—'), maxWidth);
  doc.text(lines, x + doc.getTextWidth(label + ': ') + 1, y);
  return y + (lines.length * 4.5) + 1;
}

export function exportValidationPDF({ report, evidenceMap, commMap, incidentMap, resolveLinkedItems }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 14;

  // ── COVER HEADER ──────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Evidence Validation Report', margin, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RICS Conduct Investigation — Confidential', margin, 26);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, margin, 32);

  // severity badge top-right
  const criticalCount = report.issues.filter(i => i.severity === 'critical').length;
  const highCount     = report.issues.filter(i => i.severity === 'high').length;
  const overallStatus = criticalCount > 0 ? 'CRITICAL' : highCount > 0 ? 'HIGH' : 'MODERATE';
  const statusColor   = criticalCount > 0 ? [220, 38, 38] : highCount > 0 ? [234, 88, 12] : [217, 119, 6];
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageW - 46, 14, 32, 10, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(overallStatus, pageW - 30, 20.5, { align: 'center' });

  y = 50;
  doc.setTextColor(0, 0, 0);

  // ── EXECUTIVE SUMMARY ─────────────────────────────────────────
  y = addSectionHeader(doc, 'EXECUTIVE SUMMARY', y);

  const summaryData = [
    ['Total Issues',               report.issues.length],
    ['Critical',                   criticalCount],
    ['High',                       highCount],
    ['Documents Analysed',         report.documentsAnalyzed || '—'],
    ['RICS Requirements Checked',  report.ricsRequirementsChecked || '—'],
    ['Timeline Integrity',         report.timelineIntegrity ? 'Verified' : 'Issues Found'],
    ['Communication–Incident Alignment', report.communicationAlignment ? 'Aligned' : 'Discrepancies Found'],
  ];

  doc.setFontSize(8);
  summaryData.forEach(([label, val]) => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val), margin + 70, y);
    y += 5.5;
  });

  y += 6;

  // ── ISSUES ────────────────────────────────────────────────────
  y = addSectionHeader(doc, `VALIDATION ISSUES (${report.issues.length})`, y);

  report.issues.forEach((issue, idx) => {
    if (y > 260) { doc.addPage(); y = 20; }

    const rgb = SEVERITY_COLORS[issue.severity] || [100, 100, 100];

    // Issue title bar
    doc.setFillColor(rgb[0], rgb[1], rgb[2], 0.12);
    doc.setDrawColor(...rgb);
    doc.setLineWidth(0.4);

    const startY = y;
    // left severity stripe
    doc.setFillColor(...rgb);
    doc.rect(margin, y - 1, 2, 7, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...rgb);
    doc.text(`[${(issue.severity || 'unknown').toUpperCase()}]`, margin + 4, y + 4);
    const sevWidth = doc.getTextWidth(`[${(issue.severity || '').toUpperCase()}]`) + 2;

    doc.setTextColor(15, 23, 42);
    doc.text(String(issue.title || ''), margin + 4 + sevWidth, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(VALIDATION_TYPES[issue.type] || issue.type || '', pageW - margin, y + 4, { align: 'right' });

    y += 9;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);

    if (issue.description) {
      y = addWrappedText(doc, issue.description, margin + 4, y, contentW - 4, 4.5);
      y += 2;
    }

    if (issue.evidence) {
      doc.setFont('helvetica', 'bold');
      doc.text('Evidence:', margin + 4, y); y += 4.5;
      doc.setFont('helvetica', 'normal');
      y = addWrappedText(doc, issue.evidence, margin + 8, y, contentW - 8, 4.5);
      y += 2;
    }

    if (issue.recommendation) {
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendation:', margin + 4, y); y += 4.5;
      doc.setFont('helvetica', 'normal');
      y = addWrappedText(doc, issue.recommendation, margin + 8, y, contentW - 8, 4.5);
      y += 2;
    }

    // Linked items
    const linked = resolveLinkedItems(issue);
    if (linked.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`Linked Items (${linked.length}):`, margin + 4, y); y += 4.5;
      doc.setFont('helvetica', 'normal');
      linked.forEach(({ type, record }) => {
        if (y > 275) { doc.addPage(); y = 20; }
        const label = type === 'evidence'
          ? `[Evidence] ${record.title || '—'}`
          : type === 'communication'
          ? `[Communication] ${record.subject || record.from || '—'} (${record.date || ''})`
          : `[Incident] ${record.title || '—'} (${record.date || ''})`;
        doc.text('• ' + label, margin + 8, y); y += 4.5;

        // Annotation
        if (record.annotations) {
          doc.setTextColor(180, 130, 0);
          y = addWrappedText(doc, '  ★ Annotation: ' + record.annotations, margin + 10, y, contentW - 14, 4);
          doc.setTextColor(0, 0, 0);
          y += 1;
        }
      });
    }

    // divider
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 2, pageW - margin, y + 2);
    y += 7;
  });

  // ── APPENDIX: EVIDENCE DETAILS ────────────────────────────────
  const evidenceList = Object.values(evidenceMap);
  if (evidenceList.length > 0) {
    doc.addPage();
    y = 20;
    y = addSectionHeader(doc, 'APPENDIX A — EVIDENCE DETAILS', y);
    evidenceList.forEach((r, i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${r.title || '—'}`, margin, y); y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      if (r.evidence_type) y = addKeyValue(doc, 'Type', r.evidence_type.replace(/_/g, ' '), margin + 3, y, contentW - 6);
      if (r.date_collected) y = addKeyValue(doc, 'Date Collected', r.date_collected, margin + 3, y, contentW - 6);
      if (r.strength)       y = addKeyValue(doc, 'Strength', r.strength, margin + 3, y, contentW - 6);
      if (r.relevance)      y = addKeyValue(doc, 'Relevance', r.relevance.replace(/_/g, ' '), margin + 3, y, contentW - 6);
      if (r.description)    y = addWrappedText(doc, r.description, margin + 3, y, contentW - 6, 4.5);
      if (r.notes) {
        doc.setFont('helvetica', 'italic');
        y = addWrappedText(doc, 'Notes: ' + r.notes, margin + 3, y, contentW - 6, 4.5);
        doc.setFont('helvetica', 'normal');
      }
      if (r.annotations) {
        doc.setTextColor(180, 130, 0);
        y = addWrappedText(doc, '★ Annotation: ' + r.annotations, margin + 3, y, contentW - 6, 4.5);
        doc.setTextColor(0, 0, 0);
      }
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + 2, pageW - margin, y + 2);
      y += 6;
    });
  }

  // ── APPENDIX: COMMUNICATIONS ──────────────────────────────────
  const commList = Object.values(commMap);
  if (commList.length > 0) {
    doc.addPage();
    y = 20;
    y = addSectionHeader(doc, 'APPENDIX B — COMMUNICATION DETAILS', y);
    commList.forEach((r, i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${r.subject || '—'}`, margin, y); y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      if (r.date) y = addKeyValue(doc, 'Date', r.date, margin + 3, y, contentW - 6);
      if (r.from) y = addKeyValue(doc, 'From', r.from, margin + 3, y, contentW - 6);
      if (r.to)   y = addKeyValue(doc, 'To', r.to, margin + 3, y, contentW - 6);
      if (r.tone) y = addKeyValue(doc, 'Tone', r.tone, margin + 3, y, contentW - 6);
      if (r.content) y = addWrappedText(doc, r.content, margin + 3, y, contentW - 6, 4.5);
      if (r.annotations) {
        doc.setTextColor(180, 130, 0);
        y = addWrappedText(doc, '★ Annotation: ' + r.annotations, margin + 3, y, contentW - 6, 4.5);
        doc.setTextColor(0, 0, 0);
      }
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + 2, pageW - margin, y + 2);
      y += 6;
    });
  }

  // ── APPENDIX: INCIDENTS ───────────────────────────────────────
  const incidentList = Object.values(incidentMap);
  if (incidentList.length > 0) {
    doc.addPage();
    y = 20;
    y = addSectionHeader(doc, 'APPENDIX C — INCIDENT DETAILS', y);
    incidentList.forEach((r, i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${r.title || '—'}`, margin, y); y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      if (r.date)          y = addKeyValue(doc, 'Date', r.date, margin + 3, y, contentW - 6);
      if (r.incident_type) y = addKeyValue(doc, 'Type', r.incident_type.replace(/_/g, ' '), margin + 3, y, contentW - 6);
      if (r.severity)      y = addKeyValue(doc, 'Severity', r.severity, margin + 3, y, contentW - 6);
      if (r.description)   y = addWrappedText(doc, r.description, margin + 3, y, contentW - 6, 4.5);
      if (r.rics_violations?.length) {
        doc.setFont('helvetica', 'bold'); doc.text('RICS Violations:', margin + 3, y); y += 4.5;
        doc.setFont('helvetica', 'normal');
        r.rics_violations.forEach(v => { y = addWrappedText(doc, '• ' + v, margin + 6, y, contentW - 9, 4.5); });
      }
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + 2, pageW - margin, y + 2);
      y += 6;
    });
  }

  // ── FOOTER on every page ─────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('RICS Conduct Investigation — Confidential — Not for Distribution', margin, 292);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, 292, { align: 'right' });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`validation-report-${dateStr}.pdf`);
}