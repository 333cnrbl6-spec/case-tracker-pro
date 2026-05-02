import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.0.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Initializing Stripe products...');

    const tiers = [
      {
        name: 'Starter',
        description: 'Perfect for solo practitioners',
        monthlyPrice: 4900,
        annualPrice: 49000,
        features: ['5 cases', '1 team member', '5 AI narratives/month', '10 document exports/month', 'Basic RICS risk scoring']
      },
      {
        name: 'Professional',
        description: 'For growing practices',
        monthlyPrice: 14900,
        annualPrice: 149000,
        features: ['50 cases', '5 team members', '100 AI narratives/month', '50 document exports/month', 'Advanced RICS analytics', 'Witness collaboration']
      },
      {
        name: 'Premium',
        description: 'For established firms',
        monthlyPrice: 29900,
        annualPrice: 299000,
        features: ['Unlimited cases', '20 team members', 'Unlimited AI narratives', 'Unlimited document exports', 'Monthly RICS breach bulletin', 'Priority support', 'Custom templates']
      },
      {
        name: 'Enterprise',
        description: 'Custom for large firms',
        monthlyPrice: 99900,
        annualPrice: 999000,
        features: ['Unlimited everything', 'Unlimited team members', 'Dedicated account manager', 'White-label API access', 'Custom integrations', 'SLA guarantee', 'On-premises option']
      }
    ];

    const products = [];

    for (const tier of tiers) {
      const product = await stripe.products.create({
        name: tier.name,
        description: tier.description,
        metadata: { tier_name: tier.name, features: JSON.stringify(tier.features) }
      });

      console.log(`Created product: ${product.name} (${product.id})`);

      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.monthlyPrice,
        currency: 'gbp',
        recurring: { interval: 'month' },
        metadata: { tier_name: tier.name, billing_type: 'monthly' }
      });

      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.annualPrice,
        currency: 'gbp',
        recurring: { interval: 'year' },
        metadata: { tier_name: tier.name, billing_type: 'annual' }
      });

      products.push({
        tier: tier.name,
        product_id: product.id,
        monthly_price_id: monthlyPrice.id,
        annual_price_id: annualPrice.id,
        monthly_amount_gbp: tier.monthlyPrice / 100,
        annual_amount_gbp: tier.annualPrice / 100
      });
    }

    return Response.json({ success: true, message: 'Stripe products initialized', products });
  } catch (error) {
    console.error('Stripe initialization error:', error);
    return Response.json({ error: error.message, details: error.toString() }, { status: 500 });
  }
});