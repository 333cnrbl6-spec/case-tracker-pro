import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firm_name, trial_days = 14 } = await req.json();

    // Send personalized welcome email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Welcome to CaseNarrative! 🚀 Your ${trial_days}-day trial starts now`,
      body: `Hi ${user.full_name},

Welcome to CaseNarrative! You're now set up with a ${trial_days}-day free trial.

Here's what you can do right now:

1. **Generate Settlement Predictions** — Upload a case and get a valuation in seconds (85% accuracy)
2. **Create AI Legal Briefs** — Turn evidence into court-ready narratives in minutes
3. **Monitor RICS Compliance** — See breach probability across your cases
4. **Invite Witnesses** — Coordinate securely without creating external accounts
5. **Try All Premium Features** — Full access during your trial

Getting Started:
→ Visit your dashboard: https://app.casenarra.co.uk/dashboard
→ Create your first case or pick a template
→ Upload evidence and watch the magic happen

Next Steps:
- Browse our Getting Started guide: https://casenarra.co.uk/getting-started
- Watch a 3-min demo: https://casenarra.co.uk/demo
- Schedule a walkthrough: https://calendly.com/casenarra/demo

Questions? Reply to this email or chat with us at support@casenarra.co.uk.

Excited to help ${firm_name} work smarter!

Best,
The CaseNarrative Team

P.S. Your trial expires on ${new Date(Date.now() + trial_days * 24 * 60 * 60 * 1000).toLocaleDateString()}. No credit card needed—and no auto-charge when it ends.`
    });

    console.log(`Onboarding email sent to ${user.email}`);

    // Track conversion event
    await base44.analytics.track({
      eventName: 'conversion_trial_signup',
      properties: {
        user_email: user.email,
        firm_name: firm_name,
        trial_days: trial_days
      }
    });

    return Response.json({ success: true, message: 'Welcome email sent' });
  } catch (error) {
    console.error('Onboarding welcome error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});