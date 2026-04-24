import React, { useState } from 'react';
import { KEY_ENTITIES, buildEntityInteractions } from '@/lib/forceGraph';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, GitCommit, MessageSquare } from 'lucide-react';

// Fixed positions for key entities in a circular/organic layout
const POSITIONS = {
  entity_belcher:  { x: 420, y: 120 },
  entity_powell:   { x: 680, y: 300 },
  entity_bradley:  { x: 420, y: 480 },
  entity_vivid:    { x: 160, y: 300 },
  entity_markjones:{ x: 660, y: 480 },
};

const TONE_SEVERITY = { aggressive: 3, threatening: 3, unprofessional: 2, dismissive: 2, neutral: 1, professional: 0 };

function maxTone(tones) {
  if (!tones.length) return null;
  return tones.reduce((worst, t) => (TONE_SEVERITY[t] ?? 0) > (TONE_SEVERITY[worst] ?? 0) ? t : worst, tones[0]);
}

function edgeColor(tone, count) {
  if (tone === 'aggressive' || tone === 'threatening') return '#ef4444';
  if (tone === 'dismissive' || tone === 'unprofessional') return '#f97316';
  if (count >= 5) return '#a855f7';
  return '#64748b';
}

function edgeLabel(interaction) {
  const tone = maxTone(interaction.tones);
  const parts = [`${interaction.count} link${interaction.count !== 1 ? 's' : ''}`];
  if (tone) parts.push(tone);
  return parts.join(' · ');
}

const CONSPIRACY_NOTES = {
  'entity_belcher__entity_powell': {
    flag: 'Coordination suspected',
    detail: 'Belcher and Powell appear to have coordinated to restrict Bradley\'s access to direct communication with the freeholder. All contractor contact was routed through Belcher\'s office.',
    severity: 'critical',
  },
  'entity_belcher__entity_bradley': {
    flag: 'Direct misconduct',
    detail: 'Belcher downvalued Bradley\'s work, imposed retrospective documentation requirements, and sent communications described as aggressive and dismissive.',
    severity: 'high',
  },
  'entity_powell__entity_bradley': {
    flag: 'Gatekept by Belcher',
    detail: 'Bradley was denied direct contact with Powell. This gatekeeping may have been orchestrated jointly by Powell and Belcher to prevent Bradley asserting his rights.',
    severity: 'high',
  },
  'entity_belcher__entity_vivid': {
    flag: 'VIVID counter-valuations',
    detail: 'VIVID Housing submitted counter-valuations dramatically reducing Bradley\'s agreed rates. Belcher\'s involvement in the VIVID dispute requires investigation.',
    severity: 'medium',
  },
  'entity_bradley__entity_vivid': {
    flag: 'Downvaluation dispute',
    detail: 'VIVID countered Bradley\'s cost schedule across ~40+ line items, reducing agreed rates by up to 87.8% on individual items.',
    severity: 'high',
  },
  'entity_bradley__entity_markjones': {
    flag: 'Subcontract relationship',
    detail: 'Mark Jones (electrician) was engaged as a subcontractor on Victoria Street works. Invoice No. 2 (£400, April 2023) documented.',
    severity: 'low',
  },
};

function noteKey(a, b) {
  return [a, b].sort().join('__');
}

