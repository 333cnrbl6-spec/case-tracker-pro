import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, FileText, MessageSquare, CheckCircle2,
  ArrowUpRight, Clock, ChevronDown, ChevronUp, Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

/* ─── Config ─────────────────────────────────────────────── */
const ENTRY_TYPES = {
  incident:      { label: 'Incident Logged',    color: 'bg-red-100 text-red-700 border-red-200',     dot: 'bg-red-500',    icon: AlertTriangle },
  status_change: { label: 'Status Updated',     color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500', icon: CheckCircle2 },
  evidence:      { label: 'Evidence Added',     color: 'bg-blue-100 text-blue-700 border-blue-200',   dot: 'bg-blue-500',   icon: FileText },
  communication: { label: 'Communication',      color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500',  icon: MessageSquare },
  escalation:    { label: 'Escalated',          color: 'bg-red-100 text-red-800 border-red-300',      dot: 'bg-red-700',    icon: ArrowUpRight },
};

const STATUS_LABELS = {
  open: 'Open',
  reviewed: 'Under Review',
  assessed: 'Assessed',
  escalated: 'Escalated',
};

function parseDate(str) {
  if (!str) return null;
  try { return parseISO(str); } catch { return null; }
}

function formatDate(str) {
  const d = parseDate(str);
  return d ? format(d, 'd MMM yyyy') : str;
}

/* ─── Single timeline entry ─────────────────────────────── */
function TimelineEntry({ entry, isLast }) {
  const cfg = ENTRY_TYPES[entry.type] || ENTRY_TYPES.evidence;
  const Icon = cfg.icon;

  return (
    <div className="flex gap-3 group">
      {/* Spine */}
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ring-2 ring-white ${cfg.dot}`} />
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1" />}
      </div>

      {/* Content */}
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(entry.date)}
          </span>
          {entry.sub && (
            <span className="text-xs text-slate-500 italic">{entry.sub}</span>
          )}
        </div>
        <p className="text-sm text-slate-700 font-medium leading-snug">{entry.title}</p>
        {entry.detail && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{entry.detail}</p>
        )}
        {entry.badges?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {entry.badges.map((b, i) => (
              <Badge key={i} variant="outline" className="text-xs py-0">{b}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function IncidentTimeline({ incident, evidence = [], communications = [] }) {
  const [open, setOpen] = useState(false);

  const entries = useMemo(() => {
    const list = [];

    // 1. Incident logged
    list.push({
      type: 'incident',
      date: incident.date,
      title: incident.title,
      detail: incident.description?.slice(0, 160),
      badges: incident.rics_violations?.slice(0, 3),
    });

    // 2. Status changes inferred from current status
    if (incident.status && incident.status !== 'open') {
      list.push({
        type: incident.status === 'escalated' ? 'escalation' : 'status_change',
        date: incident.updated_date || incident.date,
        title: `Status changed to "${STATUS_LABELS[incident.status] || incident.status}"`,
        detail: incident.status === 'escalated' ? 'Case escalated for formal investigation or legal action.' : null,
      });
    }

    // 3. Related evidence
    const relatedEvidence = evidence.filter(e =>
      e.related_incidents?.includes(incident.id) ||
      incident.evidence_notes?.toLowerCase().includes(e.title?.toLowerCase())
    );
    relatedEvidence.forEach(ev => {
      list.push({
        type: 'evidence',
        date: ev.date_collected,
        title: ev.title || 'Evidence document',
        detail: ev.description,
        sub: ev.evidence_type?.replace(/_/g, ' '),
        badges: ev.strength ? [`Strength: ${ev.strength}`] : [],
      });
    });

    // 4. Related communications
    const relatedComms = communications.filter(c =>
      c.related_incidents?.includes(incident.id)
    );
    relatedComms.forEach(comm => {
      list.push({
        type: 'communication',
        date: comm.date,
        title: comm.subject || 'Communication',
        detail: comm.content?.slice(0, 140),
        sub: `${comm.type?.replace(/_/g, ' ')} · ${comm.from} → ${comm.to}`,
        badges: comm.tone && comm.tone !== 'neutral' ? [comm.tone] : [],
      });
    });

    // Sort by date ascending
    return list.sort((a, b) => {
      const da = parseDate(a.date);
      const db = parseDate(b.date);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });
  }, [incident, evidence, communications]);

  const total = entries.length;
  // Always show the first entry (incident itself) + rest behind toggle
  const visible = open ? entries : entries.slice(0, 1);
  const hidden  = total - 1;

  return (
    <div className="border-t border-slate-100 pt-3 mt-1">
      <button
        className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3 w-full text-left"
        onClick={() => setOpen(o => !o)}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>Case Timeline</span>
        <span className="ml-auto flex items-center gap-1 text-slate-400">
          {total} event{total !== 1 ? 's' : ''}
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {open && (
        <div className="pl-1">
          {visible.map((entry, i) => (
            <TimelineEntry key={i} entry={entry} isLast={i === visible.length - 1} />
          ))}
        </div>
      )}

      {!open && hidden > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-blue-600 hover:underline ml-4"
        >
          + {hidden} more event{hidden !== 1 ? 's' : ''} (evidence, communications, status updates)
        </button>
      )}
    </div>
  );
}