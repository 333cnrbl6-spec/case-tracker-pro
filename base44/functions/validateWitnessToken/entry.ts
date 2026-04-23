import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Find invitation by token
    const invitations = await fetch(
      'https://api.base44.io/entities/WitnessInvitation/filter?query=' + 
      encodeURIComponent(JSON.stringify({ secure_token: token })),
      {
        headers: { 'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_TOKEN')}` }
      }
    ).then(r => r.json());

    if (!invitations || invitations.length === 0) {
      return Response.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    const invitation = invitations[0];

    // Get incident details
    const incident = await fetch(
      `https://api.base44.io/entities/Incident/${invitation.incident_id}`,
      {
        headers: { 'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_TOKEN')}` }
      }
    ).then(r => r.json());

    return Response.json({
      valid: true,
      invitationId: invitation.id,
      incidentId: invitation.incident_id,
      incidentTitle: incident.title,
      witnessEmail: invitation.witness_email,
      witnessName: invitation.witness_name,
      status: invitation.status,
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});