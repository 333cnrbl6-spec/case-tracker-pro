import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, FileText, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const EXPORT_TYPES = [
  { id: 'full_narrative', label: 'Full Case Narrative', desc: 'Complete narrative with all sections' },
  { id: 'evidence_bundle', label: 'Evidence Bundle Index', desc: 'Indexed list of all evidence items' },
  { id: 'chronology', label: 'Chronology Timeline', desc: 'Dated chronological event timeline' },
  { id: 'client_care', label: 'Client Care Letter', desc: 'SRA-compliant client care letter template' },
  { id: 'settlement', label: 'Settlement Proposal', desc: 'Without prejudice settlement proposal' },
  { id: 'court_bundle', label: 'Court Bundle Checklist', desc: 'Pre-trial court bundle checklist' },
];

function addPage(pdf, yPos, pageHeight = 270) {
  if (yPos > pageHeight) { pdf.addPage(); return 20; }
  return yPos;
}

function writeSection(pdf, title, content, yPos) {
  if (!content) return yPos;
  yPos = addPage(pdf, yPos);
  pdf.setFontSize(11);
  pdf.setFont(undefined, 'bold');
  pdf.text(title, 20, yPos);
  yPos += 6;
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(9);
  const lines = pdf.splitTextToSize(typeof content === 'string' ? content : JSON.stringify(content), 170);
  lines.forEach(line => {
    yPos = addPage(pdf, yPos);
    pdf.text(line, 20, yPos);
    yPos += 4.5;
  });
  return yPos + 4;
}

function headerFooter(pdf, legalCase, firm, pageNum) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFontSize(8);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(150);
  pdf.text(`${firm || 'CaseNarrative'}  |  ${legalCase?.case_ref || ''}  |  CONFIDENTIAL`, 20, 10);
  pdf.text(`${format(new Date(), 'dd MMMM yyyy')}  |  Page ${pageNum}`, pageWidth - 20, 10, { align: 'right' });
  pdf.setTextColor(0);
}

