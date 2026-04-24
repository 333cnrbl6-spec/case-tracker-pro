import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  Zap,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CaseNarrativeBuilder() {
  const queryClient = useQueryClient();
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [activeSection, setActiveSection] = useState('executive_summary');

  // Fetch cases
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list('-created_date'),
  });

  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const narrative = selectedCase?.ai_narrative
    ? (() => {
        try {
          return JSON.parse(selectedCase.ai_narrative);
        } catch {
          return null;
        }
      })()
    : null;

  // Generate narrative mutation
  const generateNarrative = useMutation({
    mutationFn: (caseId) =>
      base44.functions.invoke('generateStructuredLegalNarrative', {
        case_id: caseId,
      }),
    onSuccess: async () => {
      toast.success('Narrative generated successfully');
      await queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.refetchQueries({ queryKey: ['legal-cases'] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || 'Failed to generate narrative'
      );
    },
  });

  const handleGenerateNarrative = () => {
    if (!selectedCaseId) {
      toast.error('Please select a case');
      return;
    }
    generateNarrative.mutate(selectedCaseId);
  };

  const exportToPDF = async () => {
    if (!narrative) return;

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let yPos = 20;

      const addText = (text, fontSize = 12, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, 170);
        doc.text(lines, 20, yPos);
        yPos += lines.length * (fontSize / 3) + 3;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Header
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('LEGAL CASE BRIEF', 20, 20);
      yPos = 30;

      if (narrative.case_overview) {
        addText('CASE OVERVIEW', 12, true);
        addText(`Case Reference: ${narrative.case_overview.title}`);
        addText(`Type: ${narrative.case_overview.type}`);
        addText(`Client: ${narrative.case_overview.client}`);
        addText(`Opponent: ${narrative.case_overview.opponent}`);
        addText(`Value: ${narrative.case_overview.value}`);
        addText(`Status: ${narrative.case_overview.status}`);
        yPos += 5;
      }

      if (narrative.executive_summary) {
        addText('EXECUTIVE SUMMARY', 12, true);
        addText(narrative.executive_summary, 11);
        yPos += 5;
      }

      if (narrative.background_and_facts) {
        addText('BACKGROUND & FACTS', 12, true);
        addText(narrative.background_and_facts, 11);
        yPos += 5;
      }

      if (narrative.liability_analysis) {
        addText('LIABILITY ANALYSIS', 12, true);
        addText(narrative.liability_analysis, 11);
        yPos += 5;
      }

      if (narrative.key_evidence && narrative.key_evidence.length > 0) {
        addText('KEY EVIDENCE', 12, true);
        narrative.key_evidence.forEach((e) => {
          addText(`• ${e.description}`, 10);
          addText(`  Strength: ${e.strength} | Impact: ${e.impact}`, 9);
        });
        yPos += 3;
      }

      if (narrative.strengths && narrative.strengths.length > 0) {
        addText('CASE STRENGTHS', 12, true);
        narrative.strengths.forEach((s) => {
          addText(`✓ ${s}`, 11);
        });
        yPos += 3;
      }

      if (narrative.weaknesses && narrative.weaknesses.length > 0) {
        addText('IDENTIFIED WEAKNESSES', 12, true);
        narrative.weaknesses.forEach((w) => {
          addText(`⚠ ${w}`, 11);
        });
        yPos += 3;
      }

      if (narrative.risks && narrative.risks.length > 0) {
        addText('RISKS', 12, true);
        narrative.risks.forEach((r) => {
          addText(`• ${r}`, 11);
        });
        yPos += 3;
      }

      if (narrative.next_steps && narrative.next_steps.length > 0) {
        addText('RECOMMENDED NEXT STEPS', 12, true);
        narrative.next_steps.forEach((step, idx) => {
          addText(`${idx + 1}. ${step}`, 11);
        });
      }

      doc.save(
        `${selectedCase.case_ref}_narrative_${new Date().toISOString().split('T')[0]}.pdf`
      );
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Case Narrative Builder
          </h1>
          <p className="text-slate-600 mt-2">
            AI-powered legal brief generation from case facts, communications, and evidence
          </p>
        </div>

        {/* Case Selection & Generation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select & Generate Narrative</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Select Case
                </label>
                <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a case..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.case_ref} - {c.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={handleGenerateNarrative}
                  disabled={generateNarrative.isPending || !selectedCaseId}
                  className="gap-2"
                >
                  {generateNarrative.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate Narrative
                    </>
                  )}
                </Button>

                {narrative && (
                  <Button
                    onClick={exportToPDF}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                )}
              </div>
            </div>

            {selectedCase?.narrative_generated_at && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold">Narrative generated</p>
                  <p className="text-xs">
                    {new Date(
                      selectedCase.narrative_generated_at
                    ).toLocaleString('en-GB')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Narrative Display */}
        {narrative ? (
          <div className="space-y-6">
            {/* Executive Summary */}
            {narrative.executive_summary && (
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-700">
                  {narrative.executive_summary}
                </CardContent>
              </Card>
            )}

            {/* Case Overview */}
            {narrative.case_overview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Case Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">
                        Type
                      </p>
                      <p className="text-sm font-bold">
                        {narrative.case_overview.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">
                        Client
                      </p>
                      <p className="text-sm font-bold">
                        {narrative.case_overview.client}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">
                        Status
                      </p>
                      <Badge className="mt-1">
                        {narrative.case_overview.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">
                        Opponent
                      </p>
                      <p className="text-sm font-bold">
                        {narrative.case_overview.opponent}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">
                        Value
                      </p>
                      <p className="text-sm font-bold">
                        {narrative.case_overview.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabbed Sections */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'background_and_facts', label: 'Facts' },
                    { id: 'liability_analysis', label: 'Liability' },
                    { id: 'key_evidence', label: 'Evidence' },
                    { id: 'legal_issues', label: 'Legal Issues' },
                    { id: 'strengths', label: 'Strengths' },
                    { id: 'weaknesses', label: 'Weaknesses' },
                    { id: 'risks', label: 'Risks' },
                    { id: 'next_steps', label: 'Next Steps' },
                  ].map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {activeSection === 'background_and_facts' && narrative.background_and_facts && (
                    <div className="whitespace-pre-wrap text-slate-700">
                      {narrative.background_and_facts}
                    </div>
                  )}

                  {activeSection === 'liability_analysis' && narrative.liability_analysis && (
                    <div className="whitespace-pre-wrap text-slate-700">
                      {narrative.liability_analysis}
                    </div>
                  )}

                  {activeSection === 'key_evidence' && narrative.key_evidence && (
                    <div className="space-y-3">
                      {narrative.key_evidence.map((e, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded"
                        >
                          <p className="font-semibold text-slate-900">
                            {e.description}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            <span className="font-medium">Type:</span> {e.type}{' '}
                            | <span className="font-medium">Strength:</span>{' '}
                            {e.strength}
                          </p>
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Impact:</span>{' '}
                            {e.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSection === 'legal_issues' && narrative.legal_issues && (
                    <div className="space-y-3">
                      {narrative.legal_issues.map((issue, idx) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                          <p className="font-semibold text-slate-900">
                            {issue.issue}
                          </p>
                          <p className="text-sm text-slate-700 mt-2">
                            {issue.analysis}
                          </p>
                          <Badge
                            className={`mt-2 ${
                              issue.risk === 'high'
                                ? 'bg-red-100 text-red-800'
                                : issue.risk === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {issue.risk.toUpperCase()} RISK
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSection === 'strengths' && narrative.strengths && (
                    <ul className="space-y-2">
                      {narrative.strengths.map((s, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-slate-700"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeSection === 'weaknesses' && narrative.weaknesses && (
                    <ul className="space-y-2">
                      {narrative.weaknesses.map((w, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-slate-700"
                        >
                          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeSection === 'risks' && narrative.risks && (
                    <ul className="space-y-2">
                      {narrative.risks.map((r, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-slate-700"
                        >
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeSection === 'next_steps' && narrative.next_steps && (
                    <ol className="space-y-2">
                      {narrative.next_steps.map((step, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-slate-700"
                        >
                          <span className="font-bold text-primary min-w-fit">
                            {idx + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Partner Review Notes */}
            {narrative.partner_review_notes && (
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-900">
                    Partner Review Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-purple-900">
                  {narrative.partner_review_notes}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              {selectedCaseId && casesLoading
                ? 'Loading...'
                : selectedCaseId
                  ? 'Click "Generate Narrative" to create an AI-powered case brief'
                  : 'Select a case to begin'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}