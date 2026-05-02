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

    const { tier_name, billing_period = 'monthly' } = await req.json();

    // Get Stripe prices for this tier
    const products = await stripeClient.products.list({
      expand: ['data.default_price'],
      limit: 100
    });

    const tierProduct = products.data.find(p => p.metadata?.tier_name === tier_name);
    if (!tierProduct) {
      return Response.json({ error: `Tier '${tier_name}' not found in Stripe` }, { status: 404 });
    }

    // Get the correct price (monthly or annual)
    const prices = await stripeClient.prices.list({
      product: tierProduct.id,
      limit: 10
    });

    const selectedPrice = prices.data.find(p => 
      p.metadata?.billing_type === billing_period
    );

    if (!selectedPrice) {
      return Response.json({ error: `${billing_period} pricing not found` }, { status: 404 });
    }

    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPrice.id,
          quantity: 1
        }
      ],
      mode: 'subscription',
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