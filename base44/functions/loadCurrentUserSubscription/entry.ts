import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CRITICAL: Filter by current user's email only
    // Load their cases, incidents, evidence
    const [cases, incidents] = await Promise.all([
      base44.entities.LegalCase.filter({ created_by: user.email }, '-updated_date', 100).catch(() => []),
      base44.entities.Incident.filter({ created_by: user.email }, '-updated_date', 100).catch(() => []),
    ]);

    return Response.json({
      success: true,
      tier: user.subscription_tier || 'free',
      email: user.email,
      full_name: user.full_name,
      cases: cases.length,
      incidents: incidents.length,
      team_members: 1 // Would fetch from User team relationships if available
    });
  } catch (error) {
    console.error('Subscription load error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});