export default function ConspiracyView({ communications, incidents }) {
  const [selected, setSelected] = useState(null);

  const interactions = buildEntityInteractions(communications, incidents);

  const entityMap = Object.fromEntries(KEY_ENTITIES.map(e => [e.id, e]));

  const selectedInteraction = selected
    ? interactions.find(i => [i.a, i.b].sort().join('__') === selected) || null
    : null;
  const selectedNote = selected ? CONSPIRACY_NOTES[selected] : null;

  const W = 840, H = 600;

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-red-950/60 border border-red-700/50 rounded-xl p-4 text-sm">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-red-200">
          <strong className="text-red-100">Conspiracy / Influence Map</strong> — This view maps the relationships and communication flows between key parties. 
          Edge thickness represents interaction frequency; edge colour indicates the most severe tone detected.
          Red edges indicate aggressive or threatening communications. Purple indicates high-volume contact.
        </p>
      </div>

      {/* SVG map */}
      <div className="bg-slate-950 rounded-2xl border border-slate-700 overflow-hidden">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          <defs>
            <marker id="c-arrow" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" opacity="0.8" />
            </marker>
            <filter id="entity-glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background grid */}
          <rect width={W} height={H} fill="#020617" />
          {Array.from({ length: 20 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 30} x2={W} y2={i * 30} stroke="#1e293b" strokeWidth={1} />
          ))}
          {Array.from({ length: 30 }, (_, i) => (
            <line key={`v${i}`} x1={i * 30} y1={0} x2={i * 30} y2={H} stroke="#1e293b" strokeWidth={1} />
          ))}

          {/* Edges */}
          {interactions.map((interaction, idx) => {
            const posA = POSITIONS[interaction.a];
            const posB = POSITIONS[interaction.b];
            if (!posA || !posB) return null;
            const tone = maxTone(interaction.tones);
            const color = edgeColor(tone, interaction.count);
            const weight = Math.min(1 + interaction.count * 0.6, 8);
            const k = noteKey(interaction.a, interaction.b);
            const isSelected = selected === k;
            const mx = (posA.x + posB.x) / 2;
            const my = (posA.y + posB.y) / 2;

            return (
              <g key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelected(isSelected ? null : k)}>
                <line
                  x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y}
                  stroke={color}
                  strokeWidth={isSelected ? weight + 3 : weight}
                  opacity={selected && !isSelected ? 0.15 : 0.75}
                  strokeDasharray={interaction.count < 2 ? '6,4' : undefined}
                  markerEnd="url(#c-arrow)"
                />
                {/* Edge label */}
                <text x={mx} y={my - 6} textAnchor="middle" fill={color} fontSize={10} fontWeight="600" opacity={selected && !isSelected ? 0.1 : 0.9}>
                  {edgeLabel(interaction)}
                </text>
                {/* Clickable hit area */}
                <line
                  x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y}
                  stroke="transparent"
                  strokeWidth={20}
                />
              </g>
            );
          })}

          {/* Entity nodes */}
          {KEY_ENTITIES.map(entity => {
            const pos = POSITIONS[entity.id];
            if (!pos) return null;
            const isInvolved = selected && (
              interactions.find(i => noteKey(i.a, i.b) === selected && (i.a === entity.id || i.b === entity.id))
            );
            const isDimmed = selected && !isInvolved;

            return (
              <g key={entity.id} transform={`translate(${pos.x},${pos.y})`}
                style={{ opacity: isDimmed ? 0.3 : 1 }}
                filter={isInvolved ? 'url(#entity-glow)' : undefined}
              >
                {/* Outer ring */}
                <circle cx={0} cy={0} r={42} fill="none" stroke={entity.color} strokeWidth={2.5} opacity={0.6} />
                {/* Inner fill */}
                <circle cx={0} cy={0} r={34} fill={entity.color} opacity={0.9} />
                {/* Initials */}
                <text x={0} y={2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={13} fontWeight="800" style={{ pointerEvents: 'none' }}>
                  {entity.label.split(' ').map(w => w[0]).join('').slice(0, 3)}
                </text>
                {/* Name below */}
                <text x={0} y={50} textAnchor="middle" fill={entity.color} fontSize={11} fontWeight="700" style={{ pointerEvents: 'none' }}>
                  {entity.label.split(' ').slice(0, 2).join(' ')}
                </text>
                <text x={0} y={63} textAnchor="middle" fill="#94a3b8" fontSize={9} style={{ pointerEvents: 'none' }}>
                  {entity.role}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected edge detail */}
      {selected && (selectedInteraction || selectedNote) && (() => {
        const eA = entityMap[selectedInteraction?.a];
        const eB = entityMap[selectedInteraction?.b];
        const note = selectedNote;
        return (
          <Card className="bg-slate-800 border-slate-600">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-slate-400" />
                {eA?.label} ↔ {eB?.label}
                {note && (
                  <Badge className={`ml-2 text-xs ${note.severity === 'critical' ? 'bg-red-700 text-red-100' : note.severity === 'high' ? 'bg-orange-700 text-orange-100' : 'bg-slate-600 text-slate-200'}`}>
                    {note.flag}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3 text-sm">
              {note && <p className="text-slate-300">{note.detail}</p>}
              {selectedInteraction && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  <div className="bg-slate-900 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Total links</p>
                    <p className="text-xl font-bold text-white">{selectedInteraction.count}</p>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Worst tone</p>
                    <p className="text-sm font-semibold text-orange-300 capitalize">{maxTone(selectedInteraction.tones) || '—'}</p>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Subjects</p>
                    <p className="text-xs text-slate-300 line-clamp-2">{selectedInteraction.subjects.slice(0, 3).join(' · ') || '—'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Interaction summary table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" /> All Entity Interactions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {interactions.length === 0 ? (
            <p className="text-xs text-slate-500">No interactions detected yet. Add communications with known party names (Bradley, Belcher, Powell, VIVID, Mark Jones).</p>
          ) : (
            <div className="space-y-2">
              {interactions.sort((a, b) => b.count - a.count).map((i, idx) => {
                const eA = entityMap[i.a];
                const eB = entityMap[i.b];
                if (!eA || !eB) return null;
                const tone = maxTone(i.tones);
                const k = noteKey(i.a, i.b);
                const note = CONSPIRACY_NOTES[k];
                return (
                  <button
                    key={idx}
                    onClick={() => setSelected(prev => prev === k ? null : k)}
                    className={`w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${selected === k ? 'bg-slate-600' : 'hover:bg-slate-700/60'}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-bold" style={{ color: eA.color }}>{eA.label.split(' ')[0]}</span>
                      <span className="text-slate-500 text-xs">↔</span>
                      <span className="text-xs font-bold" style={{ color: eB.color }}>{eB.label.split(' ')[0]}</span>
                    </div>
                    <span className="text-xs text-slate-400">{i.count} link{i.count !== 1 ? 's' : ''}</span>
                    {tone && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tone === 'aggressive' || tone === 'threatening' ? 'bg-red-900/60 text-red-300' :
                        tone === 'dismissive' || tone === 'unprofessional' ? 'bg-orange-900/60 text-orange-300' :
                        'bg-slate-700 text-slate-400'
                      } capitalize`}>{tone}</span>
                    )}
                    {note && (
                      <span className={`text-xs px-2 py-0.5 rounded-full hidden sm:inline ${
                        note.severity === 'critical' ? 'bg-red-800/60 text-red-300' :
                        note.severity === 'high' ? 'bg-orange-800/60 text-orange-300' :
                        'bg-slate-700 text-slate-400'
                      }`}>{note.flag}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}