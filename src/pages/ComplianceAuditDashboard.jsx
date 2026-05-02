import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, FileX, Users, TrendingUp } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Link } from 'react-router-dom';

function ragColor(val, warn, crit) {
  if (val >= crit) return 'text-red-600 bg-red-50 border-red-300';
  if (val >= warn) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
  return 'text-green-600 bg-green-50 border-green-300';
}

function ragBadge(days) {
  if (days <= 7) return 'bg-red-600 text-white';
  if (days <= 30) return 'bg-orange-500 text-white';
  if (days <= 90) return 'bg-yellow-500 text-white';
  return 'bg-slate-200 text-slate-700';
}

function complianceScore(cases, feeEarner) {
  const myCases = cases.filter(c => c.assigned_fee_earner === feeEarner && c.status !== 'closed' && c.status !== 'settled');
  if (myCases.length === 0) return 100;
  const now = new Date();
  let deductions = 0;
  myCases.forEach(c => {
    if (!c.client_care_letter_sent && differenceInDays(now, parseISO(c.created_date || now.toISOString())) >= 14) deductions += 15;
    if (c.limitation_date && differenceInDays(parseISO(c.limitation_date), now) <= 30) deductions += 20;
    if (c.last_client_contact && differenceInDays(now, parseISO(c.last_client_contact)) >= 30) deductions += 10;
  });
  return Math.max(0, 100 - deductions);
}

