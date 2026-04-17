import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all pending tasks with upcoming deadlines
    const tasks = await base44.asServiceRole.entities.IncidentTask.list();

    const today = new Date();
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const tasksDueToday = tasks.filter(task => {
      const taskData = task.data;
      if (!taskData.deadline || taskData.reminder_sent) return false;
      if (['completed', 'blocked'].includes(taskData.status)) return false;

      const deadline = new Date(taskData.deadline);
      return deadline.toDateString() === today.toDateString();
    });

    const tasksDueTomorrow = tasks.filter(task => {
      const taskData = task.data;
      if (!taskData.deadline || taskData.reminder_sent) return false;
      if (['completed', 'blocked'].includes(taskData.status)) return false;

      const deadline = new Date(taskData.deadline);
      return deadline.toDateString() === tomorrowDate.toDateString();
    });

    // Send reminders for tasks due today
    for (const task of tasksDueToday) {
      if (task.data.assigned_to) {
        await base44.integrations.Core.SendEmail({
          to: task.data.assigned_to,
          subject: `Reminder: Task Due Today - ${task.data.title}`,
          body: `The following task is due today:\n\nTitle: ${task.data.title}\nDeadline: ${task.data.deadline}\n\nPlease complete or update the status as soon as possible.`
        });

        // Mark reminder as sent
        await base44.asServiceRole.entities.IncidentTask.update(task.id, {
          reminder_sent: true
        });
      }
    }

    // Send reminders for tasks due tomorrow
    for (const task of tasksDueTomorrow) {
      if (task.data.assigned_to) {
        await base44.integrations.Core.SendEmail({
          to: task.data.assigned_to,
          subject: `Upcoming Deadline - ${task.data.title}`,
          body: `The following task is due tomorrow:\n\nTitle: ${task.data.title}\nDeadline: ${task.data.deadline}\n\nPlease ensure you're on track to complete it.`
        });
      }
    }

    return Response.json({
      success: true,
      reminders_sent: tasksDueToday.length + tasksDueTomorrow.length,
      today: tasksDueToday.length,
      tomorrow: tasksDueTomorrow.length
    });
  } catch (error) {
    console.error('Error sending deadline reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});