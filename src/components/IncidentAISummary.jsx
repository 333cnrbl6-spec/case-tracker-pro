import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function IncidentAISummary({ incident, evidence = [], communications = [] }) {
  const [bullets, setBullets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const generate = async () => {
    setLoading(true);
    setBullets(null);

    const relatedEvidence = evidence.filter(e =>
      incident.related_incidents?.includes(e.id) ||
      incident.evidence_notes?.toLowerCase().includes(e.title?.toLowerCase())
    );
    const relatedComms = communications.filter(c =>
      incident.related_incidents?.includes(c.id)
    );

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a legal compliance expert analysing a RICS conduct incident for a formal complaint file.

INCIDENT:
Title: ${incident.title}
Date: ${incident.date}
Type: ${incident.incident_type?.replace(/_/g, ' ')}
Severity: ${incident.severity?.toUpperCase()}
Description: ${incident.description}
Evidence Notes: ${incident.evidence_notes || 'None'}
RICS Violations: ${(incident.rics_violations || []).join(', ') || 'None identified'}
Legal Issues: ${(incident.legal_issues || []).join(', ') || 'None identified'}
Witnesses: ${(incident.witnesses || []).join(', ') || 'None recorded'}
${relatedEvidence.length > 0 ? `\nLinked Evidence:\n${relatedEvidence.map(e => `- ${e.title} (${e.evidence_type}, strength: ${e.strength})`).join('\n')}` : ''}
${relatedComms.length > 0 ? `\nLinked Communications:\n${relatedComms.map(c => `- ${c.subject} from ${c.from} (tone: ${c.tone})`).join('\n')}` : ''}

Produce exactly 3–5 bullet points summarising this incident for a legal file. Each bullet must be concise (max 20 words), factual, and professionally worded. Focus on: severity impact, key conduct issues, RICS rule relevance, evidence strength, and any legal exposure. Return only a JSON array of strings, no extra text.`,
      response_json_schema: {
        type: 'object',
        properties: { bullets: { type: 'array', items: { type: 'string' } } },
      },
    });

    setBullets(result?.bullets || []);
    setExpanded(true);
    setLoading(false);
  };

  return (
    <div className="mt-2">
      {!bullets && !loading && (
        <Button
          size="sm"
          variant="outline"
          onClick={generate}
          className="gap-1.5 text-xs h-7 border-violet-200 text-violet-700 hover:bg-violet-50"
        >
          <Sparkles className="w-3 h-3" />
          AI Summary
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-violet-600 py-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Generating summary…
        </div>
      )}

      {bullets && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 mt-1">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-600" />
              <span className="text-xs font-semibold text-violet-800">AI Summary</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={generate} className="h-5 px-1.5 text-xs text-violet-500 hover:text-violet-700">
                Refresh
              </Button>
              <button onClick={() => setExpanded(e => !e)} className="text-violet-400 hover:text-violet-700">
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {expanded && (
            <ul className="space-y-1">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-violet-900">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-violet-400" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}