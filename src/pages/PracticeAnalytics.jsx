import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Briefcase, TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6'];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

export default function PracticeAnalytics() {
  const { data: cases = [] } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list(),
  });

  const metrics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeCases = cases.filter(c => c.status === 'active' || c.status === 'litigation' || c.status === 'under_review');
    const settledThisMonth = cases.filter(c => c.status === 'settled' && c.settlement_date && new Date(c.settlement_date) >= startOfMonth);
    const avgSettlementValue = settledThisMonth.length > 0
      ? settledThisMonth.reduce((s, c) => s + (c.settlement_value || 0), 0) / settledThisMonth.length
      : 0;

    const limitationNext30 = cases.filter(c => {
      const d = daysUntil(c.limitation_date);
      return d !== null && d >= 0 && d <= 30 && c.status !== 'closed' && c.status !== 'settled';
    });

    const noClientContact = cases.filter(c => {
      if (!c.last_client_contact || c.status === 'closed' || c.status === 'settled') return false;
      const days = Math.ceil((now - new Date(c.last_client_contact)) / (1000 * 60 * 60 * 24));
      return days > 30;
    });

    // Average case duration (for settled/closed)
    const closedCases = cases.filter(c => (c.status === 'settled' || c.status === 'closed') && c.incident_date);
    const avgDuration = closedCases.length > 0
      ? closedCases.reduce((s, c) => s + Math.ceil((now - new Date(c.incident_date)) / (1000 * 60 * 60 * 24)), 0) / closedCases.length
      : 0;

    // By type
    const byType = Object.entries(
      cases.reduce((acc, c) => { acc[c.case_type] = (acc[c.case_type] || 0) + 1; return acc; }, {})
    ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

    // By month (last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { month: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), count: 0, settled: 0 };
    });
    cases.forEach(c => {
      const d = new Date(c.created_date || Date.now());
      last6Months.forEach(m => {
        if (m.month === d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })) m.count++;
      });
      if (c.settlement_date) {
        const sd = new Date(c.settlement_date);
        last6Months.forEach(m => {
          if (m.month === sd.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })) m.settled++;
        });
      }
    });

    // Fee earner workload
    const byFeeEarner = Object.entries(
      cases.filter(c => c.assigned_fee_earner && c.status !== 'closed').reduce((acc, c) => {
        acc[c.assigned_fee_earner] = (acc[c.assigned_fee_earner] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, cases]) => ({ name, cases })).sort((a, b) => b.cases - a.cases);

    // Case age
    const ageDistribution = [
      { range: '0-30d', count: 0 }, { range: '31-90d', count: 0 },
      { range: '91-180d', count: 0 }, { range: '181-365d', count: 0 }, { range: '1yr+', count: 0 }
    ];
    cases.filter(c => c.status === 'active').forEach(c => {
      const age = c.incident_date ? Math.ceil((now - new Date(c.incident_date)) / (1000 * 60 * 60 * 24)) : 0;
      if (age <= 30) ageDistribution[0].count++;
      else if (age <= 90) ageDistribution[1].count++;
      else if (age <= 180) ageDistribution[2].count++;
      else if (age <= 365) ageDistribution[3].count++;
      else ageDistribution[4].count++;
    });

    return { activeCases, settledThisMonth, avgSettlementValue, limitationNext30, noClientContact, avgDuration, byType, last6Months, byFeeEarner, ageDistribution };
  }, [cases]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Practice Analytics</h1>
          <p className="text-slate-500 mt-1">KPIs, workload, and compliance metrics</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard icon={<Briefcase className="w-5 h-5 text-indigo-600" />} label="Active Cases" value={metrics.activeCases.length} />
          <KPICard icon={<CheckCircle className="w-5 h-5 text-green-600" />} label="Settled This Month" value={metrics.settledThisMonth.length} sub={metrics.avgSettlementValue > 0 ? `Avg £${Math.round(metrics.avgSettlementValue).toLocaleString()}` : ''} />
          <KPICard
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            label="⚠️ Limitation <30d"
            value={metrics.limitationNext30.length}
            urgent={metrics.limitationNext30.length > 0}
          />
          <KPICard icon={<Users className="w-5 h-5 text-orange-600" />} label="No Contact >30d" value={metrics.noClientContact.length} urgent={metrics.noClientContact.length > 0} />
          <KPICard icon={<TrendingUp className="w-5 h-5 text-blue-600" />} label="Total Cases" value={cases.length} />
          <KPICard icon={<Clock className="w-5 h-5 text-purple-600" />} label="Avg Case Duration" value={metrics.avgDuration > 0 ? `${Math.round(metrics.avgDuration)}d` : 'N/A'} />
        </div>

        {/* Limitation Dates Due */}
        {metrics.limitationNext30.length > 0 && (
          <Card className="border-red-400 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Limitation Dates Due Within 30 Days — Act Immediately
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.limitationNext30.sort((a, b) => new Date(a.limitation_date) - new Date(b.limitation_date)).map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-red-50 rounded p-2">
                    <div>
                      <span className="font-semibold text-sm text-slate-900">{c.case_ref}</span>
                      <span className="text-slate-500 text-sm ml-2">{c.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">{new Date(c.limitation_date).toLocaleDateString('en-GB')}</span>
                      <Badge className={daysUntil(c.limitation_date) <= 7 ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}>
                        {daysUntil(c.limitation_date)}d
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">New Cases by Month</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metrics.last6Months}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="New Cases" fill="#6366f1" />
                  <Bar dataKey="settled" name="Settled" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Cases by Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={metrics.byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={e => e.name}>
                    {metrics.byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {metrics.byFeeEarner.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Fee Earner Workload (Active Cases)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart layout="vertical" data={metrics.byFeeEarner}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="cases" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Case Age Distribution (Active)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metrics.ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, sub, urgent }) {
  return (
    <Card className={urgent ? 'border-red-400 border-2' : ''}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-500 font-medium">{label}</span></div>
        <p className={`text-2xl font-bold ${urgent ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}