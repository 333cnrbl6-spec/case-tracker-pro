import React, { useState, useMemo, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, AlertTriangle, FileText, MessageSquare, User, Zap, RefreshCw } from 'lucide-react';
import NetworkGraph from '@/components/NetworkGraph';
import { buildGraphData } from '@/lib/forceGraph';

const LEGEND = [
  { type: 'incident', color: 'bg-red-500', label: 'Incident', letter: 'I' },
  { type: 'evidence', color: 'bg-blue-500', label: 'Evidence', letter: 'E' },
  { type: 'communication', color: 'bg-purple-500', label: 'Communication', letter: 'C' },
  { type: 'person', color: 'bg-amber-500', label: 'Individual', letter: 'P' },
];

const LINK_LEGEND = [
  { stroke: 'bg-red-500', label: 'Causal link (incident ↔ comm)', dash: true },
  { stroke: 'bg-blue-500', label: 'Evidence supports incident', dash: true },
  { stroke: 'bg-amber-500', label: 'Witness / Party present', dash: true },
];

export default function NetworkMap() {
  const containerRef = useRef(null);
  const [graphKey, setGraphKey] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 900, height: 620 });
  const [filterType, setFilterType] = useState('all');

  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => base44.entities.Incident.list() });
  const { data: communications = [] } = useQuery({ queryKey: ['communications'], queryFn: () => base44.entities.Communication.list() });
  const { data: evidence = [] } = useQuery({ queryKey: ['evidence'], queryFn: () => base44.entities.Evidence.list() });

  // Responsive width
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setDimensions({ width: Math.floor(w), height: Math.max(500, Math.floor(w * 0.62)) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const { nodes: allNodes, links: allLinks } = useMemo(
    () => buildGraphData(incidents, communications, evidence),
    [incidents, communications, evidence]
  );

  // Filter nodes/links by type
  const { nodes, links } = useMemo(() => {
    if (filterType === 'all') return { nodes: allNodes, links: allLinks };
    const allowedTypes = new Set(['person', filterType]);
    const filtered = allNodes.filter(n => allowedTypes.has(n.type));
    const filteredIds = new Set(filtered.map(n => n.id));
    return {
      nodes: filtered,
      links: allLinks.filter(l => filteredIds.has(l.source) && filteredIds.has(l.target)),
    };
  }, [allNodes, allLinks, filterType]);

  // Stats
  const incidentCount = allNodes.filter(n => n.type === 'incident').length;
  const evidenceCount = allNodes.filter(n => n.type === 'evidence').length;
  const commCount = allNodes.filter(n => n.type === 'communication').length;
  const personCount = allNodes.filter(n => n.type === 'person').length;
  const criticalIncidents = incidents.filter(r => (r.data ?? r).severity === 'critical').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Network className="w-6 h-6 text-slate-300" />
              <h1 className="text-2xl font-bold text-white">Case Network Map</h1>
            </div>
            <p className="text-slate-400 text-sm">Visual interconnection map of incidents, evidence, communications, and individuals</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700"
            onClick={() => setGraphKey(k => k + 1)}>
            <RefreshCw className="w-4 h-4" /> Re-layout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Incidents', value: incidentCount, icon: AlertTriangle, color: 'text-red-400' },
            { label: 'Evidence', value: evidenceCount, icon: FileText, color: 'text-blue-400' },
            { label: 'Communications', value: commCount, icon: MessageSquare, color: 'text-purple-400' },
            { label: 'Individuals', value: personCount, icon: User, color: 'text-amber-400' },
            { label: 'Critical', value: criticalIncidents, icon: Zap, color: 'text-red-300' },
          ].map(s => (
            <Card key={s.label} className="bg-slate-800 border-slate-700">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All' },
            { value: 'incident', label: 'Incidents' },
            { value: 'evidence', label: 'Evidence' },
            { value: 'communication', label: 'Communications' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => { setFilterType(f.value); setGraphKey(k => k + 1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === f.value
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500 self-center">{nodes.length} nodes · {links.length} connections</span>
        </div>

        {/* Graph canvas */}
        <div ref={containerRef} className="w-full rounded-2xl overflow-hidden border border-slate-700">
          <NetworkGraph key={graphKey} nodes={nodes} links={links} width={dimensions.width} height={dimensions.height} />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-slate-400 uppercase tracking-wide">Node Types</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {LEGEND.map(l => (
                  <div key={l.type} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${l.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{l.letter}</div>
                    <span className="text-sm text-slate-300">{l.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">Red ring = critical severity incident</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-slate-400 uppercase tracking-wide">Connection Types</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {LINK_LEGEND.map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${l.stroke} flex-shrink-0`} />
                    <div className="w-8 border-t-2 border-dashed border-slate-500" />
                  </div>
                  <span className="text-xs text-slate-300">{l.label}</span>
                </div>
              ))}
              <p className="text-xs text-slate-500 pt-1">Arrow direction shows cause → effect flow</p>
            </CardContent>
          </Card>
        </div>

        {/* RICS clusters summary */}
        {incidents.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-400" /> RICS Violation Clusters
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const ruleCounts = {};
                  incidents.forEach(r => {
                    const rec = r.data ?? r;
                    (rec.rics_violations || []).forEach(v => { ruleCounts[v] = (ruleCounts[v] || 0) + 1; });
                  });
                  const sorted = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]);
                  if (sorted.length === 0) return <p className="text-xs text-slate-500">No RICS violations mapped yet.</p>;
                  return sorted.map(([rule, count]) => (
                    <span key={rule} className="inline-flex items-center gap-1.5 bg-red-900/40 border border-red-700/50 text-red-300 text-xs px-2.5 py-1 rounded-full">
                      <Zap className="w-3 h-3" />{rule}
                      <span className="bg-red-700/60 text-red-200 px-1.5 rounded-full">{count}</span>
                    </span>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}