import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2, Edit2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

const flagTypeConfig = {
  domain_origin: { icon: AlertCircle, color: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  missing_recipient: { icon: AlertTriangle, color: 'bg-red-50 border-red-200', text: 'text-red-700' },
  scope_discussion: { icon: AlertTriangle, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  possible_reply_confusion: { icon: AlertCircle, color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' }
};

export default function SenderRecipientVerification({ caseId, onIssuesFound }) {
  const [expandedIssues, setExpandedIssues] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [corrections, setCorrections] = useState({});

  const verificationMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('verifySenderRecipientAccuracy', {
        case_id: caseId
      });
      return response.data;
    },
    onSuccess: (data) => {
      onIssuesFound?.(data.issues_found);
    }
  });

  const applyCorrection = async (commId, newFrom, newTo) => {
    try {
      await base44.entities.Communication.update(commId, {
        from: newFrom || undefined,
        to: newTo || undefined
      });
      
      // Remove from corrections state
      const newCorrections = { ...corrections };
      delete newCorrections[commId];
      setCorrections(newCorrections);
      
      // Re-run verification
      setTimeout(() => verificationMutation.mutate(), 500);
    } catch (error) {
      console.error('Failed to apply correction:', error);
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
            Sender/Recipient Verification
          </CardTitle>
          <CardDescription>Check email sender/recipient accuracy and identify potential confusion from replies</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => verificationMutation.mutate()} disabled={verificationMutation.isPending}>
            {verificationMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Verify All Communications
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
          <p className="text-sm text-slate-600">Checking sender/recipient accuracy...</p>
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
              <p className="text-xs text-slate-600 mb-1">Communications Checked</p>
              <p className="text-2xl font-bold text-slate-900">{data.total_communications_checked}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Issues Found</p>
              <p className={`text-2xl font-bold ${data.issues_found > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {data.issues_found}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Suspicious Patterns</p>
              <p className="text-2xl font-bold text-yellow-600">{data.suspicious_patterns?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Domains Detected */}
      {data.email_domains_detected && data.email_domains_detected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Domains Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.email_domains_detected.map((domain, idx) => (
                <Badge key={idx} variant="outline">
                  {domain}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suspicious Patterns */}
      {data.suspicious_patterns && data.suspicious_patterns.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Suspicious Patterns ({data.suspicious_patterns.length})
          </h3>
          <div className="space-y-3">
            {data.suspicious_patterns.map((pattern, idx) => (
              <Card key={idx} className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-900 mb-1">{pattern.type.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-700 mb-2">{pattern.reason}</p>
                      <div className="text-xs space-y-1 text-slate-600 bg-white rounded p-2">
                        <p><span className="font-medium">Subject:</span> {pattern.subject}</p>
                        <p><span className="font-medium">From:</span> {pattern.from}</p>
                        <p><span className="font-medium">To:</span> {pattern.to}</p>
                        <p><span className="font-medium">Date:</span> {pattern.date}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Verification Issues */}
      {data.issues && data.issues.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Verification Issues ({data.issues.length})
          </h3>
          <div className="space-y-3">
            {data.issues.map((issue, idx) => {
              const isExpanded = expandedIssues.has(issue.id);
              
              return (
                <Card key={idx} className="border-orange-200 bg-orange-50">
                  <div
                    className="p-4 cursor-pointer hover:bg-orange-100/50 transition-colors"
                    onClick={() => toggleExpanded(issue.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-900 mb-1">{issue.subject}</p>
                        <div className="text-xs space-y-1 text-slate-600">
                          <p><span className="font-medium">From:</span> {issue.from}</p>
                          <p><span className="font-medium">To:</span> {issue.to}</p>
                          <p><span className="font-medium">Date:</span> {issue.date}</p>
                        </div>
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
                    {issue.flags && issue.flags.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {issue.flags.map((flag, flagIdx) => {
                          const config = flagTypeConfig[flag.type] || flagTypeConfig.scope_discussion;
                          return (
                            <div key={flagIdx} className="bg-white rounded p-2 text-xs">
                              <p className="font-semibold text-slate-900 mb-1 capitalize">
                                {flag.type.replace(/_/g, ' ')}
                              </p>
                              <p className="text-slate-700 mb-1">{flag.message}</p>
                              <p className="text-slate-600 italic">💡 {flag.suggestion}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Edit Mode */}
                    {editingId === issue.id && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-orange-200">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Correct From</label>
                          <input
                            type="text"
                            defaultValue={issue.from}
                            onChange={(e) => setCorrections({ ...corrections, [issue.id]: { ...corrections[issue.id], from: e.target.value } })}
                            className="w-full text-xs border border-orange-300 rounded px-2 py-1"
                            placeholder="sender@example.com"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Correct To</label>
                          <input
                            type="text"
                            defaultValue={issue.to}
                            onChange={(e) => setCorrections({ ...corrections, [issue.id]: { ...corrections[issue.id], to: e.target.value } })}
                            className="w-full text-xs border border-orange-300 rounded px-2 py-1"
                            placeholder="recipient@example.com"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyCorrection(
                            issue.id,
                            corrections[issue.id]?.from || issue.from,
                            corrections[issue.id]?.to || issue.to
                          )}
                        >
                          Save Correction
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

      {data.issues_found === 0 && data.suspicious_patterns.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <p className="text-sm font-semibold text-green-900">All sender/recipient information verified</p>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => verificationMutation.mutate()} variant="outline" className="w-full">
        Re-verify
      </Button>
    </div>
  );
}