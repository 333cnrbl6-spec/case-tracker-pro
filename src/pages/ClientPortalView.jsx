import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Signature,
} from 'lucide-react';
import { toast } from 'sonner';

const UPDATE_TYPES = {
  progress_update: { label: 'Progress Update', icon: '📊' },
  feedback: { label: 'Feedback', icon: '💬' },
  signature_request: { label: 'Signature Request', icon: '✍️' },
  document_share: { label: 'Document Share', icon: '📄' },
  milestone: { label: 'Milestone', icon: '🎯' },
};

const SENTIMENT_COLORS = {
  positive: 'border-l-4 border-green-500 bg-green-50',
  neutral: 'border-l-4 border-blue-500 bg-blue-50',
  cautionary: 'border-l-4 border-orange-500 bg-orange-50',
};

export default function ClientPortalView() {
  const queryClient = useQueryClient();
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [signingUpdateId, setSigningUpdateId] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return me;
    },
  });

  // Fetch case (assuming passed via URL or context)
  const caseId = new URLSearchParams(window.location.search).get('case_id');
  const { data: legalCase } = useQuery({
    queryKey: ['legal-case', caseId],
    queryFn: () =>
      caseId
        ? base44.entities.LegalCase.list().then((cases) =>
            cases.find((c) => c.id === caseId)
          )
        : null,
    enabled: !!caseId,
  });

  // Fetch client updates
  const { data: updates = [] } = useQuery({
    queryKey: ['client-updates', caseId],
    queryFn: () =>
      caseId
        ? base44.entities.ClientUpdate.filter({
            case_id: caseId,
            visibility: 'public',
          })
        : Promise.resolve([]),
    enabled: !!caseId,
  });

  // Mark as viewed
  const viewMutation = useMutation({
    mutationFn: (updateId) =>
      base44.entities.ClientUpdate.update(updateId, {
        client_viewed: true,
        client_viewed_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-updates', caseId] });
    },
  });

  // Sign document
  const signMutation = useMutation({
    mutationFn: (updateId) =>
      base44.entities.ClientUpdate.update(updateId, {
        signature_status: 'signed',
        signature_date: new Date().toISOString(),
        signature_ip: window.location.hostname,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-updates', caseId] });
      setSigningUpdateId(null);
      toast.success('Document signed successfully');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleViewUpdate = (update) => {
    setSelectedUpdate(update);
    if (!update.client_viewed) {
      viewMutation.mutate(update.id);
    }
  };

  const recentUpdates = [...updates].reverse();

  if (!caseId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">
            No case information available. Please use your secure portal link.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {legalCase?.client_name}'s Case Portal
          </h1>
          <p className="text-slate-600 mt-2">
            Case Reference: <span className="font-mono font-semibold">{legalCase?.case_ref}</span>
          </p>
        </div>

        {/* Case Summary */}
        {legalCase && (
          <Card className="mb-6 border-blue-200 bg-white">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Your Solicitor</p>
                  <p className="font-semibold">{legalCase.assigned_fee_earner || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Case Status</p>
                  <Badge className="mt-1">
                    {legalCase.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {legalCase.estimated_value && (
                  <div>
                    <p className="text-sm text-slate-600">Estimated Value</p>
                    <p className="font-semibold">
                      £{legalCase.estimated_value.toLocaleString()}
                    </p>
                  </div>
                )}
                {legalCase.court_deadline && (
                  <div>
                    <p className="text-sm text-slate-600">Next Deadline</p>
                    <p className="font-semibold">
                      {new Date(legalCase.court_deadline).toLocaleDateString(
                        'en-GB'
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Updates List */}
        <div className="space-y-4">
          {recentUpdates.length === 0 ? (
            <Card className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                No updates yet. Your solicitor will share progress here.
              </p>
            </Card>
          ) : (
            recentUpdates.map((update) => (
              <Card
                key={update.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  SENTIMENT_COLORS[update.sentiment || 'neutral']
                }`}
                onClick={() => handleViewUpdate(update)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {UPDATE_TYPES[update.type]?.icon || '📌'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline">
                          {UPDATE_TYPES[update.type]?.label || update.type}
                        </Badge>
                        {!update.client_viewed && (
                          <Badge className="bg-blue-600 text-white animate-pulse">
                            New
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {update.title}
                      </h3>

                      <p className="text-slate-700 mb-3 line-clamp-2">
                        {update.content}
                      </p>

                      {update.signature_required && (
                        <div className="bg-white/50 border border-purple-300 rounded p-3 mb-3 text-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Signature className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-purple-900">
                              Signature Requested: {update.document_name}
                            </span>
                          </div>
                          {update.deadline && (
                            <p className="text-xs text-purple-700">
                              ⏰ Due:{' '}
                              {new Date(update.deadline).toLocaleDateString(
                                'en-GB'
                              )}
                            </p>
                          )}
                          {update.signature_status === 'signed' && (
                            <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              ✓ Signed on{' '}
                              {new Date(
                                update.signature_date
                              ).toLocaleDateString('en-GB')}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-600">
                          {new Date(update.created_date).toLocaleDateString(
                            'en-GB',
                            {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </p>
                        <p className="text-xs text-slate-600">
                          Click to view details →
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail Modal */}
        {selectedUpdate && (
          <Dialog open={!!selectedUpdate} onOpenChange={() => setSelectedUpdate(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">
                    {UPDATE_TYPES[selectedUpdate.type]?.icon}
                  </span>
                  {selectedUpdate.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded">
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedUpdate.content}
                  </p>
                </div>

                {selectedUpdate.signature_required && selectedUpdate.signature_status !== 'signed' && (
                  <div className="bg-purple-50 border border-purple-200 rounded p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Signature className="w-5 h-5 text-purple-600" />
                      Signature Required
                    </h4>

                    <p className="text-sm text-slate-700 mb-4">
                      Your solicitor has requested your signature on:{' '}
                      <strong>{selectedUpdate.document_name}</strong>
                    </p>

                    {selectedUpdate.deadline && (
                      <p className="text-sm text-orange-700 mb-4">
                        ⏰ This must be signed by{' '}
                        {new Date(selectedUpdate.deadline).toLocaleDateString(
                          'en-GB'
                        )}
                      </p>
                    )}

                    {selectedUpdate.document_url && (
                      <Button
                        onClick={() => window.open(selectedUpdate.document_url)}
                        variant="outline"
                        className="w-full mb-3 gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Document
                      </Button>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setSigningUpdateId(selectedUpdate.id)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        disabled={signMutation.isPending}
                      >
                        {signMutation.isPending ? 'Signing...' : '✓ Confirm Signature'}
                      </Button>
                    </div>

                    {signingUpdateId === selectedUpdate.id && (
                      <div className="mt-4 p-4 bg-white border rounded">
                        <p className="text-xs text-slate-600 mb-3">
                          By signing, you confirm you have reviewed the document and
                          agree to its contents.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              signMutation.mutate(selectedUpdate.id);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Confirm & Sign
                          </Button>
                          <Button
                            onClick={() => setSigningUpdateId(null)}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedUpdate.signature_status === 'signed' && (
                  <div className="bg-green-50 border border-green-200 rounded p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Signed</p>
                      <p className="text-sm text-green-700">
                        Signed on{' '}
                        {new Date(
                          selectedUpdate.signature_date
                        ).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-500 pt-4 border-t">
                  <p>
                    Posted:{' '}
                    {new Date(selectedUpdate.created_date).toLocaleDateString(
                      'en-GB',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}