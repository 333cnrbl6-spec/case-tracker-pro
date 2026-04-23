import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function CaseMigrationWizard({ open = false, onOpenChange = () => {}, onSuccess = () => {} }) {
  const [step, setStep] = useState('confirm'); // confirm, form, processing, complete
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    caseName: '',
    clientName: '',
    clientEmail: '',
    opponentName: ''
  });
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const queryClient = useQueryClient();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMigrate = async () => {
    if (!formData.caseName || !formData.clientName || !formData.clientEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('migrateDataToNewCase', formData);
      
      setResult(response.data.case);
      setStats(response.data.summary);
      setStep('complete');
      toast.success(`Case ${response.data.case.case_ref} created successfully!`);
      
      // Refresh case list
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onSuccess(response.data.case);
    } catch (err) {
      toast.error(err.message || 'Migration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Migrate Evidence to New Case</DialogTitle>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-900">
                This will consolidate all your current incidents, evidence, and communications into a new legal case within the Case Manager. All evidence will remain accessible and fully integrated.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">Multiple</p>
                <p className="text-xs text-slate-600 mt-1">Incidents</p>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-900">1</p>
                <p className="text-xs text-blue-600 mt-1">Unified Case</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setStep('form')}
              >
                Proceed to Setup
              </Button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Case Name *</label>
                <Input
                  placeholder="e.g., Smith v. Jones Professional Negligence"
                  value={formData.caseName}
                  onChange={(e) => handleInputChange('caseName', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Client Name *</label>
                <Input
                  placeholder="Your client's name"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Client Email *</label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Opponent Name</label>
                <Input
                  placeholder="Opposing party (optional)"
                  value={formData.opponentName}
                  onChange={(e) => handleInputChange('opponentName', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('confirm')}>
                Back
              </Button>
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
                onClick={handleMigrate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Case...
                  </>
                ) : (
                  'Create Case & Migrate'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && result && stats && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">Migration Complete</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your case has been created and all evidence has been integrated.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">Case Reference</p>
                <Badge variant="outline" className="font-mono">{result.case_ref}</Badge>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <p className="text-slate-600">Incidents Migrated</p>
                  <p className="font-medium text-slate-900">{stats.incidents_migrated}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-slate-600">Evidence Items</p>
                  <p className="font-medium text-slate-900">{stats.evidence_migrated}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-slate-600">Communications</p>
                  <p className="font-medium text-slate-900">{stats.communications_migrated}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-slate-600">Case Parties Created</p>
                  <p className="font-medium text-slate-900">{stats.parties_created}</p>
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-600">Initial Risk Score</p>
                  <div className="flex items-center gap-2">
                    <Badge className={`${
                      stats.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                      stats.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                      stats.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {stats.risk_score}/100
                    </Badge>
                    <Badge variant="outline" className="capitalize">{stats.risk_level}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Next Steps:</strong> Navigate to Case Manager to review the case, update client information, and proceed with legal analysis.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  onOpenChange(false);
                  // Navigate to case manager
                  window.location.href = '/case-manager';
                }}
              >
                Go to Case Manager
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}