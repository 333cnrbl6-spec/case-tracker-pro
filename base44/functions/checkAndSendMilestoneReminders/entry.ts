import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all active cases
    const cases = await base44.asServiceRole.entities.LegalCase.list('-created_date');
    const activeCases = cases.filter(
      (c) =>
        c.status !== 'closed' &&
        c.status !== 'settled' &&
        (c.limitation_date || c.court_deadline)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const remindersToCreate = [];
    const remindersToUpdate = [];

    // Check each case for upcoming milestones
    for (const legalCase of activeCases) {
      // Check limitation date
      if (legalCase.limitation_date) {
        const limitDate = new Date(legalCase.limitation_date);
        const daysUntil = Math.ceil(
          (limitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Create reminder if within alert threshold (30, 14, 7, 3, 1 days)
        const alertDays = [30, 14, 7, 3, 1];
        for (const alertDay of alertDays) {
          if (daysUntil === alertDay) {
            // Check if reminder already exists for this date
            const existingReminders = await base44.asServiceRole.entities.MilestoneReminder.filter(
              {
                case_id: legalCase.id,
                milestone_type: 'limitation_date',
                status: { $ne: 'completed' },
              }
            );

            if (existingReminders.length === 0) {
              remindersToCreate.push({
                case_id: legalCase.id,
                case_ref: legalCase.case_ref,
                milestone_type: 'limitation_date',
                milestone_date: legalCase.limitation_date,
                title: `Limitation Date Approaching: ${legalCase.case_ref}`,
                description: `The legal limitation date for case ${legalCase.case_ref} (${legalCase.client_name}) is ${daysUntil} days away. This is a CRITICAL deadline that must not be missed.`,
                days_remaining: daysUntil,
                severity:
                  daysUntil <= 3
                    ? 'critical'
                    : daysUntil <= 7
                      ? 'high'
                      : 'medium',
                recipient_email: legalCase.assigned_fee_earner,
              });
            }
          }
        }
      }

      // Check court deadline
      if (legalCase.court_deadline) {
        const courtDate = new Date(legalCase.court_deadline);
        const daysUntil = Math.ceil(
          (courtDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil <= 14 && daysUntil > 0) {
          const existingReminders = await base44.asServiceRole.entities.MilestoneReminder.filter(
            {
              case_id: legalCase.id,
              milestone_type: 'court_deadline',
              status: { $ne: 'completed' },
            }
          );

          if (existingReminders.length === 0) {
            remindersToCreate.push({
              case_id: legalCase.id,
              case_ref: legalCase.case_ref,
              milestone_type: 'court_deadline',
              milestone_date: legalCase.court_deadline,
              title: `Court Deadline: ${legalCase.case_ref}`,
              description: `Court deadline for case ${legalCase.case_ref} is ${daysUntil} days away.`,
              days_remaining: daysUntil,
              severity:
                daysUntil <= 3
                  ? 'critical'
                  : daysUntil <= 7
                    ? 'high'
                    : 'medium',
              recipient_email: legalCase.assigned_fee_earner,
            });
          }
        }
      }

      // Check client contact reminder
      if (legalCase.last_client_contact) {
        const lastContact = new Date(legalCase.last_client_contact);
        const daysSinceContact = Math.floor(
          (today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
        );
        const contactReminderDays = 30; // Alert every 30 days without contact

        if (daysSinceContact >= contactReminderDays) {
          const existingReminders = await base44.asServiceRole.entities.MilestoneReminder.filter(
            {
              case_id: legalCase.id,
              milestone_type: 'client_contact_due',
              status: 'pending',
            }
          );

          if (existingReminders.length === 0) {
            remindersToCreate.push({
              case_id: legalCase.id,
              case_ref: legalCase.case_ref,
              milestone_type: 'client_contact_due',
              milestone_date: new Date(
                today.getTime() + contactReminderDays * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split('T')[0],
              title: `Client Contact Due: ${legalCase.case_ref}`,
              description: `No contact with client for ${daysSinceContact} days. Consider reaching out to ${legalCase.client_name}.`,
              days_remaining: 0,
              severity: 'medium',
              recipient_email: legalCase.assigned_fee_earner,
            });
          }
        }
      }

      // Check client care letter
      if (!legalCase.client_care_letter_sent) {
        const createdDate = new Date(legalCase.created_date);
        const daysSinceCreated = Math.floor(
          (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const cclDeadlineDays = 14;

        if (daysSinceCreated >= cclDeadlineDays) {
          const existingReminders = await base44.asServiceRole.entities.MilestoneReminder.filter(
            {
              case_id: legalCase.id,
              milestone_type: 'client_care_letter_due',
              status: 'pending',
            }
          );

          if (existingReminders.length === 0) {
            remindersToCreate.push({
              case_id: legalCase.id,
              case_ref: legalCase.case_ref,
              milestone_type: 'client_care_letter_due',
              milestone_date: new Date(
                createdDate.getTime() + cclDeadlineDays * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split('T')[0],
              title: `Client Care Letter Due: ${legalCase.case_ref}`,
              description: `Client care letter has not been sent for case ${legalCase.case_ref}. This must be sent within 14 days of case creation.`,
              days_remaining: 0,
              severity: 'high',
              recipient_email: legalCase.assigned_fee_earner,
            });
          }
        }
      }
    }

    // Fetch existing pending reminders and update their status
    const pendingReminders = await base44.asServiceRole.entities.MilestoneReminder.filter(
      {
        status: 'pending',
      }
    );

    for (const reminder of pendingReminders) {
      const milestoneDate = new Date(reminder.milestone_date);
      const daysUntil = Math.ceil(
        (milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Mark as completed if deadline has passed
      if (daysUntil < 0) {
        remindersToUpdate.push({
          id: reminder.id,
          data: { status: 'completed' },
        });
      } else {
        // Update days remaining
        remindersToUpdate.push({
          id: reminder.id,
          data: { days_remaining: daysUntil },
        });
      }
    }

    // Create new reminders
    if (remindersToCreate.length > 0) {
      await base44.asServiceRole.entities.MilestoneReminder.bulkCreate(
        remindersToCreate
      );
    }

    // Update existing reminders
    for (const update of remindersToUpdate) {
      await base44.asServiceRole.entities.MilestoneReminder.update(
        update.id,
        update.data
      );
    }

    // Send email and in-app notifications for pending reminders
    const allReminders = await base44.asServiceRole.entities.MilestoneReminder.filter(
      {
        status: 'pending',
        reminder_sent: false,
      }
    );

    for (const reminder of allReminders) {
      try {
        // Send email
        if (reminder.recipient_email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: reminder.recipient_email,
            subject: reminder.title,
            body: `${reminder.description}\n\nDays remaining: ${reminder.days_remaining}\nSeverity: ${reminder.severity}`,
          });
        }

        // Mark reminder as sent
        await base44.asServiceRole.entities.MilestoneReminder.update(
          reminder.id,
          {
            reminder_sent: true,
            reminder_sent_date: new Date().toISOString(),
            email_sent: !!reminder.recipient_email,
            email_sent_date: reminder.recipient_email
              ? new Date().toISOString()
              : null,
            actions_taken: [
              ...(reminder.actions_taken || []),
              `Email reminder sent on ${new Date().toISOString()}`,
            ],
          }
        );
      } catch (error) {
        console.error(`Failed to send reminder for case ${reminder.case_ref}:`, error);
      }
    }

    return Response.json({
      success: true,
      reminders_created: remindersToCreate.length,
      reminders_updated: remindersToUpdate.length,
      reminders_notified: allReminders.length,
    });
  } catch (error) {
    console.error('Milestone reminder check failed:', error);
    return Response.json(
      { error: error.message || 'Failed to check milestones' },
      { status: 500 }
    );
  }
});