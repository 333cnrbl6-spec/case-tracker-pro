import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Lightbulb, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-800',
  serious: 'bg-orange-100 text-orange-800',
  moderate: 'bg-amber-100 text-amber-800',
  minor: 'bg-yellow-100 text-yellow-800'
};

export default function RuleRecommendations({ incident, evidence, linkedRules, onLinkedRulesChange }) {
  const [recommendations, setRecommendations] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const fetchRecommendations = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('getIncidentRuleRecommendations', {
        incident: {
          title: incident.title,
          incident_type: incident.incident_type,
          description: incident.description,
          severity: incident.severity,
          evidence_notes: incident.evidence_notes
        },
        evidence: evidence ? evidence.map(e => ({
          title: e.title,
          evidence_type: e.evidence_type,
          description: e.description
        })) : []
      });
      return result.data;
    },
    onSuccess: (data) => {
      setRecommendations(data.recommendations || []);
    },
    onError: (error) => {
      toast.error('Failed to get recommendations');
    }
  });

  useEffect(() => {
    if (incident && incident.title) {
      fetchRecommendations.mutate();
    }
  }, [incident?.id]);

  const toggleRule = (ruleName) => {
    const newLinkedRules = linkedRules.includes(ruleName)
      ? linkedRules.filter(r => r !== ruleName)
      : [...linkedRules, ruleName];
    onLinkedRulesChange(newLinkedRules);
  };

  if (fetchRecommendations.isPending) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing incident for relevant RICS rules...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          AI-Recommended RICS Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Based on this incident, the following RICS conduct rules appear relevant. Link rules to add them to the incident record.
        </p>

        {recommendations.map((rec, idx) => (
          <div key={idx} className="bg-white rounded border border-blue-200 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={linkedRules.includes(rec.rule_name)}
                onChange={() => toggleRule(rec.rule_name)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono font-semibold text-slate-900">{rec.rule_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {rec.rule_category}
                  </Badge>
                  <Badge className={SEVERITY_COLORS[rec.severity] || 'bg-slate-100'}>
                    {rec.severity}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800">
                    {rec.relevance_score}% match
                  </Badge>
                </div>
                <h4 className="font-semibold text-slate-900">{rec.title}</h4>
              </div>
              <button
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className="text-slate-400 hover:text-slate-600"
              >
                {expandedIndex === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {expandedIndex === idx && (
              <div className="space-y-2 text-sm border-t border-blue-200 pt-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Why this rule is relevant:</p>
                  <p className="text-slate-700">{rec.explanation}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Specific conduct violation:</p>
                  <p className="text-slate-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    {rec.violated_conduct}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        <p className="text-xs text-slate-500 mt-4">
          {linkedRules.length} rule(s) selected. These will be linked to this incident and included in compliance checklists.
        </p>
      </CardContent>
    </Card>
  );
}