import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({
        error: 'Only admins can invite team members'
      }, { status: 403 });
    }

    const { email, role } = await req.json();

    // Check current user count against tier limit
    const meters = await base44.entities.SubscriptionMeters.filter({
      firm_email: user.email
    });

    if (meters && meters.length > 0) {
      const meter = meters[0];
      const tier = await base44.entities.SubscriptionTier.filter({
        tier_name: meter.subscription_tier
      });

      if (tier && tier.length > 0 && meter.current_user_count >= tier[0].max_users) {
        return Response.json({
          error: `User limit reached for ${tier[0].tier_name} tier. Upgrade to add more team members.`
        }, { status: 402 });
      }
    }

    // Invite user (Base44 handles the actual invitation)
    await base44.users.inviteUser(email, role || 'user');

    // Log the invitation
    await base44.functions.invoke('logAuditEvent', {
      event_type: 'team_member_invited',
      action: `Invited ${email} as ${role || 'user'}`,
      severity: 'low',
      details: { email, role }
    });

    return Response.json({
      success: true,
      message: `Invitation sent to ${email}`
    });
  } catch (error) {
    console.error('[inviteFirmTeamMember]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});