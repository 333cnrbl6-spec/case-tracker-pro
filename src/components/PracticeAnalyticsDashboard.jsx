import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { differenceInDays, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

export default function PracticeAnalyticsDashboard() {
  const { data: cases = [] } = useQuery({
    queryKey: ['legalCases'],
    queryFn: () => base44.entities.LegalCase.list()
  });

  const analytics = useMemo(() => {
    const activeCases = cases.filter(c => c.status === 'active').length;
    const thisMonth = new Date();
    const settledThisMonth = cases.filter(c => 
      c.status === 'settled' &&
      c.settlement_date &&
      isWithinInterval(parseISO(c.settlement_date), {
        start: startOfMonth(thisMonth),
        end: endOfMonth(thisMonth)
      })
    );
    const avgSettlement = settledThisMonth.length > 0
      ? settledThisMonth.reduce((sum, c) => sum + (c.settlement_value || 0), 0) / settledThisMonth.length
      : 0;

    const limitationAlerts = cases.filter(c => 
      c.status === 'active' && c.limitation_date &&
      differenceInDays(parseISO(c.limitation_date), new Date()) < 30
    ).length;

    const outstandingActions = cases.filter(c =>
      c.status === 'active' &&
      c.settlement_authority_obtained === false
    ).length;

    const casesByType = cases.reduce((acc, c) => {
      const existing = acc.find(x => x.name === c.case_type);
      if (existing) existing.value++;
      else acc.push({ name: c.case_type, value: 1 });
      return acc;
    }, []);

    const monthlyNewCases = [];
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const count = cases.filter(c =>
        isWithinInterval(parseISO(c.created_date || new Date()), {
          start: startOfMonth(month),
          end: endOfMonth(month)
        })
      ).length;
      monthlyNewCases.push({
        month: month.toLocaleDateString('en-GB', { month: 'short' }),
        cases: count
      });
    }

    const settlementTrend = [];
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const settled = cases.filter(c =>
        c.settlement_value &&
        isWithinInterval(parseISO(c.settlement_date || new Date()), {
          start: startOfMonth(month),
          end: endOfMonth(month)
        })
      );
      const total = settled.reduce((sum, c) => sum + c.settlement_value, 0);
      settlementTrend.push({
        month: month.toLocaleDateString('en-GB', { month: 'short' }),
        value: total
      });
    }

    return {
      activeCases,
      settledThisMonth: settledThisMonth.length,
      avgSettlement,
      limitationAlerts,
      outstandingActions,
      casesByType,
      monthlyNewCases,
      settlementTrend
    };
  }, [cases]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Active Cases</p>
            <p className="text-3xl font-bold text-slate-900">{analytics.activeCases}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Settled This Month</p>
            <p className="text-3xl font-bold text-green-600">{analytics.settledThisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Avg Settlement</p>
            <p className="text-3xl font-bold text-slate-900">£{(analytics.avgSettlement / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        <Card className={analytics.limitationAlerts > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 flex items-center gap-2">
              {analytics.limitationAlerts > 0 && <AlertTriangle className="w-4 h-4 text-red-600" />}
              Limitation {'<'} 30 Days
            </p>
            <p className={`text-3xl font-bold ${analytics.limitationAlerts > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {analytics.limitationAlerts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Outstanding Actions</p>
            <p className="text-3xl font-bold text-slate-900">{analytics.outstandingActions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Cases by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.monthlyNewCases}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cases" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cases by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={analytics.casesByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                  {analytics.casesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Settlement Value Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.settlementTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `£${(value / 1000).toFixed(1)}k`} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}