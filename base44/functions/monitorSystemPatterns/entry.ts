import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all incidents and tasks
    const [incidents, tasks] = await Promise.all([
      base44.asServiceRole.entities.Incident.list(),
      base44.asServiceRole.entities.IncidentTask.list()
    ]);

    const alerts = [];

    // Pattern 1: Check for RICS rule clusters
    const ruleFrequency = {};
    incidents.forEach(incident => {
      if (incident.data.rics_violations && Array.isArray(incident.data.rics_violations)) {
        incident.data.rics_violations.forEach(rule => {
          ruleFrequency[rule] = (ruleFrequency[rule] || 0) + 1;
        });
      }
    });

    // Flag rules with 5+ incidents
    Object.entries(ruleFrequency).forEach(([rule, count]) => {
      if (count >= 5) {
        const relatedIncidents = incidents
          .filter(i => i.data.rics_violations?.includes(rule))
          .map(i => i.id);

        alerts.push({
          alert_type: 'rule_pattern',
          severity: count >= 8 ? 'critical' : 'warning',
          title: `Systemic Risk: RICS Rule ${rule} Violated ${count} Times`,
          description: `The rule "${rule}" has been violated in ${count} separate incidents. This suggests a systemic issue that may indicate a broader pattern of non-compliance.`,
          rule_number: rule,
          incident_count: count,
          related_incidents: relatedIncidents,
          detection_date: new Date().toISOString().split('T')[0],
          recommended_action: `Review all ${count} incidents involving rule ${rule}. Consider whether remedial training, process changes, or escalation to RICS is warranted.`
        });
      }
    });

    // Pattern 2: Check for overdue critical tasks
    const today = new Date();
    const overdueByIncident = {};

    const criticalOverdue = tasks.filter(task => {
      if (task.data.priority !== 'critical' && task.data.priority !== 'high') return false;
      if (!task.data.deadline) return false;
      if (task.data.status === 'completed' || task.data.status === 'blocked') return false;

      const deadline = new Date(task.data.deadline);
      const isOverdue = deadline < today;

      if (isOverdue) {
        const incidentId = task.data.incident_id;
        overdueByIncident[incidentId] = (overdueByIncident[incidentId] || 0) + 1;
      }

      return isOverdue;
    });

    if (criticalOverdue.length >= 3) {
      alerts.push({
        alert_type: 'overdue_tasks',
        severity: criticalOverdue.length >= 5 ? 'critical' : 'warning',
        title: `${criticalOverdue.length} Critical/High Priority Tasks Are Overdue`,
        description: `${criticalOverdue.length} critical or high-priority incident follow-up tasks have missed their deadlines. This may indicate resource constraints or inadequate case management.`,
        overdue_task_count: criticalOverdue.length,
        related_tasks: criticalOverdue.map(t => t.id),
        detection_date: new Date().toISOString().split('T')[0],
        recommended_action: `Immediately review all ${criticalOverdue.length} overdue tasks. Consider reallocating resources, extending deadlines with documented reasons, or escalating to management.`
      });
    }

    // Pattern 3: Check for high-severity incident clusters
    const highSeverityCount = incidents.filter(i => 
      i.data.severity === 'critical' || i.data.severity === 'high'
    ).length;

    if (highSeverityCount >= 5) {
      const highSeverityIncidents = incidents
        .filter(i => i.data.severity === 'critical' || i.data.severity === 'high')
        .map(i => i.id);

      alerts.push({
        alert_type: 'high_severity_cluster',
        severity: highSeverityCount >= 8 ? 'critical' : 'warning',
        title: `${highSeverityCount} High/Critical Severity Incidents Detected`,
        description: `The case contains ${highSeverityCount} incidents rated as high or critical severity. This cluster suggests the case may involve serious breaches or widespread misconduct.`,
        incident_count: highSeverityCount,
        related_incidents: highSeverityIncidents,
        detection_date: new Date().toISOString().split('T')[0],
        recommended_action: `Ensure all high/critical incidents are thoroughly documented with supporting evidence. Consider expediting escalation to RICS or legal counsel.`
      });
    }

    // Check for existing alerts and create new ones
    if (alerts.length > 0) {
      // Clear old alerts of the same type and create new ones
      for (const alert of alerts) {
        // Only keep the first instance of each alert type
        const existingAlerts = await base44.asServiceRole.entities.SystemAlert.filter({
          alert_type: alert.alert_type,
          status: { $in: ['active', 'acknowledged'] }
        });

        if (existingAlerts.length === 0) {
          await base44.asServiceRole.entities.SystemAlert.create(alert);
        }
      }
    }

    return Response.json({
      success: true,
      alerts_generated: alerts.length,
      patterns_detected: {
        rule_patterns: Object.keys(ruleFrequency).filter(r => ruleFrequency[r] >= 5).length,
        overdue_critical_tasks: criticalOverdue.length,
        high_severity_incidents: highSeverityCount
      }
    });
  } catch (error) {
    console.error('Error monitoring patterns:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});