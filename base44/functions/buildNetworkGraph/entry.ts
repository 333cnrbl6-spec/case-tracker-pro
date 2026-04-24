import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all relevant data
    const [cases, incidents, communications, surveyors, caseParties] = await Promise.all([
      base44.entities.LegalCase.list('-updated_date', 100),
      base44.entities.Incident.list('-updated_date', 200),
      base44.entities.Communication.list('-updated_date', 200),
      base44.asServiceRole.entities.RICSSurveyorProfile.list('-updated_date', 100),
      base44.asServiceRole.entities.CaseParty.list('-updated_date', 100),
    ]);

    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    // Helper to add node
    const addNode = (id, label, type, data = {}) => {
      if (!nodeMap.has(id)) {
        const sizeMap = {
          case: 8,
          client: 6,
          opponent: 6,
          incident: 5,
          surveyor: 5,
          party: 4,
        };

        const colorMap = {
          case: '#3B82F6',
          client: '#10B981',
          opponent: '#EF4444',
          incident: '#F59E0B',
          surveyor: '#8B5CF6',
          party: '#6B7280',
        };

        nodes.push({
          id,
          label,
          type,
          size: sizeMap[type] || 5,
          color: colorMap[type] || '#6B7280',
          ...data,
        });
        nodeMap.set(id, true);
      }
    };

    // Helper to add edge
    const addEdge = (source, target, label = '', weight = 1) => {
      const edgeId = `${source}->${target}`;
      if (!edges.find(e => e.source === source && e.target === target)) {
        edges.push({
          source,
          target,
          label,
          weight,
        });
      }
    };

    // Add case nodes and connections
    cases.forEach((c) => {
      addNode(`case_${c.id}`, c.case_ref, 'case', {
        caseType: c.case_type,
        status: c.status,
      });

      // Client
      if (c.client_name) {
        addNode(`client_${c.client_name}`, c.client_name, 'client');
        addEdge(`client_${c.client_name}`, `case_${c.id}`, 'involved');
      }

      // Opponent
      if (c.opponent_name) {
        addNode(`opponent_${c.opponent_name}`, c.opponent_name, 'opponent');
        addEdge(`case_${c.id}`, `opponent_${c.opponent_name}`, 'vs');
      }
    });

    // Add incident nodes
    incidents.forEach((i) => {
      addNode(`incident_${i.id}`, i.title, 'incident', {
        severity: i.severity,
        date: i.date,
      });

      // Link incident to related cases if available
      if (cases.find(c => c.id === i.case_id)) {
        addEdge(`case_${i.case_id}`, `incident_${i.id}`, 'contains');
      }
    });

    // Add communication nodes (aggregate by participant)
    const commParticipants = new Map();
    communications.forEach((c) => {
      const fromKey = `person_${c.from}`;
      const toKey = `person_${c.to}`;

      if (!commParticipants.has(c.from)) {
        commParticipants.set(c.from, []);
      }
      if (!commParticipants.has(c.to)) {
        commParticipants.set(c.to, []);
      }

      commParticipants.get(c.from).push(c);
      commParticipants.get(c.to).push(c);
    });

    // Add nodes for frequent communicators
    commParticipants.forEach((comms, participant) => {
      if (comms.length >= 2) {
        // Only add if they have multiple communications
        addNode(`person_${participant}`, participant, 'party');
      }
    });

    // Add communication edges
    const communicationEdges = new Set();
    communications.forEach((c) => {
      const fromKey = `person_${c.from}`;
      const toKey = `person_${c.to}`;

      if (nodeMap.has(fromKey) && nodeMap.has(toKey)) {
        const edgeKey = [fromKey, toKey].sort().join('|');
        if (!communicationEdges.has(edgeKey)) {
          const count = communications.filter(
            (x) =>
              (x.from === c.from && x.to === c.to) ||
              (x.from === c.to && x.to === c.from)
          ).length;

          addEdge(fromKey, toKey, `${count} communications`, count);
          communicationEdges.add(edgeKey);
        }
      }
    });

    // Add surveyor nodes
    surveyors.forEach((s) => {
      addNode(`surveyor_${s.id}`, s.surveyor_name, 'surveyor', {
        rics_number: s.rics_registration_number,
      });
    });

    // Add case party nodes and link to cases
    caseParties.forEach((p) => {
      addNode(`party_${p.id}`, p.name, 'party', {
        party_type: p.party_type,
        role: p.role_in_case,
      });
    });

    // Calculate network statistics
    const getNodeDegree = (nodeId) => {
      return edges.filter((e) => e.source === nodeId || e.target === nodeId)
        .length;
    };

    const nodeDegrees = nodes.map((n) => ({
      id: n.id,
      label: n.label,
      degree: getNodeDegree(n.id),
    }));

    const topNodes = nodeDegrees.sort((a, b) => b.degree - a.degree).slice(0, 10);

    // Identify clusters
    const clusters = identifyClusters(nodes, edges);

    return Response.json({
      nodes,
      edges,
      statistics: {
        total_nodes: nodes.length,
        total_edges: edges.length,
        top_participants: topNodes,
        clusters,
        node_types: groupBy(nodes, 'type'),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper: Group array by property
function groupBy(arr, key) {
  return arr.reduce((acc, obj) => {
    const group = obj[key];
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});
}

// Helper: Simple cluster detection using connected components
function identifyClusters(nodes, edges) {
  const clusters = [];
  const visited = new Set();

  const dfs = (nodeId, cluster) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    cluster.push(nodeId);

    edges.forEach((e) => {
      if (e.source === nodeId && !visited.has(e.target)) {
        dfs(e.target, cluster);
      }
      if (e.target === nodeId && !visited.has(e.source)) {
        dfs(e.source, cluster);
      }
    });
  };

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const cluster = [];
      dfs(node.id, cluster);
      if (cluster.length > 1) {
        clusters.push({
          id: `cluster_${clusters.length}`,
          nodes: cluster,
          size: cluster.length,
        });
      }
    }
  });

  return clusters;
}