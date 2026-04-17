import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, AlertTriangle, Loader2, Link2, Flag } from 'lucide-react';
import { toast } from 'sonner';
import CommunicationMapperCard from '@/components/CommunicationMapperCard';

export default function RICSCommunicationMapper() {
  const [expandedComm, setExpandedComm] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: communications = [], isLoading: commsLoading } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list(),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const analyzeComm = useMutation({
    mutationFn: async (commId) => {
      const result = await base44.functions.invoke('analyzeCommunicationMapping', {
        communicationId: commId,
        incidents: incidents.map(i => i.data),
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Communication analysis complete');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to analyze communication');
    }
  });

  const analyzeAllComms = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('batchAnalyzeCommunications', {
        communicationIds: communications.map(c => c.id),
        incidents: incidents.map(i => i.data),
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('All communications analyzed');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to analyze communications');
    }
  });

  // Count discrepancies
  const commsWithDiscrepancies = communications.filter(c => c.data?.discrepancies?.length > 0).length;
  const commsWithMissingEvidence = communications.filter(c => !c.data?.linked_evidence?.length && c.data?.mapped_violations?.length > 0).length;
  const fullyMapped = communications.filter(c => c.data?.mapped_violations?.length > 0 && c.data?.mapped_legal_issues?.length > 0).length;

  const filteredComms = communications.filter(c => {
    if (filterType === 'unmapped') return !c.data?.mapped_violations?.length && !c.data?.mapped_legal_issues?.length;
    if (filterType === 'discrepancies') return c.data?.discrepancies?.length > 0;
    if (filterType === 'missing-evidence') return c.data?.mapped_violations?.length > 0 && !c.data?.linked_evidence?.length;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Communication to RICS Violation Mapper</h1>
          <p className="text-lg text-slate-600">Automatically link communications to RICS violations and flag discrepancies</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Communications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{communications.length}</div>
              <p className="text-xs text-slate-500 mt-1">Logged messages & documents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Fully Mapped</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{fullyMapped}</div>
              <p className="text-xs text-slate-500 mt-1">Linked to violations & issues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Discrepancies Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{commsWithDiscrepancies}</div>
              <p className="text-xs text-slate-500 mt-1">Contradictions or gaps</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Missing Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{commsWithMissingEvidence}</div>
              <p className="text-xs text-slate-500 mt-1">No supporting files</p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Actions */}
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-indigo-600" />
              Automated Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 mb-4">Use AI to automatically analyze communications and map them to RICS violations and legal issues:</p>
            <div className="flex gap-3">
              <Button
                onClick={() => analyzeAllComms.mutate()}
                disabled={communications.length === 0 || analyzeAllComms.isPending}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {analyzeAllComms.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Analyze All Communications
              </Button>
              <Button
                variant="outline"
                onClick={() => setFilterType(filterType === 'unmapped' ? 'all' : 'unmapped')}
              >
                {filterType === 'unmapped' ? 'Show All' : 'Show Unmapped Only'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            All Communications ({communications.length})
          </Button>
          <Button
            variant={filterType === 'unmapped' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('unmapped')}
          >
            Unmapped
          </Button>
          <Button
            variant={filterType === 'discrepancies' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('discrepancies')}
          >
            Discrepancies ({commsWithDiscrepancies})
          </Button>
          <Button
            variant={filterType === 'missing-evidence' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('missing-evidence')}
          >
            Missing Evidence ({commsWithMissingEvidence})
          </Button>
        </div>

        {/* Communications List */}
        {commsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredComms.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              No communications found for this filter
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredComms.map((comm) => (
              <CommunicationMapperCard
                key={comm.id}
                communication={comm}
                incidents={incidents}
                evidence={evidence}
                expanded={expandedComm === comm.id}
                onToggleExpand={() => setExpandedComm(expandedComm === comm.id ? null : comm.id)}
                onAnalyze={() => analyzeComm.mutate(comm.id)}
                isAnalyzing={analyzeComm.isPending}
              />
            ))}
          </div>
        )}

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              How This Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>✓ Analyze communications to identify connections to RICS violations</li>
              <li>✓ Automatically map communications to legal issues mentioned in incidents</li>
              <li>✓ Flag discrepancies where communications contradict incident descriptions</li>
              <li>✓ Identify communications that lack supporting evidence files</li>
              <li>✓ Strengthen your case by cross-referencing all documentary evidence</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}