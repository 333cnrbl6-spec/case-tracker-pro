import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const incidentTypeLabels = {
  communication: 'Communication Issue',
  professional_conduct: 'Professional Conduct',
  document_issue: 'Document Issue',
  gatekeeping: 'Gatekeeping',
  information_control: 'Information Control',
  harassment: 'Harassment',
  other: 'Other'
};

export default function IncidentAIAssistant({ description, onApplySuggestions }) {
  const [suggestions, setSuggestions] = useState(null);
  const [applied, setApplied] = useState(false);

  const { data: rules = [] } = useQuery({
    queryKey: ['rics-rules'],
    queryFn: () => base44.entities.RICSRule.list(),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('analyzeIncidentContent', {
        description: description,
        rules: rules.map(r => ({
          rule_number: r.data.rule_number,
          title: r.data.title
        }))
      });
      return result.data;
    },
    onSuccess: (data) => {
      setSuggestions(data);
      setApplied(false);
    },
    onError: () => {
      toast.error('Failed to analyze incident');
    }
  });

  useEffect(() => {
    // Debounce analysis - only analyze if description is substantial
    const timer = setTimeout(() => {
      if (description && description.trim().length > 20 && rules.length > 0) {
        analyzeMutation.mutate();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [description, rules.length]);

  if (!suggestions || analyzeMutation.isPending) {
    return null;
  }

  const handleApply = () => {
    onApplySuggestions({
      incident_type: suggestions.incident_type,
      severity: suggestions.severity,
      rics_violations: suggestions.rics_violations
    });
    setApplied(true);
    toast.success('AI suggestions applied');
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          AI Analysis
          {applied && <Check className="w-4 h-4 text-green-600 ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.confidence && (
          <p className="text-sm text-slate-600">
            Confidence: <Badge className="bg-indigo-100 text-indigo-800">{suggestions.confidence}%</Badge>
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Suggested Type</label>
            <Badge className="bg-indigo-600 text-white">
              {incidentTypeLabels[suggestions.incident_type] || suggestions.incident_type}
            </Badge>
            <p className="text-xs text-slate-600 mt-1">Current categorization based on description</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Suggested Severity</label>
            <Badge className={severityColors[suggestions.severity] || 'bg-slate-100'}>
              {suggestions.severity?.charAt(0).toUpperCase() + suggestions.severity?.slice(1)}
            </Badge>
            <p className="text-xs text-slate-600 mt-1">Risk level assessment</p>
          </div>

          {suggestions.rics_violations && suggestions.rics_violations.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Suggested RICS Violations</label>
              <div className="flex flex-wrap gap-2">
                {suggestions.rics_violations.map(rule => (
                  <Badge key={rule} variant="outline" className="border-indigo-300">
                    {rule}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-1">Applicable conduct rules</p>
            </div>
          )}

          {suggestions.reasoning && (
            <div className="bg-white p-3 rounded border border-indigo-200">
              <p className="text-xs font-medium text-slate-700 mb-1">Analysis:</p>
              <p className="text-xs text-slate-600">{suggestions.reasoning}</p>
            </div>
          )}

          <Button
            onClick={handleApply}
            disabled={applied}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            size="sm"
          >
            {applied ? 'Applied' : 'Apply Suggestions'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}