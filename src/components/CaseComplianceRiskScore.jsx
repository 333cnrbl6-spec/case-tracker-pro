import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

const riskLevelConfig = {
  low: { color: 'bg-green-100 text-green-900', textColor: 'text-green-700', borderColor: 'border-green-300' },
  medium: { color: 'bg-yellow-100 text-yellow-900', textColor: 'text-yellow-700', borderColor: 'border-yellow-300' },
  high: { color: 'bg-orange-100 text-orange-900', textColor: 'text-orange-700', borderColor: 'border-orange-300' },
  critical: { color: 'bg-red-100 text-red-900', textColor: 'text-red-700', borderColor: 'border-red-300' }
};

function RiskGauge({ score }) {
  const percentage = score;
  let fillColor = '#22c55e'; // green
  if (percentage > 75) fillColor = '#dc2626'; // red
  else if (percentage > 50) fillColor = '#f97316'; // orange
  else if (percentage > 25) fillColor = '#eab308'; // yellow

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={fillColor}
            strokeWidth="8"
            strokeDasharray={`${(percentage / 100) * 283} 283`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
          <text x="50" y="50" textAnchor="middle" dy="0.3em" className="text-2xl font-bold" fill="#1f2937">
            {Math.round(percentage)}
          </text>
        </svg>
      </div>
      <p className="text-xs text-slate-600 text-center">Risk Score (0-100)</p>
    </div>
  );
}

export default function CaseComplianceRiskScore({ caseId, onScoreUpdate }) {
  const [expanded, setExpanded] = useState(false);

  // Fetch latest risk assessment
  const { data: latestRisk } = useQuery({
    queryKey: ['complianceRisk', caseId],
    queryFn: async () => {
      const risks = await base44.entities.ComplianceRisk.filter({ case_id: caseId });
      if (risks.length === 0) return null;
      return risks.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
    }
  });

  // Calculate risk score mutation
  const calculateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('calculateComplianceRiskScore', {
        case_id: caseId
      });
      return response.data.risk_score;
    },
    onSuccess: (data) => {
      onScoreUpdate?.(data);
    }
  });

  const riskData = latestRisk ? {
    score: latestRisk.overall_risk_score,
    level: latestRisk.risk_level,
    categories: latestRisk.risk_categories ? JSON.parse(latestRisk.risk_categories) : {},
    factors: latestRisk.risk_factors ? JSON.parse(latestRisk.risk_factors) : {},
    actions: latestRisk.recommended_actions ? JSON.parse(latestRisk.recommended_actions) : [],
    confidence: latestRisk.confidence_score,
    date: latestRisk.assessment_date
  } : null;

  const config = riskData ? riskLevelConfig[riskData.level] || riskLevelConfig.medium : riskLevelConfig.low;

  return (
    <Card className={`border-2 ${riskData ? config.borderColor : 'border-slate-200'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Compliance Risk Score
            </CardTitle>
            <CardDescription>
              {riskData ? `Last assessed on ${new Date(riskData.date).toLocaleDateString()}` : 'No assessment yet'}
            </CardDescription>
          </div>
          <Button 
            onClick={() => calculateMutation.mutate()} 
            disabled={calculateMutation.isPending}
            size="sm"
            variant="outline"
          >
            {calculateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {calculateMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-600">Calculating risk score...</p>
          </div>
        ) : riskData ? (
          <>
            {/* Risk Score Display */}
            <div className="flex items-center gap-6">
              <RiskGauge score={riskData.score} />
              <div className="flex-1 space-y-3">
                <div>
                  <Badge className={config.color}>
                    {riskData.level.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${riskData.confidence}%` }} 
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{riskData.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {Object.keys(riskData.categories).length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-semibold mb-3 text-slate-700">Risk by Category</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(riskData.categories).map(([category, score]) => (
                    <div key={category} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 capitalize mb-1">
                        {category.replace(/_/g, ' ')}
                      </p>
                      <p className="text-lg font-bold text-slate-900">{score}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Critical Findings */}
            {riskData.factors?.findings && riskData.factors.findings.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2 text-slate-700">
                  <AlertCircle className="w-4 h-4" />
                  Critical Findings ({riskData.factors.findings.length})
                </p>
                <ul className="space-y-1">
                  {riskData.factors.findings.slice(0, 3).map((finding, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-red-500 flex-shrink-0">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expandable Details */}
            {(riskData.factors?.gaps?.length > 0 || riskData.actions?.length > 0) && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {expanded ? '▼' : '▶'} Details & Remediation
                </button>

                {expanded && (
                  <div className="mt-3 space-y-3">
                    {/* Evidence Gaps */}
                    {riskData.factors?.gaps && riskData.factors.gaps.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-yellow-900 mb-2">Evidence Gaps</p>
                        <ul className="space-y-1">
                          {riskData.factors.gaps.map((gap, idx) => (
                            <li key={idx} className="text-xs text-yellow-800 flex gap-2">
                              <span className="flex-shrink-0">→</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Remediation Actions */}
                    {riskData.actions && riskData.actions.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Remediation Priority
                        </p>
                        <ol className="space-y-1">
                          {riskData.actions.map((action, idx) => (
                            <li key={idx} className="text-xs text-green-800">
                              <span className="font-semibold">{idx + 1}.</span> {action}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-600 mb-4">No risk assessment yet. Click refresh to calculate.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}