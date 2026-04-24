import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { case_id_1, case_id_2 } = await req.json();
    if (!case_id_1 || !case_id_2) {
      return Response.json({ error: 'Both case IDs required' }, { status: 400 });
    }

    // Fetch both cases
    const [cases1, cases2] = await Promise.all([
      base44.entities.LegalCase.filter({ id: case_id_1 }),
      base44.entities.LegalCase.filter({ id: case_id_2 })
    ]);

    const case1 = cases1[0];
    const case2 = cases2[0];

    if (!case1 || !case2) {
      return Response.json({ error: 'One or both cases not found' }, { status: 404 });
    }

    // Compare key fields
    const comparison = {
      identical: true,
      case1: { id: case1.id, case_ref: case1.case_ref, ai_narrative: !!case1.ai_narrative },
      case2: { id: case2.id, case_ref: case2.case_ref, ai_narrative: !!case2.ai_narrative },
      differences: []
    };

    const keysToCompare = [
      'case_ref', 'case_type', 'status', 'client_name', 'client_email',
      'opponent_name', 'assigned_fee_earner', 'incident_date', 'limitation_date',
      'estimated_value', 'facts', 'instructions', 'court_deadline'
    ];

    keysToCompare.forEach(key => {
      const v1 = case1[key];
      const v2 = case2[key];
      if (v1 !== v2) {
        comparison.identical = false;
        comparison.differences.push({
          field: key,
          case1_value: v1,
          case2_value: v2
        });
      }
    });

    // Check which has more data (AI narrative, etc.)
    comparison.case1_has_narrative = !!case1.ai_narrative;
    comparison.case2_has_narrative = !!case2.ai_narrative;
    comparison.recommendation = comparison.identical 
      ? `Cases are identical. Safe to delete ${case2.case_ref} and keep ${case1.case_ref}`
      : `Cases have differences. Review before merging.`;

    return Response.json(comparison);
  } catch (error) {
    console.error('compareDuplicateCases error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});