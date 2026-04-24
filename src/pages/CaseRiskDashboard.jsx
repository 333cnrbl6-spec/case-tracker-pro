import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, RefreshCw, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const riskLevelColors = {
  critical: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-600 text-white', text: 'text-red-800' },
  high: { bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-600 text-white', text: 'text-orange-800' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', badge: 'bg-yellow-600 text-white', text: 'text-yellow-800' },
  low: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-600 text-white', text: 'text-green-800' },
};

function RiskScoreBar({ score }) {
  const color = score >= 75 ? 'bg-red-600' : score >= 60 ? 'bg-orange-600' : score >= 40 ? 'bg-yellow-600' : 'bg-green-600';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="font-bold text-sm w-8">{score}</span>
    </div>
  );
}

export default function CaseRiskDashboard() {
  const [caseRisks, setCaseRisks] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: cases = [] } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list(),
  });

  const activeCases = cases.filter(c => c.status !== 'closed' && c.status !== 'settled');

  const calculateAllRisks = async () => {
    setIsCalculating(true);
    const newRisks = {};

    for (const caseItem of activeCases) {
      try {
        const response = await base44.functions.invoke('calculateCaseRiskScore', { case_id: caseItem.id });
        newRisks[caseItem.id] = response;
      } catch (err) {
        console.error(`Error calculating risk for ${caseItem.case_ref}:`, err);
        newRisks[caseItem.id] = { error: err.message };
      }
    }

    setCaseRisks(newRisks);
    setIsCalculating(false);
    toast.success(`Risk analysis complete for ${activeCases.length} case${activeCases.length > 1 ? 's' : ''}`);
  };

  // Auto-calculate on load
  useEffect(() => {
    if (activeCases.length > 0 && Object.keys(caseRisks).length === 0) {
      calculateAllRisks();
    }
  }, [activeCases.length]);

  const sortedRisks = Object.values(caseRisks)
    .filter(r => !r.error)
    .sort((a, b) => b.risk_score - a.risk_score);

  const criticalCases = sortedRisks.filter(r => r.risk_level === 'critical');
  const highCases = sortedRisks.filter(r => r.risk_level === 'high');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Case Risk Dashboard</h1>
            <p className="text-slate-600 mt-1">AI-driven risk analysis: client contact, overdue tasks, compliance gaps</p>
          </div>
          <Button
            onClick={calculateAllRisks}
            disabled={isCalculating}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> Re-calculate All
              </>
            )}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-slate-500">Active Cases</p>
              <p className="text-3xl font-bold text-slate-900">{activeCases.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-600">
            <CardContent className="pt-4">
              <p className="text-sm text-red-700 font-semibold">Critical Risk</p>
              <p className="text-3xl font-bold text-red-600">{criticalCases.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-600">
            <CardContent className="pt-4">
              <p className="text-sm text-orange-700 font-semibold">High Risk</p>
              <p className="text-3xl font-bold text-orange-600">{highCases.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-slate-500">Avg Risk Score</p>
              <p className="text-3xl font-bold text-slate-900">
                {sortedRisks.length > 0 ? Math.round(sortedRisks.reduce((sum, r) => sum + r.risk_score, 0) / sortedRisks.length) : 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* At-Risk Cases Alert */}
        {criticalCases.length > 0 && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="pt-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">{criticalCases.length} case{criticalCases.length > 1 ? 's' : ''} at critical risk</p>
                <p className="text-xs text-red-800 mt-1">Requires immediate action: limitation dates approaching, overdue tasks, or no client contact</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Breakdown by Level */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Critical & High */}
          {(criticalCases.length > 0 || highCases.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5 text-red-600" /> Urgent Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...criticalCases, ...highCases].slice(0, 5).map(risk => (
                  <Link key={risk.case_id} to={`/case-manager`}>
                    <div className={`p-3 rounded-lg border ${riskLevelColors[risk.risk_level].bg} ${riskLevelColors[risk.risk_level].border} cursor-pointer hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900">{risk.case_ref}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{risk.client_name}</p>
                          {risk.ai_summary && (
                            <p className="text-xs text-slate-700 mt-1 italic">{risk.ai_summary}</p>
                          )}
                        </div>
                        <Badge className={riskLevelColors[risk.risk_level].badge}>{risk.risk_level.toUpperCase()}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-indigo-600" /> Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['critical', 'high', 'medium', 'low'].map(level => {
                const count = sortedRisks.filter(r => r.risk_level === level).length;
                const percent = sortedRisks.length > 0 ? Math.round((count / sortedRisks.length) * 100) : 0;
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium capitalize">{level}</span>
                      <span className="text-xs font-semibold">{count} ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          level === 'critical' ? 'bg-red-600' :
                          level === 'high' ? 'bg-orange-600' :
                          level === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* All Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>All Active Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedRisks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No risk data available. Click "Re-calculate All" to generate analysis.</p>
            ) : (
              <div className="space-y-3">
                {sortedRisks.map(risk => {
                  const level = risk.risk_level || 'low';
                  return (
                    <Link key={risk.case_id} to={`/case-manager`}>
                      <div className={`p-4 rounded-lg border ${riskLevelColors[level].bg} ${riskLevelColors[level].border} hover:shadow-md transition-shadow cursor-pointer`}>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{risk.case_ref} — {risk.client_name}</p>
                          </div>
                          <Badge className={riskLevelColors[level].badge}>{level.toUpperCase()}</Badge>
                      </div>

                      <RiskScoreBar score={risk.risk_score} />

                      {risk.risk_factors && risk.risk_factors.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-700 mb-2">Risk Factors:</p>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {risk.risk_factors.slice(0, 3).map((factor, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-red-600">•</span> {factor}
                              </li>
                            ))}
                            {risk.risk_factors.length > 3 && (
                              <li className="text-slate-500">+{risk.risk_factors.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {risk.metrics && (
                        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <p className="text-slate-500">Contact</p>
                            <p className="font-semibold text-slate-900">{risk.metrics.days_since_contact === 999 ? 'Never' : `${risk.metrics.days_since_contact}d ago`}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Limitation</p>
                            <p className="font-semibold text-slate-900">{risk.metrics.days_to_limitation === null ? 'N/A' : `${risk.metrics.days_to_limitation}d`}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Overdue</p>
                            <p className="font-semibold text-slate-900">{risk.metrics.overdue_tasks}/{risk.metrics.total_tasks}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Evidence</p>
                            <p className="font-semibold text-slate-900">{risk.metrics.evidence_count}</p>
                          </div>
                        </div>
                      )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}