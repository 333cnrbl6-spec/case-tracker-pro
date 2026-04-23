import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incidentId, witnessEmail, witnessName } = await req.json();

    // Verify incident exists and user has access
    const incident = await base44.asServiceRole.entities.Incident.get(incidentId);
    if (!incident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Generate secure token (random 32-char string)
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create witness invitation
    const invitation = await base44.asServiceRole.entities.WitnessInvitation.create({
      incident_id: incidentId,
      secure_token: token,
      witness_email: witnessEmail,
      witness_name: witnessName || '',
      status: 'pending',
      invited_by: user.email,
      invited_at: new Date().toISOString(),
    });

    // Build the public witness portal URL
    const appUrl = Deno.env.get('APP_URL') || 'https://app.base44.io';
    const witnessLink = `${appUrl}/witness/${token}`;

    return Response.json({
      success: true,
      invitationId: invitation.id,
      token,
      witnessLink,
      witnessEmail,
      message: `Share this link with the witness: ${witnessLink}`,
    });
  } catch (error) {
    console.error('Error generating witness link:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});