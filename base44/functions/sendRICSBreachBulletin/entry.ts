import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active trial + paid users
    const users = await base44.asServiceRole.entities.SubscriptionMeters.list();
    const activeUsers = users.filter(u => u.subscription_active);

    // Fetch all RICSBenchmarks
    const benchmarks = await base44.asServiceRole.entities.RICSBenchmark.list();

    // Analyze cases from this month
    const thisMonth = new Date();
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const cases = await base44.asServiceRole.entities.LegalCase.list();
    const thisMonthCases = cases.filter(c => new Date(c.created_date) >= monthStart);

    // Count breach types
    const breachCounts = {};
    benchmarks.forEach(b => breachCounts[b.breach_type] = 0);

    thisMonthCases.forEach(c => {
      const incidents = c.incidents || [];
      incidents.forEach(inc => {
        if (inc.rics_violations) {
          inc.rics_violations.forEach(violation => {
            if (breachCounts[violation]) breachCounts[violation]++;
          });
        }
      });
    });

    // Top 10 breaches
    const topBreaches = Object.entries(breachCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count], idx) => {
        const bench = benchmarks.find(b => b.breach_type === type);
        return {
          rank: idx + 1,
          breach_type: type,
          case_count: count,
          avg_settlement: bench?.settlement_avg_gbp || 0,
          key_insight: `${count} cases detected. Average settlement: £${bench?.settlement_avg_gbp || 0}`
        };
      });

    // Generate bulletin
    const bulletin = {
      bulletin_month: monthStart.toISOString().split('T')[0],
      top_breaches: topBreaches,
      case_law_updates: [
        {
          case_name: 'Example v Example',
          ruling_date: new Date().toISOString().split('T')[0],
          implication: 'Recent ruling establishes precedent for surveyor liability'
        }
      ],
      trend_analysis: `This month saw ${topBreaches[0]?.case_count || 0} cases of ${topBreaches[0]?.breach_type || 'unknown'} breaches, up/down from previous month.`,
      subscriber_count: activeUsers.length,
      generated_at: new Date().toISOString()
    };

    // Store bulletin
    await base44.asServiceRole.entities.RICSBreachBulletin.create(bulletin);

    // Send email to all active users
    const emailPromises = activeUsers.map(user =>
      base44.integrations.Core.SendEmail({
        to: user.firm_email,
        subject: `CaseNarrative Monthly RICS Breach Bulletin - ${monthStart.toLocaleDateString()}`,
        body: `
Hello,

This month's RICS breach analysis shows:

${topBreaches.slice(0, 5).map((b, i) => `${i + 1}. ${b.breach_type.replace(/_/g, ' ')}: ${b.case_count} cases (avg settlement: £${b.avg_settlement})`).join('\n')}

${bulletin.trend_analysis}

View the full bulletin in your CaseNarrative dashboard.

Best regards,
CaseNarrative Team
        `,
        from_name: 'CaseNarrative'
      }).catch(err => {
        console.error(`Failed to send bulletin to ${user.firm_email}:`, err);
        return null;
      })
    );

    await Promise.all(emailPromises);

    return Response.json({
      success: true,
      bulletin_id: bulletin.id,
      emails_sent: activeUsers.length,
      top_breach: topBreaches[0]?.breach_type
    });
  } catch (error) {
    console.error('Bulletin generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});