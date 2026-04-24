import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, AlertTriangle, Shield, Home, Heart, Scale, Loader2 } from 'lucide-react';

const reportTypes = [
    {
        id: 'rics_breach',
        title: 'RICS Breach Notification',
        description: 'Professional conduct violations and RICS code breaches',
        icon: Scale,
        color: 'bg-red-600 hover:bg-red-700',
        entity: 'Incident'
    },
    {
        id: 'limitation_dates',
        title: 'Limitation Date Report',
        description: 'Critical legal deadline tracking and compliance alerts',
        icon: AlertTriangle,
        color: 'bg-amber-600 hover:bg-amber-700',
        entity: 'LegalCase'
    },
    {
        id: 'case_compliance',
        title: 'Case Compliance Summary',
        description: 'Evidence validation, audit trails, and risk assessments',
        icon: Shield,
        color: 'bg-green-600 hover:bg-green-700',
        entity: 'LegalCase'
    },
    {
        id: 'incident_report',
        title: 'Incident Analysis Report',
        description: 'Breach patterns, severity clustering, and remediation tracking',
        icon: AlertTriangle,
        color: 'bg-orange-600 hover:bg-orange-700',
        entity: 'Incident'
    }
];

export default function ComplianceReportGenerator() {
    const [selectedReport, setSelectedReport] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleGenerateReport = async (reportType) => {
        setSelectedReport(reportType);
        setGenerating(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await base44.functions.invoke('generateComplianceReport', {
                report_type: reportType.id
            });

            // Create download link
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportType.id}-report-${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);

            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Compliance Report Generator</h1>
                    <p className="text-slate-600">Automated PDF reports pulling real-time data from entity trackers</p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6 bg-green-50 border-green-200">
                        <AlertDescription className="text-green-800">
                            Report generated and downloaded successfully!
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reportTypes.map((report) => {
                        const Icon = report.icon;
                        return (
                            <Card key={report.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${report.color} text-white`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-lg">{report.title}</div>
                                            <Badge variant="outline" className="mt-1">
                                                {report.entity} Entity
                                            </Badge>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 mb-4">{report.description}</p>
                                    <Button
                                        className={`w-full ${report.color}`}
                                        onClick={() => handleGenerateReport(report)}
                                        disabled={generating}
                                    >
                                        {generating && selectedReport?.id === report.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4 mr-2" />
                                                Generate PDF Report
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card className="mt-8 bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <Shield className="w-5 h-5" />
                            Report Features
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-blue-800">
                        <ul className="space-y-2 text-sm">
                            <li>✓ Real-time data from entity trackers</li>
                            <li>✓ Branded PDF formatting with professional headers</li>
                            <li>✓ Automatic pagination for large reports</li>
                            <li>✓ Color-coded severity indicators</li>
                            <li>✓ Metadata tracking (generated date, user)</li>
                            <li>✓ Instant download with descriptive filenames</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}