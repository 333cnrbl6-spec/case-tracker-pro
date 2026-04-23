import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RiskVisualization({ risks, cases, title, height = 300 }) {
    // Aggregate risk scores by date
    const timeSeriesData = () => {
        const byDate = {};
        risks.forEach(risk => {
            if (!byDate[risk.assessment_date]) {
                byDate[risk.assessment_date] = { date: risk.assessment_date, count: 0, avgScore: 0, critical: 0, high: 0, medium: 0, low: 0 };
            }
            byDate[risk.assessment_date].count += 1;
            byDate[risk.assessment_date].avgScore += risk.overall_risk_score;
            byDate[risk.assessment_date][risk.risk_level] += 1;
        });

        return Object.values(byDate)
            .map(item => ({
                ...item,
                avgScore: Math.round(item.avgScore / item.count)
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    // Risk score distribution
    const distributionData = () => {
        const dist = { low: 0, medium: 0, high: 0, critical: 0 };
        risks.forEach(risk => {
            dist[risk.risk_level] += 1;
        });
        return [
            { name: 'Low', value: dist.low, fill: '#10b981' },
            { name: 'Medium', value: dist.medium, fill: '#f59e0b' },
            { name: 'High', value: dist.high, fill: '#ef6b35' },
            { name: 'Critical', value: dist.critical, fill: '#dc2626' }
        ];
    };

    // Case type vs risk score
    const caseTypeData = () => {
        const byType = {};
        risks.forEach(risk => {
            const caseItem = cases.find(c => c.id === risk.case_id);
            if (caseItem) {
                if (!byType[caseItem.case_type]) {
                    byType[caseItem.case_type] = { type: caseItem.case_type, avgScore: 0, count: 0 };
                }
                byType[caseItem.case_type].avgScore += risk.overall_risk_score;
                byType[caseItem.case_type].count += 1;
            }
        });

        return Object.values(byType)
            .map(item => ({
                type: item.type,
                avgScore: Math.round(item.avgScore / item.count),
                count: item.count
            }))
            .sort((a, b) => b.avgScore - a.avgScore);
    };

    const timeSeries = timeSeriesData();
    const distribution = distributionData();
    const caseTypes = caseTypeData();

    return (
        <div className="space-y-6">
            {/* Time Series Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Risk Score Trends Over Time
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={timeSeries} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="right" tick={{ fontSize: 12 }} orientation="right" />
                            <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }} />
                            <Legend />
                            <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={2} name="Avg Risk Score" />
                            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Assessment Count" yAxisId="right" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Distribution and Case Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Risk Level Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={distribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Case Type Comparison */}
                <Card>
                    <CardHeader>
                        <CardTitle>Average Risk by Case Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={caseTypes} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                <YAxis dataKey="type" type="category" width={100} tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }} />
                                <Bar dataKey="avgScore" fill="#ef6b35" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}