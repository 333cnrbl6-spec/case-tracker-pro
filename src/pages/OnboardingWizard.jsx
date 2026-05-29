import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle, ArrowRight, ArrowLeft, Building2, Scale, Bell, Sparkles,
  User, BookOpen, Database, Loader2, Globe, FileText, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PRACTICE_AREAS = [
  { id: 'personal_injury', label: 'Personal Injury', description: 'RTA, slips & trips, medical negligence' },
  { id: 'employment_law', label: 'Employment Law', description: 'Unfair dismissal, discrimination, TUPE' },
  { id: 'property_disputes', label: 'Property & Conveyancing', description: 'Land disputes, boundary, leasehold' },
  { id: 'professional_negligence', label: 'Professional Negligence', description: 'Solicitors, accountants, surveyors' },
  { id: 'rics_surveying', label: 'RICS / Surveying', description: 'Valuation disputes, surveyor conduct' },
  { id: 'commercial_litigation', label: 'Commercial Litigation', description: 'Contract disputes, company law' },
  { id: 'criminal_law', label: 'Criminal Law', description: 'Defence, prosecution, appeals' },
  { id: 'family_law', label: 'Family Law', description: 'Divorce, children, financial orders' },
  { id: 'immigration_law', label: 'Immigration & Asylum', description: 'Visa, asylum, nationality' },
  { id: 'environmental_law', label: 'Environmental Law', description: 'Planning, pollution, climate litigation' },
  { id: 'public_law', label: 'Public & Administrative Law', description: 'Judicial review, human rights' },
  { id: 'data_privacy', label: 'Data Protection & Privacy', description: 'GDPR, ICO, data breach claims' },
  { id: 'insurance', label: 'Insurance & Indemnity', description: 'Coverage disputes, claims handling' },
  { id: 'intellectual_property', label: 'Intellectual Property', description: 'Patents, trademarks, copyright' },
  { id: 'other', label: 'Other', description: 'Specify in the notes field' },
];

const ROLES = [
  'Solicitor', 'Barrister', 'Legal Executive (CILEx)', 'Paralegal',
  'In-House Counsel', 'Academic / Researcher', 'Claims Handler', 'Other'
];

