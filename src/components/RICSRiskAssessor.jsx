import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield, Loader2, RefreshCw, AlertTriangle, ChevronDown, ChevronUp,
  TrendingUp, Search, Zap, CheckCircle2, AlertCircle, Target, BookOpen
} from 'lucide-react';

const RISK_COLORS = {
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-800 border-green-300' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800 border-orange-300' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-800 border-red-300' },
};

const CATEGORY_LABELS = {
  rics_violation_risk: 'RICS Violation Risk',
  evidence_integrity_risk: 'Evidence Integrity',
  communication_conduct_risk: 'Communication Conduct',
  documentation_gap_risk: 'Documentation Gaps',
  task_compliance_risk: 'Task Compliance',
  pattern_escalation_risk: 'Pattern Escalation',
};

const PRIORITY_ICON = {
  critical: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
  high: <AlertCircle className="w-3.5 h-3.5 text-orange-500" />,
  medium: <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />,
  low: <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />,
};

const CATEGORY_ICON = {
  pattern: <TrendingUp className="w-3 h-3" />,
  documentation: <BookOpen className="w-3 h-3" />,
  communication: <AlertCircle className="w-3 h-3" />,
  evidence: <Search className="w-3 h-3" />,
  ocr_contradiction: <Zap className="w-3 h-3" />,
  rics_violation: <Shield className="w-3 h-3" />,
};

