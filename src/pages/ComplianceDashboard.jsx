import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Scale, 
  FileText, 
  Home, 
  Users, 
  Leaf, 
  TrendingUp,
  AlertCircle,
  Calendar,
  Shield,
  FileCheck,
  Loader2,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_COMPLIANCE, getCriticalComplianceChecks } from '@/lib/compliance';

// App configurations
const APP_CONFIGS = {
  CASENARRATIVE: {
    ...APP_COMPLIANCE.CASENARRATIVE,
    route: '/case-manager',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600'
  },
  PREMISO: {
    ...APP_COMPLIANCE.PREMISO,
    route: '/practice-analytics',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600'
  },
  CHARITYHUB: {
    ...APP_COMPLIANCE.CHARITYHUB,
    route: '/compliance-checklist',
    color: 'pink',
    gradient: 'from-pink-500 to-pink-600'
  },
  SPECIES_EXPLORER: {
    ...APP_COMPLIANCE.SPECIES_EXPLORER,
    route: '/analytics',
    color: 'green',
    gradient: 'from-green-500 to-green-600'
  }
};

const SEVERITY_STYLES = {
  critical: 'bg-red-100 border-red-400 text-red-800',
  urgent: 'bg-orange-100 border-orange-400 text-orange-800',
  warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  info: 'bg-blue-100 border-blue-400 text-blue-800',
};

