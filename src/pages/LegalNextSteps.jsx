import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Download, FileText, Send, Loader2, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const NEXT_STEPS = [
  {
    id: 1,
    priority: 'critical',
    status: 'pending',
    title: 'Obtain Original Communications',
    description: 'Secure full email headers and original documents for Comms. 1 (Nov 2023 £185k agreement) and Comm. 2 (Dec 2023 £40k reduction with ultimatum).',
    dueDate: '2026-04-24',
    owner: 'You',
    action: 'Document Collection',
    evidence: ['Email headers', 'Full original letters', 'Metadata timestamps']
  },
  {
    id: 2,
    priority: 'critical',
    status: 'pending',
    title: 'File RICS Conflict of Interest Complaint',
    description: 'Submit formal complaint to RICS Regulatory Board regarding Comm. 7 — Belcher acting as valuer (£50k fee) AND selling agent (£3k commission) simultaneously without proper disclosure.',
    dueDate: '2026-04-30',
    owner: 'You / Solicitor',
    action: 'Generate Complaint Letter',
    evidence: ['Communication 7', 'RICS Ethics Standards 2024 breach analysis']
  },
  {
    id: 3,
    priority: 'critical',
    status: 'pending',
    title: 'Instruct Legal Counsel',
    description: 'Brief a solicitor on the economic duress pattern (Comms. 2-4) and tortious interference claim. Discuss interim injunction application and summary judgment strategy.',
    dueDate: '2026-05-01',
    owner: 'You',
    action: 'Generate Solicitor Brief',
    evidence: ['Full communications review', 'Incident analysis', 'Damages calculation']
  },
  {
    id: 4,
    priority: 'high',
    status: 'pending',
    title: 'Secure Witness Statements',
    description: 'Obtain formal statements from: (1) Bradley (contractor), (2) Site workers present during works, (3) Client assistant (witness to Belcher communications), (4) Architect (victim of information gatekeeping).',
    dueDate: '2026-05-15',
    owner: 'You / Solicitor',
    action: 'Prepare Witness Schedule',
    evidence: ['Witness contact list', 'Statement templates']
  },
  {
    id: 5,
    priority: 'high',
    status: 'pending',
    title: 'Compile Photographic Evidence Pack',
    description: 'Organize all 30+ photographs documenting works completion timeline (Oct-Nov 2022 at Victoria Street, Llandudno). Establish handover date definitively.',
    dueDate: '2026-05-01',
    owner: 'You',
    action: 'Organize Evidence',
    evidence: ['17 photos from Victoria Street', 'Waltons Parade photos', 'Timeline annotations']
  },
  {
    id: 6,
    priority: 'high',
    status: 'pending',
    title: 'Obtain Payment & Invoice Records',
    description: 'Gather Bradley\'s invoices for both properties, Powell\'s payment records (or absence thereof), and any correspondence evidencing payment refusal.',
    dueDate: '2026-04-28',
    owner: 'You',
    action: 'Document Collection',
    evidence: ['Invoices', 'Payment records', 'Correspondence']
  },
  {
    id: 7,
    priority: 'medium',
    status: 'pending',
    title: 'Calculate Damages Claim',
    description: 'Quantify: (1) Direct loss (£40k undervaluation), (2) Consequential losses (Bradley\'s inability to recover payment), (3) RICS breach remedies, (4) Legal costs.',
    dueDate: '2026-05-10',
    owner: 'Solicitor',
    action: 'Generate Damages Schedule',
    evidence: ['Cost schedules', 'Valuation comparison', 'Invoice records']
  },
  {
    id: 8,
    priority: 'medium',
    status: 'pending',
    title: 'Prepare Pre-Action Protocol Letter',
    description: 'Draft and send a formal pre-action letter to Belcher (via his solicitor, if instructed) setting out the claim, breaches, and damages. Allows 28 days for response before court proceedings.',
    dueDate: '2026-05-20',
    owner: 'Solicitor',
    action: 'Generate Letter',
    evidence: ['All communications', 'Breach analysis', 'Damages claim']
  }
];

const DOCUMENT_TEMPLATES = [
  {
    id: 'rics-complaint',
    title: 'RICS Conflict of Interest Complaint',
    description: 'Formal complaint to RICS Regulatory Board re: Communication 7 (dual role without disclosure)',
    status: 'ready',
    action: 'Generate & Download'
  },
  {
    id: 'solicitor-brief',
    title: 'Solicitor Instruction Brief',
    description: 'Comprehensive briefing document covering all breaches, evidence, and recommended legal strategy',
    status: 'ready',
    action: 'Generate & Download'
  },
  {
    id: 'damages-schedule',
    title: 'Damages Claim Schedule',
    description: 'Quantified breakdown of all losses: direct, consequential, and legal costs',
    status: 'pending',
    action: 'Generate (Step 7)'
  },
  {
    id: 'pre-action-letter',
    title: 'Pre-Action Protocol Letter',
    description: 'Formal demand letter to Belcher under Civil Procedure Rules Practice Direction 8.2',
    status: 'pending',
    action: 'Generate (Step 8)'
  }
];

