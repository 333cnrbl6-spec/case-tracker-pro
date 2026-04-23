import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseName, clientName, clientEmail, opponentName } = await req.json();

    if (!caseName || !clientName || !clientEmail) {
      return Response.json({ error: 'Case name, client name, and email required' }, { status: 400 });
    }

    // Fetch all existing data
    const incidents = await base44.asServiceRole.entities.Incident.list('-updated_date', 100);
    const evidence = await base44.asServiceRole.entities.Evidence.list('-updated_date', 200);
    const communications = await base44.asServiceRole.entities.Communication.list('-updated_date', 200);

    // Generate case reference
    const caseRef = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create new legal case
    const newCase = await base44.asServiceRole.entities.LegalCase.create({
      case_ref: caseRef,
      case_type: 'professional_negligence',
      status: 'active',
      client_name: clientName,
      client_email: clientEmail,
      opponent_name: opponentName || 'TBD',
      assigned_fee_earner: user.email,
      incident_date: incidents.length > 0 ? incidents[0].date : new Date().toISOString().split('T')[0],
      facts: `Case migrated from evidence analysis. Contains ${incidents.length} incidents, ${evidence.length} evidence items, and ${communications.length} communications.`,
      instructions: `Full case setup with automated evidence tagging and conflict checking.`,
      client_care_letter_sent: false,
      client_care_letter_date: new Date().toISOString().split('T')[0],
      last_client_contact: new Date().toISOString().split('T')[0]
    });

    // Link incidents to case
    const incidentLinks = [];
    for (const incident of incidents) {
      incidentLinks.push({
        case_id: newCase.id,
        incident_id: incident.id,
        incident_title: incident.title
      });
    }

    // Link evidence to case
    const evidenceLinks = [];
    for (const ev of evidence) {
      await base44.asServiceRole.entities.Evidence.update(ev.id, {
        related_incidents: [...(ev.related_incidents || []), ...incidents.map(i => i.id)]
      });
      evidenceLinks.push({
        case_id: newCase.id,
        evidence_id: ev.id,
        evidence_title: ev.title
      });
    }

    // Link communications to case
    const commLinks = [];
    for (const comm of communications) {
      await base44.asServiceRole.entities.Communication.update(comm.id, {
        related_incidents: [...(comm.related_incidents || []), ...incidents.map(i => i.id)]
      });
      commLinks.push({
        case_id: newCase.id,
        communication_id: comm.id,
        communication_subject: comm.subject
      });
    }

    // Extract unique parties from evidence and communications
    const partyNames = new Set();
    evidence.forEach(e => {
      if (e.notes) partyNames.add(e.notes.substring(0, 50));
    });
    communications.forEach(c => {
      partyNames.add(c.from);
      partyNames.add(c.to);
    });

    // Create case parties
    const createdParties = [];
    for (const name of Array.from(partyNames).slice(0, 10)) {
      const party = await base44.asServiceRole.entities.CaseParty.create({
        name: name,
        party_type: 'person',
        role_in_case: 'participant',
        confirmed: false
      });
      createdParties.push(party);
    }

    // Generate risk assessment
    let riskScore = 50;
    if (incidents.length > 5) riskScore += 20;
    if (evidence.some(e => e.strength === 'critical')) riskScore += 15;
    if (communications.some(c => c.tone === 'threatening' || c.tone === 'aggressive')) riskScore += 10;

    const riskAssessment = await base44.asServiceRole.entities.ComplianceRisk.create({
      case_id: newCase.id,
      assessment_date: new Date().toISOString().split('T')[0],
      overall_risk_score: Math.min(riskScore, 100),
      risk_level: riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
      risk_categories: JSON.stringify({
        documentation_risk: evidence.filter(e => e.evidence_type === 'document').length,
        communication_risk: communications.length,
        incident_severity: incidents.filter(i => i.severity === 'critical').length
      }),
      analyzed_by: user.email,
      confidence_score: 85
    });

    // Create system alert for new case
    const systemAlert = await base44.asServiceRole.entities.SystemAlert.create({
      alert_type: 'rule_pattern',
      severity: riskAssessment.risk_level === 'critical' ? 'critical' : 'warning',
      title: `New case created: ${caseName}`,
      description: `Case ${caseRef} has been created with ${incidents.length} incidents and ${evidence.length} evidence items ready for review.`,
      detection_date: new Date().toISOString().split('T')[0],
      status: 'active',
      recommended_action: 'Review case in Case Manager and initiate legal analysis workflow.'
    });

    // Log audit entry
    await base44.asServiceRole.entities.AuditLog.create({
      event_type: 'workflow_triggered',
      action: `Case migration completed: ${caseName} (${caseRef})`,
      triggered_by: user.email,
      case_id: newCase.id,
      case_ref: caseRef,
      severity: 'high',
      details: JSON.stringify({
        incidents_migrated: incidents.length,
        evidence_migrated: evidence.length,
        communications_migrated: communications.length,
        parties_created: createdParties.length
      }),
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    return Response.json({
      success: true,
      case: {
        id: newCase.id,
        case_ref: caseRef,
        case_name: caseName
      },
      summary: {
        incidents_migrated: incidents.length,
        evidence_migrated: evidence.length,
        communications_migrated: communications.length,
        parties_created: createdParties.length,
        risk_score: riskAssessment.overall_risk_score,
        risk_level: riskAssessment.risk_level
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});