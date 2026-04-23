import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * AnnotationPanel — inline notes editor for an entity record.
 *
 * Props:
 *   entityName  — e.g. 'Evidence' | 'Communication'
 *   recordId    — record id
 *   field       — which field stores the annotation (default 'annotations')
 *   value       — current value of that field
 *   queryKey    — react-query key to invalidate on save (e.g. ['evidence'])
 *   readOnly    — if true, only shows saved note (no edit UI)
 */
export default function AnnotationPanel({ entityName, recordId, field = 'annotations', value = '', queryKey, readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const queryClient = useQueryClient();

  // Keep draft in sync if parent value changes (e.g. after refetch)
  useEffect(() => { setDraft(value); }, [value]);

  const saveMutation = useMutation({
    mutationFn: (text) => base44.entities[entityName].update(recordId, { [field]: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditing(false);
      toast.success('Annotation saved');
    },
    onError: () => toast.error('Failed to save annotation'),
  });

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (readOnly) {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
        <StickyNote className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <p className="text-slate-700 whitespace-pre-wrap">{value}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!editing ? (
        <div>
          {value ? (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm group">
              <StickyNote className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-yellow-700 mb-1">Your Annotation</p>
                <p className="text-slate-700 whitespace-pre-wrap">{value}</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-700 transition-colors px-1 py-1"
            >
              <StickyNote className="w-3.5 h-3.5" />
              Add annotation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add your notes or annotations here…"
            className="min-h-24 text-sm bg-yellow-50 border-yellow-300 focus-visible:ring-yellow-400"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={handleCancel} className="gap-1">
              <X className="w-3 h-3" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate(draft)}
              disabled={saveMutation.isPending}
              className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Check className="w-3 h-3" />
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}