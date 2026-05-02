import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const { event_type, action, case_id, severity, details } = await req.json();

    const auditEntry = await base44.entities.AuditLog.create({
      event_type: event_type,
      action: action,
      triggered_by: user?.email || 'system',
      case_id: case_id || null,
      severity: severity || 'low',
      details: JSON.stringify(details || {}),
      status: 'success',
      timestamp: new Date().toISOString()
    });

    console.log(`[AuditLog] ${event_type} - ${action} by ${user?.email}`);

    return Response.json({ success: true, audit_id: auditEntry.id });
  } catch (error) {
    console.error('[logAuditEvent]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});