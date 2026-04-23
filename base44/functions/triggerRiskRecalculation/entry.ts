import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data } = await req.json();

    // This is called as an entity automation trigger
    // Triggered when evidence is created or updated
    if (event?.type === 'create' || event?.type === 'update') {
      if (event.entity_name === 'Evidence') {
        const evidence = data || await base44.entities.Evidence.read(event.entity_id);
        
        // Find related incidents to identify the case
        if (evidence.related_incidents && evidence.related_incidents.length > 0) {
          const incidentId = evidence.related_incidents[0];
          
          // Find case that includes this incident
          const cases = await base44.asServiceRole.entities.LegalCase.filter({
            case_ref: { $regex: incidentId }
          });

          if (cases.length > 0) {
            const caseId = cases[0].id;
            
            // Trigger risk recalculation for this case
            const result = await base44.asServiceRole.functions.invoke('calculateComplianceRiskScore', {
              case_id: caseId
            });

            console.log(`Risk recalculated for case ${caseId}:`, result);
            
            return Response.json({
              status: 'recalculated',
              case_id: caseId,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    return Response.json({ status: 'skipped', reason: 'No case found for recalculation' });

  } catch (error) {
    console.error('Risk recalculation trigger failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});