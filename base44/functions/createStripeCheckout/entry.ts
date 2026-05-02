import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = (await import('npm:stripe@17.0.0')).default;
const stripeClient = stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier_name, billing_period } = await req.json();

    // Get tier pricing
    const tiers = await base44.entities.SubscriptionTier.filter({
      tier_name: tier_name
    });

    if (!tiers || tiers.length === 0) {
      return Response.json({ error: 'Tier not found' }, { status: 404 });
    }

    const tier = tiers[0];
    const amount = billing_period === 'annual' ? tier.annual_price : tier.monthly_price;
    const currency = 'gbp';

    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `${tier_name} Tier - ${billing_period === 'annual' ? 'Annual' : 'Monthly'}`,
              description: tier.features?.join(', ') || 'Legal case management'
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${Deno.env.get('APP_URL')}/pricing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${Deno.env.get('APP_URL')}/pricing?cancelled=true`,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        tier_name: tier_name,
        user_email: user.email,
        billing_period: billing_period
      }
    });

    console.log('[createStripeCheckout] Session created:', session.id);

    return Response.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id
    });
  } catch (error) {
    console.error('[createStripeCheckout]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});