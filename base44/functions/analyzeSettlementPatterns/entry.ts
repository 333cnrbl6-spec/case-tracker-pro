import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { case_id } = await req.json();

    if (!case_id) {
      return Response.json({ error: 'Missing case_id' }, { status: 400 });
    }

    // Fetch the target case
    const targetCase = await base44.asServiceRole.entities.LegalCase.get(case_id);
    if (!targetCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Fetch all settled cases for historical analysis
    const settledCases = await base44.asServiceRole.entities.LegalCase.filter({
      status: 'settled'
    }, '-settlement_date', 100);

    // Build settlement data summary for LLM
    const settlementData = settledCases.map(c => ({
      case_type: c.case_type,
      estimated_value: c.estimated_value || 0,
      settlement_value: c.settlement_value || 0,
      incident_date: c.incident_date,
      settlement_date: c.settlement_date,
      days_to_settle: c.settlement_date && c.incident_date ? 
        Math.floor((new Date(c.settlement_date) - new Date(c.incident_date)) / (1000 * 60 * 60 * 24)) : null
    }));

    // Use LLM to analyze patterns and generate valuation
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert legal valuation analyst. Analyze the following settlement data and provide a probability-weighted valuation estimate for a new case.

TARGET CASE:
- Type: ${targetCase.case_type}
- Estimated Value: £${targetCase.estimated_value?.toLocaleString() || 'Unknown'}
- Incident Date: ${targetCase.incident_date}
- Client: ${targetCase.client_name}

HISTORICAL SETTLEMENT DATA (${settledCases.length} cases):
${JSON.stringify(settlementData, null, 2)}

Based on this data, provide:
1. Valuation estimate (point estimate in GBP)
2. Valuation range (25th-75th percentile in GBP)
3. Settlement probability vs litigation (%)
4. Confidence in estimate (0-100)
5. Key risk factors affecting valuation
6. Comparable cases and similarity scores
7. Case type benchmarks
8. Executive summary explaining the valuation

Response MUST be valid JSON with these exact keys:
- valuation_estimate (number)
- valuation_range_low (number)
- valuation_range_high (number)
- settlement_probability (number, 0-100)
- confidence_score (number, 0-100)
- risk_factors (array of {factor: string, impact_percent: number})
- comparable_cases (array of {case_type: string, settlement_value: number, similarity_score: number})
- case_type_factors (object with historical_avg_settlement, settlement_rate, avg_litigation_duration_days)
- analysis_summary (string)`,
      response_json_schema: {
        type: "object",
        properties: {
          valuation_estimate: { type: "number" },
          valuation_range_low: { type: "number" },
          valuation_range_high: { type: "number" },
          settlement_probability: { type: "number" },
          confidence_score: { type: "number" },
          risk_factors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                factor: { type: "string" },
                impact_percent: { type: "number" }
              }
            }
          },
          comparable_cases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                case_type: { type: "string" },
                settlement_value: { type: "number" },
                similarity_score: { type: "number" }
              }
            }
          },
          case_type_factors: {
            type: "object",
            properties: {
              historical_avg_settlement: { type: "number" },
              settlement_rate: { type: "number" },
              avg_litigation_duration_days: { type: "number" }
            }
          },
          analysis_summary: { type: "string" }
        },
        required: ["valuation_estimate", "valuation_range_low", "valuation_range_high", "settlement_probability", "confidence_score"]
      }
    });

    // Create valuation insight record
    const insight = await base44.entities.CaseValuationInsight.create({
      case_id,
      case_ref: targetCase.case_ref,
      analysis_date: new Date().toISOString().split('T')[0],
      valuation_estimate: analysis.valuation_estimate,
      valuation_range_low: analysis.valuation_range_low,
      valuation_range_high: analysis.valuation_range_high,
      settlement_probability: analysis.settlement_probability,
      confidence_score: analysis.confidence_score,
      case_type_factors: analysis.case_type_factors,
      comparable_cases: analysis.comparable_cases || [],
      risk_factors: analysis.risk_factors || [],
      key_indicators: {
        estimated_value: targetCase.estimated_value,
        limitation_days_remaining: targetCase.limitation_date ? 
          Math.max(0, Math.floor((new Date(targetCase.limitation_date) - new Date()) / (1000 * 60 * 60 * 24))) : null,
        case_complexity: determineCaseComplexity(targetCase),
        evidence_strength: 'pending'
      },
      analysis_summary: analysis.analysis_summary,
      analyzed_by: user.email
    });

    return Response.json({
      success: true,
      insight_id: insight.id,
      valuation_estimate: analysis.valuation_estimate,
      confidence_score: analysis.confidence_score,
      settlement_probability: analysis.settlement_probability,
      comparable_cases_analyzed: analysis.comparable_cases?.length || 0
    });
  } catch (error) {
    console.error('Settlement analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function determineCaseComplexity(legalCase) {
  if (!legalCase.estimated_value) return 'medium';
  if (legalCase.estimated_value > 500000) return 'high';
  if (legalCase.estimated_value < 50000) return 'low';
  return 'medium';
}