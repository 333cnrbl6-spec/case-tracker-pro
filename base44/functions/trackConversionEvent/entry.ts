import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_name, event_data } = await req.json();

    // Track conversion events
    const conversionEvents = {
      'trial_signup': { tier: 'conversion', value: 1 },
      'first_case_created': { tier: 'engagement', value: 1 },
      'first_ai_narrative_generated': { tier: 'engagement', value: 1 },
      'first_witness_invited': { tier: 'engagement', value: 1 },
      'upgrade_clicked': { tier: 'conversion', value: 1 },
      'subscription_created': { tier: 'revenue', value: event_data?.amount || 0 },
      'invoice_paid': { tier: 'revenue', value: event_data?.amount || 0 }
    };

    const conversionEvent = conversionEvents[event_name];
    if (!conversionEvent) {
      return Response.json({ error: 'Unknown event' }, { status: 400 });
    }

    // Log to analytics
    await base44.analytics.track({
      eventName: `conversion_${event_name}`,
      properties: {
        user_email: user.email,
        tier: conversionEvent.tier,
        value: conversionEvent.value,
        timestamp: new Date().toISOString(),
        ...event_data
      }
    });

    console.log(`Tracked conversion event: ${event_name} for ${user.email}`);

    return Response.json({ success: true, event: event_name });
  } catch (error) {
    console.error('Conversion tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});