import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active cases with limitation dates
    const cases = await base44.asServiceRole.entities.LegalCase.list();
    const activeCases = cases.filter(c => 
      c.status === 'active' && c.limitation_date
    );

    const alertThresholds = [90, 60, 30]; // Days before expiration
    const sentAlerts = [];
    const failedAlerts = [];

    for (const legalCase of activeCases) {
      const daysUntilExpiry = Math.floor(
        (new Date(legalCase.limitation_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      for (const threshold of alertThresholds) {
        // Check if alert should be triggered
        if (daysUntilExpiry === threshold || (daysUntilExpiry < threshold && daysUntilExpiry >= threshold - 1)) {
          
          // Check if alert already exists for this case and threshold
          const existingAlerts = await base44.asServiceRole.entities.ComplianceAlert.filter({
            case_id: legalCase.id,
            alert_type: 'limitation_date',
            days_until: threshold
          });

          if (existingAlerts.length === 0) {
            try {
              // Create compliance alert record
              const alertRecord = await base44.asServiceRole.entities.ComplianceAlert.create({
                case_id: legalCase.id,
                case_ref: legalCase.case_ref,
                client_name: legalCase.client_name,
                alert_type: 'limitation_date',
                severity: threshold <= 30 ? 'critical' : threshold <= 60 ? 'urgent' : 'warning',
                days_until: daysUntilExpiry,
                deadline_date: legalCase.limitation_date,
                message: `Limitation date expires in ${daysUntilExpiry} days for ${legalCase.case_ref} (${legalCase.client_name})`,
                status: 'active'
              });

              // Get fee earner email (from case or practice profile)
              let feeEarnerEmail = legalCase.assigned_fee_earner;
              let feeEarnerName = 'Fee Earner';

              if (feeEarnerEmail && !feeEarnerEmail.includes('@')) {
                // If it's a name, try to find the user
                const users = await base44.asServiceRole.entities.User.list();
                const feeEarner = users.find(u => u.full_name === feeEarnerEmail);
                if (feeEarner) {
                  feeEarnerEmail = feeEarner.email;
                  feeEarnerName = feeEarner.full_name;
                }
              }

              // Send email alert
              if (feeEarnerEmail && feeEarnerEmail.includes('@')) {
                const severityText = threshold <= 30 ? 'CRITICAL' : threshold <= 60 ? 'URGENT' : 'WARNING';
                const emailBody = `
Case: ${legalCase.case_ref}
Client: ${legalCase.client_name}
Limitation Date: ${new Date(legalCase.limitation_date).toLocaleDateString('en-GB')}
Days Remaining: ${daysUntilExpiry}

This is a ${severityText} reminder that the limitation date for this case is approaching. 
Please ensure all necessary actions (filing, settlement negotiations, etc.) are completed before the deadline.

This case requires immediate attention to avoid losing the right to pursue the claim.

---
Automated Limitation Date Alert System
`;

                await base44.asServiceRole.integrations.Core.SendEmail({
                  to: feeEarnerEmail,
                  subject: `[${severityText}] Limitation Date Alert: ${legalCase.case_ref} — ${daysUntilExpiry} days remaining`,
                  body: emailBody,
                  from_name: 'Case Management System'
                });

                sentAlerts.push({
                  case_ref: legalCase.case_ref,
                  fee_earner: feeEarnerEmail,
                  days_until: daysUntilExpiry,
                  threshold: threshold,
                  alert_id: alertRecord.id
                });
              }
            } catch (alertErr) {
              console.error(`Failed to create/send alert for ${legalCase.case_ref}:`, alertErr);
              failedAlerts.push({
                case_ref: legalCase.case_ref,
                error: alertErr.message
              });
            }
          }
        }
      }
    }

    // Log audit trail
    if (sentAlerts.length > 0) {
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          event_type: 'reminder_sent',
          action: `Limitation date alerts sent to ${sentAlerts.length} fee earner(s)`,
          triggered_by: 'system',
          severity: 'info',
          status: 'success',
          details: JSON.stringify({
            alerts_sent: sentAlerts.length,
            cases_alerted: sentAlerts.map(a => a.case_ref),
            timestamp: new Date().toISOString()
          }),
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.error('Audit log error:', e);
      }
    }

    return Response.json({
      success: true,
      cases_scanned: activeCases.length,
      alerts_sent: sentAlerts.length,
      alerts_failed: failedAlerts.length,
      sent_details: sentAlerts,
      failed_details: failedAlerts
    });
  } catch (error) {
    console.error('Limitation date alert check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});