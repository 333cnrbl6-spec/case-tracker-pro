// Audit logging utility for compliance tracking
// Usage: await logAuditEvent(base44, event)

export const logAuditEvent = async (base44, event) => {
  try {
    const auditEntry = {
      event_type: event.event_type,
      action: event.action,
      triggered_by: event.triggered_by || 'system',
      case_id: event.case_id,
      case_ref: event.case_ref,
      risk_id: event.risk_id,
      task_id: event.task_id,
      assigned_to: event.assigned_to,
      severity: event.severity || 'medium',
      details: typeof event.details === 'string' ? event.details : JSON.stringify(event.details || {}),
      status: event.status || 'success',
      error_message: event.error_message,
      timestamp: new Date().toISOString()
    };

    await base44.entities.AuditLog.create(auditEntry);
    return auditEntry;
  } catch (error) {
    console.error('Failed to log audit event:', error);
    throw error;
  }
};

export const formatAuditEventType = (eventType) => {
  const labels = {
    workflow_triggered: 'Workflow Triggered',
    task_created: 'Task Created',
    task_escalated: 'Task Escalated',
    reminder_sent: 'Reminder Sent',
    workflow_completed: 'Workflow Completed',
    risk_assessment_created: 'Risk Assessment Created',
    escalation_sent: 'Escalation Sent'
  };
  return labels[eventType] || eventType;
};

export const getSeverityColor = (severity) => {
  const colors = {
    low: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200'
  };
  return colors[severity] || colors.medium;
};