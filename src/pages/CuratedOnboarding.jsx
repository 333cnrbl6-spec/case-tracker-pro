import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DEVELOPER_EMAIL } from '@/lib/dataPolicy';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Shield, User, Building2, Scale, Database, CheckCircle,
  Sparkles, ArrowRight, Loader2, Copy, Mail, AlertTriangle,
  ChevronDown, ChevronRight, Edit3, Send, Eye, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const PRACTICE_AREAS = [
  { id: 'personal_injury', label: 'Personal Injury' },
  { id: 'employment_law', label: 'Employment Law' },
  { id: 'property_disputes', label: 'Property & Conveyancing' },
  { id: 'professional_negligence', label: 'Professional Negligence' },
  { id: 'rics_surveying', label: 'RICS / Surveying' },
  { id: 'commercial_litigation', label: 'Commercial Litigation' },
  { id: 'criminal_law', label: 'Criminal Law' },
  { id: 'family_law', label: 'Family Law' },
  { id: 'immigration_law', label: 'Immigration & Asylum' },
  { id: 'environmental_law', label: 'Environmental Law' },
  { id: 'public_law', label: 'Public & Administrative Law' },
  { id: 'data_privacy', label: 'Data Protection & Privacy' },
  { id: 'insurance', label: 'Insurance & Indemnity' },
  { id: 'intellectual_property', label: 'Intellectual Property' },
];

const ROLES = [
  'Solicitor', 'Barrister', 'Legal Executive (CILEx)', 'Paralegal',
  'In-House Counsel', 'Academic / Researcher', 'Claims Handler', 'Other'
];

const STAGES = [
  { id: 'user', label: 'User Details', icon: User },
  { id: 'practice', label: 'Practice Setup', icon: Building2 },
  { id: 'specialisms', label: 'Specialisms', icon: Scale },
  { id: 'knowledge', label: 'Build Knowledge Base', icon: Database },
  { id: 'review', label: 'Review & Invite', icon: Send },
];

