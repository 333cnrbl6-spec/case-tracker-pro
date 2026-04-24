import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'letter_of_claim',
    name: 'Letter of Claim',
    description: 'Formal notification of claim with facts and legal basis',
    icon: '📬',
    category: 'Correspondence',
  },
  {
    id: 'demand_letter',
    name: 'Demand Letter',
    description: 'Settlement demand with liability and damages breakdown',
    icon: '💬',
    category: 'Correspondence',
  },
  {
    id: 'witness_statement',
    name: 'Witness Statement',
    description: 'Court-formatted witness statement with factual observations',
    icon: '👤',
    category: 'Statements',
  },
  {
    id: 'statement_of_case',
    name: 'Statement of Case',
    description: 'Formal pleading for court filing with numbered paragraphs',
    icon: '⚖️',
    category: 'Court Filings',
  },
  {
    id: 'settlement_agreement',
    name: 'Settlement Agreement',
    description: 'Binding settlement terms with confidentiality clause',
    icon: '✍️',
    category: 'Agreements',
  },
  {
    id: 'case_summary',
    name: 'Case Summary',
    description: 'Executive brief of facts, issues, liability and risk',
    icon: '📋',
    category: 'Reports',
  },
];

export default function DocumentTemplateEngine() {
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Fetch active cases
  const { data: cases = [] } = useQuery({
    queryKey: ['activeCases'],
    queryFn: () =>
      base44.entities.LegalCase.filter(
        { status: 'active' },
        '-updated_date',
        50
      ),
  });

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const handleGenerate = async () => {
    if (!selectedCaseId || !selectedTemplate) return;

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateLegalDocument', {
        caseId: selectedCaseId,
        templateType: selectedTemplate,
      });

      // Download PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCase.case_ref}_${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(`Error generating document: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const selectedTemplateObj = TEMPLATES.find(t => t.id === selectedTemplate);
  const categories = [...new Set(TEMPLATES.map(t => t.category))];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Document Template Engine</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Auto-generate legal documents from case data with AI-powered content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Selection */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">1. Select Case</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cases.length === 0 ? (
                <p className="text-sm text-slate-500">No active cases</p>
              ) : (
                <>
                  <select
                    value={selectedCaseId || ''}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 text-sm"
                  >
                    <option value="">Choose case...</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.case_ref} - {c.client_name}
                      </option>
                    ))}
                  </select>

                  {selectedCase && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm space-y-1">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        {selectedCase.case_ref}
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        {selectedCase.client_name} vs {selectedCase.opponent_name}
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        Type: {selectedCase.case_type}
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        Value: £{selectedCase.estimated_value || 'TBD'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Template Selection */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">2. Select Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map((category) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    {category}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {TEMPLATES.filter(t => t.category === category).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedTemplate === template.id
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xl">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview & Generate */}
      {selectedTemplate && selectedCase && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                {selectedTemplateObj?.icon} {selectedTemplateObj?.name}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2 text-sm">
              <p>
                <strong>Document:</strong> {selectedTemplateObj?.name}
              </p>
              <p>
                <strong>Case:</strong> {selectedCase.case_ref} - {selectedCase.client_name}
              </p>
              <p>
                <strong>Opponent:</strong> {selectedCase.opponent_name}
              </p>
              <p>
                <strong>Status:</strong> {selectedCase.status}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generate & Download PDF
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              ✓ AI-generated from case data (client, opponent, incidents, evidence)
              <br />✓ Court-formatted and ready to use
              <br />✓ Automatically saved to your downloads
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedTemplate || !selectedCase && (
        <Card className="border-dashed text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            Select a case and template above to generate documents
          </p>
        </Card>
      )}
    </div>
  );
}