export default function ComplianceAuditDashboard() {
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['legal-cases-compliance'],
    queryFn: () => base44.entities.LegalCase.list(),
  });

  const audit = useMemo(() => {
    const now = new Date();
    const activeCases = cases.filter(c => c.status !== 'closed' && c.status !== 'settled');

    const missingCCL = activeCases.filter(c => {
      if (c.client_care_letter_sent) return false;
      const days = c.created_date ? differenceInDays(now, parseISO(c.created_date)) : 0;
      return days >= 14;
    });

    const limitationNext90 = activeCases
      .filter(c => c.limitation_date)
      .map(c => ({ ...c, days_remaining: differenceInDays(parseISO(c.limitation_date), now) }))
      .filter(c => c.days_remaining <= 90)
      .sort((a, b) => a.days_remaining - b.days_remaining);

    const noActivity = activeCases.filter(c => {
      if (!c.last_client_contact) return false;
      return differenceInDays(now, parseISO(c.last_client_contact)) >= 30;
    });

    const feeEarners = [...new Set(activeCases.map(c => c.assigned_fee_earner).filter(Boolean))];
    const feeEarnerScores = feeEarners.map(fe => ({
      name: fe,
      score: complianceScore(activeCases, fe),
      total: activeCases.filter(c => c.assigned_fee_earner === fe).length,
    })).sort((a, b) => a.score - b.score);

    return { missingCCL, limitationNext90, noActivity, feeEarnerScores };
  }, [cases]);

  if (isLoading) return <div className="p-6 text-center text-slate-400">Loading compliance data...</div>;

  const totalIssues = audit.missingCCL.length + audit.limitationNext90.length + audit.noActivity.length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Case Compliance Audit</h1>
          <p className="text-slate-500 mt-1">Firm-wide compliance overview for managing partners and compliance officers</p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Limitation Dates (≤90d)"
            value={audit.limitationNext90.length}
            urgent={audit.limitationNext90.filter(c => c.days_remaining <= 30).length > 0}
            sub={audit.limitationNext90.filter(c => c.days_remaining <= 7).length > 0 ? `${audit.limitationNext90.filter(c => c.days_remaining <= 7).length} CRITICAL` : ''}
          />
          <KPICard
            icon={<FileX className="w-5 h-5" />}
            label="Missing Care Letters"
            value={audit.missingCCL.length}
            urgent={audit.missingCCL.length > 0}
          />
          <KPICard
            icon={<Clock className="w-5 h-5" />}
            label="No Activity 30+ Days"
            value={audit.noActivity.length}
            urgent={audit.noActivity.length > 0}
          />
          <KPICard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Total Compliance Issues"
            value={totalIssues}
            urgent={totalIssues > 5}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Limitation Dates RAG */}
          <Card className={audit.limitationNext90.filter(c => c.days_remaining <= 7).length > 0 ? 'border-red-400 border-2' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className={`w-5 h-5 ${audit.limitationNext90.filter(c => c.days_remaining <= 7).length > 0 ? 'text-red-600' : 'text-orange-500'}`} />
                Limitation Dates — Next 90 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audit.limitationNext90.length === 0 ? (
                <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> No limitation dates in next 90 days</p>
              ) : (
                <div className="space-y-2">
                  {audit.limitationNext90.map(c => (
                    <div key={c.id} className={`rounded p-2 border text-sm flex items-center justify-between ${c.days_remaining <= 7 ? 'bg-red-50 border-red-200' : c.days_remaining <= 30 ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div>
                        <span className="font-semibold text-slate-900">{c.case_ref}</span>
                        <span className="text-slate-500 ml-2 text-xs">{c.client_name}</span>
                        {c.assigned_fee_earner && <span className="text-slate-400 ml-2 text-xs">— {c.assigned_fee_earner}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">{format(parseISO(c.limitation_date), 'dd MMM yy')}</span>
                        <Badge className={ragBadge(c.days_remaining)}>{c.days_remaining}d</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Missing Client Care Letters */}
          <Card className={audit.missingCCL.length > 0 ? 'border-yellow-400' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileX className="w-5 h-5 text-yellow-600" />
                Missing Client Care Letters
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audit.missingCCL.length === 0 ? (
                <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> All client care letters sent</p>
              ) : (
                <div className="space-y-2">
                  {audit.missingCCL.map(c => {
                    const daysSince = c.created_date ? differenceInDays(new Date(), parseISO(c.created_date)) : 0;
                    return (
                      <div key={c.id} className="rounded p-2 bg-yellow-50 border border-yellow-200 text-sm flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900">{c.case_ref}</span>
                          <span className="text-slate-500 ml-2 text-xs">{c.client_name}</span>
                        </div>
                        <Badge className="bg-yellow-500 text-white text-xs">{daysSince}d overdue</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* No Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-blue-500" />
                No Client Contact (30+ days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audit.noActivity.length === 0 ? (
                <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> All cases have recent client contact</p>
              ) : (
                <div className="space-y-2">
                  {audit.noActivity.map(c => {
                    const days = differenceInDays(new Date(), parseISO(c.last_client_contact));
                    return (
                      <div key={c.id} className="rounded p-2 bg-blue-50 border border-blue-200 text-sm flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900">{c.case_ref}</span>
                          <span className="text-slate-500 ml-2 text-xs">{c.client_name}</span>
                          {c.assigned_fee_earner && <span className="text-slate-400 ml-2 text-xs">— {c.assigned_fee_earner}</span>}
                        </div>
                        <Badge variant="outline" className="text-xs text-blue-700">{days}d since contact</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Earner Compliance Scores */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-purple-500" />
                Fee Earner Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audit.feeEarnerScores.length === 0 ? (
                <p className="text-sm text-slate-400">No fee earners assigned to active cases</p>
              ) : (
                <div className="space-y-3">
                  {audit.feeEarnerScores.map(fe => (
                    <div key={fe.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-800">{fe.name}</span>
                        <span className={`text-sm font-bold ${fe.score >= 80 ? 'text-green-600' : fe.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{fe.score}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${fe.score >= 80 ? 'bg-green-500' : fe.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${fe.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{fe.total} active cases</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link to="/compliance-alerts" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View & manage all compliance alerts →
          </Link>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, urgent, sub }) {
  return (
    <Card className={urgent ? 'border-red-400 border-2' : ''}>
      <CardContent className="pt-4 pb-4">
        <div className={`flex items-center gap-2 mb-1 ${urgent ? 'text-red-600' : 'text-slate-500'}`}>{icon}<span className="text-xs font-medium">{label}</span></div>
        <p className={`text-2xl font-bold ${urgent ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
        {sub && <p className="text-xs font-semibold text-red-600 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}