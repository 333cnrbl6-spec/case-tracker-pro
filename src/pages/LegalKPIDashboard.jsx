import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, Briefcase, Calendar } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function LegalKPIDashboard() {
  const { data: cases = [] } = useQuery({
    queryKey: ['legal_cases'],
    queryFn: () => base44.entities.LegalCase.list(),
  });

  const kpis = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Active cases
    const activeCases = cases.filter(c => ['active', 'under_review', 'litigation'].includes(c.status));
    const activeCount = activeCases.length;

    // Settlement trends by month (last 6 months)
    const settlementTrend = {};
    cases.forEach(c => {
      if (c.settlement_date && c.settlement_value) {
        const monthKey = format(parseISO(c.settlement_date), 'MMM yyyy');
        if (!settlementTrend[monthKey]) {
          settlementTrend[monthKey] = 0;
        }
        settlementTrend[monthKey] += c.settlement_value;
      }
    });

    const settlementData = Object.entries(settlementTrend)
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => new Date(`01 ${a.month}`) - new Date(`01 ${b.month}`))
      .slice(-6);

    const totalSettlements = settlementData.reduce((sum, d) => sum + d.value, 0);
    const avgSettlement = settlementData.length > 0 ? totalSettlements / settlementData.length : 0;

    // Upcoming limitation deadlines (next 30 days)
    const upcomingDeadlines = activeCases
      .filter(c => c.limitation_date)
      .map(c => {
        const limitDate = parseISO(c.limitation_date);
        const daysRemaining = differenceInDays(limitDate, today);
        return {
          id: c.id,
          case_ref: c.case_ref,
          client_name: c.client_name,
          limitation_date: c.limitation_date,
          daysRemaining,
          urgency: daysRemaining <= 7 ? 'critical' : daysRemaining <= 14 ? 'high' : 'medium'
        };
      })
      .filter(d => d.daysRemaining > 0 && d.daysRemaining <= 30)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Case status breakdown
    const statusBreakdown = {};
    cases.forEach(c => {
      statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;
    });

    const statusData = Object.entries(statusBreakdown).map(([status, count]) => ({
      name: status.replace(/_/g, ' ').toUpperCase(),
      value: count
    }));

    // Case types breakdown
    const typeBreakdown = {};
    cases.forEach(c => {
      typeBreakdown[c.case_type] = (typeBreakdown[c.case_type] || 0) + 1;
    });

    const typeData = Object.entries(typeBreakdown).map(([type, count]) => ({
      name: type.replace(/_/g, ' '),
      value: count
    }));

    return {
      activeCount,
      totalCases: cases.length,
      settlementData,
      avgSettlement,
      totalSettlements,
      upcomingDeadlines,
      statusData,
      typeData
    };
  }, [cases]);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      default: return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getUrgencyBadgeColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      default: return 'bg-yellow-600 text-white';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Legal KPI Dashboard</h1>
        <p className="text-slate-600 mt-1">Track active cases, settlements, and critical limitation deadlines</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Active Cases</p>
            <p className="text-4xl font-bold text-blue-600">{kpis.activeCount}</p>
            <p className="text-xs text-slate-500 mt-2">of {kpis.totalCases} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Settlements</p>
            <p className="text-4xl font-bold text-green-600">£{(kpis.totalSettlements / 1000).toFixed(0)}k</p>
            <p className="text-xs text-slate-500 mt-2">all settlements</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Avg Settlement</p>
            <p className="text-4xl font-bold text-slate-900">£{(kpis.avgSettlement / 1000).toFixed(1)}k</p>
            <p className="text-xs text-slate-500 mt-2">per case</p>
          </CardContent>
        </Card>

        <Card className={kpis.upcomingDeadlines.length > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Deadlines (30d)
            </p>
            <p className={`text-4xl font-bold ${kpis.upcomingDeadlines.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {kpis.upcomingDeadlines.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settlement Value Trend */}
        {kpis.settlementData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Settlement Value Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kpis.settlementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `£${(value / 1000).toFixed(1)}k`} />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Case Status Breakdown */}
        {kpis.statusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cases by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={kpis.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                    {kpis.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Case Types Distribution */}
        {kpis.typeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cases by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kpis.typeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Limitation Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Upcoming Limitation Deadlines (Next 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kpis.upcomingDeadlines.length > 0 ? (
            <div className="space-y-3">
              {kpis.upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className={`border rounded-lg p-4 ${getUrgencyColor(deadline.urgency)}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{deadline.case_ref}</p>
                      <p className="text-sm text-slate-700">{deadline.client_name}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Deadline: {format(parseISO(deadline.limitation_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getUrgencyBadgeColor(deadline.urgency)}>
                        {deadline.daysRemaining} days
                      </Badge>
                      <p className="text-xs text-slate-600 mt-2">
                        {deadline.daysRemaining} day{deadline.daysRemaining !== 1 ? 's' : ''} remaining
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600">No limitation deadlines in the next 30 days</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}