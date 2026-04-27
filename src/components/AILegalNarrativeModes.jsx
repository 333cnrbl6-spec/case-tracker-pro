import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Scale, BookOpen, FileSearch, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const MODES = [
  {
    id: 'structured_narrative',
    label: 'Structured Narrative',
    icon: Scale,
    description: 'Full legal case narrative with liability, quantum & statutes',
    color: 'bg-blue-600',
  },
  {
    id: 'precedent_crossref',
    label: 'Precedent Cross-Reference',
    icon: BookOpen,
    description: 'Find relevant case law and statutes for this matter',
    color: 'bg-purple-600',
  },
  {
    id: 'evidence_summary',
    label: 'Evidence Summarisation',
    icon: FileSearch,
    description: 'AI summary of available evidence and its legal weight',
    color: 'bg-green-600',
  },
  {
    id: 'correspondence',
    label: 'Correspondence Drafting',
    icon: Mail,
    description: 'Draft letters of claim, pre-action protocol & without prejudice',
    color: 'bg-orange-600',
  },
];

export default function AILegalNarrativeModes({ legalCase, onResult }) {
  const [activeMode, setActiveMode] = useState('structured_narrative');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [correspondenceType, setCorrespondenceType] = useState('letter_of_claim');
  const [extraContext, setExtraContext] = useState('');

  const buildPrompt = () => {
    const base = `You are a senior UK solicitor with 20 years' experience specialising in ${legalCase.case_type?.replace(/_/g, ' ')}, jurisdiction: England & Wales.

Case Reference: ${legalCase.case_ref}
Client: ${legalCase.client_name}
Opponent: ${legalCase.opponent_name || 'TBC'}
Date of Incident: ${legalCase.incident_date || 'TBC'}
Limitation Date: ${legalCase.limitation_date || 'TBC'}
Estimated Value: £${legalCase.estimated_value?.toLocaleString() || 'TBC'}
Facts: ${legalCase.facts || 'See case file'}
Client Instructions: ${legalCase.instructions || 'As per instructions'}
Additional Context: ${extraContext || 'None'}`;

    if (activeMode === 'structured_narrative') {
      return base + `\n\nProduce a comprehensive legal narrative including: Background & Parties, Chronology of Events, Liability Analysis, Quantum Assessment, Applicable Legal Framework & Statutes, Recommended Next Steps, Risk Assessment (prospects of success %).`;
    }
    if (activeMode === 'precedent_crossref') {
      return base + `\n\nProvide: (1) Directly applicable UK case law precedents with citations, (2) Relevant statutes and their specific sections, (3) How each precedent applies to this matter, (4) Any distinguishing factors, (5) Strongest precedents for each side. Be specific with citations — do not invent cases.`;
    }
    if (activeMode === 'evidence_summary') {
      return base + `\n\nAnalyse the evidence position for this case: (1) What evidence is likely available given the case type, (2) Legal weight and admissibility of each type, (3) Evidence that should be secured urgently, (4) Disclosure obligations, (5) Expert evidence requirements, (6) Overall evidential strength assessment.`;
    }
    if (activeMode === 'correspondence') {
      const types = { letter_of_claim: 'Letter of Claim (PAP compliant)', preaction: 'Pre-Action Protocol Letter', without_prejudice: 'Without Prejudice Settlement Letter', update_letter: 'Client Update Letter' };
      return base + `\n\nDraft a professional ${types[correspondenceType]} for this matter. The letter must be: formally structured, legally precise, UK law compliant, and reflect the strength of the client's position. Include all relevant legal references.`;
    }
    return base;
  };

  const getSchema = () => {
    if (activeMode === 'structured_narrative') {
      return {
        type: 'object',
        properties: {
          background_parties: { type: 'string' },
          chronology: { type: 'string' },
          liability_analysis: { type: 'string' },
          quantum_assessment: { type: 'string' },
          legal_framework: { type: 'string' },
          recommended_actions: { type: 'array', items: { type: 'string' } },
          risk_assessment: { type: 'string' },
          prospects_percentage: { type: 'number' },
          applicable_statutes: { type: 'array', items: { type: 'string' } },
        }
      };
    }
    if (activeMode === 'precedent_crossref') {
      return {
        type: 'object',
        properties: {
          case_law: { type: 'array', items: { type: 'object', properties: { citation: { type: 'string' }, principle: { type: 'string' }, application: { type: 'string' }, favours: { type: 'string' } } } },
          key_statutes: { type: 'array', items: { type: 'object', properties: { statute: { type: 'string' }, section: { type: 'string' }, relevance: { type: 'string' } } } },
          strongest_precedents: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        }
      };
    }
    if (activeMode === 'evidence_summary') {
      return {
        type: 'object',
        properties: {
          available_evidence: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, description: { type: 'string' }, weight: { type: 'string' }, urgency: { type: 'string' } } } },
          evidence_to_secure: { type: 'array', items: { type: 'string' } },
          expert_requirements: { type: 'array', items: { type: 'string' } },
          overall_strength: { type: 'string' },
          disclosure_notes: { type: 'string' },
        }
      };
    }
    return {
      type: 'object',
      properties: {
        letter_text: { type: 'string' },
        key_points: { type: 'array', items: { type: 'string' } },
        next_steps: { type: 'array', items: { type: 'string' } },
      }
    };
  };

  const handleGenerate = async () => {
    if (!legalCase?.id) { toast.error('No case selected'); return; }
    setLoading(true);
    setResult(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        model: 'claude_sonnet_4_6',
        prompt: buildPrompt(),
        response_json_schema: getSchema(),
      });
      setResult({ mode: activeMode, data: response });
      if (onResult) onResult(activeMode, response);
      toast.success('AI analysis complete');
    } catch (err) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Credit Notice */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-amber-800"><strong>Legal AI Mode:</strong> Uses Claude Sonnet (premium model) for accuracy required in legal work. This uses more AI credits than standard generation.</p>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-3">
        {MODES.map(mode => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => { setActiveMode(mode.id); setResult(null); }}
              className={`p-3 rounded-lg border-2 text-left transition-all ${activeMode === mode.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${mode.color}`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-sm text-slate-900">{mode.label}</span>
              </div>
              <p className="text-xs text-slate-500">{mode.description}</p>
            </button>
          );
        })}
      </div>

      {/* Correspondence sub-type */}
      {activeMode === 'correspondence' && (
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Document Type</label>
          <select
            value={correspondenceType}
            onChange={e => setCorrespondenceType(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
          >
            <option value="letter_of_claim">Letter of Claim (PAP Compliant)</option>
            <option value="preaction">Pre-Action Protocol Letter</option>
            <option value="without_prejudice">Without Prejudice Settlement Letter</option>
            <option value="update_letter">Client Update Letter</option>
          </select>
        </div>
      )}

      {/* Extra context */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">Additional Context <span className="font-normal text-slate-400">(optional)</span></label>
        <Textarea
          value={extraContext}
          onChange={e => setExtraContext(e.target.value)}
          placeholder="Any additional instructions, context or specific questions for the AI..."
          className="min-h-16 text-sm"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating with Claude Sonnet...</> : <><Sparkles className="w-4 h-4" /> Generate {MODES.find(m => m.id === activeMode)?.label}</>}
      </Button>

      {/* Results */}
      {result && <AIResultDisplay result={result} legalCase={legalCase} />}
    </div>
  );
}

