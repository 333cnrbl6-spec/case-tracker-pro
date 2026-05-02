import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_type, entity_id, operation } = await req.json();

    // Fetch the entity
    let entity;
    try {
      if (entity_type === 'LegalCase') {
        entity = await base44.entities.LegalCase.filter({ id: entity_id });
      } else if (entity_type === 'Incident') {
        entity = await base44.entities.Incident.filter({ id: entity_id });
      } else if (entity_type === 'Evidence') {
        entity = await base44.entities.Evidence.filter({ id: entity_id });
      }
    } catch (e) {
      return Response.json({ error: 'Entity not found' }, { status: 404 });
    }

    if (!entity || entity.length === 0) {
      return Response.json({ error: 'Entity not found' }, { status: 404 });
    }

    const record = entity[0];

    // Check if user created this record (created_by field) or is admin
    const isOwner = record.created_by === user.email;
    const isAdmin = user.role === 'admin';

    // For read/list: users can see all records created by their firm (share firm email domain)
    // For write/delete: only owner or admin can modify
    const canAccess = isOwner || isAdmin;

    if ((operation === 'delete' || operation === 'update') && !canAccess) {
      return Response.json({
        allowed: false,
        reason: 'You do not have permission to modify this record'
      }, { status: 403 });
    }

    return Response.json({
      allowed: true,
      is_owner: isOwner,
      is_admin: isAdmin,
      created_by: record.created_by
    });
  } catch (error) {
    console.error('[enforceMultiTenancy]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});