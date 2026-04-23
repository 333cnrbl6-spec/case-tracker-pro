import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import RICSRiskAssessor from '@/components/RICSRiskAssessor';

export default function RICSRiskModule() {
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-date'),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  // Quick stats
  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const totalViolations = incidents.flatMap(i => i.rics_violations || []).length;
  const uniqueViolations = new Set(incidents.flatMap(i => i.rics_violations || []));
  const criticalEvidence = evidence.filter(e => e.strength === 'critical').length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">RICS Compliance Risk Module</h1>
            <p className="text-slate-500 text-sm">AI-powered proactive risk identification and investigation recommendations</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Critical Incidents', value: criticalCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
            { label: 'RICS Violations Flagged', value: totalViolations, icon: Shield, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
            { label: 'Unique Rule Breaches', value: uniqueViolations.size, icon: TrendingUp, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
            { label: 'Critical Evidence', value: criticalEvidence, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
          ].map(s => (
            <Card key={s.label} className={`border ${s.bg}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                  <div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Violation frequency heatmap */}
        {totalViolations > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                RICS Violation Frequency Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  incidents.flatMap(i => i.rics_violations || []).reduce((acc, v) => {
                    acc[v] = (acc[v] || 0) + 1;
                    return acc;
                  }, {})
                ).sort((a, b) => b[1] - a[1]).map(([rule, count]) => (
                  <Badge
                    key={rule}
                    className={`text-xs border ${count >= 3 ? 'bg-red-100 text-red-800 border-red-300' : count === 2 ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}
                  >
                    {rule} ×{count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main assessor */}
        <RICSRiskAssessor />
      </div>
    </div>
  );
}