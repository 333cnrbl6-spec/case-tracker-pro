import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role === 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { target_case_id } = body;

    if (!target_case_id) {
      return Response.json({ error: 'target_case_id required' }, { status: 400 });
    }

    // Fetch target case
    const targetCase = await base44.asServiceRole.entities.LegalCase.read(target_case_id);
    if (!targetCase) {
      return Response.json({ error: `Case ${target_case_id} not found` }, { status: 404 });
    }

    // Get all entities to clean
    const allIncidents = await base44.asServiceRole.entities.Incident.list();
    const allComms = await base44.asServiceRole.entities.Communication.list();
    const allEvidence = await base44.asServiceRole.entities.Evidence.list();
    const allTasks = await base44.asServiceRole.entities.IncidentTask.list();
    const allAnnotations = await base44.asServiceRole.entities.Annotation.list();
    const allCaseParties = await base44.asServiceRole.entities.CaseParty.list();

    // Identify build/test data (anything not linked to target case)
    const targetCaseIncidents = allIncidents.filter(i => 
      i.id && targetCase.id && i.related_incidents?.includes(targetCase.id)
    );

    const buildIncidents = allIncidents.filter(i => 
      !targetCaseIncidents.includes(i)
    );

    const buildComms = allComms.filter(c => 
      !c.related_incidents?.some(id => targetCaseIncidents.map(inc => inc.id).includes(id))
    );

    const buildEvidence = allEvidence.filter(e => 
      !e.related_incidents?.some(id => targetCaseIncidents.map(inc => inc.id).includes(id))
    );

    const buildTasks = allTasks.filter(t => 
      !targetCaseIncidents.map(inc => inc.id).includes(t.incident_id)
    );

    const buildAnnotations = allAnnotations.filter(a => 
      !buildEvidence.map(e => e.id).includes(a.evidence_id)
    );

    // Delete build data
    const deletionStats = {
      incidents_deleted: 0,
      communications_deleted: 0,
      evidence_deleted: 0,
      tasks_deleted: 0,
      annotations_deleted: 0
    };

    // Delete in reverse order of dependencies
    for (const annotation of buildAnnotations) {
      await base44.asServiceRole.entities.Annotation.delete(annotation.id);
      deletionStats.annotations_deleted++;
    }

    for (const task of buildTasks) {
      await base44.asServiceRole.entities.IncidentTask.delete(task.id);
      deletionStats.tasks_deleted++;
    }

    for (const evidence of buildEvidence) {
      await base44.asServiceRole.entities.Evidence.delete(evidence.id);
      deletionStats.evidence_deleted++;
    }

    for (const comm of buildComms) {
      await base44.asServiceRole.entities.Communication.delete(comm.id);
      deletionStats.communications_deleted++;
    }

    for (const incident of buildIncidents) {
      await base44.asServiceRole.entities.Incident.delete(incident.id);
      deletionStats.incidents_deleted++;
    }

    // Now run verifications on target case evidence
    const targetCaseEvidence = await base44.asServiceRole.entities.Evidence.list();
    const targetEvidenceFiltered = targetCaseEvidence.filter(e => 
      e.related_incidents?.some(id => targetCaseIncidents.map(inc => inc.id).includes(id))
    );

    // Run sender/recipient verification
    const senderVerification = await base44.asServiceRole.functions.invoke('verifySenderRecipientAccuracy', {
      case_id: target_case_id,
      check_all: false
    });

    // Run party verification on evidence
    const partyVerification = await base44.asServiceRole.functions.invoke('verifyEvidenceParties', {
      case_id: target_case_id,
      evidence_ids: targetEvidenceFiltered.map(e => e.id)
    });

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      event_type: 'workflow_triggered',
      action: `Build data cleanup and migration to ${target_case_id} completed. Verifications run on ${targetEvidenceFiltered.length} evidence items.`,
      triggered_by: user.email,
      case_id: target_case_id,
      severity: 'high',
      status: 'success',
      details: JSON.stringify({
        deletion_stats: deletionStats,
        target_case_id,
        verification_results: {
          sender_recipient_issues: senderVerification.issues_found,
          party_verification_issues: partyVerification.issues_found
        }
      }),
      timestamp: new Date().toISOString()
    });

    return Response.json({
      status: 'success',
      target_case_id,
      deletion_summary: deletionStats,
      remaining_evidence: targetEvidenceFiltered.length,
      verification_results: {
        sender_recipient: {
          total_checked: senderVerification.total_communications_checked,
          issues_found: senderVerification.issues_found
        },
        party_verification: {
          total_checked: partyVerification.total_evidence_reviewed,
          issues_found: partyVerification.issues_found
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cleanup and migration failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});