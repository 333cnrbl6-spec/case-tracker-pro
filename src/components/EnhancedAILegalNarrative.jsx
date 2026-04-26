import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader, FileText } from 'lucide-react';

export default function EnhancedAILegalNarrative({ legalCase, onNarrativeGenerated }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generateNarrative = async () => {
    try {
      setGenerating(true);
      setError(null);

      const prompt = `You are a senior UK solicitor specialising in ${legalCase.case_type}. Generate a comprehensive, structured legal case narrative.

CASE DETAILS:
- Reference: ${legalCase.case_ref}
- Type: ${legalCase.case_type}
- Client: ${legalCase.client_name}
- Opponent: ${legalCase.opponent_name}
- Incident Date: ${legalCase.incident_date}
- Limitation Date: ${legalCase.limitation_date}
- Estimated Value: £${legalCase.estimated_value || '0'}
- Facts: ${legalCase.facts}
- Instructions: ${legalCase.instructions}

Jurisdiction: England & Wales

Generate a JSON narrative with strict structure including:
1. CHRONOLOGY - detailed timeline of events with dates
2. LIABILITY ANALYSIS - legal basis, breach analysis, causation
3. QUANTUM ASSESSMENT - damages calculation, heads of loss, valuation methodology`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
        response_json_schema: {
          type: 'object',
          properties: {
            background: {
              type: 'object',
              properties: {
                parties: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' }, significance: { type: 'string' } } } },
                relationship: { type: 'string' },
                contractual_basis: { type: 'string' }
              }
            },
            chronology: {
              type: 'object',
              properties: {
                timeline: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, event: { type: 'string' }, significance: { type: 'string' } } } },
                key_milestones: { type: 'array', items: { type: 'string' } },
                critical_dates: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, description: { type: 'string' }, legal_consequence: { type: 'string' } } } }
              }
            },
            liability_analysis: {
              type: 'object',
              properties: {
                legal_framework: { type: 'string' },
                breach_identified: { type: 'string' },
                causation: { type: 'string' },
                defences: { type: 'array', items: { type: 'string' } },
                assessment: { type: 'string' }
              }
            },
            quantum_assessment: {
              type: 'object',
              properties: {
                heads_of_loss: { type: 'array', items: { type: 'object', properties: { category: { type: 'string' }, description: { type: 'string' }, estimated_value: { type: 'string' } } } },
                calculation_methodology: { type: 'string' },
                total_quantum: { type: 'string' },
                mitigation_assessment: { type: 'string' }
              }
            },
            legal_framework: {
              type: 'object',
              properties: {
                applicable_law: { type: 'array', items: { type: 'string' } },
                key_statutes: { type: 'array', items: { type: 'object', properties: { statute: { type: 'string' }, section: { type: 'string' }, relevance: { type: 'string' } } } },
                case_law: { type: 'array', items: { type: 'string' } }
              }
            },
            strengths_weaknesses: {
              type: 'object',
              properties: {
                strengths: { type: 'array', items: { type: 'string' } },
                weaknesses: { type: 'array', items: { type: 'string' } },
                risks: { type: 'array', items: { type: 'string' } },
                overall_assessment: { type: 'string' }
              }
            },
            next_steps: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, priority: { type: 'string' }, timeline: { type: 'string' } } } }
          },
          required: ['chronology', 'liability_analysis', 'quantum_assessment']
        }
      });

      // Save narrative to case
      await base44.entities.LegalCase.update(legalCase.id, {
        ai_narrative: JSON.stringify(response),
        narrative_generated_at: new Date().toISOString()
      });

      onNarrativeGenerated(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          AI Legal Narrative Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Generate a structured legal narrative powered by Claude Sonnet 4.6 (UK solicitor-trained).
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          onClick={generateNarrative}
          disabled={generating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {generating ? (
            <>
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Generating narrative...
            </>
          ) : (
            'Generate Full Narrative'
          )}
        </Button>

        {legalCase.ai_narrative && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-700">
            ✓ Narrative generated at {new Date(legalCase.narrative_generated_at).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}