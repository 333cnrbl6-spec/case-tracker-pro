import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, rules } = await req.json();

    if (!description || description.trim().length < 10) {
      return Response.json({
        success: true,
        incident_type: null,
        severity: null,
        rics_violations: []
      });
    }

    const prompt = `You are an expert at analyzing incident reports for RICS conduct violations. Analyze this incident description and provide structured categorization.

INCIDENT DESCRIPTION:
${description}

AVAILABLE RICS RULES:
${rules.map(r => `- ${r.rule_number}: ${r.title}`).join('\n')}

Based on the incident description, provide:

1. INCIDENT TYPE: Categorize this as one of: communication, professional_conduct, document_issue, gatekeeping, information_control, harassment, other
   - Communication: Issues related to how the surveyor communicated
   - Professional_conduct: General professional standards violations
   - Document_issue: Problems with documents or paperwork
   - Gatekeeping: Withholding or controlling information
   - Information_control: Preventing access to information
   - Harassment: Abusive or threatening behavior
   - Other: Something else

2. SEVERITY: Rate as: low, medium, high, critical
   - Low: Minor issues with limited impact
   - Medium: Notable breaches with moderate impact
   - High: Serious violations affecting key interests
   - Critical: Major breaches with significant consequences

3. RELEVANT RICS RULES: Identify the 2-4 most applicable rules from the list above

Return a JSON object with this structure:
{
  "incident_type": "string",
  "severity": "string",
  "rics_violations": ["rule_number1", "rule_number2"],
  "confidence": 85,
  "reasoning": "Brief explanation of the categorization"
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          incident_type: { type: 'string' },
          severity: { type: 'string' },
          rics_violations: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number' },
          reasoning: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      incident_type: analysis.incident_type,
      severity: analysis.severity,
      rics_violations: analysis.rics_violations || [],
      confidence: analysis.confidence || 0,
      reasoning: analysis.reasoning
    });
  } catch (error) {
    console.error('Error analyzing incident:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});