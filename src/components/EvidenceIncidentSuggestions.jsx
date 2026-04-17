import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EvidenceIncidentSuggestions({ evidence, incidents, onLinkCreated }) {
  const [suggestions, setSuggestions] = useState([]);
  const [linkedIncidents, setLinkedIncidents] = useState([]);

  const fetchSuggestions = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('suggestEvidenceIncidentLinks', {
        evidence: {
          title: evidence.title,
          evidence_type: evidence.evidence_type,
          description: evidence.description,
          date_collected: evidence.date_collected,
          relevance: evidence.relevance
        },
        incidents: incidents.map(i => ({
          id: i.id,
          date: i.data.date,
          title: i.data.title,
          incident_type: i.data.incident_type,
          description: i.data.description
        }))
      });
      return result.data;
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
    },
    onError: (error) => {
      toast.error('Failed to fetch suggestions');
    }
  });

  useEffect(() => {
    if (evidence && evidence.title && incidents && incidents.length > 0) {
      fetchSuggestions.mutate();
    }
  }, [evidence.id]);

  const handleLinkIncident = async (incidentId) => {
    try {
      // Here you would typically save the link to a separate entity or update the incident
      // For now, we'll just track it locally and notify parent
      setLinkedIncidents([...linkedIncidents, incidentId]);
      onLinkCreated?.(incidentId);
      toast.success('Evidence linked to incident');
    } catch (error) {
      toast.error('Failed to link evidence');
    }
  };

  if (incidents.length === 0) {
    return null;
  }

  if (fetchSuggestions.isPending) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing evidence for related incidents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const getIncidentTitle = (incidentId) => {
    const incident = incidents.find(i => i.id === incidentId);
    return incident?.data.title || 'Unknown incident';
  };

  return (
    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="w-5 h-5 text-cyan-600" />
          Suggested Incident Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          This evidence may relate to the following incidents based on keywords, dates, and content:
        </p>

        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className="bg-white rounded border border-cyan-200 p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">
                  {getIncidentTitle(suggestion.incident_id)}
                </h4>
                <p className="text-sm text-slate-700 mt-1">{suggestion.reason}</p>
              </div>
              <Badge className="bg-cyan-100 text-cyan-800">
                {suggestion.confidence}% match
              </Badge>
            </div>

            {suggestion.keywords_matched && suggestion.keywords_matched.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {suggestion.keywords_matched.slice(0, 4).map((keyword, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}

            <Button
              onClick={() => handleLinkIncident(suggestion.incident_id)}
              disabled={linkedIncidents.includes(suggestion.incident_id)}
              size="sm"
              variant={linkedIncidents.includes(suggestion.incident_id) ? 'outline' : 'default'}
              className="w-full"
            >
              {linkedIncidents.includes(suggestion.incident_id) ? 'Linked' : 'Link to Incident'}
            </Button>
          </div>
        ))}

        <p className="text-xs text-slate-500 flex items-start gap-2 mt-4">
          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          These are AI suggestions. Review carefully before linking.
        </p>
      </CardContent>
    </Card>
  );
}