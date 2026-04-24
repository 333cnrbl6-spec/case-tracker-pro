import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Sparkles, Loader2, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const severityIcons = {
  low: <AlertTriangle className="w-4 h-4" />,
  medium: <AlertTriangle className="w-4 h-4" />,
  high: <AlertTriangle className="w-4 h-4" />,
  critical: <AlertTriangle className="w-4 h-4" />
};

export default function BreachDiscoveryTool() {
  const [breaches, setBreaches] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [convertingId, setConvertingId] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const queryClient = useQueryClient();

  const { data: cases = [] } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list(),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('analyzeCommuncationsForBreaches', { case_id: selectedCaseId });
      return response;
    },
    onSuccess: (data) => {
      setBreaches(data.breaches || []);
      toast.success(`Found ${data.breaches?.length || 0} potential breaches in ${data.total_analyzed} communications`);
    },
    onError: (e) => toast.error(e.message)
  });

  const convertMutation = useMutation({
    mutationFn: async (breach) => {
      setConvertingId(breach.breach_type);
      const response = await base44.functions.invoke('convertBreachToIncident', { breach });
      return response;
    },
    onSuccess: (data) => {
      toast.success(`Incident created: ${data.incident_title}`);
      setConvertingId(null);
      // Remove from list
      setBreaches(breaches.filter(b => b.breach_type !== data.incident_id));
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: (e) => {
      toast.error(e.message);
      setConvertingId(null);
    }
  });

  const byCritical = breaches.filter(b => b.severity === 'critical');
  const byHigh = breaches.filter(b => b.severity === 'high');
  const byMedium = breaches.filter(b => b.severity === 'medium');
  const byLow = breaches.filter(b => b.severity === 'low');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-indigo-600" /> Breach Discovery Tool
          </h1>
          <p className="text-slate-600">AI-powered scanner to detect non-compliant language and RICS rule violations in communications</p>
        </div>

        {/* Case Selection & Scan */}
        {breaches.length === 0 && !analyzeMutation.isPending && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Scan Communications for Breaches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Select Case (Optional)</label>
                <select
                  value={selectedCaseId || ''}
                  onChange={(e) => setSelectedCaseId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="">All Communications</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.case_ref} — {c.client_name}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-slate-600">
                Analyzes communications using Claude AI against RICS Professional Standards to identify non-compliant language and rule violations.
              </p>
              <Button
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2 w-full"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Scanning...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Start Scan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {analyzeMutation.isPending && (
          <Card className="mb-8 text-center py-12">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-700 font-medium">Analyzing communications with Claude AI...</p>
            <p className="text-slate-500 text-sm mt-1">Checking against RICS rules</p>
          </Card>
        )}

        {/* Results Summary */}
        {breaches.length > 0 && (
          <>
            <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-900">{breaches.length}</p>
                    <p className="text-xs text-slate-600 mt-1">Total Breaches</p>
                  </div>
                  {byCritical.length > 0 && (
                    <div className="text-center bg-red-100 rounded-lg p-2">
                      <p className="text-2xl font-bold text-red-700">{byCritical.length}</p>
                      <p className="text-xs text-red-600 mt-1">Critical</p>
                    </div>
                  )}
                  {byHigh.length > 0 && (
                    <div className="text-center bg-orange-100 rounded-lg p-2">
                      <p className="text-2xl font-bold text-orange-700">{byHigh.length}</p>
                      <p className="text-xs text-orange-600 mt-1">High</p>
                    </div>
                  )}
                  {byMedium.length > 0 && (
                    <div className="text-center bg-yellow-100 rounded-lg p-2">
                      <p className="text-2xl font-bold text-yellow-700">{byMedium.length}</p>
                      <p className="text-xs text-yellow-600 mt-1">Medium</p>
                    </div>
                  )}
                  {byLow.length > 0 && (
                    <div className="text-center bg-blue-100 rounded-lg p-2">
                      <p className="text-2xl font-bold text-blue-700">{byLow.length}</p>
                      <p className="text-xs text-blue-600 mt-1">Low</p>
                    </div>
                  )}
                  <Button
                    onClick={() => analyzeMutation.mutate()}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <RefreshCw className="w-4 h-4" /> Rescan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Breach Groups */}
            {[
              { severity: 'critical', label: '🔴 Critical', breaches: byCritical },
              { severity: 'high', label: '🟠 High', breaches: byHigh },
              { severity: 'medium', label: '🟡 Medium', breaches: byMedium },
              { severity: 'low', label: '🔵 Low', breaches: byLow }
            ].map(group => group.breaches.length > 0 && (
              <div key={group.severity} className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">{group.label} Severity ({group.breaches.length})</h3>
                <div className="space-y-2">
                  {group.breaches.map((breach, idx) => (
                    <BreachCard
                      key={idx}
                      breach={breach}
                      expanded={expandedId === `${group.severity}-${idx}`}
                      onToggle={() => setExpandedId(expandedId === `${group.severity}-${idx}` ? null : `${group.severity}-${idx}`)}
                      onConvert={() => convertMutation.mutate(breach)}
                      isConverting={convertingId === breach.breach_type}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {breaches.length === 0 && !analyzeMutation.isPending && (
          <Card className="text-center py-8 border-dashed text-slate-500">
            <p>No breaches found. Run a scan to begin.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function BreachCard({ breach, expanded, onToggle, onConvert, isConverting }) {
  return (
    <Card
      className={`cursor-pointer transition-all border-l-4 ${
        breach.severity === 'critical' ? 'border-l-red-600 bg-red-50' :
        breach.severity === 'high' ? 'border-l-orange-600 bg-orange-50' :
        breach.severity === 'medium' ? 'border-l-yellow-600 bg-yellow-50' :
        'border-l-blue-600 bg-blue-50'
      }`}
      onClick={onToggle}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge className={severityColors[breach.severity]}>
                {severityIcons[breach.severity]} {breach.severity.toUpperCase()}
              </Badge>
              <span className="font-semibold text-slate-900 text-sm">{breach.breach_type}</span>
              <span className="text-xs text-slate-600 font-mono">{breach.date}</span>
            </div>

            <p className="font-medium text-slate-900 mb-1">{breach.rule_title}</p>
            <p className="text-xs text-slate-700 mb-2">{breach.rule_category}</p>
            <p className="text-sm text-slate-700 line-clamp-2">{breach.issue_description}</p>

            {expanded && (
              <div className="mt-4 space-y-3 pt-3 border-t border-slate-300">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Problematic Text:</p>
                  <p className="text-sm text-slate-800 bg-white rounded p-2 italic border-l-2 border-slate-400">
                    "{breach.problematic_text}"
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Communication Details:</p>
                  <div className="text-xs text-slate-700 space-y-1 bg-white rounded p-2">
                    <p><strong>From:</strong> {breach.from}</p>
                    <p><strong>To:</strong> {breach.to}</p>
                    <p><strong>Subject:</strong> {breach.subject}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Recommendation:</p>
                  <p className="text-sm text-slate-700 bg-white rounded p-2">{breach.recommendation}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onConvert();
              }}
              disabled={isConverting}
              className="bg-indigo-600 hover:bg-indigo-700 gap-1 whitespace-nowrap"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Create Incident
                </>
              )}
            </Button>
            {expanded && (
              <Link to="/incidents">
                <Button size="sm" variant="outline" className="gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}