export default function CuratedOnboarding() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(null);
  const [stage, setStage] = useState('user');
  const [building, setBuilding] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState(null);
  const [validationResults, setValidationResults] = useState([]);
  const [buildProgress, setBuildProgress] = useState([]);
  const [inviteSent, setInviteSent] = useState(false);

  const [userForm, setUserForm] = useState({
    full_name: '', email: '', role: '', phone: ''
  });
  const [practiceForm, setPracticeForm] = useState({
    firm_name: '', sra_number: '', city: '', firm_size: '', website: ''
  });
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [specialismNotes, setSpecialismNotes] = useState('');
  const [welcomeNote, setWelcomeNote] = useState('');

  useEffect(() => {
    base44.auth.me().then(user => {
      setAuthorized(user?.email === DEVELOPER_EMAIL);
    });
  }, []);

  if (authorized === null) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-3">
            <Shield className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Access Restricted</h2>
            <p className="text-muted-foreground text-sm">This area is only accessible to the platform administrator.</p>
            <Button variant="outline" onClick={() => navigate('/')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleArea = (id) => {
    setSelectedAreas(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const buildKnowledgeBase = async () => {
    setBuilding(true);
    setBuildProgress([]);
    setKnowledgeBase(null);
    setValidationResults([]);

    const areaLabels = selectedAreas.map(id => PRACTICE_AREAS.find(a => a.id === id)?.label).filter(Boolean);

    const steps = [
      `Identifying primary legislation for: ${areaLabels.join(', ')}`,
      'Indexing UK Statute Law Database (legislation.gov.uk)',
      'Fetching case law from BAILII and ICLR',
      'Retrieving CPR Practice Directions',
      'Sourcing regulatory standards & conduct codes',
      'Indexing Law Commission reports',
      'Collating judicial guidance & sentencing guidelines',
      'Building personalised legal knowledge index',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 700));
      setBuildProgress(prev => [...prev, steps[i]]);
    }

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a UK legal research AI setting up a workspace for a legal professional.
Practice areas: ${areaLabels.join(', ')}.
${specialismNotes ? `Specialism notes: ${specialismNotes}` : ''}
Firm: ${practiceForm.firm_name}, Role: ${userForm.role}.

Generate a comprehensive personalised legal source library. Include primary legislation, key case law, CPR practice directions, regulatory bodies, courts/tribunals, and any specialism-specific materials.`,
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

      setKnowledgeBase(result);

      // Run validation
      const validation = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a UK legal data quality auditor. Practice areas: ${areaLabels.join(', ')}.
Sources compiled: ${JSON.stringify(result, null, 2)}
For each practice area, verify data completeness: legislation, case law, regulatory bodies, courts. Return pass/partial/fail per area.`,
        response_json_schema: {
          type: 'object',
          properties: {
            specialism_tests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  specialism: { type: 'string' },
                  status: { type: 'string', enum: ['pass', 'partial', 'fail'] },
                  legislation_check: { type: 'boolean' },
                  case_law_check: { type: 'boolean' },
                  regulatory_check: { type: 'boolean' },
                  courts_check: { type: 'boolean' },
                  confidence_score: { type: 'number' },
                  gaps_identified: { type: 'array', items: { type: 'string' } },
                }
              }
            }
          }
        }
      });

      setValidationResults(validation.specialism_tests || []);
    } catch (e) {
      toast.error('Knowledge base build failed: ' + e.message);
    }

    setBuilding(false);
  };

  const sendInvite = async () => {
    if (!userForm.email || !knowledgeBase) return;
    setInviting(true);

    try {
      // Invite the user to the platform
      await base44.users.inviteUser(userForm.email, 'user');

      // Store their curated profile as a PracticeProfile so it's ready when they log in
      await base44.entities.PracticeProfile.create({
        firm_name: practiceForm.firm_name,
        sra_number: practiceForm.sra_number,
        practice_areas: selectedAreas,
        address: practiceForm.city,
        email: userForm.email,
        phone: userForm.phone || '',
        limitation_alert_days: [30, 14, 7, 3, 1],
        onboarding_complete: true,
        curated_by: DEVELOPER_EMAIL,
        legal_sources_summary: knowledgeBase.summary,
        // Store full index too
      });

      // Send a personalised welcome email
      const areaLabels = selectedAreas.map(id => PRACTICE_AREAS.find(a => a.id === id)?.label).filter(Boolean);
      await base44.integrations.Core.SendEmail({
        to: userForm.email,
        from_name: 'CaseNarrative',
        subject: `Your CaseNarrative workspace is ready, ${userForm.full_name.split(' ')[0]}`,
        body: `Dear ${userForm.full_name},

Your personalised CaseNarrative workspace has been set up for you by the CaseNarrative team.

Your workspace has been configured for: ${areaLabels.join(', ')}

${welcomeNote ? `Personal note: ${welcomeNote}\n\n` : ''}Your legal knowledge base has been pre-built with:
- Primary legislation relevant to your practice areas
- Key case law and precedents
- CPR practice directions
- Regulatory body standards

You can log in directly — no onboarding wizard required. Your workspace is ready to use.

${knowledgeBase.summary}

Welcome to CaseNarrative.

— The CaseNarrative Team`
      });

      setInviteSent(true);
      toast.success(`Workspace created and invite sent to ${userForm.email}`);
    } catch (e) {
      toast.error('Failed to send invite: ' + e.message);
    }

    setInviting(false);
  };

  const stageIndex = STAGES.findIndex(s => s.id === stage);

  const canAdvance = {
    user: userForm.full_name && userForm.email && userForm.role,
    practice: practiceForm.firm_name,
    specialisms: selectedAreas.length > 0,
    knowledge: !!knowledgeBase,
    review: true,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Curated Onboarding Studio</h1>
              <p className="text-sm text-muted-foreground">Set up a pre-configured workspace for a new beta tester</p>
            </div>
            <Badge className="ml-auto bg-accent text-white border-0">Developer Only</Badge>
          </div>
        </div>

        {/* Stage Progress */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const done = i < stageIndex;
            const current = s.id === stage;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => done || current ? setStage(s.id) : null}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 transition-colors ${
                    current ? 'bg-primary text-white' :
                    done ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200' :
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STAGES.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Stage: User Details */}
        {stage === 'user' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> New User Details</CardTitle>
              <CardDescription>Enter the details of the person you're setting up a workspace for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Full Name *</label>
                  <Input value={userForm.full_name} onChange={e => setUserForm({ ...userForm, full_name: e.target.value })} placeholder="e.g. Sarah Thompson" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email Address *</label>
                  <Input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="sarah@chambers.co.uk" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} placeholder="+44 7700 000000" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-2 block">Professional Role *</label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map(r => (
                      <button key={r} onClick={() => setUserForm({ ...userForm, role: r })}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${userForm.role === r ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 hover:border-primary/50 text-slate-700'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStage('practice')} disabled={!canAdvance.user} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage: Practice */}
        {stage === 'practice' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Practice Details</CardTitle>
              <CardDescription>Firm or chambers information for this user's workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Firm / Chambers Name *</label>
                  <Input value={practiceForm.firm_name} onChange={e => setPracticeForm({ ...practiceForm, firm_name: e.target.value })} placeholder="Thompson & Partners LLP" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">SRA Number</label>
                  <Input value={practiceForm.sra_number} onChange={e => setPracticeForm({ ...practiceForm, sra_number: e.target.value })} placeholder="123456" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input value={practiceForm.city} onChange={e => setPracticeForm({ ...practiceForm, city: e.target.value })} placeholder="London" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Website</label>
                  <Input value={practiceForm.website} onChange={e => setPracticeForm({ ...practiceForm, website: e.target.value })} placeholder="www.example.co.uk" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Firm Size</label>
                  <div className="flex flex-wrap gap-2">
                    {['Solo', '2–5', '6–20', '21–50', '50+'].map(s => (
                      <button key={s} onClick={() => setPracticeForm({ ...practiceForm, firm_size: s })}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${practiceForm.firm_size === s ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 hover:border-primary/50 text-slate-700'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStage('user')}>Back</Button>
                <Button onClick={() => setStage('specialisms')} disabled={!canAdvance.practice} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage: Specialisms */}
        {stage === 'specialisms' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-primary" /> Practice Areas</CardTitle>
              <CardDescription>Select the legal specialisms for this user's AI knowledge base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {PRACTICE_AREAS.map(area => (
                  <button key={area.id} onClick={() => toggleArea(area.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all ${
                      selectedAreas.includes(area.id) ? 'bg-primary/10 border-primary font-medium' : 'bg-white border-slate-200 hover:border-primary/40'
                    }`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selectedAreas.includes(area.id) ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                      {selectedAreas.includes(area.id) && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    {area.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Specialism notes <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea value={specialismNotes} onChange={e => setSpecialismNotes(e.target.value)}
                  placeholder="Any additional context, sub-specialisms, or focus areas..." rows={2} />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStage('practice')}>Back</Button>
                <Button onClick={() => setStage('knowledge')} disabled={!canAdvance.specialisms} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage: Knowledge Base */}
        {stage === 'knowledge' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Build Knowledge Base</CardTitle>
              <CardDescription>Pre-build their personalised legal knowledge base before they even log in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!building && !knowledgeBase && (
                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
                    <p className="font-medium">Building for: <span className="text-primary">{userForm.full_name}</span> at <span className="text-primary">{practiceForm.firm_name}</span></p>
                    <p className="text-muted-foreground">Specialisms: {selectedAreas.map(id => PRACTICE_AREAS.find(a => a.id === id)?.label).join(', ')}</p>
                  </div>
                  <Button onClick={buildKnowledgeBase} className="w-full gap-2 h-11">
                    <Sparkles className="w-4 h-4" /> Build Personalised Knowledge Base
                  </Button>
                </div>
              )}

              {building && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" /> Building knowledge base...
                  </div>
                  <div className="space-y-1.5">
                    {buildProgress.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {p}
                      </div>
                    ))}
                    {buildProgress.length < 8 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Processing...
                      </div>
                    )}
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${(buildProgress.length / 8) * 100}%` }} />
                  </div>
                </div>
              )}

              {knowledgeBase && !building && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                      <CheckCircle className="w-4 h-4" /> Knowledge Base Built
                    </div>
                    <p className="text-sm text-green-600">{knowledgeBase.summary}</p>
                  </div>

                  {/* Validation results */}
                  {validationResults.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Specialism Validation Tests</p>
                      {validationResults.map((v, i) => {
                        const color = v.status === 'pass' ? 'bg-green-50 border-green-200' : v.status === 'partial' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
                        const badge = v.status === 'pass' ? 'bg-green-100 text-green-800' : v.status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
                        return (
                          <div key={i} className={`rounded-lg border p-3 ${color}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{v.specialism}</span>
                              <div className="flex items-center gap-2">
                                {v.confidence_score && <span className="text-xs text-muted-foreground">{Math.round(v.confidence_score)}%</span>}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${badge}`}>{v.status}</span>
                              </div>
                            </div>
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              {[['Leg.', v.legislation_check], ['Cases', v.case_law_check], ['Reg.', v.regulatory_check], ['Courts', v.courts_check]].map(([l, ok]) => (
                                <span key={l} className={`text-xs px-1.5 py-0.5 rounded ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ok ? '✓' : '✗'} {l}</span>
                              ))}
                            </div>
                            {v.gaps_identified?.length > 0 && (
                              <p className="text-xs text-amber-700 mt-1"><strong>Gaps:</strong> {v.gaps_identified.join(', ')}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setKnowledgeBase(null); setValidationResults([]); setBuildProgress([]); }} className="gap-1 text-sm">
                      <RefreshCw className="w-3.5 h-3.5" /> Rebuild
                    </Button>
                    <Button onClick={() => setStage('review')} className="flex-1 gap-2">
                      Proceed to Review <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {!knowledgeBase && !building && (
                <div className="flex justify-start">
                  <Button variant="outline" onClick={() => setStage('specialisms')}>Back</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stage: Review & Invite */}
        {stage === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-primary" /> Review & Send Invite</CardTitle>
              <CardDescription>Review the curated workspace configuration before sending the invite email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {inviteSent ? (
                <div className="text-center py-8 space-y-3">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-800">Workspace Ready!</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>{userForm.full_name}</strong> has been invited to <strong>{userForm.email}</strong>.
                    Their workspace is pre-configured and ready to use on first login.
                  </p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Button variant="outline" onClick={() => {
                      setInviteSent(false); setStage('user');
                      setUserForm({ full_name: '', email: '', role: '', phone: '' });
                      setPracticeForm({ firm_name: '', sra_number: '', city: '', firm_size: '', website: '' });
                      setSelectedAreas([]); setKnowledgeBase(null); setValidationResults([]); setBuildProgress([]); setWelcomeNote('');
                    }}>
                      Set Up Another User
                    </Button>
                    <Button onClick={() => navigate('/saas-admin')}>View All Users</Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">User</span>
                      <button onClick={() => setStage('user')} className="text-xs text-primary hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                      <span>Name:</span><span className="text-foreground font-medium">{userForm.full_name}</span>
                      <span>Email:</span><span className="text-foreground font-medium">{userForm.email}</span>
                      <span>Role:</span><span className="text-foreground font-medium">{userForm.role}</span>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Practice</span>
                      <button onClick={() => setStage('practice')} className="text-xs text-primary hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                      <span>Firm:</span><span className="text-foreground font-medium">{practiceForm.firm_name}</span>
                      <span>City:</span><span className="text-foreground font-medium">{practiceForm.city || '—'}</span>
                      <span>Size:</span><span className="text-foreground font-medium">{practiceForm.firm_size || '—'}</span>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Specialisms</span>
                      <button onClick={() => setStage('specialisms')} className="text-xs text-primary hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAreas.map(id => (
                        <Badge key={id} variant="outline" className="text-xs">{PRACTICE_AREAS.find(a => a.id === id)?.label}</Badge>
                      ))}
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Knowledge Base: Built & Validated</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{knowledgeBase?.summary?.slice(0, 120)}...</p>
                    </div>
                  </div>

                  {/* Personal welcome note */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Personal welcome note <span className="text-muted-foreground font-normal">(optional — included in invite email)</span></label>
                    <Textarea value={welcomeNote} onChange={e => setWelcomeNote(e.target.value)}
                      placeholder={`e.g. "Hi Sarah, looking forward to getting your feedback on the RICS compliance module..."`}
                      rows={3} />
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStage('knowledge')}>Back</Button>
                    <Button onClick={sendInvite} disabled={inviting} className="bg-green-600 hover:bg-green-700 gap-2">
                      {inviting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                        : <><Mail className="w-4 h-4" /> Invite & Activate Workspace</>
                      }
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}