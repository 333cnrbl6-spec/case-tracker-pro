import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, CheckCircle2, Clock, ShieldAlert, TrendingDown, TrendingUp,
  AlertTriangle, FileText, Calendar, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { differenceInDays, format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { Link } from 'react-router-dom';

const SEVERITY_COLOR = {
  critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', bar: '#ef4444' },
  high:     { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', bar: '#f97316' },
  medium:   { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', bar: '#f59e0b' },
  low:      { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', bar: '#3b82f6' },
};

const RICS_RULES = [
  'PS-1 Competence',
  'PS-2 Client Care',
  'PS-3 Standards & Quality',
  'PS-4 Conflicts of Interest',
  'PS-5 Complaints Handling',
  'PS-6 Documentation',
  'Conduct & Behaviour',
  'Honesty and Integrity',
];

// Mandatory RICS filing deadlines (relative to today for demonstration)
const TODAY = new Date();
const FILING_DEADLINES = [
  { label: 'RICS Annual Return', date: format(addDays(TODAY, 18), 'yyyy-MM-dd'), rule: 'Regulatory', mandatory: true },
  { label: 'CPD Completion Declaration', date: format(addDays(TODAY, 42), 'yyyy-MM-dd'), rule: 'Competence', mandatory: true },
  { label: 'PI Insurance Renewal', date: format(addDays(TODAY, 7), 'yyyy-MM-dd'), rule: 'Regulatory', mandatory: true },
  { label: 'Complaints Log Submission', date: format(addDays(TODAY, 61), 'yyyy-MM-dd'), rule: 'PS-5 Complaints Handling', mandatory: true },
  { label: 'Ethics Declaration', date: format(addDays(TODAY, 90), 'yyyy-MM-dd'), rule: 'Honesty and Integrity', mandatory: false },
];

export default function RICSComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: incidents = [], isLoading: loadingIncidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['legalCases'],
    queryFn: () => base44.entities.LegalCase.list(),
  });

  const isLoading = loadingIncidents;

  // Compute derived metrics
  const metrics = useMemo(() => {
    const withRics = incidents.filter(i => {
      const v = (i.rics_violations ?? i.data?.rics_violations) || [];
      return v.length > 0;
    });

    const open = withRics.filter(i => {
      const s = i.status ?? i.data?.status;
      return s === 'open' || s === 'reviewed';
    });

    const resolved = withRics.filter(i => {
      const s = i.status ?? i.data?.status;
      return s === 'assessed' || s === 'escalated';
    });

    // Breaches by RICS rule
    const ruleCount = {};
    withRics.forEach(i => {
      const violations = (i.rics_violations ?? i.data?.rics_violations) || [];
      violations.forEach(v => {
        const key = RICS_RULES.find(r => r.toLowerCase().includes(v.toLowerCase().split(' ')[0])) || v;
        ruleCount[key] = (ruleCount[key] || 0) + 1;
      });
    });

    const byRule = Object.entries(ruleCount)
      .map(([rule, count]) => ({ rule: rule.length > 20 ? rule.slice(0, 20) + '…' : rule, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    // Breaches by severity
    const bySeverity = ['critical', 'high', 'medium', 'low'].map(sev => ({
      severity: sev,
      count: withRics.filter(i => (i.severity ?? i.data?.severity) === sev).length,
    }));

    // Monthly trend (last 6 months)
    const monthlyMap = {};
    withRics.forEach(i => {
      const d = i.date ?? i.data?.date;
      if (!d) return;
      const key = d.slice(0, 7); // YYYY-MM
      monthlyMap[key] = (monthlyMap[key] || 0) + 1;
    });
    const sortedMonths = Object.keys(monthlyMap).sort().slice(-6);
    const trend = sortedMonths.map(m => ({
      month: format(parseISO(m + '-01'), 'MMM yy'),
      breaches: monthlyMap[m],
    }));

    // Resolution rate
    const resolutionRate = withRics.length > 0 ? Math.round((resolved.length / withRics.length) * 100) : 0;

    return { withRics, open, resolved, byRule, bySeverity, trend, resolutionRate, total: withRics.length };
  }, [incidents]);

  // Upcoming deadlines sorted by urgency
  const deadlines = useMemo(() => {
    return FILING_DEADLINES.map(d => ({
      ...d,
      daysUntil: differenceInDays(parseISO(d.date), TODAY),
    })).sort((a, b) => a.daysUntil - b.daysUntil);
  }, []);

  const urgentDeadlines = deadlines.filter(d => d.daysUntil <= 14);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">RICS Compliance Progress</h1>
            <p className="text-slate-500 mt-1">Open breaches, resolution timelines &amp; mandatory filing deadlines</p>
          </div>
          <div className="flex gap-2">
            <Link to="/assessment">
              <Button variant="outline" className="gap-2"><ShieldAlert className="w-4 h-4" /> Run Assessment</Button>
            </Link>
            <Link to="/rics-rules">
              <Button className="gap-2 bg-slate-900 hover:bg-slate-800"><FileText className="w-4 h-4" /> Rules Library</Button>
            </Link>
          </div>
        </div>

        {/* Urgent deadline banner */}
        {urgentDeadlines.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {urgentDeadlines.length} mandatory deadline{urgentDeadlines.length > 1 ? 's' : ''} due within 14 days
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {urgentDeadlines.map(d => `${d.label} (${d.daysUntil}d)`).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<ShieldAlert className="w-5 h-5 text-red-500" />} label="Total RICS Breaches" value={metrics.total} sub="across all incidents" />
          <StatCard icon={<AlertCircle className="w-5 h-5 text-orange-500" />} label="Open Breaches" value={metrics.open.length} sub="awaiting resolution" accent />
          <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="Resolution Rate" value={`${metrics.resolutionRate}%`} sub={`${metrics.resolved.length} resolved`} />
          <StatCard icon={<Calendar className="w-5 h-5 text-blue-500" />} label="Upcoming Deadlines" value={deadlines.length} sub={`${urgentDeadlines.length} urgent`} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-200 p-1 rounded-lg w-fit">
          {['overview', 'breaches', 'deadlines'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Breaches by Severity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Breaches by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton /> : (
                  <div className="space-y-3">
                    {metrics.bySeverity.map(({ severity, count }) => (
                      <div key={severity}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={`capitalize font-medium ${SEVERITY_COLOR[severity]?.text}`}>{severity}</span>
                          <span className="font-bold text-slate-900">{count}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: metrics.total ? `${(count / metrics.total) * 100}%` : '0%', backgroundColor: SEVERITY_COLOR[severity]?.bar }}
                          />
                        </div>
                      </div>
                    ))}
                    {metrics.total === 0 && <p className="text-sm text-slate-400 text-center py-4">No RICS violations logged yet</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Breach Trend (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton /> : metrics.trend.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No historical data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={metrics.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="breaches" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Breaches by Rule */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Open Breaches by RICS Rule</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton /> : metrics.byRule.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No RICS rule violations identified</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={metrics.byRule} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="rule" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {metrics.byRule.map((_, i) => (
                          <Cell key={i} fill={['#6366f1','#f97316','#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6'][i % 7]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'breaches' && (
          <div className="space-y-3">
            {isLoading ? <Skeleton /> : metrics.open.length === 0 ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-8 pb-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No open RICS breaches</p>
                </CardContent>
              </Card>
            ) : (
              metrics.open.map((incident) => {
                const d = incident.data ?? incident;
                const severity = d.severity ?? 'medium';
                const colors = SEVERITY_COLOR[severity] ?? SEVERITY_COLOR.medium;
                const violations = (d.rics_violations || []);
                const daysSince = d.date ? differenceInDays(TODAY, parseISO(d.date)) : null;
                return (
                  <Card key={incident.id} className={`border ${colors.border} ${colors.bg}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
                            <p className="font-semibold text-slate-900">{d.title}</p>
                            <Badge className={`${colors.bg} ${colors.text} text-xs capitalize`}>{severity}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">
                            {d.incident_type?.replace(/_/g, ' ')} · Logged: {d.date}
                            {daysSince !== null && <span className="ml-2 font-medium text-slate-600">({daysSince}d ago)</span>}
                          </p>
                          {violations.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {violations.map((v, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Link to="/incidents">
                          <Button size="sm" variant="outline" className="gap-1 shrink-0">
                            View <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'deadlines' && (
          <div className="space-y-3">
            {deadlines.map((d, idx) => {
              const isOverdue = d.daysUntil < 0;
              const isUrgent = d.daysUntil >= 0 && d.daysUntil <= 14;
              const statusColor = isOverdue
                ? 'bg-red-50 border-red-200'
                : isUrgent
                ? 'bg-orange-50 border-orange-200'
                : 'bg-white border-slate-200';
              const badgeClass = isOverdue
                ? 'bg-red-100 text-red-700'
                : isUrgent
                ? 'bg-orange-100 text-orange-700'
                : 'bg-slate-100 text-slate-600';
              return (
                <Card key={idx} className={`border ${statusColor}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className={`w-5 h-5 flex-shrink-0 ${isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-slate-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{d.label}</p>
                            {d.mandatory && <Badge className="text-xs bg-red-100 text-red-700">Mandatory</Badge>}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{d.rule} · Due {format(parseISO(d.date), 'd MMM yyyy')}</p>
                        </div>
                      </div>
                      <Badge className={`shrink-0 ${badgeClass}`}>
                        {isOverdue ? `${Math.abs(d.daysUntil)}d overdue` : `${d.daysUntil}d remaining`}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          {icon}
        </div>
        <p className={`text-3xl font-bold ${accent ? 'text-orange-600' : 'text-slate-900'}`}>{value}</p>
        <p className="text-xs text-slate-400 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function Skeleton() {
  return <div className="h-40 bg-slate-100 rounded-lg animate-pulse" />;
}