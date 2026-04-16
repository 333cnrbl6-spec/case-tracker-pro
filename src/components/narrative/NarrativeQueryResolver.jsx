import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const NARRATIVE_QUERIES = [
  {
    id: 'timeline-clarity',
    title: 'Confirm timeline of property refurbishment works',
    context: 'Evidence shows conflicting dates regarding when works began and completion.',
    relatedEvidenceTypes: ['document', 'communication'],
    relatedIncidents: ['undisclosed_engagement', 'scope_creep'],
    placeholder: 'Enter resolved timeline with key dates...',
  },
  {
    id: 'cost-discrepancy',
    title: 'Clarify basis for £X reduction in valuation',
    context: 'Belcher\'s valuation significantly differs from agreed cost schedule. Explain the variance.',
    relatedEvidenceTypes: ['valuation', 'contract'],
    relatedIncidents: ['conflicted_valuation'],
    placeholder: 'Explain the valuation methodology and any adjustments...',
  },
  {
    id: 'architect-access',
    title: 'Document architect\'s access denial incident',
    context: 'Co-instructed architect was denied access to survey data. Establish facts of what happened and impact.',
    relatedEvidenceTypes: ['communication', 'document'],
    relatedIncidents: ['information_control'],
    placeholder: 'Record the sequence of access denial and consequences...',
  },
  {
    id: 'dual-role-conflict',
    title: 'Establish Belcher\'s dual roles across transactions',
    context: 'Evidence suggests Belcher acted as both valuer and sales agent. Confirm scope of this conflict.',
    relatedEvidenceTypes: ['report', 'communication'],
    relatedIncidents: ['conflicted_valuation'],
    placeholder: 'Detail the transactions where dual roles applied...',
  },
  {
    id: 'witness-capacity',
    title: 'Identify and confirm witness availability',
    context: 'Multiple parties (contractors, property manager, architect) may provide corroboration.',
    relatedEvidenceTypes: ['communication'],
    relatedIncidents: [],
    placeholder: 'List identified witnesses and their willingness to provide statements...',
  },
];

export default function NarrativeQueryResolver({ evidence = [], incidents = [], communications = [] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [answerText, setAnswerText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const queryClient = useQueryClient();

  const current = NARRATIVE_QUERIES[currentIdx];
  const isAnswered = answers[current.id];

  // Filter evidence relevant to this query
  const relevantEvidence = evidence.filter(ev => 
    current.relatedEvidenceTypes.includes(ev.data?.evidence_type)
  ).slice(0, 3);

  // Filter related incidents
  const relatedIncidentRecords = incidents.filter(inc =>
    current.relatedIncidents.some(relId => 
      inc.data?.title?.toLowerCase().includes(relId.replace('_', ' '))
    )
  ).slice(0, 2);

  const saveMutation = useMutation({
    mutationFn: async (text) => {
      // Store answer in a narrative queries entity or update existing record
      const stored = {
        query_id: current.id,
        query_title: current.title,
        answer: text,
        answered_at: new Date().toISOString(),
      };
      
      // For now, store in local state and localStorage for persistence
      const allAnswers = { ...answers, [current.id]: text };
      setAnswers(allAnswers);
      localStorage.setItem('narrativeAnswers', JSON.stringify(allAnswers));
      
      return stored;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['narrativeQueries'] });
      toast.success('Answer saved');
      // Move to next query after brief delay
      setTimeout(() => {
        if (currentIdx < NARRATIVE_QUERIES.length - 1) {
          setCurrentIdx(currentIdx + 1);
          setAnswerText(answers[NARRATIVE_QUERIES[currentIdx + 1].id] || '');
        } else {
          setIsComplete(true);
        }
      }, 500);
    },
    onError: () => {
      toast.error('Failed to save answer');
    },
  });

  const handleNext = () => {
    if (currentIdx < NARRATIVE_QUERIES.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setAnswerText(answers[NARRATIVE_QUERIES[currentIdx + 1].id] || '');
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setAnswerText(answers[NARRATIVE_QUERIES[currentIdx - 1].id] || '');
    }
  };

  const handleSave = () => {
    if (answerText.trim()) {
      saveMutation.mutate(answerText);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline" className="mb-2">
              Query {currentIdx + 1} of {NARRATIVE_QUERIES.length}
            </Badge>
            <CardTitle className="text-2xl">{current.title}</CardTitle>
            <p className="text-sm text-slate-600 mt-2">{current.context}</p>
          </div>
          {isAnswered && (
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isComplete && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Narrative Query Resolution Complete</h4>
                <p className="text-sm text-green-800">All {NARRATIVE_QUERIES.length} queries have been answered and the case narrative is ready for final export and submission.</p>
              </div>
            </div>
          </div>
        )}

        {!isComplete && (
          <>
            {/* Supporting Evidence Section */}
            {(relevantEvidence.length > 0 || relatedIncidentRecords.length > 0) && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              Supporting Evidence & Context
            </h3>

            {relevantEvidence.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-700 mb-2">Evidence snippets:</p>
                <div className="space-y-2">
                  {relevantEvidence.map((ev, idx) => (
                    <div key={idx} className="bg-white rounded p-2 border-l-2 border-indigo-400 text-xs text-slate-700">
                      <strong>{ev.data?.title}</strong>
                      {ev.data?.description && <p className="text-slate-600 mt-1">{ev.data.description.substring(0, 150)}...</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedIncidentRecords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Related incidents:</p>
                <div className="space-y-2">
                  {relatedIncidentRecords.map((inc, idx) => (
                    <div key={idx} className="bg-white rounded p-2 border-l-2 border-amber-400 text-xs text-slate-700">
                      <strong>{inc.data?.title}</strong> ({inc.data?.incident_type})
                      {inc.data?.description && <p className="text-slate-600 mt-1">{inc.data.description.substring(0, 150)}...</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
            )}

            {/* Answer Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Your response:</label>
              <Textarea
                placeholder={current.placeholder}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="min-h-32"
              />
              <p className="text-xs text-slate-500 mt-1">Provide your analysis, decision on fact, or required information.</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentIdx === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!answerText.trim() || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save Answer
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIdx === NARRATIVE_QUERIES.length - 1}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            </>
            )}

            {isComplete && (
            <div className="space-y-4">
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Narrative Query Resolution Complete</h4>
                  <p className="text-sm text-green-800">All {NARRATIVE_QUERIES.length} queries have been answered and the case narrative is ready for final export and submission.</p>
                </div>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" /> Export Final Narrative
            </Button>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex gap-1 mt-4">
          {NARRATIVE_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIdx(idx);
                setAnswerText(answers[q.id] || '');
              }}
              className={`h-2 flex-1 rounded transition-colors ${
                answers[q.id] ? 'bg-green-500' : idx === currentIdx ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              title={q.title}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}