function CategoryBar({ label, value }) {
  const color = value >= 75 ? 'bg-red-500' : value >= 50 ? 'bg-orange-500' : value >= 25 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-700">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function RICSRiskAssessor({ ocrSignals = null, compact = false }) {
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [expanded, setExpanded] = useState({ factors: false, investigations: false, actions: true });
  const queryClient = useQueryClient();

  // Load latest stored assessment
  const { data: storedRisks = [] } = useQuery({
    queryKey: ['complianceRisks'],
    queryFn: () => base44.entities.ComplianceRisk.list('-assessment_date', 1),
  });
  const latestStored = storedRisks[0];

  const run = async () => {
    setLoading(true);
    try {
      const payload = { case_id: null };
      if (ocrSignals) {
        payload.ocr_signals = {
          contradiction_count: ocrSignals.contradictions?.length || 0,
          new_fact_count: ocrSignals.new_facts?.length || 0,
          rics_flags: ocrSignals.rics_flags || [],
          overall_assessment: ocrSignals.overall_assessment || '',
          contradictions: ocrSignals.contradictions || [],
        };
      }
      const res = await base44.functions.invoke('analyzeComplianceRisk', payload);
      setAssessment(res.data?.risk_assessment);
      queryClient.invalidateQueries({ queryKey: ['complianceRisks'] });
    } catch (error) {
      console.error('Risk assessment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const data = assessment || (latestStored ? {
    overall_risk_score: latestStored.overall_risk_score,
    risk_level: latestStored.risk_level,
    executive_summary: latestStored.details ? JSON.parse(latestStored.details).executive_summary : null,
    risk_categories: latestStored.risk_categories ? JSON.parse(latestStored.risk_categories) : {},
    predicted_failures: latestStored.predicted_failures ? JSON.parse(latestStored.predicted_failures) : [],
    risk_factors: latestStored.risk_factors ? JSON.parse(latestStored.risk_factors) : [],
    recommended_actions: latestStored.recommended_actions ? JSON.parse(latestStored.recommended_actions) : [],
    further_investigations: latestStored.details ? (JSON.parse(latestStored.details).further_investigations || []) : [],
    ocr_risk_elevation: latestStored.details ? JSON.parse(latestStored.details).ocr_risk_elevation : null,
    confidence_score: latestStored.confidence_score,
  } : null);

  const colors = data ? (RISK_COLORS[data.risk_level] || RISK_COLORS.medium) : null;

  return (
    <Card className={`${colors ? `${colors.border} ${colors.bg}` : 'border-slate-200'} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base">Automated RICS Risk Assessment</CardTitle>
            {data && (
              <Badge className={`text-xs border ${colors.badge}`}>
                {data.risk_level?.toUpperCase()} — {data.overall_risk_score}/100
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            onClick={run}
            disabled={loading}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs h-8"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {data ? 'Re-analyse' : 'Run Assessment'}
          </Button>
        </div>
        {latestStored && !assessment && (
          <p className="text-xs text-slate-500 mt-1">Last assessed: {latestStored.assessment_date} · Confidence: {latestStored.confidence_score}%</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-3 py-4 bg-indigo-50 border border-indigo-200 rounded-lg px-4">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-indigo-900">Running full RICS compliance risk analysis…</p>
              <p className="text-xs text-indigo-600">Analysing incident patterns, RICS violations, evidence integrity, OCR contradictions</p>
            </div>
          </div>
        )}

        {!data && !loading && (
          <div className="text-center py-6 text-slate-400">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No risk assessment yet. Click "Run Assessment" to analyse all incidents, evidence, and communications.</p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Executive summary */}
            {data.executive_summary && (
              <div className="bg-white/70 rounded-lg border border-current border-opacity-20 p-3">
                <p className="text-sm text-slate-700 leading-relaxed">{data.executive_summary}</p>
              </div>
            )}

            {/* OCR elevation notice */}
            {data.ocr_risk_elevation && data.ocr_risk_elevation !== 'N/A' && (
              <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <Zap className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-800 mb-0.5">OCR Risk Elevation</p>
                  <p className="text-xs text-orange-700">{data.ocr_risk_elevation}</p>
                </div>
              </div>
            )}

            {/* Risk category bars */}
            {data.risk_categories && Object.keys(data.risk_categories).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Risk Categories</p>
                {Object.entries(data.risk_categories).map(([key, val]) => (
                  <CategoryBar key={key} label={CATEGORY_LABELS[key] || key} value={val} />
                ))}
              </div>
            )}

            {/* Recommended actions */}
            {data.recommended_actions?.length > 0 && (
              <div>
                <button
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 w-full"
                  onClick={() => setExpanded(e => ({ ...e, actions: !e.actions }))}
                >
                  <Target className="w-3.5 h-3.5" />
                  Recommended Actions ({data.recommended_actions.length})
                  {expanded.actions ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
                {expanded.actions && (
                  <div className="space-y-1.5">
                    {data.recommended_actions.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 bg-white/70 rounded-lg border border-slate-200 px-3 py-2">
                        {PRIORITY_ICON[a.priority] || PRIORITY_ICON.medium}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800">{a.action}</p>
                          {a.rationale && <p className="text-xs text-slate-500 mt-0.5">{a.rationale}</p>}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {a.rics_rule_reference && (
                              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5">{a.rics_rule_reference}</span>
                            )}
                            <span className="text-xs text-slate-400">within {a.deadline_days}d</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Predicted failures */}
            {data.predicted_failures?.length > 0 && !compact && (
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Predicted Compliance Failures</p>
                <div className="space-y-2">
                  {data.predicted_failures.slice(0, 3).map((f, i) => (
                    <div key={i} className="bg-white/70 rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-800">{f.failure_type}</span>
                        <Badge variant="outline" className="text-xs">{f.probability}% probability</Badge>
                      </div>
                      <p className="text-xs text-slate-600">{f.description}</p>
                      {f.rics_rule && <p className="text-xs text-indigo-600 mt-1">{f.rics_rule}</p>}
                      <p className="text-xs text-slate-400 mt-1">Timeframe: {f.timeframe_days} days · Severity: {f.severity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk factors */}
            {data.risk_factors?.length > 0 && !compact && (
              <div>
                <button
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 w-full"
                  onClick={() => setExpanded(e => ({ ...e, factors: !e.factors }))}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Risk Factors ({data.risk_factors.length})
                  {expanded.factors ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
                {expanded.factors && (
                  <div className="space-y-1.5">
                    {data.risk_factors.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs bg-white/60 rounded border border-slate-100 px-3 py-2">
                        <span className="text-slate-400 mt-0.5">{CATEGORY_ICON[f.category] || <AlertCircle className="w-3 h-3" />}</span>
                        <div>
                          <span className="font-medium text-slate-800">{f.factor}</span>
                          {f.evidence && <p className="text-slate-500 mt-0.5">{f.evidence}</p>}
                        </div>
                        <Badge variant="outline" className="ml-auto text-xs capitalize flex-shrink-0">{f.impact}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Further investigations */}
            {data.further_investigations?.length > 0 && !compact && (
              <div>
                <button
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 w-full"
                  onClick={() => setExpanded(e => ({ ...e, investigations: !e.investigations }))}
                >
                  <Search className="w-3.5 h-3.5" />
                  Further Investigations Needed ({data.further_investigations.length})
                  {expanded.investigations ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
                {expanded.investigations && (
                  <div className="space-y-1.5">
                    {data.further_investigations.map((inv, i) => (
                      <div key={i} className="bg-white/60 rounded border border-slate-100 px-3 py-2 text-xs">
                        <p className="font-medium text-slate-800">{inv.area}</p>
                        <p className="text-slate-500 mt-0.5">{inv.reason}</p>
                        {inv.suggested_method && <p className="text-indigo-600 mt-0.5 italic">→ {inv.suggested_method}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}