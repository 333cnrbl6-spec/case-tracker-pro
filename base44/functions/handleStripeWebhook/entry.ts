import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = (await import('npm:stripe@17.0.0')).default;
const stripeClient = stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    // Get raw body before parsing
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('[handleStripeWebhook] Missing signature or webhook secret');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature BEFORE auth
    let event;
    try {
      event = await stripeClient.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('[handleStripeWebhook] Signature verification failed:', err.message);
      return Response.json({ error: 'Signature verification failed' }, { status: 400 });
    }

    // NOW initialize Base44 client after signature validation
    const base44 = createClientFromRequest(req);

    console.log('[handleStripeWebhook] Event type:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_email, tier_name, billing_period } = session.metadata;

      // Get tier to fetch pricing
      const tiers = await base44.entities.SubscriptionTier.filter({
        tier_name: tier_name
      });
      const tier = tiers?.[0];

      // Update or create subscription meters
      let meters = await base44.asServiceRole.entities.SubscriptionMeters.filter({
        firm_email: user_email
      });

      const billingStart = new Date();
      const billingEnd = new Date();
      if (billing_period === 'annual') {
        billingEnd.setFullYear(billingEnd.getFullYear() + 1);
      } else {
        billingEnd.setMonth(billingEnd.getMonth() + 1);
      }

      const meterData = {
        subscription_tier: tier_name,
        subscription_active: true,
        stripe_subscription_id: session.subscription || session.id,
        billing_cycle_start: billingStart.toISOString().split('T')[0],
        billing_cycle_end: billingEnd.toISOString().split('T')[0],
        ai_generations_this_month: 0,
        document_exports_this_month: 0
      };

      if (meters && meters.length > 0) {
        await base44.asServiceRole.entities.SubscriptionMeters.update(meters[0].id, meterData);
      } else {
        await base44.asServiceRole.entities.SubscriptionMeters.create({
          firm_email: user_email,
          ...meterData
        });
      }

      console.log('[handleStripeWebhook] Subscription activated for:', user_email, tier_name);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('[handleStripeWebhook] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});