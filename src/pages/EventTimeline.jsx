import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle, MessageSquare, FileText, Calendar, Filter, X,
  ChevronDown, ChevronUp, AlertCircle, Zap, Link2
} from 'lucide-react';
import AISummaryBanner from '@/components/AISummaryBanner';

// ── Type config ────────────────────────────────────────────────
const TYPE_CONFIG = {
  incident: {
    label: 'Incident',
    icon: AlertTriangle,
    dot: 'bg-red-500',
    border: 'border-red-200',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-800',
    line: 'bg-red-200',
  },
  communication: {
    label: 'Communication',
    icon: MessageSquare,
    dot: 'bg-purple-500',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-800',
    line: 'bg-purple-200',
  },
  evidence: {
    label: 'Evidence',
    icon: FileText,
    dot: 'bg-blue-500',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
    line: 'bg-blue-200',
  },
};

const SEVERITY_COLORS = {
  critical: 'bg-red-600',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-blue-400',
};

const TONE_COLORS = {
  aggressive: 'bg-red-100 text-red-800',
  threatening: 'bg-red-200 text-red-900',
  unprofessional: 'bg-orange-100 text-orange-800',
  dismissive: 'bg-yellow-100 text-yellow-800',
  neutral: 'bg-slate-100 text-slate-700',
  professional: 'bg-green-100 text-green-800',
};