export default function PDFLegalDocumentExport({ legalCase, narrative, firmName, sraNumber }) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('full_narrative');
  const [lastExported, setLastExported] = useState(null);

  const exportToPDF = async () => {
    if (!legalCase) { toast.error('No case selected'); return; }
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      let yPos = 22;
      const pageWidth = pdf.internal.pageSize.getWidth();

      headerFooter(pdf, legalCase, firmName, 1);

      // Firm header block
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text(firmName || 'CaseNarrative Legal', 20, yPos);
      yPos += 7;
      if (sraNumber) {
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.text(`SRA Number: ${sraNumber}`, 20, yPos);
        yPos += 5;
      }

      // Divider
      pdf.setDrawColor(100, 100, 200);
      pdf.setLineWidth(0.5);
      pdf.line(20, yPos, pageWidth - 20, yPos);
      yPos += 6;

      // Title
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      const titles = {
        full_narrative: 'LEGAL CASE NARRATIVE',
        evidence_bundle: 'EVIDENCE BUNDLE INDEX',
        chronology: 'CHRONOLOGY OF EVENTS',
        client_care: 'CLIENT CARE LETTER',
        settlement: 'WITHOUT PREJUDICE SETTLEMENT PROPOSAL',
        court_bundle: 'COURT BUNDLE CHECKLIST',
      };
      pdf.text(titles[exportType], pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Case details block
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      const details = [
        ['Case Reference:', legalCase.case_ref || ''],
        ['Client:', legalCase.client_name || ''],
        ['Opponent:', legalCase.opponent_name || 'TBC'],
        ['Case Type:', (legalCase.case_type || '').replace(/_/g, ' ')],
        ['Status:', legalCase.status || ''],
        ['Incident Date:', legalCase.incident_date ? format(parseISO(legalCase.incident_date), 'dd MMMM yyyy') : 'N/A'],
        ['Limitation Date:', legalCase.limitation_date ? format(parseISO(legalCase.limitation_date), 'dd MMMM yyyy') : 'N/A'],
        ['Estimated Value:', legalCase.estimated_value ? `£${Number(legalCase.estimated_value).toLocaleString()}` : 'TBC'],
        ['Fee Earner:', legalCase.assigned_fee_earner || 'N/A'],
        ['Generated:', format(new Date(), 'dd MMMM yyyy HH:mm')],
      ];
      details.forEach(([label, val]) => {
        yPos = addPage(pdf, yPos);
        pdf.setFont(undefined, 'bold');
        pdf.text(label, 20, yPos);
        pdf.setFont(undefined, 'normal');
        pdf.text(val, 75, yPos);
        yPos += 5;
      });

      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, yPos + 2, pageWidth - 20, yPos + 2);
      yPos += 8;

      // Export type content
      if (exportType === 'full_narrative' && narrative) {
        yPos = writeSection(pdf, 'BACKGROUND & PARTIES', narrative.background_parties || narrative.background_and_facts || '', yPos);
        yPos = writeSection(pdf, 'CHRONOLOGY', typeof narrative.chronology === 'string' ? narrative.chronology : JSON.stringify(narrative.chronology || ''), yPos);
        yPos = writeSection(pdf, 'LIABILITY ANALYSIS', narrative.liability_analysis || '', yPos);
        yPos = writeSection(pdf, 'QUANTUM ASSESSMENT', narrative.quantum_assessment || '', yPos);
        yPos = writeSection(pdf, 'LEGAL FRAMEWORK', narrative.legal_framework || '', yPos);
        yPos = writeSection(pdf, 'RISK ASSESSMENT', narrative.risk_assessment || '', yPos);
        if (narrative.recommended_actions?.length) {
          yPos = addPage(pdf, yPos);
          pdf.setFontSize(11); pdf.setFont(undefined, 'bold');
          pdf.text('RECOMMENDED ACTIONS', 20, yPos); yPos += 6;
          pdf.setFontSize(9); pdf.setFont(undefined, 'normal');
          narrative.recommended_actions.forEach((a, i) => {
            yPos = addPage(pdf, yPos);
            const lines = pdf.splitTextToSize(`${i + 1}. ${a}`, 170);
            pdf.text(lines, 20, yPos); yPos += lines.length * 4.5 + 2;
          });
        }
      } else if (exportType === 'chronology' && narrative) {
        const chronText = typeof narrative.chronology === 'object'
          ? (narrative.chronology?.timeline?.map(e => `${e.date}: ${e.event}`).join('\n\n') || '')
          : (narrative.chronology || '');
        yPos = writeSection(pdf, 'CHRONOLOGICAL EVENTS', chronText || 'No chronology data available.', yPos);
      } else if (exportType === 'client_care') {
        const letter = `${format(new Date(), 'dd MMMM yyyy')}\n\nDear ${legalCase.client_name},\n\nRe: ${legalCase.case_ref} — ${(legalCase.case_type || '').replace(/_/g, ' ')}\n\nWe write to confirm that we have been instructed to act on your behalf in this matter.\n\nOur Charges\nOur fees will be discussed and agreed with you prior to any significant work being undertaken. We will keep you informed of costs throughout the matter.\n\nYour Case\nWe will provide you with regular updates on the progress of your case. If you have any questions at any time, please do not hesitate to contact us.\n\nImportant Dates\nLimitation Date: ${legalCase.limitation_date ? format(parseISO(legalCase.limitation_date), 'dd MMMM yyyy') : 'To be confirmed'}\n\nComplaints\nWe are committed to providing a high quality legal service. If you are unhappy with any aspect of our service, please contact us in the first instance.\n\nWe are authorised and regulated by the Solicitors Regulation Authority (SRA). ${sraNumber ? `SRA Number: ${sraNumber}` : ''}\n\nYours sincerely,\n\n${firmName || ''}`;
        yPos = writeSection(pdf, '', letter, yPos);
      } else if (exportType === 'settlement') {
        const letter = `WITHOUT PREJUDICE\n\n${format(new Date(), 'dd MMMM yyyy')}\n\nRe: ${legalCase.case_ref} — ${legalCase.client_name} v ${legalCase.opponent_name || 'Defendant'}\n\nWe write Without Prejudice and with a view to achieving an amicable resolution of this dispute.\n\nOur client's case is strong. The value of this claim is estimated at £${Number(legalCase.estimated_value || 0).toLocaleString()} based on the following heads of loss:\n\n• General damages for pain, suffering and loss of amenity\n• Special damages as particularised\n• Interest pursuant to the Late Payment of Commercial Debts (Interest) Act 1998 / s.69 County Courts Act 1984\n\nIn the interests of saving costs and achieving an early resolution, our client is prepared to accept the sum of £[AMOUNT] in full and final settlement of all claims.\n\nThis offer will remain open for 21 days from the date of this letter, after which it will be withdrawn without further notice.\n\nYours faithfully,\n\n${firmName || ''}`;
        yPos = writeSection(pdf, '', letter, yPos);
      } else if (exportType === 'court_bundle') {
        const checklist = [
          'Claim Form (N1) and Particulars of Claim',
          'Defence (and Counterclaim if applicable)',
          'Reply to Defence',
          'Directions Questionnaire',
          'List of Documents / Disclosure Schedule',
          'Witness Statements (indexed and paginated)',
          'Expert Reports (if any)',
          'Relevant Correspondence',
          'Chronology of Key Events',
          'Skeleton Argument (if ordered)',
          'Authorities Bundle (if applicable)',
          'Draft Order (for consent orders)',
          'Cost Schedule (N260)',
          'Judgment/Order from previous hearings',
        ];
        yPos = addPage(pdf, yPos);
        pdf.setFontSize(11); pdf.setFont(undefined, 'bold');
        pdf.text('COURT BUNDLE CHECKLIST', 20, yPos); yPos += 8;
        pdf.setFontSize(9); pdf.setFont(undefined, 'normal');
        checklist.forEach((item, i) => {
          yPos = addPage(pdf, yPos);
          pdf.rect(20, yPos - 3, 4, 4);
          pdf.text(`${i + 1}. ${item}`, 27, yPos);
          yPos += 6;
        });
      } else if (exportType === 'evidence_bundle') {
        yPos = addPage(pdf, yPos);
        pdf.setFontSize(11); pdf.setFont(undefined, 'bold');
        pdf.text('EVIDENCE BUNDLE INDEX', 20, yPos); yPos += 8;
        pdf.setFontSize(9); pdf.setFont(undefined, 'normal');
        pdf.text('This bundle has been prepared for case ' + (legalCase.case_ref || '') + '.', 20, yPos); yPos += 6;
        pdf.text('Documents are indexed below. Each document is identified by tab number.', 20, yPos); yPos += 8;
        pdf.setFont(undefined, 'bold');
        pdf.text('Tab', 20, yPos); pdf.text('Document', 35, yPos); pdf.text('Date', 140, yPos); pdf.text('Relevance', 165, yPos); yPos += 5;
        pdf.line(20, yPos, pageWidth - 20, yPos); yPos += 3;
        pdf.setFont(undefined, 'normal');
        for (let i = 1; i <= 10; i++) {
          pdf.text(`${i}`, 22, yPos);
          pdf.text('[Document description]', 35, yPos);
          pdf.text('[Date]', 140, yPos);
          pdf.text('[High/Medium/Low]', 165, yPos);
          yPos += 6;
        }
      } else {
        yPos = writeSection(pdf, 'NOTE', 'No AI narrative generated yet. Generate a narrative first to export detailed content.', yPos);
      }

      const filename = `${legalCase.case_ref || 'case'}_${exportType}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
      pdf.save(filename);
      setLastExported(exportType);
      toast.success(`${EXPORT_TYPES.find(t => t.id === exportType)?.label} exported`);
    } catch (err) {
      console.error(err);
      toast.error('PDF export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Export Legal Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {EXPORT_TYPES.map(type => (
            <label key={type.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${exportType === type.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <input type="radio" name="exportType" value={type.id} checked={exportType === type.id} onChange={e => setExportType(e.target.value)} className="mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{type.label}</p>
                <p className="text-xs text-slate-500">{type.desc}</p>
              </div>
              {lastExported === type.id && <CheckCircle className="w-4 h-4 text-green-500 ml-auto mt-0.5 shrink-0" />}
            </label>
          ))}
        </div>

        <Button onClick={exportToPDF} disabled={exporting || !legalCase} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
          {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</> : <><Download className="w-4 h-4" /> Export {EXPORT_TYPES.find(t => t.id === exportType)?.label}</>}
        </Button>

        {!narrative && exportType === 'full_narrative' && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Generate a narrative first for a fully populated export. Other document types work without a narrative.
          </p>
        )}
      </CardContent>
    </Card>
  );
}