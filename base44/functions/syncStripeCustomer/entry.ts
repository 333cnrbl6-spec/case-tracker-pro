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

    // Find or create Stripe customer
    const customers = await stripeClient.customers.list({
      email: user.email,
      limit: 1
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripeClient.customers.create({
        email: user.email,
        metadata: {
          base44_user_email: user.email,
          base44_app_id: Deno.env.get('BASE44_APP_ID')
        }
      });
      customerId = customer.id;
    }

    // Fetch their subscriptions
    const subscriptions = await stripeClient.subscriptions.list({
      customer: customerId,
      status: 'active'
    });

    return Response.json({
      customer_id: customerId,
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        items: sub.items.data.map(item => ({
          price_id: item.price.id,
          product_name: item.price.product
        }))
      }))
    });
  } catch (error) {
    console.error('[syncStripeCustomer]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});