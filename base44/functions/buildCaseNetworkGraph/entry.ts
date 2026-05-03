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
      return Response.json({ error: 'case_id is required' }, { status: 400 });
    }

    // Fetch all case-related entities in parallel
    const [incidents, communications, evidence, caseParties, legalCase] = await Promise.all([
      base44.entities.Incident.filter({ case_id }).catch(() => []),
      base44.entities.Communication.filter({ case_id }).catch(() => []),
      base44.entities.Evidence.filter({ case_id }).catch(() => []),
      base44.entities.CaseParty.filter({ case_id }).catch(() => []),
      base44.entities.LegalCase.list().then(cases => cases.find(c => c.id === case_id)).catch(() => null),
    ]);

    // Build nodes
    const nodes = [];
    const nodeMap = new Map();

    // Add case node
    if (legalCase) {
      nodes.push({
        id: `case_${case_id}`,
        label: legalCase.case_ref || 'Case',
        type: 'case',
        group: 'case',
      });
      nodeMap.set(`case_${case_id}`, nodes[nodes.length - 1]);
    }

    // Add incident nodes
    incidents.forEach(incident => {
      const node = {
        id: `incident_${incident.id}`,
        label: incident.title,
        type: 'incident',
        group: 'incident',
        severity: incident.severity,
        date: incident.date,
      };
      nodes.push(node);
      nodeMap.set(`incident_${incident.id}`, node);
    });

    // Add evidence nodes
    evidence.forEach(ev => {
      const node = {
        id: `evidence_${ev.id}`,
        label: ev.title,
        type: 'evidence',
        group: 'evidence',
        strength: ev.strength,
        relevance: ev.relevance,
      };
      nodes.push(node);
      nodeMap.set(`evidence_${ev.id}`, node);
    });

    // Add party nodes
    caseParties.forEach(party => {
      const node = {
        id: `party_${party.id}`,
        label: party.name,
        type: 'party',
        group: 'party',
        party_type: party.party_type,
        role: party.role_in_case,
      };
      nodes.push(node);
      nodeMap.set(`party_${party.id}`, node);
    });

    // Add communication nodes (sample to avoid too many nodes)
    communications.slice(0, 20).forEach(comm => {
      const node = {
        id: `communication_${comm.id}`,
        label: `${comm.from} → ${comm.to}`,
        type: 'communication',
        group: 'communication',
        date: comm.date,
        tone: comm.tone,
      };
      nodes.push(node);
      nodeMap.set(`communication_${comm.id}`, node);
    });

    // Build edges
    const edges = [];
    const edgeSet = new Set(); // Prevent duplicates

    // Link incidents to case
    incidents.forEach(incident => {
      const edgeKey = `case_${case_id}-incident_${incident.id}`;
      if (!edgeSet.has(edgeKey)) {
        edges.push({
          source: `case_${case_id}`,
          target: `incident_${incident.id}`,
          type: 'case_incident',
          strength: 'strong',
        });
        edgeSet.add(edgeKey);
      }
    });

    // Link evidence to incidents
    evidence.forEach(ev => {
      (ev.related_incidents || []).forEach(incidentId => {
        const edgeKey = `incident_${incidentId}-evidence_${ev.id}`;
        if (!edgeSet.has(edgeKey)) {
          edges.push({
            source: `incident_${incidentId}`,
            target: `evidence_${ev.id}`,
            type: 'incident_evidence',
            strength: ev.strength || 'moderate',
          });
          edgeSet.add(edgeKey);
        }
      });
    });

    // Link parties to incidents (through communications and context)
    communications.forEach(comm => {
      // Find parties matching communication participants
      const fromParty = caseParties.find(p => p.name.toLowerCase() === comm.from.toLowerCase());
      const toParty = caseParties.find(p => p.name.toLowerCase() === comm.to.toLowerCase());

      // Link communication nodes
      if (fromParty) {
        const edgeKey = `party_${fromParty.id}-communication_${comm.id}`;
        if (!edgeSet.has(edgeKey)) {
          edges.push({
            source: `party_${fromParty.id}`,
            target: `communication_${comm.id}`,
            type: 'party_communication',
            strength: 'moderate',
          });
          edgeSet.add(edgeKey);
        }
      }

      if (toParty) {
        const edgeKey = `communication_${comm.id}-party_${toParty.id}`;
        if (!edgeSet.has(edgeKey)) {
          edges.push({
            source: `communication_${comm.id}`,
            target: `party_${toParty.id}`,
            type: 'communication_party',
            strength: 'moderate',
          });
          edgeSet.add(edgeKey);
        }
      }

      // Link communications to incidents
      incidents.forEach(incident => {
        if ((incident.evidence_notes || '').toLowerCase().includes(comm.subject.toLowerCase())) {
          const edgeKey = `communication_${comm.id}-incident_${incident.id}`;
          if (!edgeSet.has(edgeKey)) {
            edges.push({
              source: `communication_${comm.id}`,
              target: `incident_${incident.id}`,
              type: 'communication_incident',
              strength: 'weak',
            });
            edgeSet.add(edgeKey);
          }
        }
      });
    });

    // Detect patterns and clusters
    const patterns = detectPatterns(nodes, edges, incidents, communications, evidence);

    return Response.json({
      success: true,
      case_id,
      network: {
        nodes,
        edges,
        stats: {
          node_count: nodes.length,
          edge_count: edges.length,
          incident_count: incidents.length,
          evidence_count: evidence.length,
          party_count: caseParties.length,
          communication_count: communications.length,
        },
      },
      patterns,
    });
  } catch (error) {
    console.error('Network graph build error:', error);
    return Response.json(
      { error: error.message || 'Failed to build network graph' },
      { status: 500 }
    );
  }
});

