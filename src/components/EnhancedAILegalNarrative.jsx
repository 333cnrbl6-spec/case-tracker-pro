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

      const prompt = `You are a senior UK solicitor specialising in ${legalCase.case_type}. Build a structured legal case narrative:
Case Ref: ${legalCase.case_ref}
Client: ${legalCase.client_name}
Opponent: ${legalCase.opponent_name}
Incident Date: ${legalCase.incident_date}
Facts: ${legalCase.facts}
Evidence: ${legalCase.ai_narrative ? 'Multiple documents' : 'To be gathered'}
Instructions: ${legalCase.instructions}

Jurisdiction: England & Wales

Produce a comprehensive legal narrative with these sections:
1. Background & Parties - identify all parties, their roles, relationships
2. Chronology - timeline of key events
3. Liability Analysis - legal basis for claim
4. Quantum Assessment - damages calculation approach
5. Legal Framework & Statutes - applicable law
6. Recommended Actions - next steps
7. Risk Assessment - strengths/weaknesses
8. Applicable Statutes - relevant UK legislation`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
        response_json_schema: {
          type: 'object',
          properties: {
            background_parties: { type: 'string' },
            chronology: { type: 'string' },
            liability_analysis: { type: 'string' },
            quantum_assessment: { type: 'string' },
            legal_framework: { type: 'string' },
            recommended_actions: { type: 'array', items: { type: 'string' } },
            risk_assessment: { type: 'string' },
            applicable_statutes: { type: 'array', items: { type: 'string' } }
          }
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