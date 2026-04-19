import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const EXPORT_TYPES = [
  { id: 'full_narrative', label: 'Full Case Narrative', desc: 'Complete AI-generated legal narrative', icon: '📄' },
  { id: 'evidence_bundle', label: 'Evidence Bundle Index', desc: 'Indexed list of all evidence', icon: '📋' },
  { id: 'chronology', label: 'Chronological Timeline', desc: 'All events in date order', icon: '📅' },
  { id: 'client_care_letter', label: 'Client Care Letter', desc: 'Draft client care letter', icon: '✉️' },
  { id: 'settlement_proposal', label: 'Settlement Proposal', desc: 'Without prejudice offer template', icon: '🤝' },
  { id: 'court_bundle_checklist', label: 'Court Bundle Checklist', desc: 'Checklist for court bundle preparation', icon: '⚖️' },
];

export default function PDFExportPanel({ caseId, caseRef, onClose }) {
  const [selectedType, setSelectedType] = useState('full_narrative');
  const [loadingType, setLoadingType] = useState(null);

  const exportMutation = useMutation({
    mutationFn: async (exportType) => {
      setLoadingType(exportType);
      const result = await base44.functions.invoke('generatePDFExport', {
        case_id: caseId,
        export_type: exportType
      });
      return result.data;
    },
    onSuccess: (data) => {
      generatePDF(data);
      setLoadingType(null);
      toast.success('PDF generated');
    },
    onError: (e) => {
      setLoadingType(null);
      toast.error(e.message);
    }
  });

  const generatePDF = (data) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    // Strip HTML tags for PDF
    const stripped = data.html_content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n=== $1 ===\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n--- $1 ---\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n$1\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n$1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
      .replace(/<li>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
      .replace(/<br\/?>/gi, '\n')
      .replace(/<div[^>]*>(.*?)<\/div>/gis, '$1\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Header
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`CaseNarrative — Generated ${data.generated_at}`, margin, 12);
    doc.text(`Case: ${data.case_ref || ''}`, pageWidth - margin, 12, { align: 'right' });
    doc.setDrawColor(200);
    doc.line(margin, 15, pageWidth - margin, 15);

    // Content
    doc.setFontSize(11);
    doc.setTextColor(30);
    const lines = doc.splitTextToSize(stripped, maxWidth);
    let y = 25;

    lines.forEach(line => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`CaseNarrative — ${data.case_ref}`, margin, 12);
        doc.line(margin, 15, pageWidth - margin, 15);
        doc.setFontSize(11);
        doc.setTextColor(30);
        y = 25;
      }

      if (line.startsWith('===')) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(line.replace(/=/g, '').trim(), margin, y);
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
      } else if (line.startsWith('---')) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(line.replace(/-/g, '').trim(), margin, y);
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
      } else {
        doc.text(line, margin, y);
      }
      y += 6;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount} — Confidential — Not Legal Advice`, pageWidth / 2, 288, { align: 'center' });
    }

    doc.save(`${data.case_ref || 'case'}_${data.export_type}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Card className="border-indigo-300 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-indigo-600" /> PDF Export
          </CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EXPORT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => exportMutation.mutate(type.id)}
              disabled={loadingType !== null}
              className={`p-3 rounded-lg border text-left transition-all hover:border-indigo-400 hover:shadow-sm ${
                selectedType === type.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xl">{type.icon}</span>
                {loadingType === type.id && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                {loadingType !== type.id && loadingType === null && <Download className="w-3.5 h-3.5 text-slate-400" />}
              </div>
              <p className="font-medium text-sm text-slate-800 mt-1">{type.label}</p>
              <p className="text-xs text-slate-500">{type.desc}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}