import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, GitMerge, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function DuplicateCaseMerger({ case1, case2, open, onClose }) {
  const queryClient = useQueryClient();
  const [comparison, setComparison] = useState(null);
  const [keepCaseId, setKeepCaseId] = useState(case1?.id);
  const [merging, setMerging] = useState(false);

  const useEffect = React.useEffect;
  useEffect(() => {
    if (open && case1 && case2) {
      setKeepCaseId(case1.id);
      // Comparison is already done, just show the UI
    }
  }, [open, case1, case2]);

  const mergeMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('mergeDuplicateCases', {
        keep_case_id: keepCaseId,
        delete_case_id: keepCaseId === case1.id ? case2.id : case1.id
      });
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      toast.success(
        `Merged: Kept ${data.keep_case.case_ref}, deleted ${data.deleted_case.case_ref}. Migrated ${data.migrated.incidents + data.migrated.communications + data.migrated.evidence} related records.`
      );
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Merge failed');
    }
  });

  if (!case1 || !case2) return null;

  const deleteCase = keepCaseId === case1.id ? case2 : case1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-indigo-600" />
            Merge Duplicate Cases
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900">These cases are identical (except case references)</p>
                <p className="text-amber-800 text-xs mt-1">
                  Select which case to keep. All incidents, communications, and evidence from the other case will be migrated over, then that case will be deleted.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {/* Case 1 Option */}
            <Card
              className={`cursor-pointer transition-all border-2 ${
                keepCaseId === case1.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => setKeepCaseId(case1.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{case1.case_ref}</CardTitle>
                  {keepCaseId === case1.id && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-1 text-slate-600">
                <p><strong>Client:</strong> {case1.client_name}</p>
                <p><strong>Opponent:</strong> {case1.opponent_name || '—'}</p>
                <p><strong>Type:</strong> {case1.case_type}</p>
                <p><strong>AI Narrative:</strong> {case1.ai_narrative ? '✓' : '✗'}</p>
              </CardContent>
            </Card>

            {/* Case 2 Option */}
            <Card
              className={`cursor-pointer transition-all border-2 ${
                keepCaseId === case2.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => setKeepCaseId(case2.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{case2.case_ref}</CardTitle>
                  {keepCaseId === case2.id && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-1 text-slate-600">
                <p><strong>Client:</strong> {case2.client_name}</p>
                <p><strong>Opponent:</strong> {case2.opponent_name || '—'}</p>
                <p><strong>Type:</strong> {case2.case_type}</p>
                <p><strong>AI Narrative:</strong> {case2.ai_narrative ? '✓' : '✗'}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-4 text-sm">
              <p className="font-semibold text-slate-900 mb-2">Merge Plan:</p>
              <ul className="space-y-1 text-xs text-slate-700">
                <li>✓ Keep: <strong>{case1.case_ref === keepCaseId || keepCaseId === case1.id ? case1.case_ref : case2.case_ref}</strong></li>
                <li>✗ Delete: <strong>{deleteCase.case_ref}</strong></li>
                <li>→ Migrate all related incidents, communications, and evidence</li>
                <li>→ Preserve AI narrative if present in either case</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => mergeMutation.mutate()}
              disabled={mergeMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {mergeMutation.isPending ? 'Merging...' : 'Merge Cases'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}