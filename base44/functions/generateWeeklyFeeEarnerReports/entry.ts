import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tasks
    const allTasks = await base44.asServiceRole.entities.IncidentTask.list('-created_date');

    // Group tasks by assigned fee earner
    const tasksByFeeEarner = {};
    const feeEarners = new Set();

    for (const task of allTasks) {
      if (!task.assigned_to) continue;

      feeEarners.add(task.assigned_to);

      if (!tasksByFeeEarner[task.assigned_to]) {
        tasksByFeeEarner[task.assigned_to] = {
          completed: [],
          in_progress: [],
          overdue: [],
          due_soon: [],
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (task.status === 'completed') {
        tasksByFeeEarner[task.assigned_to].completed.push(task);
      } else {
        // Check if overdue
        if (task.deadline) {
          const deadline = new Date(task.deadline);
          deadline.setHours(0, 0, 0, 0);

          if (deadline < today) {
            tasksByFeeEarner[task.assigned_to].overdue.push(task);
          } else {
            const daysUntil = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 3) {
              tasksByFeeEarner[task.assigned_to].due_soon.push(task);
            }
          }
        }

        if (['under_investigation', 'evidence_review', 'resolution'].includes(task.status)) {
          tasksByFeeEarner[task.assigned_to].in_progress.push(task);
        }
      }
    }

    // Get incidents for context
    const incidents = await base44.asServiceRole.entities.Incident.list('-created_date');
    const incidentMap = {};
    incidents.forEach(inc => {
      incidentMap[inc.id] = inc;
    });

    // Send reports to each fee earner
    const reportsSent = [];

    for (const feeEarnerEmail of feeEarners) {
      const tasks = tasksByFeeEarner[feeEarnerEmail];
      const feeEarnerName = feeEarnerEmail.split('@')[0];

      // Generate report
      const completedList = tasks.completed
        .slice(0, 10)
        .map(t => `  • ${t.title} (Priority: ${t.priority || 'Medium'})`)
        .join('\n');

      const inProgressList = tasks.in_progress
        .slice(0, 10)
        .map(t => `  • ${t.title} (Status: ${t.status}, Priority: ${t.priority || 'Medium'})`)
        .join('\n');

      const overdueList = tasks.overdue
        .map(t => {
          const daysOverdue = Math.ceil((new Date() - new Date(t.deadline)) / (1000 * 60 * 60 * 24));
          return `  • ${t.title} - OVERDUE ${daysOverdue} DAY${daysOverdue > 1 ? 'S' : ''}`;
        })
        .join('\n');

      const dueSoonList = tasks.due_soon
        .map(t => {
          const daysUntil = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
          return `  • ${t.title} - Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
        })
        .join('\n');

      const emailBody = `Hello ${feeEarnerName},

Here is your weekly task summary for the week of ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}:

==================================================
TASK SUMMARY
==================================================

COMPLETED THIS WEEK (${tasks.completed.length} task${tasks.completed.length !== 1 ? 's' : ''})
${completedList || '  None'}

IN PROGRESS (${tasks.in_progress.length} task${tasks.in_progress.length !== 1 ? 's' : ''})
${inProgressList || '  None'}

OVERDUE - IMMEDIATE ACTION REQUIRED (${tasks.overdue.length} task${tasks.overdue.length !== 1 ? 's' : ''})
${overdueList || '  None'}

DUE SOON - NEXT 3 DAYS (${tasks.due_soon.length} task${tasks.due_soon.length !== 1 ? 's' : ''})
${dueSoonList || '  None'}

==================================================
STATISTICS
==================================================
Total Assigned: ${Object.values(tasks).reduce((sum, arr) => sum + arr.length, 0)}
Completion Rate: ${tasks.completed.length}/${tasks.completed.length + tasks.in_progress.length + tasks.overdue.length + tasks.due_soon.length}

Please log into the Case Task Workflow system to update task statuses and add comments.

Best regards,
Case Management System`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: feeEarnerEmail,
          subject: `Weekly Task Summary - ${new Date().toLocaleDateString('en-GB')}`,
          body: emailBody,
          from_name: 'Case Management System',
        });

        reportsSent.push({
          fee_earner: feeEarnerEmail,
          completed_count: tasks.completed.length,
          in_progress_count: tasks.in_progress.length,
          overdue_count: tasks.overdue.length,
          due_soon_count: tasks.due_soon.length,
        });
      } catch (emailErr) {
        console.error(`Failed to send report to ${feeEarnerEmail}:`, emailErr);
      }
    }

    return Response.json({
      reports_sent: reportsSent.length,
      details: reportsSent,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});