import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Download, ArrowLeft, CheckCircle, AlertTriangle, Scale, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import PDFExportPanel from '@/components/PDFExportPanel';
import { daysUntil } from '@/lib/dateUtils';

export default function CaseNarrativeBuilder() {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get('case_id');
  const queryClient = useQueryClient();
  const [narrative, setNarrative] = useState(null);
  const [showPDFPanel, setShowPDFPanel] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  const { data: cases = [] } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list(),
  });

  const legalCase = cases.find(c => c.id === caseId);

  // Load saved narrative on mount
  useEffect(() => {
    if (legalCase?.ai_narrative) {
      try { setNarrative(JSON.parse(legalCase.ai_narrative)); } catch {}
    }
  }, [legalCase]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('generateLegalNarrative', { case_id: caseId });
      return result.data;
    },
    onSuccess: (data) => {
      setNarrative(data);
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      toast.success('Legal narrative generated using Claude AI');
    },
    onError: (e) => toast.error(e.message)
  });

  const downloadBriefPDF = async () => {
    if (!narrative) return;
    try {
      setIsGeneratingBrief(true);
      const response = await fetch('/api/functions/generateLegalBriefPDF', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, narrative })
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Legal-Brief-${legalCase?.case_ref || 'case'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Legal brief PDF downloaded');
    } catch (e) {
      console.error('PDF download error:', e);
      toast.error(e.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  if (!caseId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No case selected.</p>
          <Link to="/case-manager"><Button>Go to Case Manager</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/case-manager" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Cases
          </Link>
          <div className="flex items-center gap-2">
            {legalCase && (
              <span className="text-sm font-medium text-slate-700">{legalCase.case_ref} — {legalCase.client_name}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPDFPanel(v => !v)}
              className="gap-1"
            >
              <Download className="w-4 h-4" /> Export PDF
            </Button>
            {narrative && (
              <Button
                size="sm"
                onClick={downloadBriefPDF}
                disabled={isGeneratingBrief}
                className="bg-amber-600 hover:bg-amber-700 gap-1"
              >
                {isGeneratingBrief ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating Brief...</>
                ) : (
                  <><FileText className="w-4 h-4" /> Download Legal Brief PDF</>
                )}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || !caseId}
              className="bg-indigo-600 hover:bg-indigo-700 gap-1"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating with Claude AI...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> {narrative ? 'Regenerate' : 'Generate'} Narrative</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* PDF Export Panel */}
        {showPDFPanel && caseId && (
          <PDFExportPanel caseId={caseId} caseRef={legalCase?.case_ref} onClose={() => setShowPDFPanel(false)} />
        )}

        {/* Case Summary Card */}
        {legalCase && (
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-slate-500">Case Ref</p><p className="font-bold">{legalCase.case_ref}</p></div>
                <div><p className="text-slate-500">Client</p><p className="font-semibold">{legalCase.client_name}</p></div>
                <div><p className="text-slate-500">Opponent</p><p className="font-semibold">{legalCase.opponent_name || '—'}</p></div>
                <div>
                  <p className="text-slate-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Limitation Date</p>
                  <p className={`font-bold ${legalCase.limitation_date && daysUntil(legalCase.limitation_date) <= 30 ? 'text-red-600' : 'text-slate-900'}`}>
                    {legalCase.limitation_date ? new Date(legalCase.limitation_date).toLocaleDateString('en-GB') : '⚠️ Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No narrative yet */}
        {!narrative && !generateMutation.isPending && (
          <Card className="text-center py-16 border-dashed">
            <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Generate AI Legal Narrative</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Powered by Claude AI — generates a structured UK legal narrative including liability analysis, quantum assessment, and applicable statutes.
            </p>
            <Button onClick={() => generateMutation.mutate()} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Sparkles className="w-4 h-4" /> Generate Narrative
            </Button>
            <p className="text-xs text-slate-400 mt-3">Uses Claude claude_sonnet_4_6 — higher quality AI credits</p>
          </Card>
        )}

        {generateMutation.isPending && (
          <Card className="text-center py-16">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Claude AI is drafting your legal narrative...</p>
            <p className="text-slate-400 text-sm mt-1">Analysing facts, evidence, and applicable law</p>
          </Card>
        )}

        {/* Narrative Sections */}
        {narrative && (
          <div className="space-y-4">
            {legalCase?.narrative_generated_at && (
              <p className="text-xs text-slate-400">Last generated: {new Date(legalCase.narrative_generated_at).toLocaleString('en-GB')}</p>
            )}

            <NarrativeSection icon={<FileText className="w-5 h-5 text-indigo-600" />} title="Background & Parties" color="indigo">
              {narrative.background_parties}
            </NarrativeSection>

            <NarrativeSection icon={<Scale className="w-5 h-5 text-blue-600" />} title="Chronology of Events" color="blue">
              {narrative.chronology}
            </NarrativeSection>

            <NarrativeSection icon={<Scale className="w-5 h-5 text-amber-600" />} title="Liability Analysis" color="amber">
              {narrative.liability_analysis}
            </NarrativeSection>

            <NarrativeSection icon={<Scale className="w-5 h-5 text-green-600" />} title="Quantum Assessment" color="green">
              {narrative.quantum_assessment}
            </NarrativeSection>

            <NarrativeSection icon={<FileText className="w-5 h-5 text-purple-600" />} title="Legal Framework" color="purple">
              {narrative.legal_framework}
            </NarrativeSection>

            {narrative.applicable_statutes?.length > 0 && (
              <Card className="border-l-4 border-l-purple-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-600" /> Applicable Statutes & Case Law
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {narrative.applicable_statutes.map((s, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">§</span> {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {narrative.strengths?.length > 0 && (
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2"><CardTitle className="text-base text-green-700">Case Strengths</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {narrative.strengths.map((s, i) => <li key={i} className="text-sm flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{s}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {narrative.weaknesses?.length > 0 && (
                <Card className="border-l-4 border-l-red-400">
                  <CardHeader className="pb-2"><CardTitle className="text-base text-red-700">Case Weaknesses / Risks</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {narrative.weaknesses.map((w, i) => <li key={i} className="text-sm flex gap-2"><AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />{w}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {narrative.recommended_actions?.length > 0 && (
              <Card className="border-l-4 border-l-emerald-500 bg-emerald-50">
                <CardHeader className="pb-2"><CardTitle className="text-base text-emerald-800">Recommended Actions</CardTitle></CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {narrative.recommended_actions.map((a, i) => (
                      <li key={i} className="text-sm flex gap-3">
                        <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</span>
                        {a}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {narrative.risk_assessment && (
              <NarrativeSection icon={<AlertTriangle className="w-5 h-5 text-red-600" />} title="Risk Assessment" color="red">
                {narrative.risk_assessment}
              </NarrativeSection>
            )}

            <div className="border-t-2 border-slate-200 pt-4 text-xs text-slate-400">
              <p><strong>Notice:</strong> This AI-generated narrative is produced using Claude AI from documented case data. It is intended as a drafting aid for qualified legal practitioners and does not constitute legal advice. Jurisdiction: England & Wales.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NarrativeSection({ icon, title, color, children }) {
  const borderColors = {
    indigo: 'border-l-indigo-500',
    blue: 'border-l-blue-500',
    amber: 'border-l-amber-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    red: 'border-l-red-400',
  };
  return (
    <Card className={`border-l-4 ${borderColors[color] || 'border-l-slate-400'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{children}</p>
      </CardContent>
    </Card>
  );
}