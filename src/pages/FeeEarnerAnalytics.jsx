import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

export default function FeeEarnerAnalytics() {
    // Fetch tasks and incidents
    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.IncidentTask.list(),
    });

    const { data: incidents = [] } = useQuery({
        queryKey: ['incidents'],
        queryFn: () => base44.entities.Incident.list(),
    });

    // Process analytics data
    const analyticsData = useMemo(() => {
        const today = new Date();
        const feeEarnerStats = {};

        // Group tasks by fee earner
        tasks.forEach(task => {
            if (!task.assigned_to) return;

            if (!feeEarnerStats[task.assigned_to]) {
                feeEarnerStats[task.assigned_to] = {
                    name: task.assigned_to.split('@')[0], // Use email prefix as name
                    totalTasks: 0,
                    activeTasks: 0,
                    completedTasks: 0,
                    overdueTasks: 0,
                    resolutionTimes: [],
                    riskTasks: 0,
                };
            }

            const stats = feeEarnerStats[task.assigned_to];
            stats.totalTasks++;

            // Count active tasks
            if (['not_started', 'under_investigation', 'evidence_review', 'resolution'].includes(task.status)) {
                stats.activeTasks++;
            }

            // Count completed tasks
            if (task.status === 'completed') {
                stats.completedTasks++;
                if (task.completion_date && task.deadline) {
                    const daysToComplete = new Date(task.completion_date) - new Date(task.deadline);
                    stats.resolutionTimes.push(daysToComplete / (1000 * 60 * 60 * 24));
                }
            }

            // Count overdue tasks
            if (task.deadline && new Date(task.deadline) < today && task.status !== 'completed') {
                stats.overdueTasks++;
            }

            // Count risk-related tasks (marked with high/critical priority or "Risk" in title)
            if (['high', 'critical'].includes(task.priority) || task.title?.includes('Risk')) {
                stats.riskTasks++;
            }
        });

        // Calculate metrics for each fee earner
        const feeEarnerMetrics = Object.entries(feeEarnerStats).map(([email, stats]) => ({
            email,
            name: stats.name,
            activeTasks: stats.activeTasks,
            completedTasks: stats.completedTasks,
            totalTasks: stats.totalTasks,
            overduePercentage: stats.totalTasks > 0 ? Math.round((stats.overdueTasks / stats.totalTasks) * 100) : 0,
            overdueTasks: stats.overdueTasks,
            avgResolutionTime: stats.resolutionTimes.length > 0 
                ? Math.round(stats.resolutionTimes.reduce((a, b) => a + b, 0) / stats.resolutionTimes.length)
                : 0,
            riskTasks: stats.riskTasks,
            completionRate: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0,
        })).sort((a, b) => b.activeTasks - a.activeTasks);

        // Calculate portfolio metrics
        const totalActiveTasks = tasks.filter(t => 
            ['not_started', 'under_investigation', 'evidence_review', 'resolution'].includes(t.status)
        ).length;
        const totalOverdue = tasks.filter(t => 
            t.deadline && new Date(t.deadline) < today && t.status !== 'completed'
        ).length;
        const portfolioOverduePercentage = tasks.length > 0 ? Math.round((totalOverdue / tasks.length) * 100) : 0;
        const allResolutionTimes = Object.values(feeEarnerStats).flatMap(s => s.resolutionTimes);
        const avgPortfolioResolutionTime = allResolutionTimes.length > 0 
            ? Math.round(allResolutionTimes.reduce((a, b) => a + b, 0) / allResolutionTimes.length)
            : 0;

        return {
            feeEarnerMetrics,
            totalActiveTasks,
            portfolioOverduePercentage,
            avgPortfolioResolutionTime,
            totalTasks: tasks.length,
        };
    }, [tasks]);

    const chartColors = ['#1f2937', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Fee Earner Analytics</h1>
                    <p className="text-slate-600">Task performance and workload distribution across the team</p>
                </div>

                {/* Portfolio Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Active Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{analyticsData.totalActiveTasks}</div>
                            <p className="text-xs text-slate-500 mt-1">Currently in progress</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600" /> Overdue Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-600">{analyticsData.portfolioOverduePercentage}%</div>
                            <p className="text-xs text-slate-500 mt-1">Of all tasks</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" /> Avg Resolution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">{analyticsData.avgPortfolioResolutionTime}</div>
                            <p className="text-xs text-slate-500 mt-1">Days to complete</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" /> Total Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">{analyticsData.totalTasks}</div>
                            <p className="text-xs text-slate-500 mt-1">Portfolio-wide</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Tasks by Fee Earner */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Tasks by Fee Earner</CardTitle>
                            <CardDescription>Current workload distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analyticsData.feeEarnerMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="activeTasks" fill="#1f2937" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Overdue Percentage by Fee Earner */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Overdue Rate by Fee Earner</CardTitle>
                            <CardDescription>Percentage of overdue tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analyticsData.feeEarnerMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `${value}%`} />
                                    <Bar dataKey="overduePercentage" fill="#dc2626" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Average Resolution Time */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Avg Resolution Time (Risk Tasks)</CardTitle>
                            <CardDescription>Days to complete risk-related tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analyticsData.feeEarnerMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="avgResolutionTime" stroke="#059669" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Risk Tasks Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Risk Tasks by Fee Earner</CardTitle>
                            <CardDescription>High/Critical priority tasks assigned</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analyticsData.feeEarnerMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="riskTasks" fill="#ea580c" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Fee Earner Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fee Earner Performance Summary</CardTitle>
                        <CardDescription>Detailed metrics for each team member</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Fee Earner</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Active</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Completed</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Total</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Completion %</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Overdue %</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Avg Resolution (days)</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Risk Tasks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsData.feeEarnerMetrics.map((earner, idx) => (
                                        <tr key={idx} className="border-b hover:bg-slate-50">
                                            <td className="py-3 px-4 text-slate-900 font-medium">{earner.name}</td>
                                            <td className="text-center py-3 px-4">
                                                <Badge variant="outline">{earner.activeTasks}</Badge>
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <Badge className="bg-green-100 text-green-800">{earner.completedTasks}</Badge>
                                            </td>
                                            <td className="text-center py-3 px-4 text-slate-600">{earner.totalTasks}</td>
                                            <td className="text-center py-3 px-4">
                                                <span className={earner.completionRate >= 50 ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                                                    {earner.completionRate}%
                                                </span>
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <span className={earner.overduePercentage > 20 ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                                                    {earner.overduePercentage}%
                                                </span>
                                            </td>
                                            <td className="text-center py-3 px-4 text-slate-600">{earner.avgResolutionTime}</td>
                                            <td className="text-center py-3 px-4">
                                                <Badge className="bg-orange-100 text-orange-800">{earner.riskTasks}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}