function AIResultDisplay({ result, legalCase }) {
  const { mode, data } = result;

  if (mode === 'structured_narrative') {
    return (
      <div className="space-y-4 border-t border-slate-200 pt-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600 text-white">Structured Narrative</Badge>
          {data.prospects_percentage && (
            <Badge className={`${data.prospects_percentage >= 60 ? 'bg-green-600' : data.prospects_percentage >= 40 ? 'bg-yellow-500' : 'bg-red-600'} text-white`}>
              {data.prospects_percentage}% Prospects
            </Badge>
          )}
        </div>
        {[
          { label: 'Background & Parties', key: 'background_parties' },
          { label: 'Chronology', key: 'chronology' },
          { label: 'Liability Analysis', key: 'liability_analysis' },
          { label: 'Quantum Assessment', key: 'quantum_assessment' },
          { label: 'Legal Framework', key: 'legal_framework' },
          { label: 'Risk Assessment', key: 'risk_assessment' },
        ].map(s => data[s.key] && (
          <div key={s.key} className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{data[s.key]}</p>
          </div>
        ))}
        {data.recommended_actions?.length > 0 && (
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Recommended Actions</p>
            <ol className="space-y-1">
              {data.recommended_actions.map((a, i) => <li key={i} className="text-sm text-indigo-900 flex gap-2"><span className="font-bold">{i+1}.</span>{a}</li>)}
            </ol>
          </div>
        )}
        {data.applicable_statutes?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.applicable_statutes.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'precedent_crossref') {
    return (
      <div className="space-y-4 border-t border-slate-200 pt-4">
        <Badge className="bg-purple-600 text-white">Precedent Cross-Reference</Badge>
        {data.summary && <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{data.summary}</p>}
        {data.case_law?.map((c, i) => (
          <div key={i} className="border border-purple-200 rounded-lg p-3 bg-purple-50">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm text-purple-900">{c.citation}</p>
              <Badge className={`text-xs ${c.favours === 'claimant' ? 'bg-green-600' : c.favours === 'defendant' ? 'bg-red-600' : 'bg-slate-500'} text-white`}>{c.favours}</Badge>
            </div>
            <p className="text-xs text-purple-700 mb-1"><strong>Principle:</strong> {c.principle}</p>
            <p className="text-xs text-purple-700"><strong>Application:</strong> {c.application}</p>
          </div>
        ))}
        {data.key_statutes?.map((s, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-3 bg-white text-sm">
            <p className="font-semibold">{s.statute} — {s.section}</p>
            <p className="text-slate-600 text-xs mt-1">{s.relevance}</p>
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'evidence_summary') {
    const strengthColor = data.overall_strength?.includes('strong') ? 'bg-green-50 border-green-200 text-green-800' : data.overall_strength?.includes('weak') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return (
      <div className="space-y-4 border-t border-slate-200 pt-4">
        <Badge className="bg-green-600 text-white">Evidence Summarisation</Badge>
        {data.overall_strength && <div className={`p-3 rounded-lg border text-sm ${strengthColor}`}><strong>Overall Strength:</strong> {data.overall_strength}</div>}
        <div className="space-y-2">
          {data.available_evidence?.map((e, i) => (
            <div key={i} className="border border-slate-200 rounded p-2 bg-slate-50 text-sm">
              <div className="flex items-center gap-2"><span className="font-semibold">{e.type}</span><Badge variant="outline" className="text-xs">{e.weight}</Badge>{e.urgency === 'high' && <Badge className="bg-red-500 text-white text-xs">Urgent</Badge>}</div>
              <p className="text-slate-600 text-xs mt-1">{e.description}</p>
            </div>
          ))}
        </div>
        {data.evidence_to_secure?.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-orange-700 mb-2">Secure Urgently</p>
            <ul className="space-y-1">{data.evidence_to_secure.map((e, i) => <li key={i} className="text-xs text-orange-800">• {e}</li>)}</ul>
          </div>
        )}
        {data.disclosure_notes && <p className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded p-3">{data.disclosure_notes}</p>}
      </div>
    );
  }

  if (mode === 'correspondence') {
    return (
      <div className="space-y-4 border-t border-slate-200 pt-4">
        <Badge className="bg-orange-600 text-white">Correspondence Draft</Badge>
        {data.letter_text && (
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <pre className="text-sm text-slate-800 whitespace-pre-wrap font-serif leading-relaxed">{data.letter_text}</pre>
          </div>
        )}
        {data.key_points?.length > 0 && (
          <div className="bg-slate-50 rounded p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Key Points Covered</p>
            <ul className="space-y-1">{data.key_points.map((p, i) => <li key={i} className="text-xs text-slate-700">✓ {p}</li>)}</ul>
          </div>
        )}
      </div>
    );
  }

  return null;
}