import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deadlines } = await req.json();

    // Get the app user's Google Calendar connection
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('googlecalendar-sync');

    if (!accessToken) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    let syncedCount = 0;
    const errors = [];

    // Sync each deadline to Google Calendar
    for (const deadline of deadlines) {
      try {
        // Determine event color based on milestone type and urgency
        let colorId = '1'; // Default blue
        if (deadline.type === 'limitation_date') {
          colorId = deadline.daysRemaining <= 7 ? '11' : '1'; // Red for urgent limitation dates, blue otherwise
        } else if (deadline.type === 'court_deadline') {
          colorId = '5'; // Cyan for court deadlines
        }

        const eventData = {
          summary: `[${deadline.caseRef}] ${deadline.title}`,
          description: `${deadline.description || ''}\n\nCase Reference: ${deadline.caseRef}\nMilestone Type: ${deadline.type.replace(/_/g, ' ').toUpperCase()}`,
          start: {
            date: deadline.date.split('T')[0], // Extract date part only
          },
          end: {
            date: deadline.date.split('T')[0],
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 30 * 24 * 60 }, // 30 days
              { method: 'email', minutes: 7 * 24 * 60 }, // 7 days
              { method: 'email', minutes: 1 * 24 * 60 }, // 1 day
            ],
          },
          colorId: colorId,
        };

        // Create event in Google Calendar
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (response.ok) {
          syncedCount++;
          console.log(`Synced deadline: ${deadline.title}`);
        } else {
          const errorText = await response.text();
          errors.push(`Failed to sync ${deadline.title}: ${errorText}`);
          console.error(`Google Calendar sync error for ${deadline.title}:`, errorText);
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
    console.error('Sync function error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});