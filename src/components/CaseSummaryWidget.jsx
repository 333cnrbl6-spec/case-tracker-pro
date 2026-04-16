import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Calendar, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CaseSummaryWidget() {
  const [summary, setsummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('generateCaseSummary', {});
      setsummary(response.data);
    } catch (err) {
      setError(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateSummary();
  }, []);

  if (loading && !summary) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <p className="text-slate-600">Generating case summary...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!summary) return null;

  const { summary: data, metadata } = summary;

  return (
    <div className="space-y-4">
      {/* Main Summary Card */}
      <Card className="border-l-4 border-l-indigo-600 bg-gradient-to-br from-indigo-50 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">Case Overview</CardTitle>
              <p className="text-sm text-slate-700 leading-relaxed">{data.overview}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={generateSummary}
              disabled={loading}
              className="ml-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{metadata.incidents_count}</div>
            <div className="text-xs text-slate-600">Incidents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{metadata.evidence_count}</div>
            <div className="text-xs text-slate-600">Evidence Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{metadata.communications_count}</div>
            <div className="text-xs text-slate-600">Communications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{metadata.parties_count}</div>
            <div className="text-xs text-slate-600">Parties</div>
          </CardContent>
        </Card>
      </div>

      {/* Expandable Sections */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left flex items-center justify-between hover:bg-slate-50 p-2 rounded -mx-2"
          >
            <CardTitle className="text-base">Details</CardTitle>
            <span className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-6 border-t pt-6">
            {/* Key Dates */}
            {data.key_dates?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  Key Dates
                </h4>
                <div className="space-y-2">
                  {data.key_dates.map((item, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <span className="font-mono text-slate-600 min-w-fit">{item.date}</span>
                      <span className="text-slate-700">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parties Involved */}
            {data.parties_involved?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  Parties Involved
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.parties_involved.map((party, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      <span className="font-semibold">{party.name}</span>
                      <span className="ml-1 text-slate-600">({party.role})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Critical Evidence */}
            {data.critical_evidence?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Critical Evidence
                </h4>
                <div className="space-y-2">
                  {data.critical_evidence.map((item, idx) => (
                    <div key={idx} className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                      <p className="font-semibold text-green-900">{item.title}</p>
                      <p className="text-green-800 text-xs mt-1">{item.why_important}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal Risks */}
            {data.legal_risks?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Legal Risks & Violations
                </h4>
                <div className="space-y-2">
                  {data.legal_risks.map((risk, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                      <p className="text-red-900">{risk}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {data.next_steps?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Recommended Next Steps</h4>
                <ol className="space-y-2 list-decimal list-inside">
                  {data.next_steps.map((step, idx) => (
                    <li key={idx} className="text-sm text-slate-700">{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}