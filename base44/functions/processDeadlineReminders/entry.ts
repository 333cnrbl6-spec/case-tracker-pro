import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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