import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const VIOLATION_STRENGTH_COLORS = {
  critical: 'bg-red-100 text-red-800',
  strong: 'bg-orange-100 text-orange-800',
  moderate: 'bg-amber-100 text-amber-800',
  weak: 'bg-yellow-100 text-yellow-800'
};

export default function EvidenceRuleCorrelations({ evidence, rules }) {
  const [correlations, setCorrelations] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const fetchCorrelations = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('correlateEvidenceWithRules', {
        evidence: {
          title: evidence.title,
          evidence_type: evidence.evidence_type,
          description: evidence.description,
          date_collected: evidence.date_collected,
          strength: evidence.strength
        },
        rules: rules.map(r => ({
          rule_number: r.data.rule_number,
          category: r.data.category,
          title: r.data.title,
          description: r.data.description
        }))
      });
      return result.data;
    },
    onSuccess: (data) => {
      setCorrelations(data.correlations || []);
    },
    onError: (error) => {
      toast.error('Failed to correlate evidence with rules');
    }
  });

  useEffect(() => {
    if (evidence && evidence.title && rules && rules.length > 0) {
      fetchCorrelations.mutate();
    }
  }, [evidence.id]);

  if (rules.length === 0) {
    return null;
  }

  if (fetchCorrelations.isPending) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing evidence for RICS rule correlations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (correlations.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          Correlated RICS Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Based on this evidence, the following RICS rules appear to be violated or implicated:
        </p>

        {correlations.map((correlation, idx) => (
          <div key={idx} className="bg-white rounded border border-amber-200 p-4 space-y-3">
            <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-semibold text-slate-900">{correlation.rule_number}</span>
                  <Badge variant="outline" className="text-xs">
                    {correlation.category}
                  </Badge>
                  <Badge className={VIOLATION_STRENGTH_COLORS[correlation.violation_strength] || 'bg-slate-100'}>
                    {correlation.violation_strength}
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-800">
                    {correlation.relevance_score}% relevant
                  </Badge>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                {expandedIndex === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {expandedIndex === idx && (
              <div className="border-t border-amber-200 pt-3">
                <p className="text-sm text-slate-700">{correlation.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}