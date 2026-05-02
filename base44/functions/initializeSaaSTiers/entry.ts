import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({
        error: 'Only admins can initialize SaaS tiers'
      }, { status: 403 });
    }

    // Check if tiers already exist
    const existingTiers = await base44.asServiceRole.entities.SubscriptionTier.list();
    if (existingTiers.length > 0) {
      return Response.json({
        success: false,
        message: 'Tiers already initialized'
      });
    }

    // Create default tiers
    const tiers = [
      {
        tier_name: 'Starter',
        monthly_price: 99,
        annual_price: 990,
        max_cases: 5,
        max_users: 2,
        max_ai_generations: 10,
        max_document_exports: 20,
        features: [
          'Up to 5 legal cases',
          '2 team members',
          '10 AI narratives/month',
          'Basic compliance alerts',
          'Email support'
        ],
        is_active: true
      },
      {
        tier_name: 'Professional',
        monthly_price: 199,
        annual_price: 1990,
        max_cases: 20,
        max_users: 5,
        max_ai_generations: 50,
        max_document_exports: 100,
        features: [
          'Up to 20 legal cases',
          '5 team members',
          '50 AI narratives/month',
          'Advanced compliance audits',
          'Priority email support',
          'Monthly analytics reports'
        ],
        is_active: true
      },
      {
        tier_name: 'Premium',
        monthly_price: 399,
        annual_price: 3990,
        max_cases: 100,
        max_users: 15,
        max_ai_generations: 200,
        max_document_exports: 500,
        features: [
          'Up to 100 legal cases',
          '15 team members',
          'Unlimited AI narratives',
          'Full compliance RAG scoring',
          'Priority phone support',
          'Weekly analytics & KPI reports',
          'Custom integrations'
        ],
        is_active: true
      },
      {
        tier_name: 'Enterprise',
        monthly_price: 999,
        annual_price: 9990,
        max_cases: 999,
        max_users: 100,
        max_ai_generations: 999,
        max_document_exports: 999,
        features: [
          'Unlimited cases',
          'Unlimited team members',
          'Unlimited AI features',
          'Custom compliance rules',
          'Dedicated account manager',
          'Real-time analytics dashboard',
          'Custom API access',
          'SLA guarantee'
        ],
        is_active: true
      }
    ];

    // Create each tier
    const createdTiers = [];
    for (const tier of tiers) {
      const created = await base44.asServiceRole.entities.SubscriptionTier.create(tier);
      createdTiers.push(created);
    }

    console.log('[initializeSaaSTiers] Created', createdTiers.length, 'pricing tiers');

    return Response.json({
      success: true,
      tiers_created: createdTiers.length,
      message: 'Subscription tiers initialized successfully'
    });
  } catch (error) {
    console.error('[initializeSaaSTiers]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});