function detectPatterns(nodes, edges, incidents, communications, evidence) {
  const patterns = [];

  // Pattern 1: High-degree nodes (well-connected entities)
  const nodeDegrees = new Map();
  edges.forEach(edge => {
    nodeDegrees.set(edge.source, (nodeDegrees.get(edge.source) || 0) + 1);
    nodeDegrees.set(edge.target, (nodeDegrees.get(edge.target) || 0) + 1);
  });

  const highDegreeNodes = Array.from(nodeDegrees.entries())
    .filter(([_, degree]) => degree > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (highDegreeNodes.length > 0) {
    patterns.push({
      type: 'central_entities',
      title: 'Central Entities',
      description: 'These entities appear in many connections',
      entities: highDegreeNodes.map(([nodeId, degree]) => ({
        node_id: nodeId,
        connection_count: degree,
      })),
    });
  }

  // Pattern 2: Communication tone patterns
  const aggressiveComms = communications.filter(c => c.tone === 'aggressive' || c.tone === 'threatening');
  if (aggressiveComms.length > 0) {
    patterns.push({
      type: 'aggressive_communications',
      title: 'Aggressive Communications',
      description: `${aggressiveComms.length} communication(s) with aggressive/threatening tone detected`,
      count: aggressiveComms.length,
      severity: aggressiveComms.length > 2 ? 'high' : 'medium',
    });
  }

  // Pattern 3: Evidence clusters by strength
  const strongEvidence = evidence.filter(e => e.strength === 'strong' || e.strength === 'critical');
  const weakEvidence = evidence.filter(e => e.strength === 'weak');

  if (strongEvidence.length > 0) {
    patterns.push({
      type: 'evidence_strength',
      title: 'Strong Evidence Cluster',
      description: `${strongEvidence.length} piece(s) of strong evidence identified`,
      count: strongEvidence.length,
      relevance: 'supports_case',
    });
  }

  if (weakEvidence.length > 2) {
    patterns.push({
      type: 'weak_evidence',
      title: 'Weak Evidence Identified',
      description: `${weakEvidence.length} piece(s) of weak evidence may need attention`,
      count: weakEvidence.length,
      relevance: 'potential_risk',
    });
  }

  // Pattern 4: Temporal patterns (incidents clustered in time)
  const incidentDates = incidents
    .filter(i => i.date)
    .map(i => ({ date: new Date(i.date), incident: i }))
    .sort((a, b) => a.date - b.date);

  if (incidentDates.length > 2) {
    const clusters = [];
    let currentCluster = [incidentDates[0]];

    for (let i = 1; i < incidentDates.length; i++) {
      const daysDiff = (incidentDates[i].date - currentCluster[currentCluster.length - 1].date) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 30) {
        currentCluster.push(incidentDates[i]);
      } else {
        if (currentCluster.length > 2) {
          clusters.push(currentCluster);
        }
        currentCluster = [incidentDates[i]];
      }
    }

    if (currentCluster.length > 2) {
      clusters.push(currentCluster);
    }

    if (clusters.length > 0) {
      patterns.push({
        type: 'temporal_cluster',
        title: 'Clustered Incidents',
        description: `${clusters.length} cluster(s) of incidents occurring within 30-day periods`,
        cluster_count: clusters.length,
        significance: 'may_indicate_pattern_of_conduct',
      });
    }
  }

  // Pattern 5: Party involvement in critical incidents
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' || i.severity === 'high');
  if (criticalIncidents.length > 0) {
    patterns.push({
      type: 'critical_incidents',
      title: 'Critical Incidents',
      description: `${criticalIncidents.length} incident(s) rated as high/critical severity`,
      count: criticalIncidents.length,
      requires_attention: true,
    });
  }

  return patterns;
}