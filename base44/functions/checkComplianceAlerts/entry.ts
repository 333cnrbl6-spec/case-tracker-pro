import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const cases = await base44.entities.LegalCase.list();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newAlerts = [];

    for (const c of cases) {
      if (c.status === 'closed' || c.status === 'settled') continue;

      // Limitation date alerts
      if (c.limitation_date) {
        const limDate = new Date(c.limitation_date);
        const daysUntil = Math.ceil((limDate - today) / (1000 * 60 * 60 * 24));
        let severity = null;
        if (daysUntil <= 1) severity = 'critical';
        else if (daysUntil <= 7) severity = 'urgent';
        else if (daysUntil <= 30) severity = 'warning';

        if (severity) {
          newAlerts.push({
            case_id: c.id,
            case_ref: c.case_ref,
            client_name: c.client_name,
            alert_type: 'limitation_date',
            severity,
            days_until: daysUntil,
            deadline_date: c.limitation_date,
            message: daysUntil <= 0
              ? `⚠️ OVERDUE: Limitation date passed ${Math.abs(daysUntil)} days ago for ${c.case_ref} (${c.client_name})`
              : `⚠️ Limitation date for ${c.case_ref} (${c.client_name}) is in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — ${c.limitation_date}`,
            status: 'active'
          });
        }
      }

      // Client care letter not sent within 14 days
      if (!c.client_care_letter_sent && c.incident_date) {
        const incDate = new Date(c.incident_date);
        const daysSinceInc = Math.ceil((today - incDate) / (1000 * 60 * 60 * 24));
        if (daysSinceInc > 14) {
          newAlerts.push({
            case_id: c.id,
            case_ref: c.case_ref,
            client_name: c.client_name,
            alert_type: 'client_care_letter',
            severity: 'warning',
            days_until: -daysSinceInc,
            deadline_date: c.incident_date,
            message: `Client care letter not sent for ${c.case_ref} (${c.client_name}) — ${daysSinceInc} days since instruction`,
            status: 'active'
          });
        }
      }

      // No client contact in 30 days
      if (c.last_client_contact) {
        const lastContact = new Date(c.last_client_contact);
        const daysSince = Math.ceil((today - lastContact) / (1000 * 60 * 60 * 24));
        if (daysSince > 30) {
          newAlerts.push({
            case_id: c.id,
            case_ref: c.case_ref,
            client_name: c.client_name,
            alert_type: 'no_client_contact',
            severity: 'warning',
            days_until: -daysSince,
            deadline_date: c.last_client_contact,
            message: `No client contact for ${c.case_ref} (${c.client_name}) in ${daysSince} days`,
            status: 'active'
          });
        }
      }

      // Court deadline approaching
      if (c.court_deadline) {
        const courtDate = new Date(c.court_deadline);
        const daysUntil = Math.ceil((courtDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= 14) {
          newAlerts.push({
            case_id: c.id,
            case_ref: c.case_ref,
            client_name: c.client_name,
            alert_type: 'court_deadline',
            severity: daysUntil <= 3 ? 'critical' : 'urgent',
            days_until: daysUntil,
            deadline_date: c.court_deadline,
            message: `Court deadline in ${daysUntil} day${daysUntil === 1 ? '' : 's'} for ${c.case_ref} (${c.client_name})`,
            status: 'active'
          });
        }
      }

      // Settlement authority not obtained but case in litigation
      if (c.status === 'litigation' && !c.settlement_authority_obtained) {
        newAlerts.push({
          case_id: c.id,
          case_ref: c.case_ref,
          client_name: c.client_name,
          alert_type: 'settlement_authority',
          severity: 'warning',
          days_until: 0,
          deadline_date: null,
          message: `Settlement authority not obtained for ${c.case_ref} (${c.client_name}) — case in litigation`,
          status: 'active'
        });
      }
    }

    // Clear old active alerts and create fresh ones
    const existingActive = await base44.asServiceRole.entities.ComplianceAlert.filter({ status: 'active' });
    for (const a of existingActive) {
      await base44.asServiceRole.entities.ComplianceAlert.delete(a.id);
    }

    const created = [];
    for (const alert of newAlerts) {
      const created_alert = await base44.asServiceRole.entities.ComplianceAlert.create(alert);
      created.push(created_alert);
    }

    return Response.json({ success: true, alerts_created: created.length, alerts: newAlerts });
  } catch (error) {
    console.error('checkComplianceAlerts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});