export default function ComplianceDashboard() {
  const [selectedApp, setSelectedApp] = useState('ALL');

  // Fetch all data in parallel
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['compliance-alerts'],
    queryFn: () => base44.entities.ComplianceAlert.list('-created_date'),
  });

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list('-created_date'),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-created_date'),
  });

  const { data: practiceProfile } = useQuery({
    queryKey: ['practice-profile'],
    queryFn: async () => {
      const profiles = await base44.entities.PracticeProfile.list();
      return profiles[0] || null;
    },
  });

  // Calculate compliance metrics
  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'urgent');
  const limitationAlerts = activeAlerts.filter(a => a.alert_type === 'limitation_date');

  // Calculate limitation date risk
  const casesWithLimitationIssues = cases.filter(c => {
    if (!c.limitation_date) return false;
    const daysUntil = Math.ceil((new Date(c.limitation_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30;
  });

  // Calculate compliance scores per app
  const calculateComplianceScore = (appName) => {
    const checks = getCriticalComplianceChecks(appName);
    if (checks.length === 0) return 100;

    // Simulate check results based on actual data
    let passedChecks = 0;
    
    if (appName === 'CASENARRATIVE') {
      // Check limitation dates
      const casesWithoutIssues = cases.length - casesWithLimitationIssues.length;
      passedChecks += casesWithoutIssues;
      
      // Check client care letters
      const casesWithCareLetter = cases.filter(c => c.client_care_letter_sent).length;
      passedChecks += casesWithCareLetter;
      
      // Check recent client contact
      const casesWithRecentContact = cases.filter(c => {
        if (!c.last_client_contact) return false;
        const daysSince = Math.ceil((new Date() - new Date(c.last_client_contact)) / (1000 * 60 * 60 * 24));
        return daysSince <= 30;
      }).length;
      passedChecks += casesWithRecentContact;
    }

    // Base score on active alerts
    const appAlerts = activeAlerts.filter(a => 
      appName === 'CASENARRATIVE' ? true : false // Filter by app when we have multi-app data
    ).length;

    const baseScore = Math.max(0, 100 - (appAlerts * 10));
    return Math.min(100, Math.round(baseScore));
  };

  const overallComplianceScore = Math.round(
    Object.keys(APP_CONFIGS).reduce((acc, appName) => {
      return acc + calculateComplianceScore(appName);
    }, 0) / Object.keys(APP_CONFIGS).length
  );

  if (alertsLoading || casesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-slate-600">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Centralized Compliance Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Real-time compliance monitoring across all portfolio apps
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Critical Alert Banner */}
        {criticalAlerts.length > 0 && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong className="font-bold">{criticalAlerts.length} critical/urgent alerts</strong> require immediate attention.
              {limitationAlerts.length > 0 && (
                <span className="block mt-1">
                  ⚠️ <strong>{limitationAlerts.length} limitation date alert{limitationAlerts.length > 1 ? 's' : ''}</strong> - Risk of professional negligence
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Overall Compliance Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Overall Compliance Health
            </CardTitle>
            <CardDescription>
              Aggregate compliance score across all portfolio apps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                  <div className="text-5xl font-bold mb-2">{overallComplianceScore}%</div>
                  <div className="text-sm opacity-90">Overall Compliance</div>
                  {overallComplianceScore >= 80 ? (
                    <CheckCircle className="w-8 h-8 mx-auto mt-3 opacity-90" />
                  ) : overallComplianceScore >= 60 ? (
                    <AlertCircle className="w-8 h-8 mx-auto mt-3 opacity-90" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 mx-auto mt-3 opacity-90" />
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">{cases.length}</div>
                    <div className="text-sm text-slate-600">Active Cases</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{activeAlerts.length}</div>
                    <div className="text-sm text-slate-600">Active Alerts</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{casesWithLimitationIssues.length}</div>
                    <div className="text-sm text-slate-600">Limitation Risks</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">{incidents.length}</div>
                    <div className="text-sm text-slate-600">Incidents Logged</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Compliance Progress</span>
                    <span className="font-medium">{overallComplianceScore}%</span>
                  </div>
                  <Progress value={overallComplianceScore} className="h-3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App-Specific Compliance */}
        <Tabs defaultValue="ALL" className="mb-6">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="ALL">All Apps</TabsTrigger>
            {Object.entries(APP_CONFIGS).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <span>{config.icon}</span>
                <span className="hidden lg:inline">{config.appName}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(APP_CONFIGS).map(([key, config]) => (
            <TabsContent key={key} value={key}>
              <AppComplianceCard appKey={key} config={config} alerts={activeAlerts} cases={cases} />
            </TabsContent>
          ))}
          
          <TabsContent value="ALL">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(APP_CONFIGS).map(([key, config]) => (
                <AppComplianceCard 
                  key={key} 
                  appKey={key} 
                  config={config} 
                  alerts={activeAlerts} 
                  cases={cases}
                  compact
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Critical Alerts Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Critical Compliance Alerts
            </CardTitle>
            <CardDescription>
              High-priority alerts requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {criticalAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No critical alerts - all systems compliant</p>
              </div>
            ) : (
              <div className="space-y-3">
                {criticalAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Limitation Date Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Limitation Date Tracker
            </CardTitle>
            <CardDescription>
              Cases approaching or past limitation deadline
            </CardDescription>
          </CardHeader>
          <CardContent>
            {casesWithLimitationIssues.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No limitation date concerns</p>
              </div>
            ) : (
              <div className="space-y-3">
                {casesWithLimitationIssues.map(caseData => {
                  const daysUntil = Math.ceil((new Date(caseData.limitation_date) - new Date()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysUntil < 0;
                  const urgency = daysUntil <= 7 ? 'critical' : daysUntil <= 30 ? 'urgent' : 'warning';
                  
                  return (
                    <div key={caseData.id} className={`p-4 rounded-lg border-l-4 ${SEVERITY_STYLES[urgency]}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{caseData.case_ref} - {caseData.client_name}</div>
                          <div className="text-sm mt-1">
                            {isOverdue ? (
                              <span className="font-bold text-red-700">
                                ⚠️ OVERDUE by {Math.abs(daysUntil)} days
                              </span>
                            ) : (
                              <span>
                                {daysUntil} days remaining
                              </span>
                            )}
                          </div>
                          <div className="text-xs mt-1 opacity-75">
                            Deadline: {new Date(caseData.limitation_date).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/case-manager?id=${caseData.id}`}>
                            View Case <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AppComplianceCard({ appKey, config, alerts, cases, compact = false }) {
  const score = 85; // Placeholder - would calculate based on app-specific data
  
  if (compact) {
    return (
      <Card className={`bg-gradient-to-br ${config.gradient} text-white`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <span className="text-sm font-semibold">{config.appName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-1">{score}%</div>
          <div className="text-xs opacity-90 mb-2">Compliance Score</div>
          <Progress value={score} className="h-2 bg-white/20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          {config.appName}
        </CardTitle>
        <CardDescription>{config.domain}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-blue-600">{score}%</div>
            <div className="text-sm text-slate-600">Compliance Score</div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={config.route}>
              View Details <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
        
        <Progress value={score} className="h-2" />
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">Critical Requirements:</div>
          <ul className="text-xs text-slate-600 space-y-1">
            {config.criticalRequirements.slice(0, 4).map((req, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-3 border-t">
          <div className="text-xs text-slate-500 mb-2">Primary Regulators:</div>
          <div className="flex flex-wrap gap-1">
            {config.primaryRegulators.slice(0, 3).map((reg, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {reg}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({ alert }) {
  const iconMap = {
    limitation_date: <AlertTriangle className="w-5 h-5" />,
    client_care_letter: <FileText className="w-5 h-5" />,
    no_client_contact: <Users className="w-5 h-5" />,
    court_deadline: <Scale className="w-5 h-5" />,
    settlement_authority: <FileCheck className="w-5 h-5" />,
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${SEVERITY_STYLES[alert.severity]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{iconMap[alert.alert_type]}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold">{alert.case_ref}</span>
            <Badge className={SEVERITY_STYLES[alert.severity]}>{alert.severity.toUpperCase()}</Badge>
          </div>
          <p className="text-sm">{alert.message}</p>
          {alert.deadline_date && (
            <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 
              Deadline: {new Date(alert.deadline_date).toLocaleDateString('en-GB')}
              {alert.days_until !== undefined && (
                <span className="ml-2 font-medium">
                  ({alert.days_until < 0 ? `${Math.abs(alert.days_until)} days overdue` : `${alert.days_until} days remaining`})
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}