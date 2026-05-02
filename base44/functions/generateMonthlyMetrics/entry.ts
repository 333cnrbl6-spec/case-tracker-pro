import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all subscription meters
    const meters = await base44.entities.SubscriptionMeters.list();
    
    // Calculate metrics
    const metrics = {
      total_users: meters.length,
      total_mrr: 0,
      total_cases: 0,
      total_team_members: 0,
      tier_breakdown: {},
      churn_risk: []
    };

    for (const meter of meters) {
      const tier = await base44.entities.SubscriptionTier.filter({
        tier_name: meter.subscription_tier
      });

      if (tier && tier.length > 0) {
        const price = meter.billing_cycle_start && 
          new Date(meter.billing_cycle_start).getMonth() === new Date().getMonth() 
          ? tier[0].monthly_price 
          : 0;
        
        metrics.total_mrr += price;
        metrics.total_cases += meter.current_case_count || 0;
        metrics.total_team_members += meter.current_user_count || 0;

        // Tier breakdown
        if (!metrics.tier_breakdown[meter.subscription_tier]) {
          metrics.tier_breakdown[meter.subscription_tier] = 0;
        }
        metrics.tier_breakdown[meter.subscription_tier]++;

        // Churn risk (upgrade_available = true means they might churn if not upgraded)
        if (meter.upgrade_available === false && meter.current_case_count > meter.current_case_count * 0.8) {
          metrics.churn_risk.push({
            firm_email: meter.firm_email,
            tier: meter.subscription_tier,
            reason: 'Approaching limit'
          });
        }
      }
    }

    console.log('Monthly metrics generated:', metrics);

    return Response.json({
      success: true,
      metrics: metrics,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Metrics generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});