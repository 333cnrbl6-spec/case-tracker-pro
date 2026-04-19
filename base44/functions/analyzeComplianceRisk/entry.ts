import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RISK_MODEL = 'claude_sonnet_4_6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { case_id } = await req.json();

        // Fetch all relevant data for analysis
        let caseData = null;
        let incidents = [];
        let communications = [];
        let evidence = [];
        let alerts = [];
        let tasks = [];

        if (case_id) {
            // Single case analysis
            caseData = await base44.entities.LegalCase.get(case_id);
            incidents = await base44.entities.Incident.filter({});
            communications = await base44.entities.Communication.filter({});
            evidence = await base44.entities.Evidence.filter({});
            alerts = await base44.entities.ComplianceAlert.filter({ case_id });
            tasks = await base44.entities.IncidentTask.filter({});
        } else {
            // Portfolio-wide analysis
            caseData = await base44.entities.LegalCase.filter({});
            incidents = await base44.entities.Incident.filter({});
            communications = await base44.entities.Communication.filter({});
            evidence = await base44.entities.Evidence.filter({});
            alerts = await base44.entities.ComplianceAlert.filter({});
            tasks = await base44.entities.IncidentTask.filter({});
        }

        // Prepare data for AI analysis
        const analysisPrompt = `You are a compliance risk assessment AI specializing in legal, property, charity, and conservation regulatory frameworks.

Analyze the following case data and provide a comprehensive risk assessment:

CASE DATA:
${JSON.stringify(caseData, null, 2)}

INCIDENTS: ${incidents.length} total
${JSON.stringify(incidents.slice(0, 20), null, 2)}

COMMUNICATIONS: ${communications.length} total
${JSON.stringify(communications.slice(0, 15), null, 2)}

EVIDENCE: ${evidence.length} total
${JSON.stringify(evidence.slice(0, 15), null, 2)}

ALERTS: ${alerts.length} active
${JSON.stringify(alerts.slice(0, 10), null, 2)}

TASKS: ${tasks.length} total
${JSON.stringify(tasks.slice(0, 10), null, 2)}

Provide a risk assessment in the following JSON format:
{
    "overall_risk_score": 0-100,
    "risk_level": "low" | "medium" | "high" | "critical",
    "risk_categories": {
        "limitation_date_risk": 0-100,
        "documentation_risk": 0-100,
        "communication_risk": 0-100,
        "evidence_risk": 0-100,
        "task_compliance_risk": 0-100
    },
    "predicted_failures": [
        {
            "failure_type": "string",
            "probability": 0-100,
            "timeframe_days": number,
            "severity": "low" | "medium" | "high" | "critical",
            "description": "string"
        }
    ],
    "risk_factors": [
        {
            "factor": "string",
            "impact": "low" | "medium" | "high",
            "evidence": "string"
        }
    ],
    "recommended_actions": [
        {
            "action": "string",
            "priority": "low" | "medium" | "high" | "critical",
            "deadline_days": number
        }
    ],
    "confidence_score": 0-100
}`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('ANTHROPIC_API_KEY')}`
            },
            body: JSON.stringify({
                model: RISK_MODEL,
                max_tokens: 2048,
                messages: [
                    {
                        role: 'user',
                        content: analysisPrompt
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
        }

        const aiResponse = await response.json();
        const content = aiResponse.content[0].text;
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid AI response format');
        }

        const riskAssessment = JSON.parse(jsonMatch[0]);

        // Store risk assessment in database
        const riskRecord = await base44.entities.ComplianceRisk.create({
            case_id: case_id || 'portfolio',
            assessment_date: new Date().toISOString().split('T')[0],
            overall_risk_score: riskAssessment.overall_risk_score,
            risk_level: riskAssessment.risk_level,
            risk_categories: JSON.stringify(riskAssessment.risk_categories),
            predicted_failures: JSON.stringify(riskAssessment.predicted_failures),
            risk_factors: JSON.stringify(riskAssessment.risk_factors),
            recommended_actions: JSON.stringify(riskAssessment.recommended_actions),
            confidence_score: riskAssessment.confidence_score,
            analyzed_by: user.email
        });

        return Response.json({
            risk_assessment: riskAssessment,
            risk_record_id: riskRecord.id,
            analyzed_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error analyzing compliance risk:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});