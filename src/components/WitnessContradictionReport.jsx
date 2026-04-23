import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, Loader2, Download, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

const severityConfig = {
  low: { icon: AlertCircle, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  moderate: { icon: AlertTriangle, color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  high: { icon: AlertTriangle, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  critical: { icon: AlertCircle, color: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' }
};

export default function WitnessContradictionReport({ witnessIds, evidenceIds, caseId }) {
  const [report, setReport] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('analyzeWitnessContradictions', {
        witness_statement_ids: witnessIds,
        evidence_ids: evidenceIds,
        case_id: caseId
      });
      return response.data.analysis;
    },
    onSuccess: (data) => {
      setReport(data);
    }
  });

  const toggleExpanded = (id) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedItems(newSet);
  };

  const downloadReport = () => {
    const reportText = generateReportText();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
    element.setAttribute('download', `contradiction-report-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateReportText = () => {
    if (!report) return '';
    let text = 'WITNESS CONTRADICTION ANALYSIS REPORT\n';
    text += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (report.summary) {
      text += `SUMMARY\n`;
      text += `Overall Reliability Score: ${report.summary.overall_reliability_score}%\n`;
      text += `Total Contradictions: ${report.summary.total_contradictions}\n`;
      text += `Critical Issues: ${report.summary.critical_issues}\n`;
      if (report.summary.key_risks && report.summary.key_risks.length > 0) {
        text += `Key Risks: ${report.summary.key_risks.join(', ')}\n`;
      }
      text += '\n';
    }

    if (report.contradictions && report.contradictions.length > 0) {
      text += `CONTRADICTIONS (${report.contradictions.length})\n`;
      report.contradictions.forEach((item, idx) => {
        text += `\n${idx + 1}. ${item.type.replace(/_/g, ' ').toUpperCase()}\n`;
        text += `   Severity: ${item.severity}\n`;
        text += `   Witness: ${item.witness_source}\n`;
        text += `   Statement: "${item.statement_excerpt}"\n`;
        text += `   Conflict: ${item.conflicting_evidence}\n`;
        text += `   Legal Significance: ${item.legal_significance}\n`;
      });
      text += '\n';
    }

    if (report.corroborations && report.corroborations.length > 0) {
      text += `CORROBORATIONS (${report.corroborations.length})\n`;
      report.corroborations.forEach((item, idx) => {
        text += `\n${idx + 1}. ${item.corroborated_fact}\n`;
        text += `   Witness: ${item.witness_source}\n`;
        text += `   Evidence: ${item.supporting_evidence}\n`;
        text += `   Confidence: ${item.confidence}\n`;
      });
    }

    return text;
  };

  if (!report && !mutation.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Witness Contradiction Analysis
          </CardTitle>
          <CardDescription>Analyze witness statements against evidence for inconsistencies</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Analyze Contradictions
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mutation.isPending) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-600">Analyzing witness statements against evidence...</p>
        </CardContent>
      </Card>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {report.summary && (
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">Reliability Score</p>
                <p className="text-2xl font-bold text-slate-900">{report.summary.overall_reliability_score}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Total Issues</p>
                <p className="text-2xl font-bold text-orange-600">{report.summary.total_contradictions}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Critical</p>
                <p className="text-2xl font-bold text-red-600">{report.summary.critical_issues}</p>
              </div>
              <div>
                <Button size="sm" onClick={downloadReport} variant="outline">
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
              </div>
            </div>
            {report.summary.key_risks && report.summary.key_risks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-2">Key Risks</p>
                <div className="flex flex-wrap gap-2">
                  {report.summary.key_risks.map((risk, idx) => (
                    <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {risk}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contradictions */}
      {report.contradictions && report.contradictions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Contradictions ({report.contradictions.length})
          </h3>
          <div className="space-y-3">
            {report.contradictions.map((item, idx) => {
              const config = severityConfig[item.severity] || severityConfig.low;
              const Icon = config.icon;
              const isExpanded = expandedItems.has(`contradiction-${idx}`);

              return (
                <Card key={idx} className={`border ${config.color}`}>
                  <div
                    className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
                    onClick={() => toggleExpanded(`contradiction-${idx}`)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.text}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm capitalize text-slate-900">
                            {item.type.replace(/_/g, ' ')}
                          </p>
                          <Badge className={config.badge}>{item.severity}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          <span className="font-medium">Witness:</span> {item.witness_source}
                        </p>
                        {!isExpanded && (
                          <p className="text-sm text-slate-700 line-clamp-2 italic">"{item.statement_excerpt}"</p>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-slate-200">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-1">Statement</p>
                          <p className="text-sm text-slate-700 italic">"{item.statement_excerpt}"</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-1">Conflicting Evidence</p>
                          <p className="text-sm text-slate-700">{item.conflicting_evidence}</p>
                        </div>
                        {item.dates_involved && item.dates_involved.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Dates Involved
                            </p>
                            <p className="text-sm text-slate-700">{item.dates_involved.join(' vs ')}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-1">Legal Significance</p>
                          <p className="text-sm text-slate-700">{item.legal_significance}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Corroborations */}
      {report.corroborations && report.corroborations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Corroborations ({report.corroborations.length})
          </h3>
          <div className="space-y-3">
            {report.corroborations.map((item, idx) => (
              <Card key={idx} className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 mb-2">{item.corroborated_fact}</p>
                      <p className="text-xs text-slate-600 mb-1">
                        <span className="font-medium">Witness:</span> {item.witness_source}
                      </p>
                      <p className="text-xs text-slate-600 mb-2">
                        <span className="font-medium">Supporting Evidence:</span> {item.supporting_evidence}
                      </p>
                      <Badge className="bg-green-100 text-green-800">{item.confidence} confidence</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Button onClick={() => mutation.mutate()} variant="outline" className="w-full">
        <RefreshCw className="w-4 h-4 mr-2" /> Re-analyze
      </Button>
    </div>
  );
}