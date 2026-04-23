import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickCaseSetup({ open = false, onOpenChange = () => {}, onSuccess = () => {} }) {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [caseData, setCaseData] = useState(null);

  const handleCreateBradleyVBelcher = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createBradleyVBelcherCase', {});
      setCaseData(response.data);
      setComplete(true);
      toast.success('Bradley v. Belcher case created successfully!');
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      toast.error(err.message || 'Failed to create case');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Case Setup</DialogTitle>
        </DialogHeader>

        {!complete ? (
          <div className="space-y-4">
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="pt-6">
                <p className="text-sm text-indigo-900 mb-4">
                  This will automatically create the <strong>Bradley v. Belcher</strong> case and populate it with all your current evidence, incidents, and communications.
                </p>
                <div className="bg-white rounded p-3 text-xs text-slate-700 space-y-1">
                  <p>✓ All incidents will be linked</p>
                  <p>✓ All evidence auto-tagged and organized</p>
                  <p>✓ Risk assessment calculated</p>
                  <p>✓ Limitation date set (6 years)</p>
                  <p>✓ Case ready for legal analysis</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
                onClick={handleCreateBradleyVBelcher}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Case Now'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">Case Created</h3>
                  <p className="text-sm text-green-700 mt-1">Bradley v. Belcher is ready for review</p>
                </div>
              </div>
            </div>

            {caseData && (
              <Card className="bg-slate-50">
                <CardContent className="pt-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Case Reference:</span>
                    <span className="font-mono font-medium">{caseData.case.case_ref}</span>
                  </div>
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-slate-700"><strong>{caseData.summary.incidents_migrated}</strong> incidents</p>
                    <p className="text-slate-700"><strong>{caseData.summary.evidence_migrated}</strong> evidence items</p>
                    <p className="text-slate-700"><strong>{caseData.summary.communications_migrated}</strong> communications</p>
                    <p className="text-slate-700 mt-2">
                      Risk Score: <strong>{caseData.summary.risk_score}/100</strong> ({caseData.summary.risk_level})
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                onOpenChange(false);
                window.location.href = '/case-manager';
              }}
            >
              Go to Case Manager
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}