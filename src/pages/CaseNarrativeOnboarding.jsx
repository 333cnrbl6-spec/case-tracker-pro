import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function CaseNarrativeOnboarding() {
  const [step, setStep] = useState(1);
  const [practiceData, setPracticeData] = useState({
    firm_name: '',
    sra_number: '',
    practice_areas: []
  });
  const [caseData, setCaseData] = useState({
    case_ref: '',
    case_type: '',
    client_name: '',
    incident_date: ''
  });
  const [alertDays, setAlertDays] = useState([30, 14, 7, 3, 1]);
  const [loading, setLoading] = useState(false);

  const completePracticeSetup = async () => {
    try {
      setLoading(true);
      const profile = await base44.entities.PracticeProfile.list();
      if (profile.length === 0) {
        await base44.entities.PracticeProfile.create({
          ...practiceData,
          limitation_alert_days: alertDays
        });
      }
      setStep(2);
    } catch (error) {
      console.error('Error setting up practice:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeFirstCase = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const limitationDate = new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());
      
      await base44.entities.LegalCase.create({
        ...caseData,
        status: 'active',
        limitation_date: limitationDate.toISOString().split('T')[0],
        client_care_letter_sent: false,
        settlement_authority_obtained: false
      });
      setStep(3);
    } catch (error) {
      console.error('Error creating case:', error);
    } finally {
      setLoading(false);
    }
  };

  const finishOnboarding = async () => {
    try {
      setLoading(true);
      await base44.auth.updateMe({ onboarding_complete: true });
      window.location.href = '/';
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl">Welcome to CaseNarrative</CardTitle>
          <p className="text-blue-100 text-sm mt-2">3 minutes to get started</p>
        </CardHeader>

        <CardContent className="p-8">
          {/* Step 1: Practice Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</div>
                  Set Up Your Practice Profile
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Firm Name *</label>
                <Input
                  value={practiceData.firm_name}
                  onChange={(e) => setPracticeData({ ...practiceData, firm_name: e.target.value })}
                  placeholder="e.g. Smith & Associates"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">SRA Registration Number *</label>
                <Input
                  value={practiceData.sra_number}
                  onChange={(e) => setPracticeData({ ...practiceData, sra_number: e.target.value })}
                  placeholder="e.g. L123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Practice Areas</label>
                <Textarea
                  value={practiceData.practice_areas.join(', ')}
                  onChange={(e) => setPracticeData({ ...practiceData, practice_areas: e.target.value.split(',').map(p => p.trim()) })}
                  placeholder="e.g. Personal Injury, Employment Law"
                  rows={3}
                />
              </div>

              <Button
                onClick={completePracticeSetup}
                disabled={!practiceData.firm_name || !practiceData.sra_number || loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Setting up...' : 'Continue to Step 2'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: First Case */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">✓</span>
                  </div>
                </h3>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</div>
                  Open Your First Case
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Case Reference *</label>
                <Input
                  value={caseData.case_ref}
                  onChange={(e) => setCaseData({ ...caseData, case_ref: e.target.value })}
                  placeholder="e.g. CASE-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Case Type *</label>
                <select
                  value={caseData.case_type}
                  onChange={(e) => setCaseData({ ...caseData, case_type: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select type</option>
                  <option value="personal_injury">Personal Injury</option>
                  <option value="employment">Employment</option>
                  <option value="property_dispute">Property Dispute</option>
                  <option value="professional_negligence">Professional Negligence</option>
                  <option value="insurance_claim">Insurance Claim</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Client Name *</label>
                <Input
                  value={caseData.client_name}
                  onChange={(e) => setCaseData({ ...caseData, client_name: e.target.value })}
                  placeholder="Client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Incident Date *</label>
                <Input
                  type="date"
                  value={caseData.incident_date}
                  onChange={(e) => setCaseData({ ...caseData, incident_date: e.target.value })}
                />
              </div>

              <Button
                onClick={completeFirstCase}
                disabled={!caseData.case_ref || !caseData.case_type || !caseData.client_name || !caseData.incident_date || loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creating case...' : 'Continue to Step 3'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 3: Configure Alerts */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </h3>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</div>
                  Configure Limitation Date Alerts
                </h3>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  We'll send you email alerts at these intervals before your limitation date expires. This is <strong>critical legal compliance</strong> — missing a limitation date can result in professional negligence claims.
                </p>
              </div>

              <div className="space-y-2">
                {[30, 14, 7, 3, 1].map(days => (
                  <label key={days} className="flex items-center gap-3 p-2 border rounded hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertDays.includes(days)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAlertDays([...alertDays, days].sort((a, b) => b - a));
                        } else {
                          setAlertDays(alertDays.filter(d => d !== days));
                        }
                      }}
                    />
                    <span className="text-sm font-medium">{days} days before limitation date</span>
                  </label>
                ))}
              </div>

              <Button
                onClick={finishOnboarding}
                disabled={alertDays.length === 0 || loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Finishing...' : 'Start Using CaseNarrative'} <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}