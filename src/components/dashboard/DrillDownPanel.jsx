import React from 'react';
import { X, AlertTriangle, Calendar, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const TYPE_LABELS = {
  communication: 'Communication',
  professional_conduct: 'Professional Conduct',
  document_issue: 'Document Issue',
  gatekeeping: 'Gatekeeping',
  information_control: 'Information Control',
  harassment: 'Harassment',
  other: 'Other',
};

export default function DrillDownPanel({ incidents, label, onClose }) {
  if (!incidents?.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-slate-900">Incidents — {label}</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{incidents.length}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
          {incidents.map(inc => (
            <div key={inc.id} className="border border-slate-200 rounded-xl p-3 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-slate-900 text-sm leading-tight">{inc.title}</p>
                <Badge className={`shrink-0 text-xs border ${SEVERITY_STYLES[inc.severity] || ''}`}>
                  {inc.severity}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-2">{inc.description}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {inc.date ? format(new Date(inc.date), 'dd MMM yyyy') : '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {TYPE_LABELS[inc.incident_type] || inc.incident_type}
                </span>
                {inc.rics_violations?.length > 0 && (
                  <span className="text-red-500">{inc.rics_violations.length} RICS violation{inc.rics_violations.length > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-400">{incidents.length} incident{incidents.length !== 1 ? 's' : ''} found</p>
          <Link to="/incidents">
            <Button size="sm" variant="outline">View All Incidents</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}