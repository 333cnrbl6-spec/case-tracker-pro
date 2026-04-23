import React, { useRef, useEffect, useState, useCallback } from 'react';
import { runForceSimulation } from '@/lib/forceGraph';

// Visual config per node type
const NODE_STYLE = {
  incident: { fill: '#ef4444', stroke: '#b91c1c', r: 22, textColor: '#fff' },
  evidence: { fill: '#3b82f6', stroke: '#1d4ed8', r: 18, textColor: '#fff' },
  communication: { fill: '#a855f7', stroke: '#7e22ce', r: 18, textColor: '#fff' },
  person: { fill: '#f59e0b', stroke: '#d97706', r: 16, textColor: '#fff' },
};

const SEVERITY_RING = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#16a34a' };

const LINK_STYLE = {
  supports: { stroke: '#3b82f6', dash: '4,3', width: 1.5 },
  witness: { stroke: '#f59e0b', dash: '3,3', width: 1.5 },
  party: { stroke: '#a855f7', dash: '3,3', width: 1.5 },
  related: { stroke: '#ef4444', dash: '6,3', width: 2 },
};

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export default function NetworkGraph({ nodes: rawNodes, links: rawLinks, width = 900, height = 620 }) {
  const [positions, setPositions] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(null);
  const dragStart = useRef(null);
  const svgRef = useRef(null);

  // Run simulation when data changes
  useEffect(() => {
    if (!rawNodes.length) { setPositions([]); return; }
    const placed = runForceSimulation(rawNodes, rawLinks, width, height, 280);
    setPositions(placed);
  }, [rawNodes, rawLinks, width, height]);

  // Drag a node
  const onNodeMouseDown = useCallback((e, nodeId) => {
    e.stopPropagation();
    dragging.current = nodeId;
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current || !positions) return;
    const dx = e.movementX / zoom;
    const dy = e.movementY / zoom;
    setPositions(prev => prev.map(n => n.id === dragging.current ? { ...n, x: n.x + dx, y: n.y + dy } : n));
  }, [positions, zoom]);

  const onMouseUp = useCallback(() => { dragging.current = null; }, []);

  // Pan background
  const panStart = useRef(null);
  const onBgMouseDown = useCallback((e) => {
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);
  const onBgMouseMove = useCallback((e) => {
    if (!panStart.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, []);
  const onBgMouseUp = useCallback(() => { panStart.current = null; }, []);

  // Zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  if (!positions) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-slate-400 text-sm animate-pulse">Building graph…</div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-slate-400 text-sm">No data to display. Add incidents, evidence or communications first.</p>
      </div>
    );
  }

  const posMap = Object.fromEntries(positions.map(n => [n.id, n]));
  const selectedNode = selected ? positions.find(n => n.id === selected) : null;

  // Highlight connected nodes when one is selected
  const connectedIds = selected
    ? new Set(rawLinks.filter(l => l.source === selected || l.target === selected).flatMap(l => [l.source, l.target]))
    : null;

  return (
    <div className="relative select-none" style={{ width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="rounded-xl bg-slate-950 cursor-grab active:cursor-grabbing"
        onMouseMove={(e) => { onMouseMove(e); onBgMouseMove(e); }}
        onMouseUp={() => { onMouseUp(); onBgMouseUp(); }}
        onMouseLeave={() => { onMouseUp(); onBgMouseUp(); }}
        onMouseDown={onBgMouseDown}
      >
        <defs>
          <marker id="arrow-related" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#ef4444" opacity="0.7" />
          </marker>
          <marker id="arrow-supports" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" opacity="0.7" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Links */}
          {rawLinks.map((link, i) => {
            const s = posMap[link.source];
            const t = posMap[link.target];
            if (!s || !t) return null;
            const style = LINK_STYLE[link.rel] || LINK_STYLE.related;
            const isHighlighted = selected && (link.source === selected || link.target === selected);
            const isDimmed = selected && !isHighlighted;
            return (
              <line
                key={i}
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke={style.stroke}
                strokeWidth={isHighlighted ? style.width * 2.5 : style.width}
                strokeDasharray={style.dash}
                opacity={isDimmed ? 0.08 : isHighlighted ? 1 : 0.35}
                markerEnd={link.rel === 'related' ? 'url(#arrow-related)' : link.rel === 'supports' ? 'url(#arrow-supports)' : undefined}
              />
            );
          })}

          {/* Nodes */}
          {positions.map(node => {
            const style = NODE_STYLE[node.type] || NODE_STYLE.incident;
            const isSelected = selected === node.id;
            const isHovered = hovered === node.id;
            const isDimmed = selected && !isSelected && connectedIds && !connectedIds.has(node.id);
            const r = isSelected ? style.r + 5 : style.r;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                onClick={() => setSelected(prev => prev === node.id ? null : node.id)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer', opacity: isDimmed ? 0.18 : 1 }}
                filter={isSelected || isHovered ? 'url(#glow)' : undefined}
              >
                {/* Severity ring for incidents */}
                {node.type === 'incident' && node.severity && (
                  <circle cx={0} cy={0} r={r + 5} fill="none" stroke={SEVERITY_RING[node.severity] || '#888'} strokeWidth={2.5} opacity={0.7} />
                )}
                <circle cx={0} cy={0} r={r} fill={style.fill} stroke={isSelected ? '#fff' : style.stroke} strokeWidth={isSelected ? 3 : 1.5} />
                {/* Type icon letter */}
                <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fill={style.textColor} fontSize={r < 18 ? 9 : 11} fontWeight="700" style={{ pointerEvents: 'none' }}>
                  {node.type === 'incident' ? 'I' : node.type === 'evidence' ? 'E' : node.type === 'communication' ? 'C' : 'P'}
                </text>
                {/* Label below */}
                <text x={0} y={r + 12} textAnchor="middle" fill="#e2e8f0" fontSize={9} style={{ pointerEvents: 'none' }}>
                  {truncate(node.label, 18)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected node detail panel */}
      {selectedNode && (
        <div className="absolute top-3 right-3 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 text-sm space-y-2 z-10">
          <div className="flex justify-between items-start">
            <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
              selectedNode.type === 'incident' ? 'bg-red-100 text-red-700' :
              selectedNode.type === 'evidence' ? 'bg-blue-100 text-blue-700' :
              selectedNode.type === 'communication' ? 'bg-purple-100 text-purple-700' :
              'bg-amber-100 text-amber-700'
            }`}>{selectedNode.type}</span>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">×</button>
          </div>
          <p className="font-semibold text-slate-900 leading-snug">{selectedNode.label}</p>
          {selectedNode.type === 'incident' && (
            <>
              {selectedNode.severity && <p className="text-slate-500">Severity: <span className="font-medium capitalize">{selectedNode.severity}</span></p>}
              {selectedNode.rics?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">RICS Violations:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.rics.map((r, i) => <span key={i} className="text-xs bg-red-50 border border-red-200 text-red-700 px-1.5 py-0.5 rounded">{r}</span>)}
                  </div>
                </div>
              )}
              {selectedNode.raw?.description && <p className="text-xs text-slate-600 line-clamp-3">{selectedNode.raw.description}</p>}
            </>
          )}
          {selectedNode.type === 'evidence' && (
            <>
              {selectedNode.strength && <p className="text-slate-500">Strength: <span className="font-medium capitalize">{selectedNode.strength}</span></p>}
              {selectedNode.raw?.evidence_type && <p className="text-slate-500">Type: <span className="font-medium capitalize">{selectedNode.raw.evidence_type.replace(/_/g, ' ')}</span></p>}
            </>
          )}
          {selectedNode.type === 'communication' && (
            <>
              {selectedNode.tone && <p className="text-slate-500">Tone: <span className="font-medium capitalize">{selectedNode.tone}</span></p>}
              {selectedNode.raw?.from && <p className="text-slate-500">From: <span className="font-medium">{selectedNode.raw.from}</span></p>}
              {selectedNode.raw?.to && <p className="text-slate-500">To: <span className="font-medium">{selectedNode.raw.to}</span></p>}
            </>
          )}
          {selectedNode.type === 'person' && (
            <p className="text-xs text-slate-500">Individual identified in communications or incidents.</p>
          )}
          <p className="text-xs text-slate-400 pt-1 border-t">
            {rawLinks.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length} connection(s)
          </p>
        </div>
      )}

      {/* Zoom hint */}
      <div className="absolute bottom-3 left-3 text-xs text-slate-500 bg-slate-900/60 text-slate-300 px-2 py-1 rounded-lg">
        Scroll to zoom · Drag nodes · Click to inspect
      </div>
    </div>
  );
}