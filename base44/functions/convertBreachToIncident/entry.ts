import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { breach } = await req.json();

    if (!breach) {
      return Response.json({ error: 'breach data required' }, { status: 400 });
    }

    // Determine severity level
    const severityMap = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical'
    };

    const incidentSeverity = severityMap[breach.severity] || 'medium';

    // Create the incident
    const incident = await base44.entities.Incident.create({
      date: breach.date,
      title: `RICS Rule ${breach.breach_type} Breach Detected: ${breach.rule_title}`,
      description: `
Potential Breach Detected via AI Communication Scanner

Rule: ${breach.breach_type} - ${breach.rule_title}
Category: ${breach.rule_category}
Severity: ${breach.severity}

Issue: ${breach.issue_description}

Problematic Text: "${breach.problematic_text}"

From: ${breach.from}
To: ${breach.to}
Subject: ${breach.subject}

Recommendation: ${breach.recommendation}
      `.trim(),
      incident_type: 'communication',
      severity: incidentSeverity,
      rics_violations: [breach.breach_type],
      evidence_notes: `Auto-flagged by AI breach discovery tool on ${new Date().toLocaleDateString('en-GB')}`,
      status: 'open'
    });

    return Response.json({
      success: true,
      incident_id: incident.id,
      incident_title: incident.title
    });
  } catch (error) {
    console.error('Convert breach error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});