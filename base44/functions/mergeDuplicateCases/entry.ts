import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { keep_case_id, delete_case_id } = await req.json();
    if (!keep_case_id || !delete_case_id) {
      return Response.json({ error: 'Both case IDs required' }, { status: 400 });
    }

    // Fetch all cases
    const allCases = await base44.entities.LegalCase.list();
    const keepCase = allCases.find(c => c.id === keep_case_id);
    const deleteCase = allCases.find(c => c.id === delete_case_id);

    if (!keepCase || !deleteCase) {
      return Response.json({ error: 'One or both cases not found' }, { status: 404 });
    }

    // Fetch related data for both cases
    const [incidents, communications, evidence] = await Promise.all([
      base44.entities.Incident.list(),
      base44.entities.Communication.list(),
      base44.entities.Evidence.list()
    ]);

    // Find all related records
    const deleteIncidents = incidents.filter(i => i.case_id === delete_case_id);
    const deleteCommunications = communications.filter(c => c.case_id === delete_case_id);
    const deleteEvidence = evidence.filter(e => e.case_id === delete_case_id);

    const migratedCount = {
      incidents: deleteIncidents.length,
      communications: deleteCommunications.length,
      evidence: deleteEvidence.length
    };

    // Migrate related records to keep case
    const updatePromises = [];

    deleteIncidents.forEach(i => {
      updatePromises.push(base44.entities.Incident.update(i.id, { case_id: keep_case_id }));
    });

    deleteCommunications.forEach(c => {
      updatePromises.push(base44.entities.Communication.update(c.id, { case_id: keep_case_id }));
    });

    deleteEvidence.forEach(e => {
      updatePromises.push(base44.entities.Evidence.update(e.id, { case_id: keep_case_id }));
    });

    // Prefer AI narrative from the case that has one
    if (!keepCase.ai_narrative && deleteCase.ai_narrative) {
      updatePromises.push(base44.entities.LegalCase.update(keep_case_id, {
        ai_narrative: deleteCase.ai_narrative,
        narrative_generated_at: deleteCase.narrative_generated_at
      }));
    }

    await Promise.all(updatePromises);

    // Delete the duplicate case
    await base44.entities.LegalCase.delete(delete_case_id);

    return Response.json({
      success: true,
      keep_case: { id: keepCase.id, case_ref: keepCase.case_ref },
      deleted_case: { id: deleteCase.id, case_ref: deleteCase.case_ref },
      migrated: migratedCount
    });
  } catch (error) {
    console.error('mergeDuplicateCases error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});