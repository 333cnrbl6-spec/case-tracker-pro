import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entity_type } = await req.json();

    // Get or create subscription meters for this firm (using created_by as tenant identifier)
    let meters = await base44.entities.SubscriptionMeters.filter({
      firm_email: user.email
    });

    if (!meters || meters.length === 0) {
      // Create default Starter tier subscription
      meters = [await base44.entities.SubscriptionMeters.create({
        firm_email: user.email,
        subscription_tier: 'Starter',
        subscription_active: true,
        billing_cycle_start: new Date().toISOString().split('T')[0],
        billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })];
    }

    const meter = meters[0];
    
    // Get tier limits
    const tiers = await base44.entities.SubscriptionTier.filter({
      tier_name: meter.subscription_tier
    });
    const tier = tiers?.[0];

    if (!tier) {
      return Response.json({
        allowed: true,
        warning: null
      });
    }

    // Check limits based on action
    const limits = {
      create_case: {
        current: meter.current_case_count || 0,
        max: tier.max_cases,
        key: 'cases'
      },
      add_user: {
        current: meter.current_user_count || 1,
        max: tier.max_users,
        key: 'team members'
      },
      generate_narrative: {
        current: meter.ai_generations_this_month || 0,
        max: tier.max_ai_generations || 999,
        key: 'AI generations'
      },
      export_document: {
        current: meter.document_exports_this_month || 0,
        max: tier.max_document_exports || 999,
        key: 'document exports'
      }
    };

    const limit = limits[action];
    if (!limit) {
      return Response.json({ allowed: true, warning: null });
    }

    const isAtLimit = limit.current >= limit.max;
    const nearLimit = limit.current >= limit.max * 0.8;

    return Response.json({
      allowed: !isAtLimit,
      at_limit: isAtLimit,
      near_limit: nearLimit,
      current: limit.current,
      max: limit.max,
      key: limit.key,
      tier: meter.subscription_tier,
      upgrade_url: isAtLimit ? '/upgrade' : null,
      warning: nearLimit && !isAtLimit ? `You've used ${limit.current}/${limit.max} ${limit.key}` : null
    });
  } catch (error) {
    console.error('[checkTierLimitAndEnforce]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});