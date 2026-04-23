import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { case_id, evidence_ids } = body;

    // Fetch case and related data
    const legalCase = case_id ? await base44.entities.LegalCase.read(case_id) : null;
    
    // Fetch all communications, evidence, case parties
    const allCommunications = await base44.entities.Communication.list();
    const allEvidence = evidence_ids 
      ? await Promise.all(evidence_ids.map(id => base44.entities.Evidence.read(id)))
      : [];
    const allCaseParties = case_id 
      ? await base44.entities.CaseParty.filter({ case_id })
      : [];

    // Build known parties map from communications and case parties
    const knownParties = new Map();
    
    allCommunications.forEach(comm => {
      if (comm.from) knownParties.set(comm.from.toLowerCase(), { name: comm.from, type: 'sender', sources: new Set([comm.id]) });
      if (comm.to) knownParties.set(comm.to.toLowerCase(), { name: comm.to, type: 'recipient', sources: new Set([comm.id]) });
    });

    allCaseParties.forEach(party => {
      const key = party.name.toLowerCase();
      if (knownParties.has(key)) {
        knownParties.get(key).confirmed = party.confirmed;
      } else {
        knownParties.set(key, { name: party.name, type: party.party_type, role: party.role_in_case, confirmed: party.confirmed });
      }
    });

    // Analyze each evidence for party verification
    const partyVerificationIssues = [];

    allEvidence.forEach(evidence => {
      const issue = {
        id: evidence.id,
        title: evidence.title,
        type: evidence.evidence_type,
        date_collected: evidence.date_collected,
        current_from: evidence.file_url ? 'From source metadata' : 'Unknown',
        current_to: 'Unknown',
        flags: [],
        suggestions: []
      };

      // Parse notes for party information
      const notes = evidence.notes || '';
      const descr = evidence.description || '';
      const fullText = `${evidence.title} ${descr} ${notes}`.toLowerCase();

      // Check for organization names that might be fronts or misattributions
      const orgPatterns = [
        { pattern: 'abc survey', suspected: 'Potentially Malcolm Belcher or associate company' },
        { pattern: 'powell', suspected: 'Could be Sean Powell or Powell & Co' },
        { pattern: 'bradley', suspected: 'Likely William Bradley (contractor)' },
        { pattern: 'belcher', suspected: 'Malcolm Belcher (defendant)' }
      ];

      orgPatterns.forEach(({ pattern, suspected }) => {
        if (fullText.includes(pattern)) {
          issue.flags.push({
            type: 'party_reference_found',
            pattern,
            suspected,
            confidence: 'requires_verification'
          });
        }
      });

      // Check for invoice/financial evidence that might indicate fee-shifting schemes
      if (evidence.evidence_type === 'document' && fullText.includes('invoice')) {
        issue.flags.push({
          type: 'financial_evidence',
          message: 'Financial/invoice evidence detected',
          suggestion: 'Verify actual parties - check if this represents fee-shifting or deduction scheme'
        });

        if (fullText.includes('payment') || fullText.includes('deduct') || fullText.includes('reduction')) {
          issue.flags.push({
            type: 'potential_fee_shift',
            message: 'Payment/deduction language detected',
            suggestion: 'HIGH PRIORITY: Verify if this shows attempt to reduce payment to one party via forced payment to another'
          });
        }
      }

      // Check for suspicious communication patterns in notes
      if (fullText.includes('reduce') || fullText.includes('deduct') || fullText.includes('force')) {
        issue.flags.push({
          type: 'coercive_language',
          message: 'Coercive or payment-reduction language detected',
          suggestion: 'Analyze for evidence of improper payment withholding schemes'
        });
      }

      if (issue.flags.length > 0) {
        partyVerificationIssues.push(issue);
      }
    });

    // Use AI to analyze suspicious patterns
    const suspiciousEvidenceTexts = partyVerificationIssues
      .filter(i => i.flags.some(f => f.type === 'potential_fee_shift'))
      .map(i => `${i.title}: ${i.flags.map(f => f.message).join('; ')}`)
      .join('\n\n');

    let aiAnalysis = null;
    if (suspiciousEvidenceTexts) {
      const prompt = `Analyze these evidence items for potential fee-shifting or payment coercion schemes in a professional services dispute:

${suspiciousEvidenceTexts}

Known parties:
- William Bradley (contractor/surveyor)
- Malcolm Belcher (defendant/firm owner)
- Sean Powell (associated party)

Identify:
1. Any evidence of one party forcing another to pay their fees
2. Deduction or offset schemes
3. Conditional payment arrangements
4. Party relationships that suggest coercion

Return JSON with findings and party verification recommendations.`;

      aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            fee_shifting_detected: { type: 'boolean' },
            scheme_type: { type: 'string' },
            parties_involved: { type: 'array', items: { type: 'string' } },
            evidence_summary: { type: 'string' },
            risk_level: { type: 'string' }
          }
        }
      });
    }

    return Response.json({
      verification_status: 'complete',
      total_evidence_reviewed: allEvidence.length,
      known_parties: Array.from(knownParties.values()),
      issues_found: partyVerificationIssues.length,
      party_issues: partyVerificationIssues,
      ai_analysis: aiAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Evidence party verification failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});