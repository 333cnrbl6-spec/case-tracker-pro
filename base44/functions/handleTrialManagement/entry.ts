import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, firm_email, trial_days = 14, converted_tier } = await req.json();

    if (action === 'create_trial') {
      // Create new trial
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + trial_days * 24 * 60 * 60 * 1000);

      const trial = await base44.entities.TrialPeriod.create({
        firm_email: firm_email || user.email,
        trial_start_date: startDate.toISOString().split('T')[0],
        trial_end_date: endDate.toISOString().split('T')[0],
        days_remaining: trial_days,
        status: 'active',
        features_allowed: [
          'Up to 3 legal cases',
          '2 team members',
          '5 AI narratives',
          'Basic compliance alerts'
        ]
      });

      // Send welcome email
      await base44.functions.invoke('sendCustomerEmail', {
        recipient_email: firm_email || user.email,
        email_type: 'onboarding_welcome',
        subject: 'Welcome to CaseNarrative - 14 Day Free Trial',
        body: `Welcome! Your 14-day free trial is active. You can create up to 3 cases, invite 2 team members, and generate 5 AI narratives during this period.\n\nTrial expires on ${endDate.toLocaleDateString()}.`
      });

      return Response.json({
        success: true,
        trial_id: trial.id,
        days_remaining: trial_days
      });

    } else if (action === 'convert_trial') {
      // Convert trial to paid subscription
      const { trial_id } = await req.json();

      const trial = await base44.entities.TrialPeriod.update(trial_id, {
        status: 'converted',
        converted_to_tier: converted_tier,
        conversion_date: new Date().toISOString()
      });

      // Update subscription meters
      await base44.entities.SubscriptionMeters.create({
        firm_email: firm_email || user.email,
        subscription_tier: converted_tier,
        subscription_active: true,
        billing_cycle_start: new Date().toISOString().split('T')[0]
      });

      return Response.json({
        success: true,
        trial_converted: true,
        tier: converted_tier
      });

    } else if (action === 'check_expiring') {
      // Check trials expiring within 3 days
      const allTrials = await base44.asServiceRole.entities.TrialPeriod.list();
      const today = new Date();

      const expiringTrials = allTrials.filter(t => {
        if (t.status !== 'active') return false;
        const expireDate = new Date(t.trial_end_date);
        const daysLeft = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && daysLeft <= 3 && !t.reminder_sent;
      });

      // Send reminders
      for (const trial of expiringTrials) {
        const daysLeft = Math.ceil((new Date(trial.trial_end_date) - today) / (1000 * 60 * 60 * 24));
        
        await base44.functions.invoke('sendCustomerEmail', {
          recipient_email: trial.firm_email,
          email_type: 'trial_expiring_soon',
          subject: `Your CaseNarrative trial expires in ${daysLeft} days`,
          body: `Your free trial expires on ${new Date(trial.trial_end_date).toLocaleDateString()}. Upgrade now to continue using CaseNarrative.`
        });

        // Mark reminder sent
        await base44.entities.TrialPeriod.update(trial.id, { reminder_sent: true });
      }

      return Response.json({
        success: true,
        reminders_sent: expiringTrials.length
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[handleTrialManagement]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});