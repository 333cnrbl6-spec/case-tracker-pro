import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();

    // Find or create meters for this firm
    let meters = await base44.entities.SubscriptionMeters.filter({
      firm_email: user.email
    });

    if (!meters || meters.length === 0) {
      metrics = await base44.entities.SubscriptionMeters.create({
        firm_email: user.email,
        subscription_tier: 'Starter',
        subscription_active: true,
        billing_cycle_start: new Date().toISOString().split('T')[0],
        billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      return Response.json({ success: true, meters });
    }

    const meter = meters[0];
    const updates = {};

    // Increment appropriate counter
    if (action === 'case_created') {
      updates.current_case_count = (meter.current_case_count || 0) + 1;
    } else if (action === 'user_added') {
      updates.current_user_count = (meter.current_user_count || 1) + 1;
    } else if (action === 'narrative_generated') {
      updates.ai_generations_this_month = (meter.ai_generations_this_month || 0) + 1;
    } else if (action === 'document_exported') {
      updates.document_exports_this_month = (meter.document_exports_this_month || 0) + 1;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ success: true, message: 'No metrics to update' });
    }

    // Update meters
    await base44.entities.SubscriptionMeters.update(meter.id, updates);

    return Response.json({ success: true, meters: updates });
  } catch (error) {
    console.error('[updateUsageMeters]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});