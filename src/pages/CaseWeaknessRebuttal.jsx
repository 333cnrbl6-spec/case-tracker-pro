import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, AlertTriangle, Save, Loader2, MessageSquare, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function CaseWeaknessRebuttal() {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get('case_id');
  const queryClient = useQueryClient();
  const [narrative, setNarrative] = useState(null);
  const [rebuttals, setRebuttals] = useState({});
  const [expandedWeakness, setExpandedWeakness] = useState(null);

  const { data: cases = [] } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list(),
  });

  const legalCase = cases.find(c => c.id === caseId);

  // Load narrative
  useEffect(() => {
    if (!legalCase?.ai_narrative) return;
    
    const loadNarrative = async () => {
      try {
        let narrativeText = legalCase.ai_narrative;
        if (narrativeText.startsWith('http')) {
          const response = await fetch(narrativeText);
          narrativeText = await response.text();
        }
        const parsed = JSON.parse(narrativeText);
        const narrativeData = parsed.properties ? parsed.properties : parsed;
        setNarrative(narrativeData);
        
        // Load saved rebuttals
        if (narrativeData.weakness_rebuttals) {
          setRebuttals(narrativeData.weakness_rebuttals);
        }
      } catch (e) {
        console.error('Failed to load narrative:', e);
        toast.error('Failed to load case data');
      }
    };
    
    loadNarrative();
  }, [legalCase]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Fetch current narrative
      let narrativeText = legalCase.ai_narrative;
      if (narrativeText.startsWith('http')) {
        const response = await fetch(narrativeText);
        narrativeText = await response.text();
      }
      const parsed = JSON.parse(narrativeText);
      const narrativeData = parsed.properties ? parsed.properties : parsed;
      
      // Update with rebuttals
      narrativeData.weakness_rebuttals = rebuttals;
      const updated = JSON.stringify(narrativeData);
      
      // Upload if too large
      let narrativeUrl = null;
      if (updated.length > 25000) {
        const blob = new Blob([updated], { type: 'application/json' });
        const file = new File([blob], `narrative-${caseId}.json`);
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        narrativeUrl = uploadResult.file_url;
      }
      
      await base44.entities.LegalCase.update(caseId, {
        ai_narrative: narrativeUrl || updated,
        narrative_generated_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      toast.success('Weakness rebuttals saved');
    },
    onError: (e) => toast.error(e.message)
  });

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

  const weaknesses = narrative?.weaknesses || [];

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
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 gap-1"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Rebuttals</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Case Weaknesses & Human Perspective:</strong> Below are identified case vulnerabilities. Add your rebuttal, context, or human perspective for each weakness. These rebuttals strengthen your case narrative by addressing opposing arguments proactively.
            </p>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        {weaknesses.length === 0 ? (
          <Card className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No weaknesses identified in the narrative yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {weaknesses.map((weakness, idx) => (
              <Card key={idx} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" /> Weakness {idx + 1}
                      </CardTitle>
                      <p className="text-sm text-slate-700 mt-2">{weakness}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedWeakness(expandedWeakness === idx ? null : idx)}
                      className="gap-1 shrink-0"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {rebuttals[idx] ? 'Edit' : 'Add'} Response
                    </Button>
                  </div>
                </CardHeader>

                {expandedWeakness === idx && (
                  <CardContent className="border-t pt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Your Rebuttal / Human Perspective
                    </label>
                    <Textarea
                      placeholder="Add context, counterarguments, or mitigating factors that address this weakness. Example: 'This allegation is contradicted by communication dated...' or 'The claimant's perspective is that...'"
                      value={rebuttals[idx] || ''}
                      onChange={(e) => setRebuttals({ ...rebuttals, [idx]: e.target.value })}
                      className="h-32 mb-3"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (rebuttals[idx]) {
                            setExpandedWeakness(null);
                          }
                        }}
                        className="bg-slate-600 hover:bg-slate-700"
                      >
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRebuttals({ ...rebuttals, [idx]: '' })}
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                )}

                {rebuttals[idx] && expandedWeakness !== idx && (
                  <CardContent className="border-t pt-4 bg-green-50">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-green-700 font-medium mb-1">Your Response</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{rebuttals[idx]}</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-xs text-slate-500 p-4 bg-slate-100 rounded">
          <p><strong>Note:</strong> Your rebuttals are saved as part of the case narrative and can be incorporated into legal documents and PDF exports.</p>
        </div>
      </div>
    </div>
  );
}