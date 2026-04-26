import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, RefreshCw, AlertCircle, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function CaseValuationInsights() {
  const [selectedCase, setSelectedCase] = useState('');
  const [expandedCase, setExpandedCase] = useState(null);
  const queryClient = useQueryClient();

  const { data: activeCases = [] } = useQuery({
    queryKey: ['activeCasesForValuation'],
    queryFn: async () => {
      const cases = await base44.entities.LegalCase.filter({ status: 'active' });
      return cases;
    }
  });

  const { data: insights = [] } = useQuery({
    queryKey: ['caseValuationInsights'],
    queryFn: async () => {
      const allInsights = await base44.entities.CaseValuationInsight.list();
      return allInsights.sort((a, b) => new Date(b.analysis_date) - new Date(a.analysis_date));
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async (caseId) => {
      const result = await base44.functions.invoke('analyzeSettlementPatterns', {
        case_id: caseId
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caseValuationInsights'] });
    }
  });

  const getInsightForCase = (caseId) => {
    return insights.find(i => i.case_id === caseId);
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getSettlementColor = (prob) => {
    if (prob >= 70) return '#10b981';
    if (prob >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">ML-Based Case Valuation Insights</h1>
        <p className="text-slate-600 mt-1">Probability-weighted valuations based on historical settlement patterns</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-slate-900">{activeCases.length}</p>
            <p className="text-sm text-slate-600 mt-2">Active Cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-slate-900">{insights.length}</p>
            <p className="text-sm text-slate-600 mt-2">Cases Analyzed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-slate-900">
              £{(insights.reduce((sum, i) => sum + (i.valuation_estimate || 0), 0) / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-slate-600 mt-2">Total Estimated Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-slate-900">
              {insights.length > 0 ? (insights.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / insights.length).toFixed(0) : 0}%
            </p>
            <p className="text-sm text-slate-600 mt-2">Avg Confidence</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="portfolio">Portfolio View</TabsTrigger>
          <TabsTrigger value="analyze">Analyze New Case</TabsTrigger>
        </TabsList>

        {/* Portfolio View */}
        <TabsContent value="portfolio" className="space-y-4 mt-6">
          {insights.length > 0 ? (
            <>
              {/* Valuation Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Valuation Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={insights.slice(0, 10).map(i => ({
                      name: i.case_ref,
                      value: (i.valuation_estimate / 1000).toFixed(0),
                      low: (i.valuation_range_low / 1000).toFixed(0),
                      high: (i.valuation_range_high / 1000).toFixed(0)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => `£${value}k`} />
                      <Bar dataKey="value" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Settlement Probability */}
              <Card>
                <CardHeader>
                  <CardTitle>Settlement Probability by Case</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={insights.slice(0, 10).map(i => ({
                      name: i.case_ref,
                      probability: i.settlement_probability
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Line type="monotone" dataKey="probability" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Cases List */}
              <div className="space-y-3">
                {insights.map((insight) => (
                  <Card
                    key={insight.id}
                    className="cursor-pointer hover:shadow-md transition"
                    onClick={() => setExpandedCase(expandedCase === insight.id ? null : insight.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                        {/* Case Info */}
                        <div>
                          <p className="font-semibold text-slate-900">{insight.case_ref}</p>
                          <p className="text-xs text-slate-500 mt-1">{format(parseISO(insight.analysis_date), 'dd MMM yyyy')}</p>
                        </div>

                        {/* Valuation */}
                        <div>
                          <p className="text-2xl font-bold text-slate-900">£{(insight.valuation_estimate / 1000).toFixed(1)}k</p>
                          <p className="text-xs text-slate-600 mt-1">
                            Range: £{(insight.valuation_range_low / 1000).toFixed(0)}k - £{(insight.valuation_range_high / 1000).toFixed(0)}k
                          </p>
                        </div>

                        {/* Settlement Probability */}
                        <div className="flex flex-col gap-2">
                          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${insight.settlement_probability}%`,
                                backgroundColor: getSettlementColor(insight.settlement_probability)
                              }}
                            />
                          </div>
                          <p className="text-xs text-slate-600">{insight.settlement_probability}% Settlement Prob.</p>
                        </div>

                        {/* Confidence */}
                        <div>
                          <Badge className={`${getConfidenceColor(insight.confidence_score)}`}>
                            {insight.confidence_score}% Confidence
                          </Badge>
                        </div>

                        {/* Risk Level */}
                        <div className="text-right">
                          {insight.risk_factors?.length > 0 && (
                            <Badge variant="outline" className="text-orange-600">
                              {insight.risk_factors.length} Risk Factors
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      {expandedCase === insight.id && (
                        <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                          {/* Analysis Summary */}
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-2">Analysis Summary</h4>
                            <p className="text-sm text-slate-700">{insight.analysis_summary}</p>
                          </div>

                          {/* Risk Factors */}
                          {insight.risk_factors?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">Risk Factors</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {insight.risk_factors.map((rf, idx) => (
                                  <div key={idx} className="bg-orange-50 p-2 rounded text-sm">
                                    <p className="text-orange-900 font-medium">{rf.factor}</p>
                                    <p className="text-xs text-orange-700">{rf.impact_percent}% impact</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Comparable Cases */}
                          {insight.comparable_cases?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">Comparable Cases</h4>
                              <div className="space-y-1 text-sm">
                                {insight.comparable_cases.slice(0, 3).map((cc, idx) => (
                                  <p key={idx} className="text-slate-700">
                                    {cc.case_type}: £{(cc.settlement_value / 1000).toFixed(0)}k ({cc.similarity_score}% similar)
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No cases analyzed yet. Start by analyzing an active case.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analyze New Case */}
        <TabsContent value="analyze" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Analyze Case Settlement Pattern
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Active Case</label>
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                >
                  <option value="">Choose a case...</option>
                  {activeCases.map(c => {
                    const hasInsight = getInsightForCase(c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.case_ref} - {c.client_name} {hasInsight ? '(analyzed)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <Button
                onClick={() => selectedCase && analyzeMutation.mutate(selectedCase)}
                disabled={!selectedCase || analyzeMutation.isPending}
                className="w-full"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing settlement patterns...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate ML Valuation
                  </>
                )}
              </Button>

              {analyzeMutation.isSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">Analysis Complete!</p>
                      <p className="text-sm text-green-700 mt-1">
                        Valuation: £{(analyzeMutation.data.valuation_estimate / 1000).toFixed(1)}k
                      </p>
                      <p className="text-sm text-green-700">
                        Confidence: {analyzeMutation.data.confidence_score}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {analyzeMutation.isError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  Error: {analyzeMutation.error?.message}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}