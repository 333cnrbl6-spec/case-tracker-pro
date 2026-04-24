import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Users, CheckCircle } from 'lucide-react';

const PRIORITY_COLORS = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export default function TaskAnalyticsDashboard() {
  // Fetch tasks and incidents
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['analytics-tasks'],
    queryFn: () => base44.entities.IncidentTask.list('-created_date'),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['analytics-incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    // Completion trend over time (last 12 weeks)
    const completionTrend = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const tasksInWeek = tasks.filter(t => {
        const completedDate = t.completion_date ? new Date(t.completion_date) : null;
        return completedDate && completedDate >= weekStart && completedDate <= weekEnd;
      });

      completionTrend.push({
        week: weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        completed: tasksInWeek.length,
      });
    }

    // Average handling time per priority
    const handlingByPriority = {};
    ['critical', 'high', 'medium', 'low'].forEach(priority => {
      const priorityTasks = tasks.filter(t => t.priority === priority && t.completion_date && t.deadline);
      if (priorityTasks.length > 0) {
        const avgDays = priorityTasks.reduce((sum, t) => {
          const start = new Date(t.created_date || t.deadline);
          const end = new Date(t.completion_date);
          return sum + Math.floor((end - start) / (1000 * 60 * 60 * 24));
        }, 0) / priorityTasks.length;
        handlingByPriority[priority] = Math.max(0, Math.round(avgDays * 10) / 10);
      }
    });

    const handlingData = Object.entries(handlingByPriority).map(([priority, days]) => ({
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      days: days,
      fill: PRIORITY_COLORS[priority],
    }));

    // Workload distribution by fee earner
    const workloadByEarner = {};
    tasks.forEach(task => {
      if (task.assigned_to) {
        if (!workloadByEarner[task.assigned_to]) {
          workloadByEarner[task.assigned_to] = {
            total: 0,
            completed: 0,
            in_progress: 0,
          };
        }
        workloadByEarner[task.assigned_to].total++;
        if (task.status === 'completed') {
          workloadByEarner[task.assigned_to].completed++;
        } else if (['under_investigation', 'evidence_review', 'resolution'].includes(task.status)) {
          workloadByEarner[task.assigned_to].in_progress++;
        }
      }
    });

    const workloadData = Object.entries(workloadByEarner).map(([earner, data]) => ({
      name: earner.split('@')[0],
      completed: data.completed,
      in_progress: data.in_progress,
      total: data.total,
    }));

    // Summary metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const avgCompletionTime = tasks
      .filter(t => t.completion_date && t.created_date)
      .reduce((sum, t) => {
        const days = Math.floor((new Date(t.completion_date) - new Date(t.created_date)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / Math.max(1, tasks.filter(t => t.completion_date).length);

    return {
      completionTrend,
      handlingData,
      workloadData,
      completionRate,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      totalTasks,
      completedTasks,
    };
  }, [tasks]);

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Task Analytics Dashboard</h1>
          <p className="text-slate-600 mt-1">Visual insights into task completion trends, handling times, and team workload</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-slate-900">{analytics.completionRate}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Avg Completion Time</p>
                  <p className="text-3xl font-bold text-slate-900">{analytics.avgCompletionTime}d</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold text-slate-900">{analytics.totalTasks}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Completed</p>
                  <p className="text-3xl font-bold text-slate-900">{analytics.completedTasks}</p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Completion Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Completion Trend (Last 12 Weeks)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Handling Time by Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Average Handling Time by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.handlingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="priority" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="days" fill="#8b5cf6">
                    {analytics.handlingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Workload Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workload Distribution by Fee Earner</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics.workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} label={{ value: 'Tasks', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completed" />
                <Bar dataKey="in_progress" stackId="a" fill="#2563eb" name="In Progress" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}