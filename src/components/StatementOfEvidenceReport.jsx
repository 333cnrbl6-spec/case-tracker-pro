import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function StatementOfEvidenceReport({ selectedEvidenceIds = [] }) {
  const [loading, setLoading] = useState(false);
  const [statement, setStatement] = useState(null);
  const [reportRef, setReportRef] = useState(null);

  const handleGenerateStatement = async () => {
    if (selectedEvidenceIds.length === 0) {
      toast.error('Select at least one evidence item');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateStatementOfEvidence', {
        evidenceIds: selectedEvidenceIds
      });
      setStatement(response.data.statement);
      toast.success('Statement of Evidence generated');
    } catch (err) {
      toast.error(err.message || 'Failed to generate statement');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef) return;

    try {
      const canvas = await html2canvas(reportRef, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`Statement_of_Evidence_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported');
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  };

  if (!statement) {
    return (
      <Card className="bg-slate-50 border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600">Generate a Statement of Evidence from your annotated documents</p>
            <Button
              onClick={handleGenerateStatement}
              disabled={loading || selectedEvidenceIds.length === 0}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Statement
                </>
              )}
            </Button>
            {selectedEvidenceIds.length === 0 && (
              <p className="text-xs text-slate-500">Select evidence items to generate statement</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Statement of Evidence</h2>
        <Button onClick={handleExportPDF} className="gap-2">
          <Download className="w-4 h-4" />
          Export as PDF
        </Button>
      </div>

      <div ref={setReportRef} className="bg-white p-8 space-y-8">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Statement of Evidence</h1>
          <p className="text-slate-600">Compiled from annotated documents and RICS conduct analysis</p>
          <p className="text-xs text-slate-500 mt-3">
            Generated: {statement.generated_date} | By: {statement.generated_by}
          </p>
        </div>

        {/* Executive Summary */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            Executive Summary
          </h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-red-600">{statement.executive_summary.total_critical}</p>
                <p className="text-xs text-slate-600 mt-1">Critical Findings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-blue-600">{statement.executive_summary.total_supporting}</p>
                <p className="text-xs text-slate-600 mt-1">Supporting Evidence</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-slate-600">{statement.evidence_count}</p>
                <p className="text-xs text-slate-600 mt-1">Documents Analyzed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-purple-600">{statement.executive_summary.rics_rules_implicated}</p>
                <p className="text-xs text-slate-600 mt-1">RICS Rules Breached</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Critical Findings */}
        {statement.critical_findings.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Critical Findings ({statement.critical_findings.length})
            </h2>
            <div className="space-y-4">
              {statement.critical_findings.map((finding, idx) => (
                <div key={idx} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                  <p className="font-medium text-slate-900 mb-2">"{finding.excerpt}"</p>
                  <p className="text-sm text-slate-700 mb-3">
                    <strong>Source:</strong> {finding.source_document}
                  </p>
                  {finding.interpretation && (
                    <p className="text-sm text-slate-700 mb-3 italic bg-white p-2 rounded">
                      Interpretation: {finding.interpretation}
                    </p>
                  )}
                  {finding.linked_rics_violations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">Linked RICS Violations:</p>
                      <div className="space-y-1">
                        {finding.linked_rics_violations.map((rule, ridx) => (
                          <div key={ridx} className="text-xs bg-white p-2 rounded">
                            <Badge variant="outline" className="mr-2">{rule.rule_number}</Badge>
                            <span className="text-slate-700">{rule.rule_title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supporting Evidence */}
        {statement.supporting_evidence.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Supporting Evidence ({statement.supporting_evidence.length})
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {statement.supporting_evidence.slice(0, 6).map((evidence, idx) => (
                <div key={idx} className="border border-blue-200 bg-blue-50 p-4 rounded">
                  <p className="font-medium text-slate-900 mb-2 text-sm">"{evidence.excerpt.substring(0, 40)}..."</p>
                  <p className="text-xs text-slate-600">Source: {evidence.source_document}</p>
                  {evidence.note && <p className="text-xs text-slate-700 mt-2 italic">{evidence.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RICS Violations Summary */}
        {statement.rics_violations_summary.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">RICS Code of Conduct Breaches</h2>
            <div className="space-y-3">
              {statement.rics_violations_summary.map((violation, idx) => (
                <div key={idx} className="border border-slate-200 p-4 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline" className="mr-2 mb-2">{violation.rule_number}</Badge>
                      <p className="font-medium text-slate-900">{violation.title}</p>
                    </div>
                    <Badge className={`${
                      violation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      violation.severity === 'serious' ? 'bg-orange-100 text-orange-800' :
                      violation.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {violation.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{violation.category}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Supporting annotations: {violation.supporting_annotations}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Methodology */}
        <div className="bg-slate-50 p-4 rounded text-xs text-slate-700 space-y-2">
          <p className="font-medium text-slate-900">Review Methodology</p>
          <p>{statement.methodology.annotation_process}</p>
          <p>{statement.methodology.rule_linkage}</p>
          <p>Review Date: {statement.methodology.review_date}</p>
        </div>
      </div>
    </div>
  );
}