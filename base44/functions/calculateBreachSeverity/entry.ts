import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incidents, evidence } = await req.json();

    if (!incidents || incidents.length === 0) {
      return Response.json({
        success: true,
        analytics: {
          firmBreachSeverityScore: 0,
          overallRiskLevel: 'low',
          incidentCount: 0,
          criticalIncidentCount: 0,
          estimatedFinancialDamage: 0,
          potentialLegalCosts: 0,
          risksByCategory: [],
          incidentTimeline: [],
          severityDistribution: [],
          ricsViolationFrequency: [],
          complianceGaps: [],
          topRisks: []
        }
      });
    }

    // Calculate breach severity score (0-100)
    const severityWeights = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3
    };

    let totalSeverityScore = 0;
    let criticalCount = 0;
    const severityDistribution = {};

    incidents.forEach(incident => {
      const severity = incident.severity || 'medium';
      severityDistribution[severity] = (severityDistribution[severity] || 0) + 1;
      totalSeverityScore += severityWeights[severity] || 0;
      if (severity === 'critical') criticalCount++;
    });

    const firmBreachSeverityScore = Math.min(100, totalSeverityScore);

    // Determine overall risk level
    let overallRiskLevel = 'low';
    if (firmBreachSeverityScore >= 75) overallRiskLevel = 'critical';
    else if (firmBreachSeverityScore >= 50) overallRiskLevel = 'high';
    else if (firmBreachSeverityScore >= 25) overallRiskLevel = 'medium';

    // Calculate financial damage estimates
    const damageEstimates = {
      critical: 50000,
      high: 25000,
      medium: 10000,
      low: 2000
    };

    let estimatedFinancialDamage = 0;
    incidents.forEach(incident => {
      const severity = incident.severity || 'medium';
      estimatedFinancialDamage += damageEstimates[severity] || 0;
    });

    // Legal costs estimation
    const potentialLegalCosts = estimatedFinancialDamage * 0.3; // 30% of damages for legal

    // Analyze RICS violations
    const violationFrequency = {};
    incidents.forEach(incident => {
      (incident.rics_violations || []).forEach(violation => {
        violationFrequency[violation] = (violationFrequency[violation] || 0) + 1;
      });
    });

    const ricsViolationFrequency = Object.entries(violationFrequency)
      .map(([violation, count]) => ({ violation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Calculate risk by incident type
    const risksByType = {};
    incidents.forEach(incident => {
      const type = incident.incident_type || 'other';
      if (!risksByType[type]) {
        risksByType[type] = { count: 0, severitySum: 0 };
      }
      risksByType[type].count++;
      risksByType[type].severitySum += severityWeights[incident.severity || 'medium'];
    });

    const risksByCategory = Object.entries(risksByType)
      .map(([category, data]) => ({
        category,
        riskScore: Math.min(100, data.severitySum)
      }))
      .sort((a, b) => b.riskScore - a.riskScore);

    // Create incident timeline
    const incidentDates = {};
    incidents.forEach(incident => {
      const date = incident.date || new Date().toISOString().split('T')[0];
      incidentDates[date] = (incidentDates[date] || 0) + 1;
    });

    const incidentTimeline = Object.entries(incidentDates)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({ date, count }));

    // Severity distribution for pie chart
    const severityDistributionData = Object.entries(severityDistribution)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

    // Identify top risks
    const topRisks = [];
    const ricsIssues = {};

    incidents.forEach(incident => {
      (incident.rics_violations || []).forEach(violation => {
        if (!ricsIssues[violation]) {
          ricsIssues[violation] = { count: 0, maxSeverity: 'low' };
        }
        ricsIssues[violation].count++;
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        if (severityOrder[incident.severity] > severityOrder[ricsIssues[violation].maxSeverity]) {
          ricsIssues[violation].maxSeverity = incident.severity;
        }
      });
    });

    Object.entries(ricsIssues)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .forEach(([issue, data]) => {
        topRisks.push({
          issue,
          description: `Appears in ${data.count} incident(s)`,
          severity: data.maxSeverity
        });
      });

    // Identify compliance gaps
    const complianceGaps = [];

    // Check for missing evidence
    const incidentsWithoutEvidence = incidents.filter(i => 
      !(i.evidence_notes && i.evidence_notes.length > 0)
    );
    if (incidentsWithoutEvidence.length > 0) {
      complianceGaps.push({
        gap: 'Missing Evidence Documentation',
        action: 'Document supporting evidence for all incidents',
        affectedIncidents: incidentsWithoutEvidence.length
      });
    }

    // Check for critical incidents without legal issues identified
    const criticalWithoutLegal = incidents.filter(i =>
      i.severity === 'critical' && (!i.legal_issues || i.legal_issues.length === 0)
    );
    if (criticalWithoutLegal.length > 0) {
      complianceGaps.push({
        gap: 'Legal Analysis Required',
        action: 'Conduct legal analysis for critical incidents',
        affectedIncidents: criticalWithoutLegal.length
      });
    }

    // Check for incidents without RICS assessment
    const withoutRicsAssessment = incidents.filter(i =>
      !i.rics_violations || i.rics_violations.length === 0
    );
    if (withoutRicsAssessment.length > 0) {
      complianceGaps.push({
        gap: 'RICS Rules Assessment Missing',
        action: 'Map incidents to specific RICS rule violations',
        affectedIncidents: withoutRicsAssessment.length
      });
    }

    return Response.json({
      success: true,
      data: {
        firmBreachSeverityScore,
        overallRiskLevel,
        incidentCount: incidents.length,
        criticalIncidentCount: criticalCount,
        estimatedFinancialDamage,
        potentialLegalCosts,
        risksByCategory,
        incidentTimeline: incidentTimeline.length > 0 ? incidentTimeline : [{ date: 'No data', count: 0 }],
        severityDistribution: severityDistributionData,
        ricsViolationFrequency,
        complianceGaps: complianceGaps.length > 0 ? complianceGaps : [
          { gap: 'Monitoring Complete', action: 'Continue regular audits', affectedIncidents: 0 }
        ],
        topRisks: topRisks.length > 0 ? topRisks : [
          { issue: 'No critical issues identified', description: 'Incidents are low risk', severity: 'low' }
        ]
      }
    });
  } catch (error) {
    console.error('Error calculating breach severity:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});