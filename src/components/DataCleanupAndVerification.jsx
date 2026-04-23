import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

export default function DataCleanupAndVerification({ caseId, onCleanupComplete }) {
  const [confirmed, setConfirmed] = useState(false);

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cleanupBuildDataAndMigrate', {
        target_case_id: caseId
      });
      return response.data;
    },
    onSuccess: (data) => {
      onCleanupComplete?.(data);
    }
  });

  if (cleanupMutation.isPending) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <div className="text-center">
            <p className="font-semibold text-slate-900">Running Data Cleanup & Verification</p>
            <p className="text-sm text-slate-600 mt-1">Deleting build data and running comprehensive verifications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cleanupMutation.isSuccess) {
    const data = cleanupMutation.data;

    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle2 className="w-5 h-5" />
            Cleanup & Verification Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded p-3">
              <p className="text-xs text-slate-600 mb-1">Build Data Deleted</p>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{data.deletion_summary.incidents_deleted} incidents</p>
                <p className="text-sm font-semibold text-slate-900">{data.deletion_summary.communications_deleted} comms</p>
                <p className="text-sm font-semibold text-slate-900">{data.deletion_summary.evidence_deleted} evidence</p>
                <p className="text-sm font-semibold text-slate-900">{data.deletion_summary.tasks_deleted} tasks</p>
              </div>
            </div>

            <div className="bg-white rounded p-3">
              <p className="text-xs text-slate-600 mb-1">Verified Evidence</p>
              <p className="text-2xl font-bold text-green-700">{data.remaining_evidence}</p>
              <p className="text-xs text-slate-600 mt-2">In {data.target_case_id}</p>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-semibold text-slate-900">Verification Results</p>
            
            <div className="bg-white rounded p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Sender/Recipient Checked:</span>
                <span className="font-semibold">{data.verification_results.sender_recipient.total_checked}</span>
              </div>
              <div className="flex justify-between">
                <span>Issues Found:</span>
                <Badge className={data.verification_results.sender_recipient.issues_found > 0 ? 'bg-yellow-600' : 'bg-green-600'}>
                  {data.verification_results.sender_recipient.issues_found}
                </Badge>
              </div>
            </div>

            <div className="bg-white rounded p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Party Verification:</span>
                <span className="font-semibold">{data.verification_results.party_verification.total_checked} items</span>
              </div>
              <div className="flex justify-between">
                <span>Issues Found:</span>
                <Badge className={data.verification_results.party_verification.issues_found > 0 ? 'bg-yellow-600' : 'bg-green-600'}>
                  {data.verification_results.party_verification.issues_found}
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 text-center">
            All build data deleted. Real case evidence in {data.target_case_id} has been verified for accuracy.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <AlertTriangle className="w-5 h-5" />
          Cleanup Build Data & Run Verification
        </CardTitle>
        <CardDescription className="text-red-800">
          This will delete all test/build data and run comprehensive verifications on {caseId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-100 border border-red-300 rounded p-3 text-sm text-red-900">
          <p className="font-semibold mb-2">This action:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Permanently deletes all test incidents, communications, and evidence</li>
            <li>Keeps only data linked to <code className="bg-red-200 px-1 rounded">{caseId}</code></li>
            <li>Runs sender/recipient accuracy checks</li>
            <li>Verifies all evidence party information</li>
            <li>Cannot be undone</li>
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="confirm"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="rounded border-slate-300"
          />
          <label htmlFor="confirm" className="text-sm text-slate-700">
            I understand this will permanently delete build data
          </label>
        </div>

        <Button
          onClick={() => cleanupMutation.mutate()}
          disabled={!confirmed || cleanupMutation.isPending}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Build Data & Verify Case
        </Button>
      </CardContent>
    </Card>
  );
}