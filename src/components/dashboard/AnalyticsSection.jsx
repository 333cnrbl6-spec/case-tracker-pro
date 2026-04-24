import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCheck, CheckCircle, Scale, Bell, Shield, TrendingUp, Download, BarChart3, Lock, BarChart2 } from 'lucide-react';

export default function AnalyticsSection() {
  const cards = [
    {
      path: '/assessment',
      icon: Scale,
      title: 'RICS Violation Assessment',
      description: 'Systematically assess conduct against RICS Code of Conduct',
      bgColor: 'from-indigo-50 to-blue-50',
      borderColor: 'indigo-200',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      path: '/legal-analysis',
      icon: Scale,
      title: 'Legal Analysis',
      description: 'Identify potential legal violations and grounds for action',
      bgColor: 'from-amber-50 to-orange-50',
      borderColor: 'amber-200',
      btnColor: 'bg-amber-600 hover:bg-amber-700'
    },
    {
      path: '/action-bundle',
      icon: FileCheck,
      title: 'Action Bundle',
      description: 'Complete case summary & legal strategy ready for counsel',
      bgColor: 'from-purple-50 to-indigo-50',
      borderColor: 'purple-200',
      btnColor: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      path: '/next-steps',
      icon: CheckCircle,
      title: 'Legal Action — Next Steps',
      description: 'Prioritized action plan with document templates for RICS complaint & solicitor brief',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'green-200',
      btnColor: 'bg-green-600 hover:bg-green-700'
    },
    {
      path: '/rics-breach-notification',
      icon: Bell,
      title: 'RICS Breach Notification',
      description: 'Multi-select incidents to generate formal RICS regulatory breach PDF report',
      bgColor: 'from-red-50 to-pink-50',
      borderColor: 'red-200',
      btnColor: 'bg-red-600 hover:bg-red-700'
    },
    {
      path: '/rics-rules',
      icon: Shield,
      title: 'RICS Rules Library',
      description: 'Searchable reference of RICS conduct rules and compliance requirements',
      bgColor: 'from-cyan-50 to-blue-50',
      borderColor: 'cyan-200',
      btnColor: 'bg-cyan-600 hover:bg-cyan-700'
    },
    {
      path: '/compliance-checklist',
      icon: CheckCircle,
      title: 'Compliance Checklist',
      description: 'Generate AI-powered compliance checklists for selected rules',
      bgColor: 'from-lime-50 to-green-50',
      borderColor: 'lime-200',
      btnColor: 'bg-lime-600 hover:bg-lime-700'
    },
    {
      path: '/analytics',
      icon: BarChart2,
      title: 'Risk Analytics',
      description: 'Visualize incident impact, breach severity scoring, and financial risk exposure',
      bgColor: 'from-violet-50 to-purple-50',
      borderColor: 'violet-200',
      btnColor: 'bg-violet-600 hover:bg-violet-700'
    },
    {
      path: '/evidence-validator',
      icon: CheckCircle,
      title: 'Evidence Validator',
      description: 'AI-powered validation: RICS compliance gaps, timeline verification, and discrepancy detection',
      bgColor: 'from-rose-50 to-pink-50',
      borderColor: 'rose-200',
      btnColor: 'bg-rose-600 hover:bg-rose-700'
    },
    {
      path: '/incident-tasks',
      icon: Bell,
      title: 'Task Management',
      description: 'Track follow-up actions, assign to team members, and monitor deadline reminders',
      bgColor: 'from-teal-50 to-cyan-50',
      borderColor: 'teal-200',
      btnColor: 'bg-teal-600 hover:bg-teal-700'
    },
    {
      path: '/case-manager',
      icon: Scale,
      title: 'Case Manager',
      description: 'Manage UK legal cases with limitation date tracking, smart search & AI narrative builder',
      bgColor: 'from-indigo-50 to-blue-50',
      borderColor: 'indigo-300',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      path: '/compliance-alerts',
      icon: Bell,
      title: 'Compliance Alerts',
      description: 'Limitation date alerts, client care letter reminders, court deadlines & settlement authority',
      bgColor: 'from-red-50 to-orange-50',
      borderColor: 'red-300',
      btnColor: 'bg-red-600 hover:bg-red-700'
    },
    {
      path: '/practice-analytics',
      icon: TrendingUp,
      title: 'Practice Analytics',
      description: 'KPIs, fee earner workload, case age distribution, settlements & limitation date tracker',
      bgColor: 'from-slate-50 to-gray-50',
      borderColor: 'slate-200',
      btnColor: 'bg-slate-700 hover:bg-slate-800'
    },
    {
      path: '/compliance-dashboard',
      icon: Shield,
      title: 'Centralized Compliance Dashboard',
      description: 'Real-time compliance monitoring across all portfolio apps with limitation tracking, safety certificates & regulatory alerts',
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'blue-300',
      btnColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      path: '/compliance-reports',
      icon: FileCheck,
      title: 'Compliance Report Generator',
      description: 'Auto-generate branded PDF reports: RICS breaches, limitation dates, Gift Aid, Gas Safety with real-time data',
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'emerald-300',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700'
    },
    {
      path: '/risk-dashboard',
      icon: TrendingUp,
      title: 'AI Risk Assessment',
      description: 'Predictive compliance failure analysis: AI-driven risk scoring, failure prediction & urgent action recommendations',
      bgColor: 'from-red-50 to-rose-50',
      borderColor: 'red-300',
      btnColor: 'bg-red-600 hover:bg-red-700'
    },
    {
      path: '/audit-log',
      icon: BarChart3,
      title: 'Audit Log',
      description: 'Track all automated workflow actions, task assignments, reminders, and escalations for compliance reporting',
      bgColor: 'from-slate-50 to-zinc-50',
      borderColor: 'slate-300',
      btnColor: 'bg-slate-700 hover:bg-slate-800'
    },
    {
      path: '/fee-earner-analytics',
      icon: TrendingUp,
      title: 'Fee Earner Analytics',
      description: 'Track team performance: active tasks, overdue rates, resolution times, and risk task distribution',
      bgColor: 'from-purple-50 to-blue-50',
      borderColor: 'blue-300',
      btnColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      path: '/timeline',
      icon: Clock,
      title: 'Event Timeline',
      description: 'Chronological view of all incidents, tasks, and communications with filtering options',
      bgColor: 'from-cyan-50 to-teal-50',
      borderColor: 'cyan-300',
      btnColor: 'bg-cyan-600 hover:bg-cyan-700'
    },
    {
      path: '/incident-reporter',
      icon: Download,
      title: 'Incident Reporter',
      description: 'Generate formal PDF incident reports with all tasks, communications, and evidence for RICS investigations',
      bgColor: 'from-orange-50 to-red-50',
      borderColor: 'orange-300',
      btnColor: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      path: '/investigation-compliance',
      icon: BarChart3,
      title: 'Investigation Compliance',
      description: 'Real-time compliance metrics, RICS violation trends, and investigation deadline adherence',
      bgColor: 'from-indigo-50 to-blue-50',
      borderColor: 'indigo-300',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      path: '/permissions',
      icon: Lock,
      title: 'Permissions Manager',
      description: 'Manage role-based access control: Lead Investigator, Legal Counsel, and General Auditor',
      bgColor: 'from-slate-50 to-gray-50',
      borderColor: 'slate-300',
      btnColor: 'bg-slate-700 hover:bg-slate-800'
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <Link key={card.path} to={card.path} className="block">
            <Card className={`bg-gradient-to-br ${card.bgColor} border-${card.borderColor} hover:shadow-lg transition-shadow cursor-pointer h-full`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="w-5 h-5" />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">{card.description}</p>
                <Button className={`${card.btnColor} w-full`}>View {card.title}</Button>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

import { Clock } from 'lucide-react';