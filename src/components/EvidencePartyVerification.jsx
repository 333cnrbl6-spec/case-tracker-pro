import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Loader2, Edit2, CheckCircle2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

const flagTypeConfig = {
  party_reference_found: { icon: AlertCircle, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  financial_evidence: { icon: AlertTriangle, color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
  potential_fee_shift: { icon: AlertTriangle, color: 'bg-red-50 border-red-200', text: 'text-red-700', priority: 'CRITICAL' },
  coercive_language: { icon: AlertTriangle, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' }
};

export default function EvidencePartyVerification({ caseId, evidenceIds, onVerificationComplete }) {
  const [expandedIssues, setExpandedIssues] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [partyCorrections, setPartyCorrections] = useState({});

  const verificationMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('verifyEvidenceParties', {
        case_id: caseId,
        evidence_ids: evidenceIds
      });
      return response.data;
    },
    onSuccess: (data) => {
      onVerificationComplete?.(data);
    }
  });

  const applyPartyCorrection = async (evidenceId, correctedParties) => {
    try {
      await base44.entities.Evidence.update(evidenceId, {
        notes: `${base44.entities.Evidence.read(evidenceId).then(e => e.notes || '')} [CORRECTED PARTIES: ${JSON.stringify(correctedParties)}]`
      });
      
      setPartyCorrections({ ...partyCorrections, [evidenceId]: null });
      setEditingId(null);
      setTimeout(() => verificationMutation.mutate(), 500);
    } catch (error) {
      console.error('Failed to apply party correction:', error);
    }
  };

  const toggleExpanded = (id) => {
    const newSet = new Set(expandedIssues);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIssues(newSet);
  };

  if (!verificationMutation.data && !verificationMutation.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Evidence Party Verification
          </CardTitle>
          <CardDescription>Verify that evidence records have correct party information and identify fee-shifting schemes</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => verificationMutation.mutate()} disabled={verificationMutation.isPending}>
            {verificationMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Verify Evidence Parties
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (verificationMutation.isPending) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-600">Verifying evidence parties and analyzing for fee-shifting schemes...</p>
        </CardContent>
      </Card>
    );
  }

  const data = verificationMutation.data;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-600 mb-1">Evidence Reviewed</p>
              <p className="text-2xl font-bold text-slate-900">{data.total_evidence_reviewed}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Party Issues</p>
              <p className={`text-2xl font-bold ${data.issues_found > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {data.issues_found}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Known Parties</p>
              <p className="text-2xl font-bold text-slate-900">{data.known_parties?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Alert */}
      {data.ai_analysis && (
        <Card className={data.ai_analysis.fee_shifting_detected ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {data.ai_analysis.fee_shifting_detected ? 'Fee-Shifting Scheme Detected' : 'Fee-Shifting Analysis'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Scheme Type</p>
              <p className="text-sm text-slate-700">{data.ai_analysis.scheme_type || 'Analyzing...'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Parties Involved</p>
              <div className="flex flex-wrap gap-2">
                {data.ai_analysis.parties_involved?.map((party, idx) => (
                  <Badge key={idx} variant="outline">{party}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Evidence Summary</p>
              <p className="text-sm text-slate-700">{data.ai_analysis.evidence_summary}</p>
            </div>
            <div>
              <Badge className={data.ai_analysis.risk_level === 'high' ? 'bg-red-600' : 'bg-orange-600'}>
                Risk Level: {data.ai_analysis.risk_level?.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Known Parties */}
      {data.known_parties && data.known_parties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Known Parties in Case</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.known_parties.map((party, idx) => (
                <div key={idx} className="bg-slate-50 rounded p-2 text-sm">
                  <p className="font-medium text-slate-900">{party.name}</p>
                  {party.role && <p className="text-xs text-slate-600">{party.role}</p>}
                  {party.confirmed && <Badge className="bg-green-100 text-green-800 text-xs mt-1">Confirmed</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Party Verification Issues */}
      {data.party_issues && data.party_issues.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Party Verification Issues ({data.party_issues.length})
          </h3>
          <div className="space-y-3">
            {data.party_issues.map((issue, idx) => {
              const isExpanded = expandedIssues.has(issue.id);
              const hasCritical = issue.flags.some(f => flagTypeConfig[f.type]?.priority === 'CRITICAL');
              
              return (
                <Card key={idx} className={`border-2 ${hasCritical ? 'border-red-300 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
                  <div
                    className="p-4 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleExpanded(issue.id)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-900">{issue.title}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Type: {issue.type} | Date: {issue.date_collected}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(editingId === issue.id ? null : issue.id);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Flags */}
                    {issue.flags && (
                      <div className="space-y-2">
                        {issue.flags.map((flag, flagIdx) => {
                          const config = flagTypeConfig[flag.type] || flagTypeConfig.party_reference_found;
                          const Icon = config.icon;
                          
                          return (
                            <div key={flagIdx} className="flex gap-2 text-xs">
                              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {flag.message || flag.pattern}
                                  {config.priority && <Badge className="ml-2 bg-red-600">{config.priority}</Badge>}
                                </p>
                                {flag.suspected && <p className="text-slate-700 mt-0.5">Suspected: {flag.suspected}</p>}
                                {flag.suggestion && <p className="text-slate-600 italic mt-0.5">→ {flag.suggestion}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Edit Mode */}
                    {editingId === issue.id && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-orange-200">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Correct From Party</label>
                          <input
                            type="text"
                            defaultValue={partyCorrections[issue.id]?.from || ''}
                            onChange={(e) => setPartyCorrections({ ...partyCorrections, [issue.id]: { ...partyCorrections[issue.id], from: e.target.value } })}
                            className="w-full text-xs border border-orange-300 rounded px-2 py-1"
                            placeholder="e.g., Malcolm Belcher"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Correct To Party</label>
                          <input
                            type="text"
                            defaultValue={partyCorrections[issue.id]?.to || ''}
                            onChange={(e) => setPartyCorrections({ ...partyCorrections, [issue.id]: { ...partyCorrections[issue.id], to: e.target.value } })}
                            className="w-full text-xs border border-orange-300 rounded px-2 py-1"
                            placeholder="e.g., William Bradley"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyPartyCorrection(issue.id, partyCorrections[issue.id] || {})}
                        >
                          Verify & Correct
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {data.issues_found === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <p className="text-sm font-semibold text-green-900">All evidence parties verified and correct</p>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => verificationMutation.mutate()} variant="outline" className="w-full">
        Re-verify
      </Button>
    </div>
  );
}