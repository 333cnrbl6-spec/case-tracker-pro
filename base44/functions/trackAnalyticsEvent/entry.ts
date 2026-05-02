import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event_name, properties } = await req.json();

    // Log analytics event using Base44's built-in analytics
    await base44.analytics.track({
      eventName: event_name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});