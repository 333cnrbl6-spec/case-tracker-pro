import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_name, opponent_name, case_ref } = await req.json();

    if (!client_name && !opponent_name) {
      return Response.json({ error: 'client_name or opponent_name required' }, { status: 400 });
    }

    // Fetch all existing cases and surveyors
    const existingCases = await base44.asServiceRole.entities.LegalCase.list();
    const surveyors = await base44.asServiceRole.entities.RICSSurveyorProfile.list();
    const incidents = await base44.asServiceRole.entities.Incident.list();

    const conflicts = [];

    // Helper to normalize names for comparison
    const normalizeName = (name) => {
      if (!name) return '';
      return name.toLowerCase().trim().replace(/[^\w\s]/g, '');
    };

    const clientNorm = normalizeName(client_name);
    const opponentNorm = normalizeName(opponent_name);

    // 1. Check if client/opponent appears as opposing party in existing cases
    for (const existingCase of existingCases) {
      if (existingCase.id === case_ref) continue; // Skip self-comparison

      const existingClientNorm = normalizeName(existingCase.client_name);
      const existingOpponentNorm = normalizeName(existingCase.opponent_name);

      // Client matches existing opponent
      if (clientNorm && clientNorm === existingOpponentNorm) {
        conflicts.push({
          type: 'opposing_party',
          severity: 'high',
          title: 'Potential Conflict of Interest',
          description: `Client "${client_name}" was opponent in case ${existingCase.case_ref}`,
          existing_case: existingCase.case_ref,
          action_required: true
        });
      }

      // Opponent matches existing client
      if (opponentNorm && opponentNorm === existingClientNorm) {
        conflicts.push({
          type: 'opposing_party',
          severity: 'high',
          title: 'Potential Conflict of Interest',
          description: `Opponent "${opponent_name}" was client in case ${existingCase.case_ref}`,
          existing_case: existingCase.case_ref,
          action_required: true
        });
      }

      // Both sides appeared in same case (against each other)
      if (clientNorm && opponentNorm &&
          clientNorm === existingClientNorm && opponentNorm === existingOpponentNorm) {
        conflicts.push({
          type: 'repeat_case',
          severity: 'warning',
          title: 'Repeat Case Parties',
          description: `Same parties in existing case ${existingCase.case_ref} - may indicate pattern`,
          existing_case: existingCase.case_ref,
          action_required: false
        });
      }
    }

    // 2. Check if client/opponent is a known surveyor (potential bias)
    for (const surveyor of surveyors) {
      const surveyorNorm = normalizeName(surveyor.surveyor_name);

      if (clientNorm && clientNorm === surveyorNorm) {
        let disciplinaryWarning = '';
        if (surveyor.disciplinary_history) {
          disciplinaryWarning = ` — Has disciplinary history: ${surveyor.disciplinary_history}`;
        }
        conflicts.push({
          type: 'surveyor_involved',
          severity: surveyor.disciplinary_history ? 'high' : 'medium',
          title: 'Client is Known Surveyor',
          description: `Client "${client_name}" is registered RICS surveyor with specialism: ${surveyor.specialism || 'Unknown'}${disciplinaryWarning}`,
          surveyor_id: surveyor.id,
          action_required: surveyor.disciplinary_history ? true : false
        });
      }

      if (opponentNorm && opponentNorm === surveyorNorm) {
        let disciplinaryWarning = '';
        if (surveyor.disciplinary_history) {
          disciplinaryWarning = ` — Disciplinary record: ${surveyor.disciplinary_history}`;
        }
        conflicts.push({
          type: 'surveyor_opponent',
          severity: 'high',
          title: 'Opponent is Known Surveyor',
          description: `Opponent "${opponent_name}" is RICS surveyor${disciplinaryWarning}`,
          surveyor_id: surveyor.id,
          action_required: true
        });
      }
    }

    // 3. Check for patterns in incident history (multiple incidents from same parties)
    const relatedIncidents = incidents.filter(i => {
      const title = normalizeName(i.title || '');
      return (clientNorm && title.includes(clientNorm)) || (opponentNorm && title.includes(opponentNorm));
    });

    if (relatedIncidents.length > 2) {
      conflicts.push({
        type: 'pattern_detected',
        severity: 'medium',
        title: 'Multiple Incidents Pattern',
        description: `${relatedIncidents.length} incidents involve client/opponent - possible pattern of conduct`,
        incident_count: relatedIncidents.length,
        action_required: false
      });
    }

    return Response.json({
      case_ref: case_ref || 'new',
      client_name,
      opponent_name,
      conflicts_found: conflicts.length > 0,
      conflicts: conflicts,
      high_severity_count: conflicts.filter(c => c.severity === 'high').length,
      action_required: conflicts.some(c => c.action_required)
    });
  } catch (error) {
    console.error('Entity conflict check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});