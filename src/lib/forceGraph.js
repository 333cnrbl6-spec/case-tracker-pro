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

// Canonical key entities — name fragments map to a canonical node ID
const KEY_ENTITIES = [
  { id: 'entity_belcher', label: 'Malcolm Belcher MRICS', role: 'Surveyor (defendant)', color: '#dc2626', fragments: ['belcher', 'malcolm'] },
  { id: 'entity_powell', label: 'Sean Powell', role: 'Freeholder / Instructing Party', color: '#7c3aed', fragments: ['powell', 'sean'] },
  { id: 'entity_bradley', label: 'William Bradley', role: 'Contractor (claimant)', color: '#059669', fragments: ['bradley', 'william'] },
  { id: 'entity_vivid', label: 'VIVID Housing', role: 'Housing Association', color: '#d97706', fragments: ['vivid'] },
  { id: 'entity_markjones', label: 'Mark Jones', role: 'Electrician / Subcontractor', color: '#0284c7', fragments: ['mark jones', 'jones electrical'] },
];

// Returns canonical entity ID if the text matches a key entity, else null
export function resolveEntityId(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const e of KEY_ENTITIES) {
    if (e.fragments.some(f => lower.includes(f))) return e.id;
  }
  return null;
}

export { KEY_ENTITIES };

export function buildGraphData(incidents, communications, evidence) {
  const nodes = [];
  const links = [];
  const personSet = new Set();

  // Add canonical key entity nodes first
  KEY_ENTITIES.forEach(e => {
    personSet.add(e.id);
    nodes.push({ id: e.id, type: 'key_entity', label: e.label, role: e.role, entityColor: e.color, raw: {} });
  });

  // Helper: resolve a name to canonical entity node or create generic person node
  function resolveOrCreatePerson(name) {
    if (!name) return null;
    const canonical = resolveEntityId(name);
    if (canonical) return canonical;
    const pid = `person_${name}`;
    if (!personSet.has(pid)) {
      personSet.add(pid);
      nodes.push({ id: pid, type: 'person', label: name, raw: {} });
    }
    return pid;
  }

  // --- Incident nodes ---
  incidents.forEach(r => {
    const rec = r.data ?? r;
    nodes.push({ id: `inc_${r.id}`, type: 'incident', label: rec.title || 'Incident', severity: rec.severity, rics: rec.rics_violations || [], raw: rec });

    // Witnesses
    (rec.witnesses || []).forEach(w => {
      const pid = resolveOrCreatePerson(w);
      if (pid) links.push({ source: `inc_${r.id}`, target: pid, rel: 'witness' });
    });

    // Try to connect incident to key entities by scanning description
    const text = `${rec.title || ''} ${rec.description || ''} ${rec.evidence_notes || ''}`;
    KEY_ENTITIES.forEach(e => {
      if (e.fragments.some(f => text.toLowerCase().includes(f))) {
        links.push({ source: `inc_${r.id}`, target: e.id, rel: 'involves' });
      }
    });
  });

  // --- Evidence nodes ---
  evidence.forEach(r => {
    const rec = r.data ?? r;
    nodes.push({ id: `ev_${r.id}`, type: 'evidence', label: rec.title || 'Evidence', strength: rec.strength, raw: rec });

    (rec.related_incidents || []).forEach(iid => {
      links.push({ source: `ev_${r.id}`, target: `inc_${iid}`, rel: 'supports' });
    });

    // Connect evidence to key entities by scanning title/description/notes
    const text = `${rec.title || ''} ${rec.description || ''} ${rec.notes || ''}`;
    KEY_ENTITIES.forEach(e => {
      if (e.fragments.some(f => text.toLowerCase().includes(f))) {
        links.push({ source: `ev_${r.id}`, target: e.id, rel: 'involves' });
      }
    });
  });

  // --- Communication nodes ---
  communications.forEach(r => {
    const rec = r.data ?? r;
    nodes.push({ id: `comm_${r.id}`, type: 'communication', label: rec.subject || 'Communication', tone: rec.tone, raw: rec });

    // From / To → resolve to canonical entities where possible
    [rec.from, rec.to].filter(Boolean).forEach(p => {
      const pid = resolveOrCreatePerson(p);
      if (pid) links.push({ source: `comm_${r.id}`, target: pid, rel: 'party' });
    });

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

// Build entity-to-entity interaction summary for the conspiracy view
export function buildEntityInteractions(communications, incidents) {
  const interactions = {}; // "entityA__entityB" → { count, tones, dates, subjects }

  const key = (a, b) => [a, b].sort().join('__');

  communications.forEach(r => {
    const rec = r.data ?? r;
    const fromId = resolveEntityId(rec.from);
    const toId = resolveEntityId(rec.to);
    if (!fromId || !toId || fromId === toId) return;
    const k = key(fromId, toId);
    if (!interactions[k]) interactions[k] = { a: fromId, b: toId, count: 0, tones: [], dates: [], subjects: [] };
    interactions[k].count++;
    if (rec.tone) interactions[k].tones.push(rec.tone);
    if (rec.date) interactions[k].dates.push(rec.date);
    if (rec.subject) interactions[k].subjects.push(rec.subject);
  });

  // Also count incident co-involvement
  incidents.forEach(r => {
    const rec = r.data ?? r;
    const text = `${rec.title || ''} ${rec.description || ''} ${rec.evidence_notes || ''}`;
    const involved = KEY_ENTITIES.filter(e => e.fragments.some(f => text.toLowerCase().includes(f)));
    for (let i = 0; i < involved.length; i++) {
      for (let j = i + 1; j < involved.length; j++) {
        const k = key(involved[i].id, involved[j].id);
        if (!interactions[k]) interactions[k] = { a: involved[i].id, b: involved[j].id, count: 0, tones: [], dates: [], subjects: [] };
        interactions[k].count++;
      }
    }
  });

  return Object.values(interactions);
}