// ── Single timeline card ───────────────────────────────────────
function TimelineCard({ event, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;

  const title =
    event.type === 'incident' ? event.record.title :
    event.type === 'communication' ? event.record.subject :
    event.record.title;

  const subtitle =
    event.type === 'incident'
      ? `${event.record.incident_type?.replace(/_/g, ' ')} · ${event.record.severity}`
      : event.type === 'communication'
      ? `${event.record.type?.replace(/_/g, ' ')} · ${event.record.from} → ${event.record.to}`
      : `${event.record.evidence_type?.replace(/_/g, ' ')} · ${event.record.strength}`;

  const hasDetail =
    event.record.description ||
    event.record.content ||
    event.record.rics_violations?.length ||
    event.record.concerning_elements?.length ||
    event.record.notes;

  return (
    <div className="flex gap-4 group">
      {/* Stem */}
      <div className="flex flex-col items-center flex-shrink-0 w-6">
        <div className={`w-3 h-3 rounded-full ring-2 ring-white ${cfg.dot} z-10 mt-1 flex-shrink-0`} />
        {!isLast && <div className="flex-1 w-0.5 bg-slate-200 mt-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-5 rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
        <div
          className="p-4 cursor-pointer"
          onClick={() => hasDetail && setExpanded(e => !e)}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.badge.replace('bg-', 'text-').split(' ')[0]}`} />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm leading-snug">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={`${cfg.badge} text-xs`}>{cfg.label}</Badge>
              {event.type === 'incident' && event.record.severity && (
                <span className={`inline-block w-2 h-2 rounded-full ${SEVERITY_COLORS[event.record.severity]}`} title={event.record.severity} />
              )}
              {event.type === 'communication' && event.record.tone && (
                <Badge className={`${TONE_COLORS[event.record.tone] || ''} text-xs`}>{event.record.tone}</Badge>
              )}
              {event.type === 'evidence' && event.record.strength && (
                <Badge variant="outline" className="text-xs">{event.record.strength}</Badge>
              )}
              <span className="text-xs text-slate-400">{event.dateLabel}</span>
              {hasDetail && (
                expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </div>

          {/* RICS violations inline tags */}
          {event.type === 'incident' && event.record.rics_violations?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.record.rics_violations.map((v, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-red-200 text-red-700 px-2 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5" />{v}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-white/60 px-4 pb-4 pt-3 space-y-2 text-sm text-slate-700">
            {(event.record.description || event.record.content) && (
              <p className="leading-relaxed">{event.record.description || event.record.content}</p>
            )}
            {event.record.notes && (
              <p className="italic text-slate-500">Notes: {event.record.notes}</p>
            )}
            {event.record.concerning_elements?.length > 0 && (
              <div>
                <p className="font-semibold text-xs text-slate-600 mb-1">Concerning Elements:</p>
                <ul className="list-disc ml-4 space-y-0.5">
                  {event.record.concerning_elements.map((el, i) => <li key={i}>{el}</li>)}
                </ul>
              </div>
            )}
            {event.record.legal_issues?.length > 0 && (
              <div>
                <p className="font-semibold text-xs text-slate-600 mb-1">Legal Issues:</p>
                <ul className="list-disc ml-4 space-y-0.5">
                  {event.record.legal_issues.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
              </div>
            )}
            {event.record.annotations && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs">
                ★ {event.record.annotations}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Month group header ─────────────────────────────────────────
function MonthHeader({ label, count }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <div className="w-6 flex justify-center">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400">{count} event{count !== 1 ? 's' : ''}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function EventTimeline() {
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list(),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  // Build unified event list
  const allEvents = useMemo(() => {
    const events = [];

    incidents.forEach(r => {
      const rec = r.data ?? r;
      const d = rec.date;
      if (!d) return;
      events.push({ type: 'incident', record: rec, id: r.id, sortDate: new Date(d), dateLabel: new Date(d).toLocaleDateString('en-GB') });
    });

    communications.forEach(r => {
      const rec = r.data ?? r;
      const d = rec.date;
      if (!d) return;
      events.push({ type: 'communication', record: rec, id: r.id, sortDate: new Date(d), dateLabel: new Date(d).toLocaleDateString('en-GB') });
    });

    evidence.forEach(r => {
      const rec = r.data ?? r;
      const d = rec.date_collected;
      if (!d) return;
      events.push({ type: 'evidence', record: rec, id: r.id, sortDate: new Date(d), dateLabel: new Date(d).toLocaleDateString('en-GB') });
    });

    return events.sort((a, b) => b.sortDate - a.sortDate);
  }, [incidents, communications, evidence]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(ev => {
      if (filterType !== 'all' && ev.type !== filterType) return false;
      if (filterSeverity !== 'all' && ev.type === 'incident' && ev.record.severity !== filterSeverity) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        const text = [ev.record.title, ev.record.subject, ev.record.description, ev.record.content].filter(Boolean).join(' ').toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (dateFrom && ev.sortDate < new Date(dateFrom)) return false;
      if (dateTo && ev.sortDate > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [allEvents, filterType, filterSeverity, searchText, dateFrom, dateTo]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map();
    filteredEvents.forEach(ev => {
      const key = ev.sortDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    });
    return Array.from(map.entries());
  }, [filteredEvents]);

  // Stats
  const incidentCount = filteredEvents.filter(e => e.type === 'incident').length;
  const commCount = filteredEvents.filter(e => e.type === 'communication').length;
  const evidenceCount = filteredEvents.filter(e => e.type === 'evidence').length;
  const criticalCount = filteredEvents.filter(e => e.type === 'incident' && e.record.severity === 'critical').length;

  const hasFilters = filterType !== 'all' || filterSeverity !== 'all' || searchText || dateFrom || dateTo;

  // AI prompt
  const aiPrompt = `You are a RICS compliance expert. Analyse the following chronological case events and identify cause-and-effect patterns, escalation trajectories, and potential RICS violations. Provide 4–6 bullet points covering: key patterns, escalation timeline, most concerning sequences of events, and recommended investigative focus areas.

Events (${filteredEvents.length} total, newest first):
${filteredEvents.slice(0, 60).map(e =>
  `[${e.dateLabel}] [${e.type.toUpperCase()}] ${e.record.title || e.record.subject || '—'} ${e.type === 'incident' ? '| Severity: ' + e.record.severity + (e.record.rics_violations?.length ? ' | RICS: ' + e.record.rics_violations.join(', ') : '') : ''} ${e.type === 'communication' ? '| Tone: ' + e.record.tone : ''} ${e.type === 'evidence' ? '| Strength: ' + e.record.strength : ''}`
).join('\n')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-6 h-6 text-slate-700" />
            <h1 className="text-3xl font-bold text-slate-900">Evidence & Incident Timeline</h1>
          </div>
          <p className="text-slate-500 text-sm">Chronological map of all evidence, communications, and incidents — click any card to expand detail</p>
        </div>

        {/* AI Summary */}
        <AISummaryBanner
          title="AI Pattern Analysis"
          colorScheme="indigo"
          disabled={allEvents.length === 0}
          disabledMsg="Add events first"
          prompt={aiPrompt}
        />

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Incidents', value: incidentCount, color: 'text-red-600', dot: 'bg-red-500' },
            { label: 'Communications', value: commCount, color: 'text-purple-600', dot: 'bg-purple-500' },
            { label: 'Evidence', value: evidenceCount, color: 'text-blue-600', dot: 'bg-blue-500' },
            { label: 'Critical', value: criticalCount, color: 'text-red-700', dot: 'bg-red-700' },
          ].map(s => (
            <Card key={s.label} className="py-3 px-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className="text-xs text-slate-500">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter &amp; Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Input
                placeholder="Search…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="text-sm"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="incident">Incidents</SelectItem>
                  <SelectItem value="communication">Communications</SelectItem>
                  <SelectItem value="evidence">Evidence</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" title="From date" />
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" title="To date" />
            </div>
            {hasFilters && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">{filteredEvents.length} of {allEvents.length} events shown</span>
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 text-xs h-6 px-2 ml-auto"
                  onClick={() => { setFilterType('all'); setFilterSeverity('all'); setSearchText(''); setDateFrom(''); setDateTo(''); }}>
                  <X className="w-3 h-3 mr-1" /> Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              <span className="text-slate-600">{cfg.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
            <Zap className="w-3 h-3 text-red-500" />
            <span className="text-slate-600">RICS Violation tag</span>
          </div>
        </div>

        {/* Timeline */}
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No events match your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div>
            {grouped.map(([month, events]) => (
              <div key={month}>
                <MonthHeader label={month} count={events.length} />
                {events.map((ev, idx) => (
                  <TimelineCard key={ev.id + ev.type} event={ev} isLast={idx === events.length - 1 && month === grouped[grouped.length - 1][0]} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}