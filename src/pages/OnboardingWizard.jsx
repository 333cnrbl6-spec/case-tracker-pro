import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Building2, Scale, Bell, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PRACTICE_AREAS = ['Personal Injury', 'Employment Law', 'Property', 'Professional Negligence', 'Insurance Claims', 'Contract Disputes', 'RICS / Surveying', 'Other'];

const STEPS = [
  { id: 1, title: 'Practice Profile', icon: Building2, desc: 'Set up your firm details' },
  { id: 2, title: 'First Case', icon: Scale, desc: 'Open your first case' },
  { id: 3, title: 'Alert Settings', icon: Bell, desc: 'Configure limitation date alerts' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ firm_name: '', sra_number: '', practice_areas: [], address: '', phone: '', email: '' });
  const [firstCase, setFirstCase] = useState({ case_ref: '', case_type: 'personal_injury', client_name: '', incident_date: '', limitation_date: '' });
  const [alertDays, setAlertDays] = useState([30, 14, 7, 3, 1]);

  const { data: existingProfiles = [] } = useQuery({
    queryKey: ['practice-profiles'],
    queryFn: () => base44.entities.PracticeProfile.list(),
  });

  // Skip if already onboarded
  useEffect(() => {
    if (existingProfiles.length > 0 && existingProfiles[0].onboarding_complete) {
      navigate('/case-manager');
    }
  }, [existingProfiles]);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const data = { ...profile, limitation_alert_days: alertDays, onboarding_complete: true };
      if (existingProfiles.length > 0) {
        return base44.entities.PracticeProfile.update(existingProfiles[0].id, data);
      }
      return base44.entities.PracticeProfile.create(data);
    }
  });

  const saveFirstCaseMutation = useMutation({
    mutationFn: () => base44.entities.LegalCase.create(firstCase)
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await saveProfileMutation.mutateAsync();
      if (firstCase.case_ref && firstCase.client_name) {
        await saveFirstCaseMutation.mutateAsync();
      }
      await base44.auth.updateMe({ onboarding_complete: true });
    },
    onSuccess: () => {
      toast.success('Welcome to CaseNarrative!');
      navigate('/case-manager');
    },
    onError: (e) => toast.error(e.message)
  });

  const togglePracticeArea = (area) => {
    setProfile(p => ({
      ...p,
      practice_areas: p.practice_areas.includes(area)
        ? p.practice_areas.filter(a => a !== area)
        : [...p.practice_areas, area]
    }));
  };

  const toggleAlertDay = (day) => {
    setAlertDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => b - a));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">CaseNarrative</h1>
          </div>
          <p className="text-slate-600">AI-powered legal case management for UK practitioners</p>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-6 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s.id ? 'bg-green-500 text-white' : step === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s.id ? <CheckCircle className="w-5 h-5" /> : s.id}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === s.id ? 'text-indigo-700' : 'text-slate-400'}`}>{s.title}</span>
              {i < STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300 ml-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Practice Profile */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600" /> Your Practice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Firm Name *</label>
                  <Input value={profile.firm_name} onChange={e => setProfile({ ...profile, firm_name: e.target.value })} placeholder="Smith & Partners Solicitors" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">SRA Number</label>
                  <Input value={profile.sra_number} onChange={e => setProfile({ ...profile, sra_number: e.target.value })} placeholder="123456" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} placeholder="info@smithpartners.co.uk" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Practice Areas</label>
                <div className="flex flex-wrap gap-2">
                  {PRACTICE_AREAS.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => togglePracticeArea(area)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        profile.practice_areas.includes(area)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep(2)} disabled={!profile.firm_name} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: First Case */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-indigo-600" /> Open Your First Case</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">This is optional — you can add cases later.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Case Reference</label>
                  <Input value={firstCase.case_ref} onChange={e => setFirstCase({ ...firstCase, case_ref: e.target.value })} placeholder="PI-2024-001" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Case Type</label>
                  <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={firstCase.case_type} onChange={e => setFirstCase({ ...firstCase, case_type: e.target.value })}>
                    <option value="personal_injury">Personal Injury</option>
                    <option value="employment">Employment</option>
                    <option value="property_dispute">Property Dispute</option>
                    <option value="professional_negligence">Professional Negligence</option>
                    <option value="insurance_claim">Insurance Claim</option>
                    <option value="rics_complaint">RICS Complaint</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Client Name</label>
                  <Input value={firstCase.client_name} onChange={e => setFirstCase({ ...firstCase, client_name: e.target.value })} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Incident Date</label>
                  <Input type="date" value={firstCase.incident_date} onChange={e => setFirstCase({ ...firstCase, incident_date: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block text-red-600">⚠️ Limitation Date (Critical)</label>
                  <Input type="date" value={firstCase.limitation_date} onChange={e => setFirstCase({ ...firstCase, limitation_date: e.target.value })} className="border-red-300" />
                  <p className="text-xs text-red-500 mt-1">Missing this date can result in a professional negligence claim against you.</p>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Alert Settings */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-600" /> Limitation Date Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">Choose when to receive alerts before a limitation date expires. This is the most critical compliance feature — solicitors face negligence claims for missing limitation dates.</p>
              <div>
                <label className="text-sm font-medium mb-3 block">Alert me when limitation date is:</label>
                <div className="flex flex-wrap gap-2">
                  {[30, 14, 7, 3, 1].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleAlertDay(day)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        alertDays.includes(day)
                          ? day <= 3 ? 'bg-red-600 text-white border-red-600' : day <= 7 ? 'bg-orange-500 text-white border-orange-500' : 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      {day} day{day > 1 ? 's' : ''} {day <= 3 && '🚨'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                <strong>Recommendation:</strong> Enable all alerts (30, 14, 7, 3, 1 days). The 1-day alert alone could save a professional negligence claim.
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  {completeMutation.isPending ? 'Setting up...' : <><CheckCircle className="w-4 h-4" /> Complete Setup</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}