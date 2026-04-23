import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  AlertTriangle, ShieldAlert, Clock, TrendingUp, TrendingDown,
  Activity, CheckCircle2, Loader2, ArrowUpRight,
} from 'lucide-react';
import { format, parseISO, differenceInDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

/* ─── Palette ────────────────────────────────────────────── */
const SEVERITY_PALETTE = { low: '#3b82f6', medium: '#f59e0b', high: '#f97316', critical: '#dc2626' };
const STATUS_PALETTE   = { open: '#94a3b8', reviewed: '#3b82f6', assessed: '#f59e0b', escalated: '#dc2626' };
const BAR_COLORS = ['#1e40af','#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe'];

/* ─── Helpers ────────────────────────────────────────────── */
function kpi(value, label, icon, color = 'text-slate-900', sub = '') {
  return { value, label, icon, color, sub };
}

function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

/* ─── Sub-components ─────────────────────────────────────── */
function KPICard({ value, label, icon: IconComp, color, sub, trend }) {
  const Icon = IconComp;
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          </div>
          <div className="p-2 bg-slate-50 rounded-lg">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-red-500' : 'text-green-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}% vs last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function ExecutiveDashboard() {
  const { data: incidents = [], isLoading: loadingI } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-date'),
    refetchInterval: 60_000,
  });
  const { data: tasks = [], isLoading: loadingT } = useQuery({
    queryKey: ['incident-tasks'],
    queryFn: () => base44.entities.IncidentTask.list(),
    refetchInterval: 60_000,
  });

  const loading = loadingI || loadingT;

  /* ── Derived metrics ── */
  const metrics = useMemo(() => {
    if (!incidents.length) return null;

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd   = endOfMonth(subMonths(now, 1));

    const thisMonth = incidents.filter(i => i.date && parseISO(i.date) >= thisMonthStart);
    const lastMonth = incidents.filter(i => {
      if (!i.date) return false;
      const d = parseISO(i.date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const incidentTrend = lastMonth.length
      ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100)
      : 0;

    // Active (open + reviewed)
    const active = incidents.filter(i => ['open', 'reviewed'].includes(i.status));
    const escalated = incidents.filter(i => i.status === 'escalated');
    const resolved  = incidents.filter(i => ['assessed'].includes(i.status));

    // Avg time-to-resolution (days) — from date to completion_date on task
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.deadline && t.completion_date);
    const resolutionTimes = completedTasks.map(t => {
      const inc = incidents.find(i => i.id === t.incident_id);
      if (!inc?.date) return null;
      return differenceInDays(parseISO(t.completion_date), parseISO(inc.date));
    }).filter(d => d !== null && d >= 0);
    const avgResolutionDays = Math.round(avg(resolutionTimes)) || null;

    // Monthly volume (last 6 months)
    const monthlyVolume = Array.from({ length: 6 }, (_, i) => {
      const mo = subMonths(now, 5 - i);
      const start = startOfMonth(mo);
      const end   = endOfMonth(mo);
      const count = incidents.filter(inc => inc.date && parseISO(inc.date) >= start && parseISO(inc.date) <= end).length;
      const openCount = incidents.filter(inc =>
        inc.date && parseISO(inc.date) >= start && parseISO(inc.date) <= end && inc.status !== 'assessed'
      ).length;
      return { month: format(mo, 'MMM yy'), total: count, open: openCount, resolved: count - openCount };
    });

    // RICS breach frequency
    const ricsMap = {};
    incidents.forEach(inc => {
      (inc.rics_violations || []).forEach(rule => {
        ricsMap[rule] = (ricsMap[rule] || 0) + 1;
      });
    });
    const ricsFrequency = Object.entries(ricsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([rule, count], i) => ({ rule, count, fill: BAR_COLORS[i % BAR_COLORS.length] }));

    // Severity breakdown
    const severityData = ['critical', 'high', 'medium', 'low'].map(s => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: incidents.filter(i => i.severity === s).length,
      fill: SEVERITY_PALETTE[s],
    })).filter(d => d.value > 0);

    // Status breakdown
    const statusData = ['open', 'reviewed', 'assessed', 'escalated'].map(s => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: incidents.filter(i => (i.status ?? 'open') === s).length,
      fill: STATUS_PALETTE[s],
    })).filter(d => d.value > 0);

    // Incident type distribution
    const typeMap = {};
    incidents.forEach(i => { typeMap[i.incident_type] = (typeMap[i.incident_type] || 0) + 1; });
    const typeData = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type: type.replace(/_/g, ' '), count }));

    return {
      total: incidents.length,
      active: active.length,
      escalated: escalated.length,
      resolved: resolved.length,
      critical: incidents.filter(i => i.severity === 'critical').length,
      incidentTrend,
      avgResolutionDays,
      monthlyVolume,
      ricsFrequency,
      severityData,
      statusData,
      typeData,
    };
  }, [incidents, tasks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!incidents.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Activity className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-500 text-sm">No incident data yet. Log incidents to see compliance trends.</p>
        </div>
      </div>
    );
  }

  const m = metrics;

  const kpis = [
    kpi(m.active,    'Active Incidents',       Activity,    m.active > 0 ? 'text-amber-600' : 'text-green-600', `${m.total} total logged`),
    kpi(m.critical,  'Critical Severity',      AlertTriangle, m.critical > 0 ? 'text-red-600' : 'text-green-600', 'Requiring immediate action'),
    kpi(m.escalated, 'Escalated Cases',        ArrowUpRight, m.escalated > 0 ? 'text-red-600' : 'text-slate-700', 'Formal/legal action triggered'),
    kpi(
      m.avgResolutionDays !== null ? `${m.avgResolutionDays}d` : 'N/A',
      'Avg. Time-to-Resolution',
      Clock,
      m.avgResolutionDays > 30 ? 'text-orange-600' : 'text-slate-900',
      'Based on completed tasks'
    ),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-600" />
              Executive Compliance Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time compliance health · Auto-refreshes every 60s · {incidents.length} incidents on record
            </p>
          </div>
          <Badge
            className={m.active === 0
              ? 'bg-green-100 text-green-800'
              : m.critical > 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}
          >
            {m.active === 0 ? '✓ All Clear' : m.critical > 0 ? '⚠ Critical Issues Active' : '● Incidents Open'}
          </Badge>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <KPICard key={i} {...k} trend={i === 0 ? m.incidentTrend : undefined} />
          ))}
        </div>

        {/* Monthly Volume Trend */}
        <div>
          <SectionHeader
            title="Incident Volume — Last 6 Months"
            subtitle="Total incidents logged per month, split by resolution status"
          />
          <Card>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={m.monthlyVolume} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="open"     name="Open / Active"  stroke="#f59e0b" fill="url(#gradOpen)"     strokeWidth={2} />
                  <Area type="monotone" dataKey="resolved" name="Assessed"        stroke="#22c55e" fill="url(#gradResolved)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* RICS Breach Frequency + Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <SectionHeader
              title="Most Frequently Breached RICS Rules"
              subtitle="Rules cited across all incidents, ranked by frequency"
            />
            <Card>
              <CardContent className="pt-4">
                {m.ricsFrequency.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> No RICS violations logged
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={m.ricsFrequency}
                      layout="vertical"
                      margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="rule" tick={{ fontSize: 11 }} width={72} />
                      <Tooltip formatter={(v) => [`${v} incidents`, 'Breaches']} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {m.ricsFrequency.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <SectionHeader title="Current Status Distribution" subtitle="Breakdown of all incidents by workflow stage" />
            <Card>
              <CardContent className="pt-4 flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={m.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {m.statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Stat row */}
                <div className="grid grid-cols-4 w-full gap-2 mt-2">
                  {m.statusData.map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-lg font-bold" style={{ color: s.fill }}>{s.value}</div>
                      <div className="text-xs text-slate-500 capitalize">{s.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Severity Distribution + Incident Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <SectionHeader title="Severity Breakdown" subtitle="All incidents by severity rating" />
            <Card>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={m.severityData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Incidents" radius={[4, 4, 0, 0]}>
                      {m.severityData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div>
            <SectionHeader title="Incident Type Breakdown" subtitle="Volume per incident category" />
            <Card>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={m.typeData}
                    layout="vertical"
                    margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="count" name="Incidents" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}