function PriorityBadge({ priority }) {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-amber-100 text-amber-800',
    medium: 'bg-blue-100 text-blue-800'
  };
  return <Badge className={colors[priority]}>{priority.toUpperCase()}</Badge>;
}

function StatusIcon({ status }) {
  if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  if (status === 'in-progress') return <Clock className="w-5 h-5 text-amber-600" />;
  return <AlertCircle className="w-5 h-5 text-slate-400" />;
}

export default function LegalNextSteps() {
  const [expandedStep, setExpandedStep] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async (templateId) => {
      const result = await base44.functions.invoke('generateLegalDocument', { templateId });
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Document generated successfully');
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    },
    onError: () => {
      toast.error('Failed to generate document');
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Legal Action — Next Steps</h1>
          <p className="text-lg text-slate-600 mb-4">Prioritized action plan to maximize recovery and ensure regulatory accountability.</p>
          <div className="flex gap-4">
            <Badge className="bg-red-100 text-red-800">{NEXT_STEPS.filter(s => s.priority === 'critical').length} Critical</Badge>
            <Badge className="bg-amber-100 text-amber-800">{NEXT_STEPS.filter(s => s.priority === 'high').length} High Priority</Badge>
            <Badge className="bg-blue-100 text-blue-800">{NEXT_STEPS.filter(s => s.priority === 'medium').length} Medium</Badge>
          </div>
        </div>

        {/* Action Timeline */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">8-Step Action Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {NEXT_STEPS.map((step, idx) => (
              <div key={step.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <button
                  className="w-full text-left flex items-start justify-between gap-4"
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      {idx < NEXT_STEPS.length - 1 && <div className="w-0.5 h-8 bg-slate-300"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{step.title}</h3>
                        <PriorityBadge priority={step.priority} />
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{step.description}</p>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>📅 Due: {step.dueDate}</span>
                        <span>👤 {step.owner}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedStep === step.id ? 'rotate-90' : ''}`} />
                </button>

                {expandedStep === step.id && (
                  <div className="mt-4 pt-4 border-t space-y-3 ml-12">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-2">EVIDENCE NEEDED:</p>
                      <ul className="space-y-1">
                        {step.evidence.map((e, i) => (
                          <li key={i} className="text-sm text-slate-700 flex gap-2">
                            <span>✓</span> {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {step.action !== 'Document Collection' && step.action !== 'Organize Evidence' && step.action !== 'Prepare Witness Schedule' && (
                      <Button
                        size="sm"
                        onClick={() => generateMutation.mutate(step.id)}
                        disabled={generateMutation.isPending}
                        className="gap-2"
                      >
                        {generateMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        {step.action}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Document Templates */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Document Templates</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {DOCUMENT_TEMPLATES.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{doc.title}</h4>
                  <p className="text-sm text-slate-600">{doc.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => generateMutation.mutate(doc.id)}
                  disabled={doc.status === 'pending' || generateMutation.isPending}
                  variant={doc.status === 'ready' ? 'default' : 'outline'}
                  className="gap-2 whitespace-nowrap"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {doc.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Key Messaging */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-2xl">Case Strength Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-l-4 border-red-600 pl-4">
                <p className="font-semibold text-slate-900">Strongest Breaches</p>
                <ul className="text-sm text-slate-700 mt-2 space-y-1">
                  <li>✓ Written £185k agreement (Comm. 1)</li>
                  <li>✓ Unilateral £40k reduction with 14-day ultimatum (Comm. 2)</li>
                  <li>✓ Economic duress pattern (Comms. 2-4)</li>
                  <li>✓ Undisclosed dual role conflict (Comm. 7)</li>
                </ul>
              </div>
              <div className="border-l-4 border-green-600 pl-4">
                <p className="font-semibold text-slate-900">Evidence Quality</p>
                <ul className="text-sm text-slate-700 mt-2 space-y-1">
                  <li>✓ Contemporaneous written record</li>
                  <li>✓ 30+ photographs of completed works</li>
                  <li>✓ Multiple witness corroboration available</li>
                  <li>✓ Clear RICS breach pattern</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}