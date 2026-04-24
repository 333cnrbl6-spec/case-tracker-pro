import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { case_id } = await req.json();
    if (!case_id) {
      return Response.json({ error: 'case_id required' }, { status: 400 });
    }

    // Fetch case and related data
    const legalCase = await base44.asServiceRole.entities.LegalCase.list().then(cases =>
      cases.find(c => c.id === case_id)
    );

    if (!legalCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Skip closed/settled cases
    if (legalCase.status === 'closed' || legalCase.status === 'settled') {
      return Response.json({
        case_id,
        case_ref: legalCase.case_ref,
        risk_score: 0,
        risk_level: 'low',
        reason: 'Case closed or settled'
      });
    }

    const tasks = await base44.asServiceRole.entities.IncidentTask.list();
    const incidents = await base44.asServiceRole.entities.Incident.list();
    const evidence = await base44.asServiceRole.entities.Evidence.list();
    const communications = await base44.asServiceRole.entities.Communication.list();

    let riskScore = 20; // Base score
    const riskFactors = [];

    // 1. Client contact frequency (0-25 points)
    const contactDaysAgo = legalCase.last_client_contact 
      ? Math.floor((Date.now() - new Date(legalCase.last_client_contact).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (contactDaysAgo > 60) {
      riskScore += 25;
      riskFactors.push(`No client contact for ${contactDaysAgo} days`);
    } else if (contactDaysAgo > 30) {
      riskScore += 15;
      riskFactors.push(`Last contact ${contactDaysAgo} days ago`);
    } else if (contactDaysAgo > 14) {
      riskScore += 8;
      riskFactors.push(`Last contact ${contactDaysAgo} days ago`);
    }

    // 2. Limitation date proximity (0-30 points)
    if (legalCase.limitation_date) {
      const limitationDaysLeft = Math.floor((new Date(legalCase.limitation_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (limitationDaysLeft < 0) {
        riskScore += 30;
        riskFactors.push('⚠️ LIMITATION DATE PASSED');
      } else if (limitationDaysLeft < 7) {
        riskScore += 30;
        riskFactors.push(`Only ${limitationDaysLeft} days until limitation date`);
      } else if (limitationDaysLeft < 30) {
        riskScore += 20;
        riskFactors.push(`${limitationDaysLeft} days until limitation date`);
      } else if (limitationDaysLeft < 90) {
        riskScore += 10;
        riskFactors.push(`${limitationDaysLeft} days until limitation date`);
      }
    }

    // 3. Overdue tasks (0-20 points)
    const caseTasks = tasks.filter(t => {
      const isRelated = t.incident_id && incidents.find(inc => inc.id === t.incident_id);
      return isRelated;
    });

    const overdueTasks = caseTasks.filter(t => {
      if (!t.deadline || t.status === 'completed') return false;
      const daysOverdue = Math.floor((Date.now() - new Date(t.deadline).getTime()) / (1000 * 60 * 60 * 24));
      return daysOverdue > 0;
    });

    if (overdueTasks.length > 0) {
      riskScore += Math.min(20, overdueTasks.length * 5);
      riskFactors.push(`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`);
    }

    // 4. Missing client care letter (0-15 points)
    if (!legalCase.client_care_letter_sent) {
      riskScore += 15;
      riskFactors.push('Client care letter not sent');
    } else if (legalCase.client_care_letter_date) {
      const letterDaysAgo = Math.floor((Date.now() - new Date(legalCase.client_care_letter_date).getTime()) / (1000 * 60 * 60 * 24));
      if (letterDaysAgo > 365) {
        riskScore += 8;
        riskFactors.push(`Client care letter from ${letterDaysAgo} days ago (renewal needed)`);
      }
    }

    // 5. Missing settlement authority (0-10 points)
    if (!legalCase.settlement_authority_obtained && legalCase.status === 'under_review') {
      riskScore += 10;
      riskFactors.push('Settlement authority not obtained');
    }

    // 6. Evidence quality (0-10 points)
    if (evidence.length === 0) {
      riskScore += 10;
      riskFactors.push('No evidence collected yet');
    } else {
      const weakEvidence = evidence.filter(e => e.strength === 'weak').length;
      if (weakEvidence / evidence.length > 0.5) {
        riskScore += 8;
        riskFactors.push(`${weakEvidence} of ${evidence.length} evidence items are weak`);
      }
    }

    // 7. Communication frequency (0-5 bonus for good communication)
    const recentComms = communications.filter(c => {
      const daysAgo = Math.floor((Date.now() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo < 14;
    }).length;

    if (recentComms > 3) {
      riskScore = Math.max(0, riskScore - 5);
    }

    // Cap score
    riskScore = Math.min(100, Math.max(0, riskScore));

    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= 75) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';

    // Generate AI summary if high risk
    let aiSummary = '';
    if (riskScore >= 60) {
      try {
        const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a legal case risk analyst. Provide a 1-2 sentence professional assessment of this case's risk status for a law firm manager.

Case: ${legalCase.case_ref} (${legalCase.client_name})
Risk Score: ${riskScore}/100
Risk Factors: ${riskFactors.join(', ')}
Limitation Date: ${legalCase.limitation_date ? new Date(legalCase.limitation_date).toLocaleDateString('en-GB') : 'Not set'}
Status: ${legalCase.status}

Focus on: urgency, required actions, and business impact.`,
          model: 'gemini_3_flash'
        });
        aiSummary = response;
      } catch (e) {
        // Fallback if AI call fails
        aiSummary = `High-risk case requiring immediate attention. ${riskFactors[0] || 'Multiple risk factors identified.'}`;
      }
    }

    return Response.json({
      case_id,
      case_ref: legalCase.case_ref,
      client_name: legalCase.client_name,
      risk_score: riskScore,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      ai_summary: aiSummary,
      metrics: {
        days_since_contact: contactDaysAgo,
        days_to_limitation: legalCase.limitation_date 
          ? Math.floor((new Date(legalCase.limitation_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        overdue_tasks: overdueTasks.length,
        total_tasks: caseTasks.length,
        evidence_count: evidence.length,
        recent_communications: recentComms
      }
    });
  } catch (error) {
    console.error('Risk calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});