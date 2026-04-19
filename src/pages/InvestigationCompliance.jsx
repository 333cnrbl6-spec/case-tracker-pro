import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, TrendingUp, CheckCircle2, Clock, AlertCircle, Shield } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function InvestigationCompliance() {
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['incident-tasks'],
    queryFn: () => base44.entities.IncidentTask.list(),
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list(),
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const severityCounts = {
      critical: incidents.filter(i => i.data.severity === 'critical').length,
      high: incidents.filter(i => i.data.severity === 'high').length,
      medium: incidents.filter(i => i.data.severity === 'medium').length,
      low: incidents.filter(i => i.data.severity === 'low').length,
    };

    const statusCounts = {
      open: incidents.filter(i => i.data.status === 'open').length,
      reviewed: incidents.filter(i => i.data.status === 'reviewed').length,
      assessed: incidents.filter(i => i.data.status === 'assessed').length,
      escalated: incidents.filter(i => i.data.status === 'escalated').length,
    };

    // RICS violations aggregation
    const ricsViolations = {};
    incidents.forEach(incident => {
      incident.data.rics_violations?.forEach(violation => {
        ricsViolations[violation] = (ricsViolations[violation] || 0) + 1;
      });
    });

    const topViolations = Object.entries(ricsViolations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([rule, count]) => ({ rule: rule.substring(0, 15), count }));

    // Task deadline analysis
    const overdueCount = tasks.filter(t => {
      if (!t.data.deadline || t.data.status === 'completed') return false;
      return differenceInDays(new Date(t.data.deadline), new Date()) < 0;
    }).length;

    const upcomingCount = tasks.filter(t => {
      if (!t.data.deadline || t.data.status === 'completed') return false;
      const daysLeft = differenceInDays(new Date(t.data.deadline), new Date());
      return daysLeft >= 0 && daysLeft <= 7;
    }).length;

    const onTimeCount = tasks.filter(t => {
      if (!t.data.deadline || t.data.status === 'completed') return false;
      return differenceInDays(new Date(t.data.deadline), new Date()) > 7;
    }).length;

    const completedCount = tasks.filter(t => t.data.status === 'completed').length;
    const totalTasks = tasks.length;

    // Assignee workload
    const workloadByAssignee = {};
    tasks.forEach(task => {
      if (task.data.assigned_to) {
        workloadByAssignee[task.data.assigned_to] = (workloadByAssignee[task.data.assigned_to] || 0) + 1;
      }
    });

    const assigneeData = Object.entries(workloadByAssignee)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([assignee, count]) => ({
        name: assignee.split('@')[0],
        tasks: count
      }));

    // Incident timeline (last 7 incidents by date)
    const incidentTimeline = incidents
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
      .slice(0, 7)
      .reverse()
      .map(i => ({
        date: new Date(i.data.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        critical: i.data.severity === 'critical' ? 1 : 0,
        high: i.data.severity === 'high' ? 1 : 0,
        medium: i.data.severity === 'medium' ? 1 : 0,
        low: i.data.severity === 'low' ? 1 : 0,
      }));

    return {
      severityCounts,
      statusCounts,
      topViolations,
      overdueCount,
      upcomingCount,
      onTimeCount,
      completedCount,
      totalTasks,
      assigneeData,
      incidentTimeline,
      totalIncidents: incidents.length,
      totalRicsViolations: Object.values(ricsViolations).reduce((a, b) => a + b, 0)
    };
  }, [incidents, tasks]);

  const severityChartData = [
    { name: 'Critical', value: metrics.severityCounts.critical, color: '#dc2626' },
    { name: 'High', value: metrics.severityCounts.high, color: '#ea580c' },
    { name: 'Medium', value: metrics.severityCounts.medium, color: '#eab308' },
    { name: 'Low', value: metrics.severityCounts.low, color: '#22c55e' },
  ].filter(d => d.value > 0);

  const statusChartData = [
    { name: 'Open', value: metrics.statusCounts.open, color: '#3b82f6' },
    { name: 'Reviewed', value: metrics.statusCounts.reviewed, color: '#a855f7' },
    { name: 'Assessed', value: metrics.statusCounts.assessed, color: '#6366f1' },
    { name: 'Escalated', value: metrics.statusCounts.escalated, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const taskStatusData = [
    { name: 'Completed', value: metrics.completedCount, color: '#22c55e' },
    { name: 'Overdue', value: metrics.overdueCount, color: '#dc2626' },
    { name: 'Upcoming (≤7d)', value: metrics.upcomingCount, color: '#f59e0b' },
    { name: 'On Track', value: metrics.onTimeCount, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const complianceScore = Math.round(
    (metrics.completedCount / Math.max(metrics.totalTasks, 1)) * 100
  );

  const onTimePercentage = Math.round(
    ((metrics.onTimeCount + metrics.completedCount) / Math.max(metrics.totalTasks, 1)) * 100
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-slate-700" />
            <h1 className="text-4xl font-bold text-slate-900">Investigation Compliance Dashboard</h1>
          </div>
          <p className="text-slate-600">Real-time metrics for RICS conduct investigations and deadline adherence</p>
        </div>

        {/* Alerts */}
        {metrics.overdueCount > 0 && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{metrics.overdueCount} overdue task{metrics.overdueCount > 1 ? 's' : ''}</strong> require immediate attention
            </AlertDescription>
          </Alert>
        )}

        {metrics.upcomingCount > 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>{metrics.upcomingCount} task{metrics.upcomingCount > 1 ? 's' : ''} due within 7 days</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Total Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{metrics.totalIncidents}</div>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-red-100 text-red-800">{metrics.severityCounts.critical} Critical</Badge>
                <Badge className="bg-orange-100 text-orange-800">{metrics.severityCounts.high} High</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                RICS Violations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{metrics.totalRicsViolations}</div>
              <p className="text-xs text-slate-600 mt-2">Across {metrics.totalIncidents} incidents</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Task Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{complianceScore}%</div>
              <p className="text-xs text-slate-600 mt-2">{metrics.completedCount}/{metrics.totalTasks} completed</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                On-Time Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{onTimePercentage}%</div>
              <p className="text-xs text-slate-600 mt-2">Deadline adherence</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Incident Severity Distribution */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Incident Severity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Incident Status Breakdown */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Investigation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Task Deadline Performance & RICS Violations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Task Deadline Status */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Task Deadline Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top RICS Violations */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Top RICS Rules Violated</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.topViolations.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.topViolations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="rule" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-600 py-8">No RICS violations recorded</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Incident Timeline & Team Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Incident Timeline */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Recent Incident Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.incidentTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.incidentTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="critical" stackId="severity" fill="#dc2626" name="Critical" />
                    <Bar dataKey="high" stackId="severity" fill="#ea580c" name="High" />
                    <Bar dataKey="medium" stackId="severity" fill="#eab308" name="Medium" />
                    <Bar dataKey="low" stackId="severity" fill="#22c55e" name="Low" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-600 py-8">No incidents in timeline</p>
              )}
            </CardContent>
          </Card>

          {/* Team Workload Distribution */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Team Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.assigneeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.assigneeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-600 py-8">No assigned tasks</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle>Compliance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Overall Compliance Score</p>
                <div className="text-2xl font-bold text-slate-900">{complianceScore}%</div>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Deadline Adherence</p>
                <div className="text-2xl font-bold text-slate-900">{onTimePercentage}%</div>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Critical/High Severity</p>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.severityCounts.critical + metrics.severityCounts.high}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Tasks Overdue</p>
                <div className="text-2xl font-bold text-red-600">{metrics.overdueCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}