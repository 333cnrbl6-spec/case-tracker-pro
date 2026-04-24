import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, AlertTriangle, DollarSign, Shield, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#0ea5e9'];
const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-green-100 text-green-800'
};

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const calculateAnalytics = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('calculateBreachSeverity', {
        incidents: incidents.map(i => ({ id: i.id, ...i.data })),
        evidence: evidence.map(e => ({ id: e.id, ...e.data }))
      });
      setAnalytics(result.data);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Analytics calculated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to calculate analytics');
    }
  });

  const isCalculating = calculateAnalytics.isPending;

  // Initial calculation
  useEffect(() => {
    if (incidents.length > 0 && !analytics) {
      calculateAnalytics.mutate();
    }
  }, [incidents.length]);

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Analyzing incident data...</p>
        </div>
      </div>
    );
  }

  const {
    firmBreachSeverityScore,
    overallRiskLevel,
    incidentCount,
    criticalIncidentCount,
    estimatedFinancialDamage,
    risksByCategory,
    incidentTimeline,
    severityDistribution,
    ricsViolationFrequency,
    potentialLegalCosts,
    complianceGaps,
    topRisks
  } = analytics;

  const riskPercentages = (ricsViolationFrequency || []).map(item => ({
    ...item,
    percentage: Math.round((item.count / incidentCount) * 100)
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Risk Analytics Dashboard</h1>
              <p className="text-lg text-slate-600">Comprehensive incident impact analysis and breach severity assessment</p>
            </div>
            <Button
              onClick={() => calculateAnalytics.mutate()}
              disabled={isCalculating}
              variant="outline"
              className="gap-2"
            >
              {isCalculating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Analysis
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Breach Severity Score */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16 opacity-20"></div>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-600" />
                Breach Severity Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">{firmBreachSeverityScore}/100</div>
              <Badge className={SEVERITY_COLORS[overallRiskLevel]} style={{ marginTop: '0.5rem' }}>
                {overallRiskLevel.toUpperCase()} RISK
              </Badge>
              <p className="text-xs text-slate-500 mt-2">Calculated from all incidents</p>
            </CardContent>
          </Card>

          {/* Total Incidents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Total Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">{incidentCount}</div>
              <p className="text-xs text-slate-500 mt-2">
                <span className="text-red-600 font-semibold">{criticalIncidentCount}</span> critical
              </p>
            </CardContent>
          </Card>

          {/* Est. Financial Damage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Est. Financial Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">£{(estimatedFinancialDamage / 1000).toFixed(0)}K</div>
              <p className="text-xs text-slate-500 mt-2">Potential damages & costs</p>
            </CardContent>
          </Card>

          {/* Legal Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Est. Legal Costs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">£{(potentialLegalCosts / 1000).toFixed(0)}K</div>
              <p className="text-xs text-slate-500 mt-2">Solicitor & investigation</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incident Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={incidentTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Severity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Severity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(severityDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RICS Violations Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top RICS Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskPercentages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="violation" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="percentage" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={risksByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="riskScore" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Risks & Compliance Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Risks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Risk Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               {(topRisks || []).map((risk, idx) => (
                <div key={idx} className="flex justify-between items-start p-3 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{risk.issue}</p>
                    <p className="text-xs text-slate-600 mt-1">{risk.description}</p>
                  </div>
                  <Badge className={SEVERITY_COLORS[risk.severity]}>
                    {risk.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Compliance Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance Gaps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               {(complianceGaps || []).map((gap, idx) => (
                <div key={idx} className="flex justify-between items-start p-3 bg-amber-50 rounded border border-amber-200">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{gap.gap}</p>
                    <p className="text-xs text-slate-600 mt-1">{gap.action}</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-600">{gap.affectedIncidents} cases</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Risk Assessment */}
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-base">Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-700">
                Based on {incidentCount} logged incidents, the firm faces <strong>{overallRiskLevel}</strong> regulatory and financial risk.
              </p>
              <p className="text-xs text-slate-600">
                Critical incidents: {criticalIncidentCount}
              </p>
            </CardContent>
          </Card>

          {/* Financial Impact */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-base">Financial Exposure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-700">
                Estimated total exposure: <strong>£{((estimatedFinancialDamage + potentialLegalCosts) / 1000).toFixed(0)}K</strong>
              </p>
              <p className="text-xs text-slate-600">
                Damages: £{(estimatedFinancialDamage / 1000).toFixed(0)}K | Legal: £{(potentialLegalCosts / 1000).toFixed(0)}K
              </p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-700">
                Prioritize addressing <strong>{complianceGaps.length}</strong> compliance gaps to mitigate risk.
              </p>
              <p className="text-xs text-slate-600">
                Review top risk areas and escalate to leadership.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}