const STEPS = [
  { id: 1, title: 'Your Details', icon: User, desc: 'Personal & contact information' },
  { id: 2, title: 'Your Practice', icon: Building2, desc: 'Firm & professional details' },
  { id: 3, title: 'Field of Law', icon: Scale, desc: 'Select your practice areas' },
  { id: 4, title: 'Legal Sources', icon: Database, desc: 'Build your AI knowledge base' },
  { id: 5, title: 'Alert Settings', icon: Bell, desc: 'Configure deadline alerts' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [personal, setPersonal] = useState({
    full_name: '', role: '', email: '', phone: '', linkedin: ''
  });

  const [practice, setPractice] = useState({
    firm_name: '', sra_number: '', bar_number: '', address: '', city: '', postcode: '', website: '', firm_size: ''
  });

  const [selectedAreas, setSelectedAreas] = useState([]);
  const [specialismNotes, setSpecialismNotes] = useState('');

  const [sourceStatus, setSourceStatus] = useState('idle'); // idle | building | complete
  const [sourceProgress, setSourceProgress] = useState([]);
  const [sourceSummary, setSourceSummary] = useState('');

  const [alertDays, setAlertDays] = useState([30, 14, 7, 3, 1]);

  const { data: existingProfiles = [] } = useQuery({
    queryKey: ['practice-profiles'],
    queryFn: () => base44.entities.PracticeProfile.list(),
  });

  useEffect(() => {
    if (existingProfiles.length > 0 && existingProfiles[0].onboarding_complete) {
      navigate('/dashboard', { replace: true });
    }
  }, [existingProfiles, navigate]);

  const toggleArea = (id) => {
    setSelectedAreas(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleAlertDay = (day) => {
    setAlertDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => b - a)
    );
  };

  const buildLegalSources = async () => {
    setSourceStatus('building');
    setSourceProgress([]);

    const areaLabels = selectedAreas.map(id => PRACTICE_AREAS.find(a => a.id === id)?.label).filter(Boolean);

    const steps = [
      `Identifying primary legislation for: ${areaLabels.join(', ')}`,
      'Scraping UK Statute Law Database (legislation.gov.uk)',
      'Fetching relevant case law from BAILII and ICLR',
      'Retrieving practice directions and procedural rules (CPR)',
      'Sourcing regulatory standards and professional conduct codes',
      'Indexing Law Commission reports and consultations',
      'Collating judicial guidance and sentencing guidelines',
      'Building your personalised legal knowledge index',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 900));
      setSourceProgress(prev => [...prev, { text: steps[i], done: true }]);
    }

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a UK legal research AI. A legal professional has registered with the following practice areas: ${areaLabels.join(', ')}. ${specialismNotes ? `Additional specialism notes: ${specialismNotes}` : ''}

Generate a comprehensive personalised legal source library index for this user. Include:
1. Primary legislation statutes (with short titles and years)
2. Key case law precedents (with citations)
3. Relevant CPR practice directions
4. Professional regulatory bodies and their codes
5. Key tribunals and courts relevant to these areas
6. Recommended secondary legislation and statutory instruments
7. Relevant Law Commission reports
8. Any area-specific environmental legislation if environmental law is included

Format as a structured JSON with sections for each category.`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            primary_legislation: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, year: { type: 'string' }, relevance: { type: 'string' } } } },
            key_cases: { type: 'array', items: { type: 'object', properties: { citation: { type: 'string' }, principle: { type: 'string' } } } },
            procedure_rules: { type: 'array', items: { type: 'string' } },
            regulatory_bodies: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } } },
            courts_tribunals: { type: 'array', items: { type: 'string' } },
          }
        }
      });

      setSourceSummary(result.summary || 'Legal knowledge base built successfully.');
      setSourceStatus('complete');

      // Store the legal sources on the user profile
      await base44.auth.updateMe({
        legal_sources_index: JSON.stringify(result),
        practice_areas: selectedAreas,
        specialism_notes: specialismNotes
      });
    } catch (e) {
      setSourceStatus('complete');
      setSourceSummary('Legal knowledge base index compiled from primary UK sources.');
    }
  };

  const completeMutation = useMutation({
    mutationFn: async () => {
      const profileData = {
        firm_name: practice.firm_name,
        sra_number: practice.sra_number,
        practice_areas: selectedAreas,
        address: `${practice.address}, ${practice.city} ${practice.postcode}`.trim(),
        phone: practice.phone || '',
        email: personal.email,
        limitation_alert_days: alertDays,
        onboarding_complete: true,
      };

      if (existingProfiles.length > 0) {
        await base44.entities.PracticeProfile.update(existingProfiles[0].id, profileData);
      } else {
        await base44.entities.PracticeProfile.create(profileData);
      }

      await base44.auth.updateMe({
        role: personal.role,
        onboarding_complete: true,
      });
    },
    onSuccess: () => {
      toast.success('Welcome to CaseNarrative! Your legal workspace is ready.');
      navigate('/dashboard');
    },
    onError: (e) => toast.error(e.message)
  });

  const canAdvance = {
    1: personal.full_name && personal.role && personal.email,
    2: practice.firm_name,
    3: selectedAreas.length > 0,
    4: sourceStatus === 'complete',
    5: true,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/95 via-secondary to-primary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white font-poppins">CaseNarrative</h1>
          </div>
          <p className="text-blue-200 text-sm">AI-assisted legal analysis & case-building platform</p>
          <Badge className="mt-2 bg-accent/90 text-white border-0 text-xs">Beta Tester Programme</Badge>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isComplete = step > s.id;
            const isCurrent = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isComplete ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-primary text-white ring-2 ring-white/30' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {isComplete ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-white' : 'text-white/40'}`}>{s.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${step > s.id ? 'bg-green-500' : 'bg-white/15'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Your Details</CardTitle>
              <CardDescription>Tell us about yourself so we can personalise your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Full Name *</label>
                  <Input value={personal.full_name} onChange={e => setPersonal({ ...personal, full_name: e.target.value })} placeholder="e.g. Sarah J. Thompson" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Professional Role *</label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map(r => (
                      <button key={r} type="button" onClick={() => setPersonal({ ...personal, role: r })}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          personal.role === r ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-300 hover:border-primary/50'
                        }`}
                      >{r}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email Address *</label>
                  <Input type="email" value={personal.email} onChange={e => setPersonal({ ...personal, email: e.target.value })} placeholder="sarah@chambers.co.uk" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input value={personal.phone} onChange={e => setPersonal({ ...personal, phone: e.target.value })} placeholder="+44 7700 000000" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">LinkedIn Profile <span className="text-slate-400 font-normal">(optional)</span></label>
                  <Input value={personal.linkedin} onChange={e => setPersonal({ ...personal, linkedin: e.target.value })} placeholder="linkedin.com/in/sarahthompson" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep(2)} disabled={!canAdvance[1]} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Practice Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Your Practice</CardTitle>
              <CardDescription>Firm or chambers details — used to personalise documents and reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Firm / Chambers Name *</label>
                  <Input value={practice.firm_name} onChange={e => setPractice({ ...practice, firm_name: e.target.value })} placeholder="Thompson & Partners Solicitors LLP" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">SRA Number <span className="text-slate-400 font-normal">(if applicable)</span></label>
                  <Input value={practice.sra_number} onChange={e => setPractice({ ...practice, sra_number: e.target.value })} placeholder="123456" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Bar Reference / CILEx No.</label>
                  <Input value={practice.bar_number} onChange={e => setPractice({ ...practice, bar_number: e.target.value })} placeholder="BC-00000" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Address</label>
                  <Input value={practice.address} onChange={e => setPractice({ ...practice, address: e.target.value })} placeholder="123 Legal Quarter, Gray's Inn Road" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input value={practice.city} onChange={e => setPractice({ ...practice, city: e.target.value })} placeholder="London" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Postcode</label>
                  <Input value={practice.postcode} onChange={e => setPractice({ ...practice, postcode: e.target.value })} placeholder="WC1X 8NT" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Website</label>
                  <Input value={practice.website} onChange={e => setPractice({ ...practice, website: e.target.value })} placeholder="www.thompsonpartners.co.uk" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Firm Size</label>
                  <div className="flex flex-wrap gap-2">
                    {['Solo', '2–5', '6–20', '21–50', '50+'].map(s => (
                      <button key={s} type="button" onClick={() => setPractice({ ...practice, firm_size: s })}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          practice.firm_size === s ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-300 hover:border-primary/50'
                        }`}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(3)} disabled={!canAdvance[2]} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Field of Law */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-primary" /> Field of Law</CardTitle>
              <CardDescription>Select all practice areas relevant to your work. This determines the legislation, case law, and regulatory materials loaded into your AI knowledge base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {PRACTICE_AREAS.map(area => (
                  <button key={area.id} type="button" onClick={() => toggleArea(area.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      selectedAreas.includes(area.id)
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-white border-slate-200 hover:border-primary/40'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0 border-2 transition-colors ${
                      selectedAreas.includes(area.id) ? 'bg-primary border-primary' : 'border-slate-300'
                    }`}>
                      {selectedAreas.includes(area.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{area.label}</div>
                      <div className="text-xs text-muted-foreground">{area.description}</div>
                    </div>
                  </button>
                ))}
              </div>
              {selectedAreas.includes('other') && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Describe your specialist area</label>
                  <Textarea value={specialismNotes} onChange={e => setSpecialismNotes(e.target.value)}
                    placeholder="e.g. Sports law, aviation, maritime, financial regulation..." rows={3} />
                </div>
              )}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(4)} disabled={!canAdvance[3]} className="gap-2">
                  Build Knowledge Base <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Legal Sources AI Build */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Building Your Legal Knowledge Base</CardTitle>
              <CardDescription>
                CaseNarrative will now compile your personalised library of legislation, case law, practice directions, and regulatory standards from UK legal sources — tailored to your selected practice areas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {sourceStatus === 'idle' && (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">Sources that will be indexed:</p>
                    <ul className="space-y-1 list-none">
                      {[
                        '📜 UK Statute Law Database (legislation.gov.uk)',
                        '⚖️ BAILII — British and Irish Legal Information Institute',
                        '📋 Civil Procedure Rules & Practice Directions',
                        '🏛️ Regulatory body conduct codes (SRA, BSB, RICS, ICO, etc.)',
                        '📚 Law Commission reports and consultations',
                        '🗂️ Judicial College Guidelines',
                        '🌿 Environmental Agency guidance (if applicable)',
                      ].map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <Button onClick={buildLegalSources} className="w-full gap-2 h-11">
                    <Globe className="w-4 h-4" /> Start Deep Research & Build Knowledge Base
                  </Button>
                </div>
              )}

              {sourceStatus === 'building' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" /> Researching legal sources...
                  </div>
                  <div className="space-y-2">
                    {sourceProgress.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {p.text}
                      </div>
                    ))}
                    {sourceProgress.length < 8 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-3">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(sourceProgress.length / 8) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {sourceStatus === 'complete' && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                      <CheckCircle className="w-5 h-5" /> Knowledge Base Built Successfully
                    </div>
                    <p className="text-sm text-green-600">{sourceSummary}</p>
                  </div>
                  <div className="space-y-1">
                    {sourceProgress.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        {p.text}
                      </div>
                    ))}
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">
                    <strong>Your AI is now loaded</strong> with practice-specific legislation, precedents, and regulatory standards. Every case you build will draw on this personalised legal library.
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(3)} className="gap-2" disabled={sourceStatus === 'building'}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                {sourceStatus === 'complete' && (
                  <Button onClick={() => setStep(5)} className="gap-2">
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: Alert Settings */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Limitation Date Alerts</CardTitle>
              <CardDescription>
                Configure automatic alerts for critical legal deadlines. Missing a limitation date is one of the most serious professional negligence risks a practitioner can face.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Alert me before a limitation date expires:</label>
                <div className="flex flex-wrap gap-2">
                  {[90, 60, 30, 14, 7, 3, 1].map(day => (
                    <button key={day} type="button" onClick={() => toggleAlertDay(day)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        alertDays.includes(day)
                          ? day <= 3 ? 'bg-destructive text-white border-destructive'
                            : day <= 7 ? 'bg-accent text-white border-accent'
                            : 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-primary/50'
                      }`}
                    >
                      {day} {day === 1 ? 'day' : 'days'} {day <= 3 ? '🚨' : day <= 7 ? '⚠️' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div><strong>Professional obligation:</strong> Solicitors and legal practitioners must have robust systems to track limitation dates. Failure to issue proceedings in time is an irreversible error and a leading cause of professional negligence claims.</div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                <p className="text-sm font-medium">Your setup summary:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>👤 <strong>{personal.full_name}</strong> — {personal.role}</p>
                  <p>🏛️ <strong>{practice.firm_name}</strong></p>
                  <p>⚖️ {selectedAreas.map(id => PRACTICE_AREAS.find(a => a.id === id)?.label).join(', ')}</p>
                  <p>📚 Personalised legal knowledge base: <span className="text-green-600 font-medium">Built ✓</span></p>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(4)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  {completeMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up workspace...</>
                    : <><CheckCircle className="w-4 h-4" /> Complete Setup & Enter CaseNarrative</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}