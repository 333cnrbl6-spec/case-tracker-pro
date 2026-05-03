import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deadlines } = await req.json();

    // Get the app user's Outlook connection
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('outlook-sync');

    if (!accessToken) {
      return Response.json({ error: 'Outlook not connected' }, { status: 400 });
    }

    let syncedCount = 0;
    const errors = [];

    // Sync each deadline to Outlook Calendar
    for (const deadline of deadlines) {
      try {
        // Determine category color based on milestone type
        let categories = ['Deadline'];
        if (deadline.type === 'limitation_date') {
          categories.push('Critical');
        } else if (deadline.type === 'court_deadline') {
          categories.push('Court');
        }

        // Parse date - handle both ISO and date-only formats
        const dateStr = deadline.date.includes('T') ? deadline.date.split('T')[0] : deadline.date;
        const eventDate = new Date(dateStr);

        const eventData = {
          subject: `[${deadline.caseRef}] ${deadline.title}`,
          bodyPreview: deadline.description || '',
          body: {
            contentType: 'HTML',
            content: `
              <p><strong>${deadline.title}</strong></p>
              <p>${deadline.description || ''}</p>
              <p><br/></p>
              <p><strong>Case Reference:</strong> ${deadline.caseRef}</p>
              <p><strong>Milestone Type:</strong> ${deadline.type.replace(/_/g, ' ').toUpperCase()}</p>
            `,
          },
          start: {
            dateTime: eventDate.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            timeZone: 'UTC',
          },
          isReminderOn: true,
          reminderMinutesBeforeStart: 30 * 24 * 60, // 30 days
          categories: categories,
          isAllDay: true,
        };

        // Create event in Outlook Calendar
        const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (response.ok || response.status === 201) {
          syncedCount++;
          console.log(`Synced deadline to Outlook: ${deadline.title}`);
        } else {
          const errorText = await response.text();
          errors.push(`Failed to sync ${deadline.title}: ${errorText}`);
          console.error(`Outlook sync error for ${deadline.title}:`, errorText);
        }
      } catch (error) {
        errors.push(`Error syncing ${deadline.title}: ${error.message}`);
        console.error(`Error syncing deadline ${deadline.title}:`, error);
      }
    }

    return Response.json({
      success: true,
      synced_count: syncedCount,
      total: deadlines.length,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error('Outlook sync function error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});