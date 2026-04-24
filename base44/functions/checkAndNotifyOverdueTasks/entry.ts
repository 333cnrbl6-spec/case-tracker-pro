import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tasks that are not completed
    const tasks = await base44.asServiceRole.entities.IncidentTask.filter(
      { status: { $ne: 'completed' } },
      '-created_date'
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueNotifications = [];

    // Check each task for overdue status
    for (const task of tasks) {
      if (!task.deadline || !task.assigned_to) continue;

      const deadline = new Date(task.deadline);
      deadline.setHours(0, 0, 0, 0);

      // If deadline has passed and not already reminded
      if (deadline < today && !task.reminder_sent) {
        // Get incident and case info for context
        const incident = await base44.asServiceRole.entities.Incident.filter({ id: task.incident_id }).then(r => r[0]);

        // Find related case
        let caseRef = 'Unknown';
        if (incident && incident.related_incidents) {
          // Try to find case reference from related data
          const cases = await base44.asServiceRole.entities.LegalCase.filter({}, '-created_date');
          const relatedCase = cases.find(c => c.id === incident.id || c.case_ref);
          if (relatedCase) caseRef = relatedCase.case_ref;
        }

        const daysOverdue = Math.floor((today - deadline) / (1000 * 60 * 60 * 24));

        // Send email notification to fee earner
        const emailSubject = `URGENT: Task Overdue - ${task.title}`;
        const emailBody = `
Hello,

A task assigned to you is now ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue:

Task: ${task.title}
Priority: ${task.priority || 'Medium'}
Incident: ${incident?.title || 'Unknown'}
Case: ${caseRef}
Due Date: ${new Date(task.deadline).toLocaleDateString('en-GB')}

Status: ${task.status}

Please update the task status in the workflow or contact your case manager.

---
Case Task Workflow System
        `;

        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: task.assigned_to,
            subject: emailSubject,
            body: emailBody,
            from_name: 'Case Management System',
          });

          // Mark reminder as sent
          await base44.asServiceRole.entities.IncidentTask.update(task.id, {
            reminder_sent: true,
          });

          overdueNotifications.push({
            task_id: task.id,
            assigned_to: task.assigned_to,
            deadline: task.deadline,
            days_overdue: daysOverdue,
          });
        } catch (emailErr) {
          console.error(`Failed to send email for task ${task.id}:`, emailErr);
        }
      }
    }

    return Response.json({
      notified_count: overdueNotifications.length,
      notifications: overdueNotifications,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});