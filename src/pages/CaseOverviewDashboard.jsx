import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, FileText, CheckCircle2, Clock, ShieldAlert, FileCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const SEVERITY_COLOR = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  strong: 'bg-green-100 text-green-800 border-green-200',
  weak: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STRENGTH_COLOR = {
  critical: 'bg-red-500',
  strong: 'bg-green-500',
  moderate: 'bg-amber-500',
  weak: 'bg-slate-400',
};

export default function CaseOverviewDashboard() {
  const { data: evidence = [], isLoading: loadingEvidence } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list('-created_date', 50),
  });

  const { data: incidents = [], isLoading: loadingIncidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: communications = [], isLoading: loadingComms } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list(),
  });

  const isLoading = loadingEvidence || loadingIncidents || loadingComms;

  // Compute totals
  const totalIssues = incidents.length;
  const criticalCount = incidents.filter(i => (i.severity ?? i.data?.severity) === 'critical').length;
  const highCount = incidents.filter(i => (i.severity ?? i.data?.severity) === 'high').length;
  const openIncidents = incidents.filter(i => (i.status ?? i.data?.status) === 'open').length;
  const ricsViolationCount = incidents.filter(i => {
    const v = i.rics_violations ?? i.data?.rics_violations;
    return Array.isArray(v) && v.length > 0;
  }).length;

  // Recent evidence (last 6)
  const recentEvidence = [...evidence]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 6);

  // Recent incidents (last 5) as "validation activities"
  const recentActivity = [...incidents]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Case Overview</h1>
            <p className="text-slate-500 mt-1">Live snapshot of evidence, incidents & validation status</p>
          </div>
          <div className="flex gap-2">
            <Link to="/evidence-validator">
              <Button variant="outline" className="gap-2">
                <FileCheck className="w-4 h-4" /> Run Validation
              </Button>
            </Link>
            <Link to="/evidence">
              <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
                <FileText className="w-4 h-4" /> All Evidence
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Issues" value={totalIssues} icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} sub={`${openIncidents} open`} />
          <StatCard label="Critical Incidents" value={criticalCount} icon={<AlertCircle className="w-5 h-5 text-red-500" />} sub={`${highCount} high severity`} accent="red" />
          <StatCard label="RICS Violations" value={ricsViolationCount} icon={<ShieldAlert className="w-5 h-5 text-orange-500" />} sub="Identified breaches" />
          <StatCard label="Evidence Items" value={evidence.length} icon={<FileText className="w-5 h-5 text-blue-500" />} sub={`${communications.length} communications`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Validation Activity */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" /> Recent Case Activity
              </CardTitle>
              <Link to="/incidents">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-500">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</div>
              ) : recentActivity.length === 0 ? (
                <EmptyState message="No incidents logged yet" />
              ) : (
                recentActivity.map((incident) => {
                  const d = incident.data ?? incident;
                  const severity = d.severity ?? 'medium';
                  return (
                    <div key={incident.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${STRENGTH_COLOR[severity] ?? 'bg-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{d.title}</p>
                        <p className="text-xs text-slate-500">{d.incident_type} · {d.date}</p>
                      </div>
                      <Badge className={`text-xs shrink-0 ${SEVERITY_COLOR[severity] ?? ''}`}>
                        {severity}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Total Issues Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500" /> Issues Across All Cases
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</div>
              ) : (
                <>
                  <IssueBar label="Critical" count={criticalCount} total={totalIssues || 1} color="bg-red-500" />
                  <IssueBar label="High" count={highCount} total={totalIssues || 1} color="bg-orange-400" />
                  <IssueBar label="Medium" count={incidents.filter(i => (i.severity ?? i.data?.severity) === 'medium').length} total={totalIssues || 1} color="bg-amber-400" />
                  <IssueBar label="Low" count={incidents.filter(i => (i.severity ?? i.data?.severity) === 'low').length} total={totalIssues || 1} color="bg-blue-400" />
                  <div className="pt-2 border-t flex items-center justify-between text-sm text-slate-600">
                    <span>Total incidents logged</span>
                    <span className="font-bold text-slate-900">{totalIssues}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>With RICS violations</span>
                    <span className="font-bold text-slate-900">{ricsViolationCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Open / unresolved</span>
                    <span className="font-bold text-red-600">{openIncidents}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recently Uploaded Evidence */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" /> Recently Uploaded Evidence
            </CardTitle>
            <Link to="/evidence">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-500">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : recentEvidence.length === 0 ? (
              <EmptyState message="No evidence uploaded yet" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentEvidence.map((item) => {
                  const d = item.data ?? item;
                  const strength = d.strength ?? 'moderate';
                  return (
                    <div key={item.id} className="p-3 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">{d.title || 'Untitled'}</p>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${STRENGTH_COLOR[strength] ?? 'bg-slate-400'}`} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs capitalize">{d.evidence_type ?? 'other'}</Badge>
                        <span className="text-xs text-slate-400">
                          {item.created_date ? formatDistanceToNow(new Date(item.created_date), { addSuffix: true }) : '—'}
                        </span>
                      </div>
                      {d.relevance && (
                        <p className="text-xs text-slate-500 mt-2 truncate">{d.relevance.replace(/_/g, ' ')}</p>
                      )}
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

function StatCard({ label, value, icon, sub, accent }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          {icon}
        </div>
        <p className={`text-3xl font-bold ${accent === 'red' && value > 0 ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
        <p className="text-xs text-slate-400 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function IssueBar({ label, count, total, color }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{count}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return <div className="h-14 bg-slate-100 rounded-lg animate-pulse" />;
}

function SkeletonCard() {
  return <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />;
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <CheckCircle2 className="w-8 h-8 mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  );
}