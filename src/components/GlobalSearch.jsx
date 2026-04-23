import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, AlertTriangle, FileText, MessageSquare, User, ChevronRight } from 'lucide-react';

const ENTITY_CONFIG = {
  incident:      { label: 'Incident',      icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50',    route: '/incidents' },
  evidence:      { label: 'Evidence',      icon: FileText,      color: 'text-green-600',  bg: 'bg-green-50',  route: '/evidence' },
  communication: { label: 'Communication', icon: MessageSquare, color: 'text-blue-600',   bg: 'bg-blue-50',   route: '/communications' },
  party:         { label: 'Party',          icon: User,          color: 'text-purple-600', bg: 'bg-purple-50', route: '/network-map' },
};

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 80);
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + query.length + 40);
  const snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  return snippet;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => base44.entities.Incident.list('-date') });
  const { data: evidence = [] } = useQuery({ queryKey: ['evidence'], queryFn: () => base44.entities.Evidence.list('-date_collected') });
  const { data: communications = [] } = useQuery({ queryKey: ['communications'], queryFn: () => base44.entities.Communication.list('-date') });
  const { data: parties = [] } = useQuery({ queryKey: ['caseParties'], queryFn: () => base44.entities.CaseParty.list() });

  const q = query.trim().toLowerCase();

  const results = q.length < 2 ? [] : [
    ...incidents.filter(i =>
      i.title?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.rics_violations?.some(v => v.toLowerCase().includes(q)) ||
      i.incident_type?.toLowerCase().includes(q)
    ).map(i => ({ type: 'incident', id: i.id, title: i.title, snippet: highlight(i.description, q), meta: i.severity, meta2: i.date, violations: i.rics_violations })),

    ...evidence.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.notes?.toLowerCase().includes(q) ||
      e.evidence_type?.toLowerCase().includes(q)
    ).map(e => ({ type: 'evidence', id: e.id, title: e.title, snippet: highlight(e.description, q), meta: e.strength, meta2: e.date_collected })),

    ...communications.filter(c =>
      c.subject?.toLowerCase().includes(q) ||
      c.content?.toLowerCase().includes(q) ||
      c.from?.toLowerCase().includes(q) ||
      c.to?.toLowerCase().includes(q)
    ).map(c => ({ type: 'communication', id: c.id, title: c.subject, snippet: `${c.from} → ${c.to}`, meta: c.tone, meta2: c.date })),

    ...parties.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.role_in_case?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    ).map(p => ({ type: 'party', id: p.id, title: p.name, snippet: p.role_in_case, meta: p.party_type })),
  ].slice(0, 12);

  useEffect(() => {
    if (q.length >= 2) setOpen(true);
    else setOpen(false);
  }, [q]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const goTo = (item) => {
    setQuery('');
    setOpen(false);
    navigate(ENTITY_CONFIG[item.type].route);
  };

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search incidents, evidence, communications… (⌘K)"
          className="pl-9 pr-8 bg-white border-slate-200 text-sm h-9"
          onFocus={() => q.length >= 2 && setOpen(true)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-[480px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">No results for "{query}"</div>
          ) : (
            Object.entries(grouped).map(([type, items]) => {
              const cfg = ENTITY_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <div key={type}>
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{cfg.label}s</span>
                    <span className="text-xs text-slate-400">({items.length})</span>
                  </div>
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => goTo(item)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-start gap-3 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                        {item.snippet && <p className="text-xs text-slate-500 truncate mt-0.5">{item.snippet}</p>}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {item.meta && <Badge variant="outline" className="text-xs py-0 px-1.5 capitalize">{item.meta}</Badge>}
                          {item.meta2 && <span className="text-xs text-slate-400">{item.meta2}</span>}
                          {item.violations?.slice(0, 2).map((v, i) => (
                            <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 rounded px-1">{v}</span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              );
            })
          )}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1">↵</kbd> to navigate</span>
          </div>
        </div>
      )}
    </div>
  );
}