import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Create legal case
    const caseData = {
      case_ref: 'BRADLEY-001-2026',
      case_type: 'professional_negligence',
      status: 'active',
      client_name: 'John Bradley',
      client_email: 'john.bradley@example.com',
      opponent_name: 'David Belcher (RICS Surveyor)',
      assigned_fee_earner: 'alice.smith@lawfirm.co.uk',
      incident_date: '2023-06-15',
      limitation_date: '2026-06-14',
      client_care_letter_sent: true,
      client_care_letter_date: '2023-07-01',
      last_client_contact: new Date().toISOString().split('T')[0],
      estimated_value: 125000,
      facts: 'Surveyor David Belcher failed to identify significant structural defects in residential property survey dated June 2023. Property subsequently suffered £125,000 in damage requiring remedial works.',
      instructions: 'Pursue claim against surveyor for professional negligence and breach of contract. Seek full damages for remedial works and diminution in value.',
      court_deadline: '2026-10-31',
    };

    const caseRes = await base44.asServiceRole.entities.LegalCase.create(caseData);
    const caseId = caseRes.id;

    // Create incidents
    const incident1 = await base44.asServiceRole.entities.Incident.create({
      date: '2023-06-15',
      title: 'Structural defects not identified in survey',
      description: 'Surveyor Belcher failed to identify cracks in structural walls, damp penetration, and roof deterioration worth £125,000 in repairs.',
      incident_type: 'professional_conduct',
      severity: 'high',
      witnesses: ['Property inspector who carried out remedial works', 'Independent structural engineer'],
      rics_violations: ['PS-1.1', 'PS-1.2', 'Competence'],
      legal_issues: ['Professional negligence', 'Breach of contract', 'Duty of care'],
      status: 'assessed',
    });

    const incident2 = await base44.asServiceRole.entities.Incident.create({
      date: '2023-08-20',
      title: 'Dismissive response to client complaint',
      description: 'When client raised concerns about survey quality, Belcher dismissed concerns and refused to discuss liability.',
      incident_type: 'communication',
      severity: 'medium',
      witnesses: ['Client', 'Complaint handler'],
      rics_violations: ['Client Relations', 'Complaints Handling'],
      legal_issues: ['Unfair contract terms', 'Duty to respond professionally'],
      status: 'assessed',
    });

    // Create evidence
    const evidence1 = await base44.asServiceRole.entities.Evidence.create({
      date_collected: '2023-06-15',
      title: 'Original RICS Survey Report',
      description: 'Original survey conducted by David Belcher on 15 June 2023. Contains findings that structural defects were not identified.',
      evidence_type: 'document',
      file_url: 'https://example.com/belcher-survey-2023.pdf',
      relevance: 'legal_violation',
      strength: 'critical',
      notes: 'Key document showing scope of inspection and what should have been identified.',
    });

    const evidence2 = await base44.asServiceRole.entities.Evidence.create({
      date_collected: '2023-10-01',
      title: 'Structural Engineer Report',
      description: 'Independent structural engineer report detailing defects present at property and remedial costs.',
      evidence_type: 'report',
      file_url: 'https://example.com/structural-report.pdf',
      relevance: 'legal_violation',
      strength: 'critical',
      notes: 'Quantifies damage at £125,000 and establishes defects were patent and should have been identified.',
    });

    const evidence3 = await base44.asServiceRole.entities.Evidence.create({
      date_collected: '2023-08-20',
      title: 'Email: Client complaint to Belcher',
      description: 'Email from Bradley raising concerns about survey quality and requesting explanation.',
      evidence_type: 'communication',
      file_url: 'https://example.com/client-complaint-email.pdf',
      relevance: 'pattern',
      strength: 'strong',
      notes: 'Demonstrates client flagged issues and professional response was inadequate.',
    });

    // Create communications
    const comm1 = await base44.asServiceRole.entities.Communication.create({
      date: '2023-08-20',
      type: 'email',
      from: 'john.bradley@example.com',
      to: 'david.belcher@surveyors.co.uk',
      subject: 'Concern about structural defects - survey dated 15 June 2023',
      content: 'Dear Mr Belcher,\n\nFollowing receipt of your survey report dated 15 June 2023, contractors have now identified significant structural defects including cracked walls and roof deterioration. These issues should have been apparent during your inspection.\n\nI am disappointed that your survey failed to identify these serious defects. Can you please explain how these were missed?\n\nYours faithfully,\nJohn Bradley',
      tone: 'professional',
      concerning_elements: ['Reasonable complaint ignored'],
      witnesses: ['Email server logs'],
    });

    const comm2 = await base44.asServiceRole.entities.Communication.create({
      date: '2023-08-25',
      type: 'email',
      from: 'david.belcher@surveyors.co.uk',
      to: 'john.bradley@example.com',
      subject: 'RE: Concern about structural defects',
      content: 'Mr Bradley,\n\nI have reviewed your concerns. My inspection was conducted to industry standards. If defects are now apparent, this is likely due to further deterioration since the survey date.\n\nI do not accept liability for the issues you describe.\n\nDavid Belcher',
      tone: 'dismissive',
      concerning_elements: ['Dismissive tone', 'Refusal to discuss', 'Unreasonable position'],
      witnesses: ['Email server logs'],
    });

    // Create tasks
    const task1 = await base44.asServiceRole.entities.IncidentTask.create({
      incident_id: incident1.id,
      title: 'Obtain detailed cost breakdown from structural engineer',
      description: 'Request itemised repair costs from structural engineer to support damages claim.',
      status: 'completed',
      assigned_to: 'alice.smith@lawfirm.co.uk',
      deadline: '2023-09-15',
      priority: 'high',
      completion_date: '2023-09-10',
    });

    const task2 = await base44.asServiceRole.entities.IncidentTask.create({
      incident_id: incident1.id,
      title: 'Review RICS standards applicable to survey scope',
      description: 'Analyse whether defects were within scope of survey and what standard inspection should have revealed.',
      status: 'completed',
      assigned_to: 'alice.smith@lawfirm.co.uk',
      deadline: '2023-09-30',
      priority: 'high',
      completion_date: '2023-09-28',
    });

    const task3 = await base44.asServiceRole.entities.IncidentTask.create({
      incident_id: incident2.id,
      title: 'Analyse dismissive communication for breach of complaints handling rules',
      description: 'Review whether Belcher\'s dismissive response breaches RICS complaints handling and professional conduct obligations.',
      status: 'under_investigation',
      assigned_to: 'bob.jones@lawfirm.co.uk',
      deadline: '2026-05-01',
      priority: 'medium',
      reminder_sent: false,
    });

    const task4 = await base44.asServiceRole.entities.IncidentTask.create({
      incident_id: incident1.id,
      title: 'Prepare statement of claim',
      description: 'Draft formal statement of claim for professional negligence against Belcher.',
      status: 'evidence_review',
      assigned_to: 'alice.smith@lawfirm.co.uk',
      deadline: '2026-08-01',
      priority: 'critical',
    });

    // Create case parties
    await base44.asServiceRole.entities.CaseParty.create({
      name: 'John Bradley',
      party_type: 'person',
      role_in_case: 'Claimant',
      confirmed: true,
      contact_details: 'john.bradley@example.com',
    });

    await base44.asServiceRole.entities.CaseParty.create({
      name: 'David Belcher',
      party_type: 'person',
      role_in_case: 'Defendant (Surveyor)',
      confirmed: true,
      contact_details: 'david.belcher@surveyors.co.uk',
      notes: 'RICS registered surveyor',
    });

    await base44.asServiceRole.entities.CaseParty.create({
      name: 'Property at 42 Oak Street, Surrey',
      party_type: 'property',
      role_in_case: 'Subject property',
      confirmed: true,
      address: '42 Oak Street, Guildford, Surrey GU1 4AA',
    });

    // Create RICS surveyor profile
    await base44.asServiceRole.entities.RICSSurveyorProfile.create({
      surveyor_name: 'David Belcher',
      rics_registration_number: 'FRICS12345',
      specialism: 'Residential surveying',
      qualifications: ['FRICS', 'Diploma in Surveying'],
      disciplinary_history: 'No disciplinary history on record (as of June 2023)',
      scope_of_work: 'RICS HomeBuyers Report on residential property',
      years_in_profession: 18,
      notes: 'Experienced surveyor with good track record, but this case involves significant oversight.',
    });

    return Response.json({
      success: true,
      case_id: caseId,
      case_ref: caseData.case_ref,
      incidents_created: 2,
      evidence_items_created: 3,
      communications_created: 2,
      tasks_created: 4,
      parties_created: 3,
      message: 'Bradley v Belcher test data created successfully',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});