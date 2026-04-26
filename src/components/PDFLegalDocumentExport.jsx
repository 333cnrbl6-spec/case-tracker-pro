import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function PDFLegalDocumentExport({ legalCase, narrative }) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('full');

  const exportToPDF = async () => {
    try {
      setExporting(true);
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header
      pdf.setFontSize(18);
      pdf.text(`LEGAL CASE NARRATIVE`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.text(`Case Reference: ${legalCase.case_ref}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Date Generated: ${format(new Date(), 'dd MMMM yyyy')}`, 20, yPosition);
      yPosition += 12;

      // Case Details
      pdf.setFontSize(12);
      pdf.text('CASE DETAILS', 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      const details = [
        [`Client:`, legalCase.client_name],
        [`Opponent:`, legalCase.opponent_name],
        [`Case Type:`, legalCase.case_type],
        [`Status:`, legalCase.status],
        [`Incident Date:`, format(parseISO(legalCase.incident_date), 'dd MMMM yyyy')],
        [`Limitation Date:`, legalCase.limitation_date ? format(parseISO(legalCase.limitation_date), 'dd MMMM yyyy') : 'N/A'],
        [`Estimated Value:`, `£${legalCase.estimated_value}`]
      ];

      details.forEach(([label, value]) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${label}`, 20, yPosition);
        pdf.text(`${value}`, 100, yPosition);
        yPosition += 7;
      });

      yPosition += 5;

      // Narrative Sections
      if (narrative) {
        const sections = [
          { title: 'BACKGROUND & PARTIES', key: 'background_parties' },
          { title: 'CHRONOLOGY', key: 'chronology' },
          { title: 'LIABILITY ANALYSIS', key: 'liability_analysis' },
          { title: 'QUANTUM ASSESSMENT', key: 'quantum_assessment' },
          { title: 'LEGAL FRAMEWORK', key: 'legal_framework' },
          { title: 'RISK ASSESSMENT', key: 'risk_assessment' }
        ];

        sections.forEach(section => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(12);
          pdf.text(section.title, 20, yPosition);
          yPosition += 8;

          pdf.setFontSize(10);
          const text = narrative[section.key] || '';
          const wrapped = pdf.splitTextToSize(text, pageWidth - 40);
          pdf.text(wrapped, 20, yPosition);
          yPosition += wrapped.length * 4 + 5;
        });
      }

      // Save
      const filename = `${legalCase.case_ref}_narrative_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF export error:', error);
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
        <div className="space-y-3">
          {[
            { id: 'full', label: 'Full Case Narrative' },
            { id: 'evidence', label: 'Evidence Bundle Index' },
            { id: 'chronology', label: 'Chronology Timeline' },
            { id: 'care', label: 'Client Care Letter' },
            { id: 'settlement', label: 'Settlement Proposal' },
            { id: 'court', label: 'Court Bundle Checklist' }
          ].map(type => (
            <label key={type.id} className="flex items-center gap-3 p-2 border rounded hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="exportType"
                value={type.id}
                checked={exportType === type.id}
                onChange={(e) => setExportType(e.target.value)}
              />
              <span className="text-sm font-medium">{type.label}</span>
            </label>
          ))}
        </div>

        <Button
          onClick={exportToPDF}
          disabled={exporting || !narrative}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {exporting ? (
            <>
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}