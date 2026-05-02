import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feature, event_metadata } = await req.json();

    // Track via analytics SDK
    await base44.analytics.track({
      eventName: `feature_${feature}_used`,
      properties: {
        user_email: user.email,
        user_role: user.role,
        ...event_metadata
      }
    });

    // Also log to audit trail for SaaS compliance
    await base44.entities.AuditLog.create({
      event_type: 'feature_used',
      action: `User used feature: ${feature}`,
      triggered_by: user.email,
      details: JSON.stringify(event_metadata || {}),
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[trackFeatureUsage]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});