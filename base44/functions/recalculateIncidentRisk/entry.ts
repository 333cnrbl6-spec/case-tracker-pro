import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { incidentId } = await req.json();

    const incident = await base44.asServiceRole.entities.Incident.get(incidentId);
    if (!incident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Fetch related evidence for context
    const allEvidence = await base44.asServiceRole.entities.Evidence.list();
    const related = allEvidence.filter(e => e.related_incidents?.includes(incidentId));

    // Re-scoring: severity + RICS violations + linked evidence strength
    let riskScore = 0;
    const severityScores = { low: 20, medium: 50, high: 75, critical: 95 };
    riskScore += severityScores[incident.severity] || 0;

    // Bonus for RICS violations
    if (incident.rics_violations?.length) {
      riskScore += Math.min(incident.rics_violations.length * 5, 25);
    }

    // Bonus for linked evidence strength
    const evidenceBonus = related.reduce((sum, e) => {
      const strengthMap = { weak: 5, moderate: 10, strong: 15, critical: 20 };
      return sum + (strengthMap[e.strength] || 0);
    }, 0);
    riskScore = Math.min(riskScore + evidenceBonus, 100);

    return Response.json({
      incidentId,
      riskScore: Math.round(riskScore),
      linkedEvidenceCount: related.length,
      rics_violations: incident.rics_violations?.length || 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});