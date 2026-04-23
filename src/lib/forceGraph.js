/**
 * Minimal force-directed graph simulation (no external deps).
 * Runs synchronously for N ticks, returns stable node positions.
 */

export function runForceSimulation(nodes, links, width, height, ticks = 300) {
  // Clone nodes with initial random positions
  const ns = nodes.map((n, i) => ({
    ...n,
    x: width / 2 + (Math.random() - 0.5) * width * 0.6,
    y: height / 2 + (Math.random() - 0.5) * height * 0.6,
    vx: 0,
    vy: 0,
  }));

  const indexById = Object.fromEntries(ns.map((n, i) => [n.id, i]));

  const REPEL = 4000;
  const ATTRACT = 0.04;
  const IDEAL_DIST = 160;
  const DAMPING = 0.85;
  const CENTER_PULL = 0.012;

  for (let tick = 0; tick < ticks; tick++) {
    // Repulsion between all node pairs
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const dx = ns[j].x - ns[i].x || 0.01;
        const dy = ns[j].y - ns[i].y || 0.01;
        const dist2 = dx * dx + dy * dy;
        const force = REPEL / dist2;
        const fx = (dx / Math.sqrt(dist2)) * force;
        const fy = (dy / Math.sqrt(dist2)) * force;
        ns[i].vx -= fx;
        ns[i].vy -= fy;
        ns[j].vx += fx;
        ns[j].vy += fy;
      }
    }

    // Attraction along links
    for (const link of links) {
      const si = indexById[link.source];
      const ti = indexById[link.target];
      if (si == null || ti == null) continue;
      const dx = ns[ti].x - ns[si].x;
      const dy = ns[ti].y - ns[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = ATTRACT * (dist - IDEAL_DIST);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      ns[si].vx += fx;
      ns[si].vy += fy;
      ns[ti].vx -= fx;
      ns[ti].vy -= fy;
    }

    // Gravity toward center
    for (const n of ns) {
      n.vx += (width / 2 - n.x) * CENTER_PULL;
      n.vy += (height / 2 - n.y) * CENTER_PULL;
    }

    // Apply velocity + damping + boundary clamp
    for (const n of ns) {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x = Math.max(60, Math.min(width - 60, n.x + n.vx));
      n.y = Math.max(60, Math.min(height - 60, n.y + n.vy));
    }
  }

  return ns;
}

export function buildGraphData(incidents, communications, evidence) {
  const nodes = [];
  const links = [];
  const personSet = new Set();

  // --- Incident nodes ---
  incidents.forEach(r => {
    const rec = r.data ?? r;
    nodes.push({ id: `inc_${r.id}`, type: 'incident', label: rec.title || 'Incident', severity: rec.severity, rics: rec.rics_violations || [], raw: rec });

    // Person nodes from witnesses
    (rec.witnesses || []).forEach(w => {
      const pid = `person_${w}`;
      if (!personSet.has(pid)) { personSet.add(pid); nodes.push({ id: pid, type: 'person', label: w, raw: {} }); }
      links.push({ source: `inc_${r.id}`, target: pid, rel: 'witness' });
    });
  });

  // --- Evidence nodes ---
  evidence.forEach(r => {
    const rec = r.data ?? r;
    nodes.push({ id: `ev_${r.id}`, type: 'evidence', label: rec.title || 'Evidence', strength: rec.strength, raw: rec });

    // Link evidence → related incidents
    (rec.related_incidents || []).forEach(iid => {
      links.push({ source: `ev_${r.id}`, target: `inc_${iid}`, rel: 'supports' });
    });
  });

  // --- Communication nodes ---
  communications.forEach(r => {
    const rec = r.data ?? r;
    nodes.push({ id: `comm_${r.id}`, type: 'communication', label: rec.subject || 'Communication', tone: rec.tone, raw: rec });

    // Person nodes from/to
    [rec.from, rec.to].filter(Boolean).forEach(p => {
      const pid = `person_${p}`;
      if (!personSet.has(pid)) { personSet.add(pid); nodes.push({ id: pid, type: 'person', label: p, raw: {} }); }
      links.push({ source: `comm_${r.id}`, target: pid, rel: 'party' });
    });

    // Link comm → related incidents
    (rec.related_incidents || []).forEach(iid => {
      links.push({ source: `comm_${r.id}`, target: `inc_${iid}`, rel: 'related' });
    });
  });

  // Deduplicate links
  const seen = new Set();
  const dedupedLinks = links.filter(l => {
    const key = `${l.source}__${l.target}__${l.rel}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { nodes, links: dedupedLinks };
}