import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the migration function with Bradley v. Belcher case details
    const migrationResult = await base44.asServiceRole.functions.invoke('migrateDataToNewCase', {
      caseName: 'Bradley v. Belcher - Professional Negligence',
      clientName: 'Bradley',
      clientEmail: 'client@bradley-case.com',
      opponentName: 'Malcolm Belcher'
    });

    if (!migrationResult.data.success) {
      throw new Error('Migration failed');
    }

    const caseData = migrationResult.data.case;

    // Create initial compliance alert for limitation date tracking
    const incidentDate = new Date();
    const limitationDate = new Date(incidentDate.getTime() + (6 * 365 * 24 * 60 * 60 * 1000)); // 6 years

    await base44.asServiceRole.entities.LegalCase.update(caseData.id, {
      limitation_date: limitationDate.toISOString().split('T')[0],
      client_care_letter_date: new Date().toISOString().split('T')[0]
    });

    // Create a system notification
    await base44.asServiceRole.entities.SystemAlert.create({
      alert_type: 'rule_pattern',
      severity: 'warning',
      title: 'Bradley v. Belcher Case Created',
      description: `Case ${caseData.case_ref} has been fully populated with ${migrationResult.data.summary.incidents_migrated} incidents, ${migrationResult.data.summary.evidence_migrated} evidence items, and risk score of ${migrationResult.data.summary.risk_score}/100.`,
      detection_date: new Date().toISOString().split('T')[0],
      status: 'active',
      recommended_action: 'Review case in Case Manager. Limitation date set for 6 years from incident date.'
    });

    return Response.json({
      success: true,
      message: 'Bradley v. Belcher case created and fully populated',
      case: caseData,
      summary: migrationResult.data.summary,
      limitationDate: limitationDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Bradley v. Belcher case creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});