import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only process incident creation
    if (event.type !== 'create') {
      return Response.json({ skipped: 'not a creation event' });
    }

    const incident = data;

    // Determine if notification is needed
    const isCriticalSeverity = ['high', 'critical'].includes(incident.severity);
    const hasRICSViolations = incident.rics_violations?.length > 0;
    const shouldNotify = isCriticalSeverity || hasRICSViolations;

    if (!shouldNotify) {
      return Response.json({ skipped: 'severity and violations do not trigger alert' });
    }

    // Fetch practice profile for team email
    const profiles = await base44.asServiceRole.entities.PracticeProfile.list();
    const profile = profiles?.[0];
    const teamEmail = profile?.email;

    if (!teamEmail) {
      console.warn('No team email configured in PracticeProfile');
      return Response.json({ warning: 'No team email configured' });
    }

    // Build alert message
    const severity = incident.severity?.toUpperCase() || 'UNKNOWN';
    const violations = incident.rics_violations?.length > 0
      ? `RICS Violations: ${incident.rics_violations.join(', ')}`
      : 'No RICS violations linked';
    
    const subject = `[ALERT] ${severity} Incident Logged: ${incident.title}`;
    const body = `
A new incident has been logged that requires immediate attention.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INCIDENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: ${incident.title}
Severity: ${severity}
Type: ${incident.incident_type?.replace(/_/g, ' ') || 'Unknown'}
Date: ${incident.date}

Description:
${incident.description || 'No description provided'}

${violations}

${incident.legal_issues?.length > 0 ? `Legal Issues: ${incident.legal_issues.join(', ')}\n` : ''}
Status: ${incident.status || 'Open'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Log into the compliance system to review the full incident
2. Assess evidence and related communications
3. Determine remediation actions
4. Update the incident status as you progress

This is an automated notification. Do not reply to this email.
    `.trim();

    // Send email
    await base44.integrations.Core.SendEmail({
      to: teamEmail,
      subject,
      body,
      from_name: 'Compliance System',
    });

    // Create system alert
    await base44.asServiceRole.entities.SystemAlert.create({
      alert_type: 'high_severity_cluster',
      severity: isCriticalSeverity ? 'critical' : 'warning',
      title: `${severity} Incident: ${incident.title}`,
      description: `New incident logged with ${hasRICSViolations ? 'RICS violations' : 'high severity'}. Email notification sent to compliance team.`,
      incident_count: 1,
      related_incidents: [incident.id],
      detection_date: new Date().toISOString().split('T')[0],
      status: 'active',
      recommended_action: 'Review incident details and assign investigation tasks.',
    });

    return Response.json({
      success: true,
      notified: teamEmail,
      severity: incident.severity,
      hasRICSViolations,
    });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});