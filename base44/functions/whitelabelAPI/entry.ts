import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.0.0';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const base44 = createClientFromRequest(req);

    const { action, api_key, case_id } = await req.json();

    // Authenticate partner via API key
    if (!api_key) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Verify API key is registered (store partner API keys in a Partners entity)
    // For now: simple check
    const keyHash = api_key.substring(0, 10); // Mock validation

    if (action === 'generate_case_valuation') {
      if (!case_id) {
        return Response.json({ error: 'case_id required' }, { status: 400 });
      }

      // Fetch case and run valuation
      const legalCase = await base44.asServiceRole.entities.LegalCase.get(case_id);
      const incidents = await base44.asServiceRole.entities.Incident.filter({ related_cases: case_id });

      // Generate valuation using existing logic (simplified)
      const baseDamages = legalCase.damages_claimed || 50000;
      const incidentSeverity = incidents.reduce((max, i) => i.severity === 'critical' ? 1 : max, 0);
      const valuation = baseDamages * (1 + incidentSeverity * 0.3);

      return Response.json({
        case_id,
        valuation_estimate: Math.round(valuation),
        confidence: 75,
        recommended_settlement_range: [valuation * 0.7, valuation * 1.1]
      });
    }

    if (action === 'generate_narrative') {
      if (!case_id) {
        return Response.json({ error: 'case_id required' }, { status: 400 });
      }

      // Trigger narrative generation
      const result = await base44.functions.invoke('generateStructuredLegalNarrative', {
        case_id
      });

      return Response.json({
        case_id,
        narrative_generated: true,
        narrative: result.data
      });
    }

    if (action === 'list_partnerships') {
      return Response.json({
        available_integrations: [
          'Practice Management (Clio, Rocket Matter)',
          'Document Automation (HotDocs, Contract Express)',
          'Case Valuation',
          'Evidence Analysis'
        ]
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('White-label API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});