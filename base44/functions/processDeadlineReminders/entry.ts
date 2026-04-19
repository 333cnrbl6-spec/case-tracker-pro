import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const logAuditEvent = async (base44, event) => {
  try {
    await base44.entities.AuditLog.create({
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
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const today = new Date();
        const deadlineThresholds = [1, 3, 7]; // Remind 1, 3, 7 days before deadline

        // Fetch all non-completed tasks
        const allTasks = await base44.entities.IncidentTask.filter({});
        const pendingTasks = allTasks.filter(t => !['completed', 'blocked'].includes(t.status));

        const reminders = [];
        const escalatedTasks = [];

        for (const task of pendingTasks) {
            if (!task.deadline) continue;

            const deadline = new Date(task.deadline);
            const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

            // Check if task should be reminded
            if (deadlineThresholds.includes(daysUntil)) {
                reminders.push({
                    task_id: task.id,
                    title: task.title,
                    assigned_to: task.assigned_to,
                    deadline: task.deadline,
                    days_until: daysUntil,
                    priority: task.priority
                });

                // Update task with reminder flag
                await base44.entities.IncidentTask.update(task.id, {
                    reminder_sent: true
                });

                // Log reminder sent
                await logAuditEvent(base44, {
                    event_type: 'reminder_sent',
                    action: `Deadline reminder sent: "${task.title}" due in ${daysUntil} days`,
                    triggered_by: 'system',
                    task_id: task.id,
                    assigned_to: task.assigned_to,
                    severity: task.priority,
                    details: { days_until: daysUntil, deadline: task.deadline }
                });
            }

            // Escalate overdue critical/high priority tasks
            if (daysUntil < 0 && ['critical', 'high'].includes(task.priority)) {
                const incident = await base44.entities.Incident.get(task.incident_id);
                
                escalatedTasks.push({
                    task_id: task.id,
                    title: task.title,
                    assigned_to: task.assigned_to,
                    days_overdue: Math.abs(daysUntil),
                    priority: task.priority,
                    incident: incident?.title || 'Unknown'
                });

                // Update task status
                await base44.entities.IncidentTask.update(task.id, {
                    status: 'blocked',
                    notes: `ESCALATED: Overdue by ${Math.abs(daysUntil)} days - awaiting resolution`
                });

                // Log task escalation
                await logAuditEvent(base44, {
                    event_type: 'task_escalated',
                    action: `Task escalated: "${task.title}" is ${Math.abs(daysUntil)} days overdue`,
                    triggered_by: 'system',
                    task_id: task.id,
                    assigned_to: task.assigned_to,
                    severity: task.priority,
                    details: { days_overdue: Math.abs(daysUntil), deadline: task.deadline }
                });
            }
        }

        console.log(`Deadline Reminders: ${reminders.length} | Escalations: ${escalatedTasks.length}`);

        return Response.json({
            success: true,
            reminders_sent: reminders.length,
            escalations: escalatedTasks.length,
            details: {
                reminders,
                escalated_tasks: escalatedTasks
            }
        });
    } catch (error) {
        console.error('Error processing deadline reminders:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});