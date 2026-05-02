import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { case_id } = await req.json();

    // Fetch case and related evidence
    const legalCase = await base44.entities.LegalCase.get(case_id);
    const incidents = await base44.entities.Incident.filter({ related_cases: case_id });
    const communications = await base44.entities.Communication.filter({ related_incidents: incidents.map(i => i.id) });
    const evidence = await base44.entities.Evidence.filter({ related_incidents: incidents.map(i => i.id) });

    // Fetch RICS benchmarks
    const benchmarks = await base44.entities.RICSBenchmark.list();

    // Score each breach type based on evidence
    const breachScores = {};
    benchmarks.forEach(bench => {
      let score = 0;
      let factors = [];

      // Pattern matching against evidence
      incidents.forEach(inc => {
        if (inc.rics_violations && inc.rics_violations.includes(bench.breach_type)) {
          score += 25;
          factors.push(`Incident: ${inc.title}`);
        }
        if (inc.severity === 'critical') score += 15;
        if (inc.severity === 'high') score += 10;
      });

      // Communication tone analysis
      communications.forEach(comm => {
        if (comm.tone === 'threatening' || comm.tone === 'aggressive') score += 10;
        if (comm.concerning_elements && comm.concerning_elements.length > 0) score += 5;
      });

      // Evidence strength
      const strongEvidence = evidence.filter(e => e.strength === 'strong' || e.strength === 'critical').length;
      score += strongEvidence * 5;

      // Litigation risk multiplier
      if (legalCase.litigation_commenced) score += 20;
      if (legalCase.damages_claimed > 50000) score += 15;

      breachScores[bench.breach_type] = {
        probability: Math.min(score, 100),
        avg_settlement: bench.settlement_avg_gbp,
        settlement_range: [bench.settlement_range_low, bench.settlement_range_high],
        factors,
        mitigation_strategies: bench.mitigation_strategies || []
      };
    });

    // Calculate overall risk
    const overallRisk = Math.round(
      Object.values(breachScores).reduce((sum, b) => sum + b.probability, 0) / Object.keys(breachScores).length
    );

    return Response.json({
      case_id,
      overall_breach_probability: overallRisk,
      breach_scores: breachScores,
      highest_risk_breach: Object.entries(breachScores).sort((a, b) => b[1].probability - a[1].probability)[0],
      recommendation: overallRisk > 70 ? 'High risk - recommend immediate settlement discussion' : 'Monitor ongoing'
    });
  } catch (error) {
    console.error('Breach probability engine error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});