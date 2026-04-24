import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tasks in progress states
    const inProgressStatuses = ['under_investigation', 'evidence_review', 'resolution'];
    const allTasks = await base44.asServiceRole.entities.IncidentTask.list('-created_date');

    const today = new Date();
    const escalatedTasks = [];
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Check each task for staleness
    for (const task of allTasks) {
      // Skip completed and critical-priority tasks
      if (task.status === 'completed' || task.priority === 'critical') continue;

      // Check if task is in progress
      if (!inProgressStatuses.includes(task.status)) continue;

      // Parse task creation date
      const taskCreatedDate = new Date(task.created_date);

      // If task has been in progress longer than 14 days
      if (taskCreatedDate < fourteenDaysAgo) {
        const daysInProgress = Math.floor((today - taskCreatedDate) / (1000 * 60 * 60 * 24));

        // Update priority to critical
        await base44.asServiceRole.entities.IncidentTask.update(task.id, {
          priority: 'critical',
        });

        escalatedTasks.push({
          task_id: task.id,
          title: task.title,
          status: task.status,
          assigned_to: task.assigned_to,
          days_in_progress: daysInProgress,
          old_priority: task.priority,
        });
      }
    }

    // Get all admin users to notify
    const allUsers = await base44.asServiceRole.entities.User.list();
    const adminEmails = allUsers
      .filter(u => u.role === 'admin')
      .map(u => u.email)
      .filter(Boolean);

    // Send notifications to all admins
    if (escalatedTasks.length > 0 && adminEmails.length > 0) {
      const taskList = escalatedTasks
        .map(t => `  • ${t.title} (Assigned to: ${t.assigned_to || 'Unassigned'}, In Progress: ${t.days_in_progress} days)`)
        .join('\n');

      const emailBody = `ALERT: ${escalatedTasks.length} Task${escalatedTasks.length !== 1 ? 's' : ''} Escalated to Critical

The following task${escalatedTasks.length !== 1 ? 's have' : ' has'} been in the 'In Progress' column for longer than 14 days and ${escalatedTasks.length !== 1 ? 'have' : 'has'} been automatically escalated to CRITICAL priority:

${taskList}

REQUIRED ACTIONS:
1. Review each escalated task immediately
2. Determine if the task is blocked and needs reassignment
3. Update task status or add comments explaining the delay
4. Consider escalating to case management team if further assistance is needed

Log into the Case Task Workflow system to take action.

---
Automated Task Escalation System`;

      for (const managerEmail of adminEmails) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: managerEmail,
            subject: `ALERT: ${escalatedTasks.length} Task${escalatedTasks.length !== 1 ? 's' : ''} Escalated to Critical Priority`,
            body: emailBody,
            from_name: 'Case Management System',
          });
        } catch (emailErr) {
          console.error(`Failed to send escalation alert to ${managerEmail}:`, emailErr);
        }
      }
    }

    return Response.json({
      escalated_count: escalatedTasks.length,
      tasks_escalated: escalatedTasks,
      managers_notified: adminEmails.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});