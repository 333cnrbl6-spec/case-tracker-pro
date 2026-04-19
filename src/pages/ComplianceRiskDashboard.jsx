import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
    AlertTriangle, 
    Shield, 
    TrendingUp, 
    Clock, 
    CheckCircle, 
    Loader2, 
    RefreshCw,
    AlertCircle,
    Target,
    Filter,
    X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import RiskVisualization from '@/components/RiskVisualization';

const riskLevelColors = {
    low: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    critical: 'bg-red-100 text-red-800 border-red-300'
};

const riskLevelIcons = {
    low: CheckCircle,
    medium: AlertCircle,
    high: AlertTriangle,
    critical: Shield
};

export default function ComplianceRiskDashboard() {
    const queryClient = useQueryClient();
    const [selectedCase, setSelectedCase] = useState(null);
    const [filterCaseType, setFilterCaseType] = useState(null);
    const [filterFeeEarner, setFilterFeeEarner] = useState(null);

    const { data: cases = [] } = useQuery({
        queryKey: ['legalCases'],
        queryFn: () => base44.entities.LegalCase.list(),
    });

    const { data: risks = [], isLoading: isLoadingRisks } = useQuery({
        queryKey: ['complianceRisks'],
        queryFn: () => base44.entities.ComplianceRisk.list(),
    });

    const { data: alerts = [] } = useQuery({
        queryKey: ['complianceAlerts'],
        queryFn: () => base44.entities.ComplianceAlert.filter({ status: 'active' }),
    });

    const analyzeRiskMutation = useMutation({
        mutationFn: (caseId) => base44.functions.invoke('analyzeComplianceRisk', { case_id: caseId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complianceRisks'] });
        },
    });

    const handleAnalyzeCase = (caseId) => {
        analyzeRiskMutation.mutate(caseId);
    };

    const handleAnalyzeAll = () => {
        cases.forEach((c) => handleAnalyzeCase(c.id));
    };

    // Get latest risk for each case
    const getLatestRisk = (caseId) => {
        const caseRisks = risks.filter(r => r.case_id === caseId);
        return caseRisks.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
    };

    // Filter logic
    const filteredCases = cases.filter(c => {
        if (filterCaseType && c.case_type !== filterCaseType) return false;
        if (filterFeeEarner && c.assigned_fee_earner !== filterFeeEarner) return false;
        return true;
    });

    const filteredRisks = risks.filter(r => {
        const caseItem = cases.find(c => c.id === r.case_id);
        if (!caseItem) return false;
        if (filterCaseType && caseItem.case_type !== filterCaseType) return false;
        if (filterFeeEarner && caseItem.assigned_fee_earner !== filterFeeEarner) return false;
        return true;
    });

    const criticalRisks = filteredRisks.filter(r => r.risk_level === 'critical');
    const highRisks = filteredRisks.filter(r => r.risk_level === 'high');

    // Get unique values for filters
    const caseTypes = [...new Set(cases.map(c => c.case_type))];
    const feeEarners = [...new Set(cases.map(c => c.assigned_fee_earner).filter(Boolean))];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">AI Risk Assessment Dashboard</h1>
                            <p className="text-slate-600">Predictive compliance failure analysis across all cases</p>
                        </div>
                        <Button
                            onClick={handleAnalyzeAll}
                            disabled={analyzeRiskMutation.isPending || cases.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {analyzeRiskMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Analyze All Cases
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Critical Alerts */}
                {(criticalRisks.length > 0 || highRisks.length > 0) && (
                    <Alert className="mb-6 bg-red-50 border-red-300">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-800">
                            <strong>{criticalRisks.length} critical</strong> and <strong>{highRisks.length} high-risk</strong> cases require immediate attention
                        </AlertDescription>
                    </Alert>
                )}

                {/* Filters */}
                <Card className="mb-6 bg-slate-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Filter className="w-4 h-4" />
                            Filter by Case Type or Fee Earner
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {caseTypes.map(type => (
                                <Button
                                    key={type}
                                    variant={filterCaseType === type ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterCaseType(filterCaseType === type ? null : type)}
                                >
                                    {type}
                                    {filterCaseType === type && <X className="w-3 h-3 ml-1" />}
                                </Button>
                            ))}
                            <div className="border-l border-slate-300 mx-2"></div>
                            {feeEarners.map(earner => (
                                <Button
                                    key={earner}
                                    variant={filterFeeEarner === earner ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterFeeEarner(filterFeeEarner === earner ? null : earner)}
                                >
                                    {earner}
                                    {filterFeeEarner === earner && <X className="w-3 h-3 ml-1" />}
                                </Button>
                            ))}
                            {(filterCaseType || filterFeeEarner) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setFilterCaseType(null);
                                        setFilterFeeEarner(null);
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Visualizations */}
                <RiskVisualization risks={filteredRisks} cases={filteredCases} title="Portfolio Risk Visualization" />

                {/* Risk Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Total Cases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{cases.length}</div>
                            <p className="text-xs text-slate-500 mt-1">{risks.length} analyzed</p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-300 bg-red-50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-red-700">Critical Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-600">{criticalRisks.length}</div>
                            <p className="text-xs text-red-600 mt-1">Immediate action required</p>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-300 bg-orange-50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-orange-700">High Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-600">{highRisks.length}</div>
                            <p className="text-xs text-orange-600 mt-1">Urgent attention needed</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Active Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{alerts.length}</div>
                            <p className="text-xs text-slate-500 mt-1">Compliance deadlines</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Cases List */}
                <div className="grid grid-cols-1 gap-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Case Risk Assessments ({filteredCases.length})</h2>
                    
                    {filteredCases.map((caseItem) => {
                        const latestRisk = getLatestRisk(caseItem.id);
                        const RiskIcon = latestRisk ? riskLevelIcons[latestRisk.risk_level] : Clock;
                        
                        return (
                            <Card key={caseItem.id} className={latestRisk && latestRisk.risk_level === 'critical' ? 'border-red-400 shadow-red-100' : ''}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {latestRisk && (
                                                    <RiskIcon className={`w-5 h-5 ${
                                                        latestRisk.risk_level === 'critical' ? 'text-red-600' :
                                                        latestRisk.risk_level === 'high' ? 'text-orange-600' :
                                                        latestRisk.risk_level === 'medium' ? 'text-yellow-600' :
                                                        'text-green-600'
                                                    }`} />
                                                )}
                                                {caseItem.case_ref} - {caseItem.client_name}
                                            </CardTitle>
                                            <p className="text-sm text-slate-600 mt-1">{caseItem.case_type}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {!latestRisk ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAnalyzeCase(caseItem.id)}
                                                    disabled={analyzeRiskMutation.isPending}
                                                >
                                                    {analyzeRiskMutation.isPending ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <TrendingUp className="w-4 h-4 mr-2" />
                                                            Analyze Risk
                                                        </>
                                                    )}
                                                </Button>
                                            ) : (
                                                <Badge className={riskLevelColors[latestRisk.risk_level]}>
                                                    {latestRisk.risk_level.toUpperCase()} RISK
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {latestRisk ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-slate-600">Overall Risk Score</span>
                                                        <span className="font-medium">{latestRisk.overall_risk_score}/100</span>
                                                    </div>
                                                    <Progress value={latestRisk.overall_risk_score} className="h-2" />
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    <Clock className="w-4 h-4 inline mr-1" />
                                                    {latestRisk.assessment_date}
                                                </div>
                                            </div>

                                            {latestRisk.predicted_failures && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                        <Target className="w-4 h-4" />
                                                        Predicted Failures
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {JSON.parse(latestRisk.predicted_failures).slice(0, 3).map((failure, idx) => (
                                                            <div key={idx} className="text-sm p-3 bg-slate-50 rounded-lg border">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="font-medium text-slate-800">{failure.failure_type}</span>
                                                                    <Badge variant="outline">
                                                                        {failure.probability}% probability
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-slate-600">{failure.description}</p>
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    Timeframe: {failure.timeframe_days} days | Severity: {failure.severity}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {latestRisk.recommended_actions && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Recommended Actions</h4>
                                                    <div className="space-y-1">
                                                        {JSON.parse(latestRisk.recommended_actions).slice(0, 3).map((action, idx) => (
                                                            <div key={idx} className="text-sm flex items-center gap-2">
                                                                <AlertCircle className={`w-4 h-4 ${
                                                                    action.priority === 'critical' ? 'text-red-600' :
                                                                    action.priority === 'high' ? 'text-orange-600' :
                                                                    'text-blue-600'
                                                                }`} />
                                                                <span>{action.action}</span>
                                                                <span className="text-xs text-slate-500">({action.deadline_days} days)</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Link to={`/case-manager?case_id=${caseItem.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        View Case
                                                    </Button>
                                                </Link>
                                                <Link to={`/compliance-alerts`}>
                                                    <Button variant="outline" size="sm">
                                                        View Alerts
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-600">
                                            No risk assessment yet. Click "Analyze Risk" to run AI-powered compliance analysis.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}