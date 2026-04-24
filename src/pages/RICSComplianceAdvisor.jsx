import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, Zap, ArrowRight } from 'lucide-react';

const SeverityIcon = ({ severity }) => {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    case 'high':
      return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    case 'medium':
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    default:
      return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
  }
};

const SeverityBadge = ({ severity }) => {
  const colors = {
    critical: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100',
    high: 'bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100',
    medium: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100',
    low: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
  };
  return <Badge className={colors[severity] || colors.low}>{severity.toUpperCase()}</Badge>;
};

export default function RICSComplianceAdvisor() {
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  // Fetch cases
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.LegalCase.list('-updated_date', 50),
  });

  // Analyze case mutation
  const analyzeMutation = useMutation({
    mutationFn: (caseId) =>
      base44.functions.invoke('analyzeRICSCompliance', { caseId }),
    onSuccess: (response) => {
      setAnalysis(response.data);
    },
  });

  const selectedCase = useMemo(
    () => cases.find(c => c.id === selectedCaseId),
    [cases, selectedCaseId]
  );

  const handleAnalyze = () => {
    if (selectedCaseId) {
      analyzeMutation.mutate(selectedCaseId);
    }
  };

  const breachCount = analysis?.analysis?.potential_breaches?.length || 0;
  const actionCount = analysis?.analysis?.recommended_actions?.length || 0;
  const complianceScore = analysis?.analysis?.compliance_score || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">RICS Compliance Advisor</h1>
        <p className="text-slate-600 dark:text-slate-400">
          AI-powered analysis of your cases against RICS professional standards
        </p>
      </div>

      {/* Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Analyze Case
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Case</label>
            <select
              value={selectedCaseId || ''}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="">Choose a case...</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_ref} - {c.client_name} ({c.case_type})
                </option>
              ))}
            </select>
          </div>

          {selectedCase && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {selectedCase.case_ref}: {selectedCase.client_name} vs {selectedCase.opponent_name}
              </p>
              <p className="text-blue-800 dark:text-blue-200 text-xs mt-1">
                Status: {selectedCase.status} | Limitation: {selectedCase.limitation_date}
              </p>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={!selectedCaseId || analyzeMutation.isPending}
            className="w-full gap-2"
          >
            {analyzeMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Analyze for Compliance
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Compliance Score */}
          <Card className={`border-2 ${
            complianceScore >= 80 ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' :
            complianceScore >= 60 ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20' :
            'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Compliance Score</p>
                  <p className="text-4xl font-bold mt-2">{Math.round(complianceScore)}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {analysis.analysis.summary}
                  </p>
                </div>
                <div className="text-6xl font-bold opacity-20">
                  {Math.round(complianceScore)}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Potential Breaches */}
          {breachCount > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Potential Breaches ({breachCount})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.analysis.potential_breaches.map((breach, idx) => (
                  <div key={idx} className="p-4 border rounded-lg dark:border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{breach.rule_number}: {breach.rule_title}</p>
                        <p className="text-xs text-slate-500 mt-1">{breach.details}</p>
                      </div>
                      <SeverityBadge severity={breach.severity} />
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400">
                      <strong>Evidence:</strong> {breach.evidence}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Areas */}
          {analysis.analysis.risk_areas?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Risk Areas ({analysis.analysis.risk_areas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.analysis.risk_areas.map((risk, idx) => (
                  <div key={idx} className="p-4 border rounded-lg dark:border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">{risk.area}</p>
                      <SeverityBadge severity={risk.risk_level} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{risk.explanation}</p>
                    {risk.related_rules?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {risk.related_rules.map((rule) => (
                          <Badge key={rule} variant="outline" className="text-xs">
                            {rule}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommended Actions */}
          {actionCount > 0 && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Recommended Actions ({actionCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.analysis.recommended_actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm flex-1">{action.action}</p>
                      <SeverityBadge severity={action.priority} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <span>Due in: {action.deadline_days} days</span>
                      <span>Assigned to: {action.responsible}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Analysis Metadata */}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Analysis completed: {new Date(analysis.analysis_date).toLocaleString()}
          </div>
        </>
      )}

      {/* Empty State */}
      {!analysis && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              Select a case above to begin compliance analysis
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}