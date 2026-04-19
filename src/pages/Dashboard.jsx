import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, MessageSquare, AlertTriangle, FileCheck, CheckCircle, Link2, Briefcase, FileTextIcon, Scale, BarChart2, Bell, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import CaseSummaryWidget from '@/components/CaseSummaryWidget';
import SystemAlertsPanel from '@/components/SystemAlertsPanel';

export default function Dashboard() {
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list(),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;
  const highSeverity = incidents.filter(i => i.severity === 'high').length;
  const riicsViolations = incidents.filter(i => i.rics_violations?.length > 0).length;
  const legalIssues = incidents.filter(i => i.legal_issues?.length > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Case Assessment Dashboard</h1>
          <p className="text-slate-600">Building evidence against Malcolm Belcher - RICS Conduct Investigation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{incidents.length}</div>
              <p className="text-xs text-slate-500 mt-1">{criticalIncidents} critical, {highSeverity} high severity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">RICS Violations Identified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{riicsViolations}</div>
              <p className="text-xs text-slate-500 mt-1">Code of conduct breaches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Potential Legal Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{legalIssues}</div>
              <p className="text-xs text-slate-500 mt-1">Legally actionable concerns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Supporting Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{evidence.length}</div>
              <p className="text-xs text-slate-500 mt-1">Documents & communications</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">System Alerts</h2>
            <SystemAlertsPanel />
          </div>
          <CaseSummaryWidget />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/incidents" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Log Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Document specific incidents, behaviors, and breaches</p>
                <Button variant="outline" className="w-full">View All Incidents</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/communications" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Communications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Track emails, letters, and other communications</p>
                <Button variant="outline" className="w-full">View Communications</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/communication-mapper" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="w-5 h-5 text-purple-600" />
                  Communication Mapper
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Auto-map communications to RICS violations & flag discrepancies</p>
                <Button variant="outline" className="w-full">Open Mapper</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/evidence" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-green-600" />
                  Evidence & Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Upload and organize supporting documents</p>
                <Button variant="outline" className="w-full">Manage Evidence</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/solicitor-brief" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Solicitor Brief
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">AI-generated legal brief with claims analysis & strategy</p>
                <Button variant="outline" className="w-full">Generate Brief</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/rics-documents" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  RICS Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">AI-assisted drafting of complaint letters, responses & disclosures</p>
                <Button variant="outline" className="w-full">Generate Documents</Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link to="/assessment" className="block">
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg">RICS Violation Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Systematically assess conduct against RICS Code of Conduct</p>
                <Button className="bg-indigo-600 hover:bg-indigo-700 w-full">Start Assessment</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/legal-analysis" className="block">
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg">Legal Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Identify potential legal violations and grounds for action</p>
                <Button className="bg-amber-600 hover:bg-amber-700 w-full">Analyze Legal Issues</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/action-bundle" className="block">
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                  <span className="text-lg">Action Bundle</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Complete case summary & legal strategy ready for counsel</p>
                <Button className="bg-purple-600 hover:bg-purple-700 w-full">View Bundle</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/next-steps" className="block">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-lg">Legal Action — Next Steps</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Prioritized action plan with document templates for RICS complaint & solicitor brief</p>
                <Button className="bg-green-600 hover:bg-green-700 w-full">View Action Plan</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/rics-breach-notification" className="block">
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-lg">RICS Breach Notification</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Multi-select incidents to generate formal RICS regulatory breach PDF report</p>
                <Button className="bg-red-600 hover:bg-red-700 w-full">Generate Report</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/rics-rules" className="block">
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg">RICS Rules Library</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Searchable reference of RICS conduct rules and compliance requirements</p>
                <Button className="bg-cyan-600 hover:bg-cyan-700 w-full">Browse Rules</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/compliance-checklist" className="block">
            <Card className="bg-gradient-to-br from-lime-50 to-green-50 border-lime-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg">Compliance Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Generate AI-powered compliance checklists for selected rules</p>
                <Button className="bg-lime-600 hover:bg-lime-700 w-full">Generate Checklist</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/analytics" className="block">
            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg">Risk Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Visualize incident impact, breach severity scoring, and financial risk exposure</p>
                <Button className="bg-violet-600 hover:bg-violet-700 w-full">View Analytics</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/evidence-validator" className="block">
            <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg">Evidence Validator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">AI-powered validation: RICS compliance gaps, timeline verification, and discrepancy detection</p>
                <Button className="bg-rose-600 hover:bg-rose-700 w-full">Validate Evidence</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/incident-tasks" className="block">
            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg">Task Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Track follow-up actions, assign to team members, and monitor deadline reminders</p>
                <Button className="bg-teal-600 hover:bg-teal-700 w-full">Manage Tasks</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/case-manager" className="block">
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scale className="w-5 h-5 text-indigo-600" /> Case Manager
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Manage UK legal cases with limitation date tracking, smart search & AI narrative builder</p>
                <Button className="bg-indigo-600 hover:bg-indigo-700 w-full">Open Case Manager</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/compliance-alerts" className="block">
            <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="w-5 h-5 text-red-600" /> Compliance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Limitation date alerts, client care letter reminders, court deadlines & settlement authority</p>
                <Button className="bg-red-600 hover:bg-red-700 w-full">View Alerts</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/practice-analytics" className="block">
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart2 className="w-5 h-5 text-slate-700" /> Practice Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">KPIs, fee earner workload, case age distribution, settlements & limitation date tracker</p>
                <Button className="bg-slate-700 hover:bg-slate-800 w-full">View Analytics</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/compliance-dashboard" className="block">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-blue-600" /> Centralized Compliance Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Real-time compliance monitoring across all portfolio apps with limitation tracking, safety certificates & regulatory alerts</p>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full">Open Dashboard</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/compliance-reports" className="block">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-emerald-600" /> Compliance Report Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Auto-generate branded PDF reports: RICS breaches, limitation dates, Gift Aid, Gas Safety with real-time data</p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 w-full">Generate Reports</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/risk-dashboard" className="block">
            <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-red-600" /> AI Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">Predictive compliance failure analysis: AI-driven risk scoring, failure prediction & urgent action recommendations</p>
                <Button className="bg-red-600 hover:bg-red-700 w-full">View Risk Dashboard</Button>
              </CardContent>
            </Card>
          </Link>
          </div>
      </div>
    </div>
  );
}