import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, X, ChevronDown, ChevronUp, Mail } from 'lucide-react';

export default function EvidenceCommLinker({ evidence }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list('-date'),
    enabled: open,
  });

  // Parse linked comm IDs from evidence notes field (stored as JSON tag)
  const linkedIds = (() => {
    try {
      const match = (evidence.notes || '').match(/\[\[COMM_LINKS:(.*?)\]\]/);
      return match ? JSON.parse(match[1]) : [];
    } catch { return []; }
  })();

  const linkedComms = communications.filter(c => linkedIds.includes(c.id));
  const unlinkedComms = communications.filter(c => !linkedIds.includes(c.id));

  const saveLinks = async (newIds) => {
    setSaving(true);
    const tag = `[[COMM_LINKS:${JSON.stringify(newIds)}]]`;
    const baseNotes = (evidence.notes || '').replace(/\[\[COMM_LINKS:.*?\]\]/, '').trim();
    const newNotes = newIds.length > 0 ? `${baseNotes}\n${tag}`.trim() : baseNotes;
    await base44.entities.Evidence.update(evidence.id, { notes: newNotes });
    queryClient.invalidateQueries({ queryKey: ['evidence'] });
    setSaving(false);
  };

  const addLink = (commId) => saveLinks([...linkedIds, commId]);
  const removeLink = (commId) => saveLinks(linkedIds.filter(id => id !== commId));

  return (
    <div className="border-t border-slate-200 pt-2 mt-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-700 transition-colors"
      >
        <Link2 className="w-3.5 h-3.5" />
        <span className="font-medium">
          Linked Communications
          {linkedIds.length > 0 && (
            <span className="ml-1.5 bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5">{linkedIds.length}</span>
          )}
        </span>
        {open ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {/* Existing links */}
          {linkedComms.length > 0 && (
            <div className="space-y-1">
              {linkedComms.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 bg-indigo-50 border border-indigo-100 rounded px-2 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                    <span className="font-medium text-indigo-800 truncate">{c.subject}</span>
                    <span className="text-indigo-400 flex-shrink-0">{c.date}</span>
                    <Badge className="text-xs bg-indigo-100 text-indigo-600 border-0 flex-shrink-0">{c.from?.slice(0, 15)}</Badge>
                  </div>
                  <button
                    onClick={() => removeLink(c.id)}
                    className="text-indigo-400 hover:text-red-500 flex-shrink-0"
                    title="Remove link"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new links */}
          {unlinkedComms.length > 0 ? (
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
              {unlinkedComms.map(c => (
                <button
                  key={c.id}
                  onClick={() => addLink(c.id)}
                  disabled={saving}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 transition-colors text-xs"
                >
                  <Link2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-700 truncate flex-1">{c.subject}</span>
                  <span className="text-slate-400 flex-shrink-0">{c.date}</span>
                  <span className="text-slate-400 flex-shrink-0 truncate max-w-[80px]">{c.from}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">All communications are already linked.</p>
          )}

          {communications.length === 0 && (
            <p className="text-xs text-slate-400 italic">No communications found in the database.</p>
          )}
        </div>
      )}
    </div>
  );
}