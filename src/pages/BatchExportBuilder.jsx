import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FileText, Download, ArrowLeft, Loader2, AlertCircle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const strengthColors = {
  weak: 'bg-slate-100 text-slate-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  strong: 'bg-green-100 text-green-800',
  critical: 'bg-red-100 text-red-800',
};

export default function BatchExportBuilder() {
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState([]);
  const [includeNarrative, setIncludeNarrative] = useState(false);
  const [includeCommunications, setIncludeCommunications] = useState(false);
  const [includeIncidents, setIncludeIncidents] = useState(false);
  const [bundleTitle, setBundleTitle] = useState('Case Evidence Bundle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCase, setActiveCase] = useState(null);

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list('-date_collected'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list(),
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list('-date'),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-date'),
  });

  const toggleEvidence = (id) => {
    setSelectedEvidenceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedItems = evidence.filter(e => selectedEvidenceIds.includes(e.id));

  const generatePDF = async () => {
    if (selectedEvidenceIds.length === 0) {
      toast.error('Select at least one evidence item');
      return;
    }

    setIsGenerating(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let currentPage = 1;
      let yPosition = margin;

      const addPage = () => {
        if (yPosition > margin) {
          doc.addPage();
          currentPage += 1;
          yPosition = margin;
        }
      };

      const addText = (text, size = 11, isBold = false, color = [0, 0, 0]) => {
        if (yPosition + 10 > pageHeight - margin) {
          addPage();
        }
        doc.setTextColor(...color);
        doc.setFontSize(size);
        if (isBold) doc.setFont(undefined, 'bold');
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * (size / 2.5) + 3;
        doc.setFont(undefined, 'normal');
      };

      // Cover page
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, pageWidth, 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont(undefined, 'bold');
      doc.text(bundleTitle, margin, 30);
      yPosition = 75;

      doc.setTextColor(0, 0, 0);
      addText(`Compiled: ${new Date().toLocaleDateString('en-GB')}`, 11);
      if (activeCase) {
        addText(`Case: ${activeCase.case_ref} — ${activeCase.client_name}`, 11);
      }
      addText(`Items: ${selectedItems.length}${includeCommunications ? ' evidence + communications' : ' evidence'}`, 11);

      // Table of Contents
      addPage();
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      addText('TABLE OF CONTENTS', 16, true, [50, 100, 200]);
      yPosition += 5;

      let tocItems = [];
      let pageCounter = 3;

      selectedItems.forEach((item, idx) => {
        tocItems.push({ title: `${idx + 1}. ${item.title}`, page: pageCounter });
        pageCounter += 2;
      });

      if (includeCommunications && communications.length > 0) {
        tocItems.push({ title: 'Communications Summary', page: pageCounter });
      }

      tocItems.forEach(toc => {
        addText(`${toc.title} ............................. ${toc.page}`, 10);
      });

      // Evidence sections
      selectedItems.forEach((item, idx) => {
        addPage();
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        addText(`${idx + 1}. ${item.title}`, 14, true, [50, 100, 200]);
        yPosition += 3;

        doc.setFont(undefined, 'normal');
        addText(`Type: ${item.evidence_type?.replace(/_/g, ' ') || 'N/A'}`, 9);
        addText(`Date: ${item.date_collected || 'N/A'}`, 9);
        addText(`Strength: ${item.strength || 'N/A'} | Relevance: ${item.relevance?.replace(/_/g, ' ') || 'N/A'}`, 9);
        yPosition += 5;

        if (item.description) {
          addText('Description:', 10, true);
          addText(item.description, 9);
          yPosition += 3;
        }

        if (item.notes) {
          addText('Analysis Notes:', 10, true);
          addText(item.notes, 9);
        }

        // Page footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${currentPage}`, margin, pageHeight - 10);
        doc.setTextColor(0, 0, 0);
      });

      // Communications summary
      if (includeCommunications && communications.length > 0) {
        addPage();
        addText('COMMUNICATIONS SUMMARY', 14, true, [50, 100, 200]);
        yPosition += 5;

        communications.slice(0, 10).forEach(comm => {
          addText(`${comm.date} | ${comm.from} → ${comm.to}`, 9, true);
          addText(comm.subject, 9);
          yPosition += 2;
        });
      }

      // Final page with footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, margin, pageHeight - 15);
      doc.text('Confidential — For Legal Use Only', margin, pageHeight - 10);

      // Download
      doc.save(`${bundleTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
      toast.success('PDF bundle downloaded');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/evidence" className="text-slate-600 hover:text-slate-900">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Batch Export Bundle</h1>
            <p className="text-slate-600 mt-1">Multi-select evidence and compile into indexed, branded PDF for court</p>
          </div>
        </div>

        {/* Config Panel */}
        <Card className="mb-6 border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-indigo-600" /> Bundle Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Bundle Title</label>
              <Input
                value={bundleTitle}
                onChange={(e) => setBundleTitle(e.target.value)}
                placeholder="e.g., 'Evidence Bundle - Bradley v Belcher'"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Case (Optional)</label>
              <select
                value={activeCase?.id || ''}
                onChange={(e) => setActiveCase(cases.find(c => c.id === e.target.value) || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">None selected</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.case_ref} — {c.client_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeCommunications} onChange={(e) => setIncludeCommunications(e.target.checked)} />
                <span className="text-sm">Include communications summary</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeIncidents} onChange={(e) => setIncludeIncidents(e.target.checked)} />
                <span className="text-sm">Include incidents summary</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Selector */}
        <Card className="mb-6">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Select Evidence Items
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{selectedEvidenceIds.length} selected</Badge>
              {evidence.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedEvidenceIds(selectedEvidenceIds.length === evidence.length ? [] : evidence.map(e => e.id))}
                  className="text-xs h-7"
                >
                  {selectedEvidenceIds.length === evidence.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {evidence.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No evidence items found. Add evidence first.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {evidence.map(item => (
                  <label key={item.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={selectedEvidenceIds.includes(item.id)}
                      onChange={() => toggleEvidence(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{item.title}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{item.evidence_type?.replace(/_/g, ' ')}</Badge>
                        <Badge className={`${strengthColors[item.strength]} text-xs`}>
                          {item.strength}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Items Preview */}
        {selectedItems.length > 0 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Bundle Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p><strong>Cover page:</strong> Title, case info, date</p>
                <p><strong>Table of Contents:</strong> {selectedItems.length} evidence items {includeCommunications ? '+ communications' : ''}</p>
                <p><strong>Evidence sections:</strong> {selectedItems.length} pages (1 per item + details)</p>
                {includeCommunications && <p><strong>Communications:</strong> Summary of recent communications</p>}
                <p><strong>Footer:</strong> Page numbers, generated date, confidentiality notice</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link to="/evidence">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Cancel
            </Button>
          </Link>
          <Button
            onClick={generatePDF}
            disabled={selectedEvidenceIds.length === 0 || isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Generate & Download Bundle
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}