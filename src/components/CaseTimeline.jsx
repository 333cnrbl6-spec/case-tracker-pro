import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MessageSquare, FileText, GripVertical, X, Save, Filter } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  incident: {
    label: 'Incident',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
    line: 'border-red-200',
  },
  communication: {
    label: 'Communication',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    line: 'border-blue-200',
  },
  evidence: {
    label: 'Evidence',
    icon: FileText,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    line: 'border-emerald-200',
  },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function EditDialog({ item, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...item.raw });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (item.type === 'incident') return base44.entities.Incident.update(item.id, data);
      if (item.type === 'communication') return base44.entities.Communication.update(item.id, data);
      return base44.entities.Evidence.update(item.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-communications'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-evidence'] });
      toast.success('Saved');
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const dateField = item.type === 'evidence' ? 'date_collected' : 'date';
  const titleField = item.type === 'communication' ? 'subject' : 'title';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {TYPE_CONFIG[item.type].label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-sm font-medium mb-1 block">
              {item.type === 'communication' ? 'Subject' : 'Title'}
            </label>
            <Input value={form[titleField] || ''} onChange={e => setForm({ ...form, [titleField]: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Date</label>
            <Input type="date" value={form[dateField] || ''} onChange={e => setForm({ ...form, [dateField]: e.target.value })} />
          </div>
          {item.type === 'incident' && (
            <>
              <div>
                <label className="text-sm font-medium mb-1 block">Severity</label>
                <Select value={form.severity || 'medium'} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-20" />
              </div>
            </>
          )}
          {item.type === 'communication' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">From</label>
                  <Input value={form.from || ''} onChange={e => setForm({ ...form, from: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">To</label>
                  <Input value={form.to || ''} onChange={e => setForm({ ...form, to: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Content</label>
                <Textarea value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} className="min-h-20" />
              </div>
            </>
          )}
          {item.type === 'evidence' && (
            <>
              <div>
                <label className="text-sm font-medium mb-1 block">Strength</label>
                <Select value={form.strength || 'moderate'} onValueChange={v => setForm({ ...form, strength: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weak">Weak</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-20" />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 gap-1"
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending}
            >
              <Save className="w-4 h-4" /> {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CaseTimeline() {
  const [filter, setFilter] = useState('all');
  const [editItem, setEditItem] = useState(null);
  const [localOrder, setLocalOrder] = useState(null); // manual drag-reorder override

  const { data: incidents = [] } = useQuery({
    queryKey: ['timeline-incidents'],
    queryFn: () => base44.entities.Incident.list('-date'),
  });
  const { data: communications = [] } = useQuery({
    queryKey: ['timeline-communications'],
    queryFn: () => base44.entities.Communication.list('-date'),
  });
  const { data: evidence = [] } = useQuery({
    queryKey: ['timeline-evidence'],
    queryFn: () => base44.entities.Evidence.list('-date_collected'),
  });

  const allItems = useMemo(() => {
    const mapped = [
      ...incidents.map(i => ({ id: i.id, type: 'incident', date: i.date, title: i.title, sub: i.severity, raw: i })),
      ...communications.map(c => ({ id: c.id, type: 'communication', date: c.date, title: c.subject, sub: `${c.from} → ${c.to}`, raw: c })),
      ...evidence.map(e => ({ id: e.id, type: 'evidence', date: e.date_collected, title: e.title, sub: e.strength, raw: e })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    return mapped;
  }, [incidents, communications, evidence]);

  const displayed = useMemo(() => {
    const base = localOrder || allItems;
    if (filter === 'all') return base;
    return base.filter(i => i.type === filter);
  }, [allItems, localOrder, filter]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const list = [...displayed];
    const [moved] = list.splice(result.source.index, 1);
    list.splice(result.destination.index, 0, moved);
    // Rebuild full order: replace displayed items in localOrder (or allItems) with new order
    const newOrder = filter === 'all'
      ? list
      : [...(localOrder || allItems).filter(i => i.type !== filter), ...list].sort((a, b) => {
          const ia = list.findIndex(x => x.id === a.id && x.type === a.type);
          const ib = list.findIndex(x => x.id === b.id && x.type === b.type);
          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });
    setLocalOrder(newOrder);
  };

  const typeGroups = { incident: 0, communication: 0, evidence: 0 };
  allItems.forEach(i => typeGroups[i.type]++);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400" />
        {['all', 'incident', 'communication', 'evidence'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'
            }`}
          >
            {f === 'all' ? `All (${allItems.length})` : `${TYPE_CONFIG[f].label}s (${typeGroups[f]})`}
          </button>
        ))}
        {localOrder && (
          <button
            onClick={() => setLocalOrder(null)}
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-red-500"
          >
            <X className="w-3 h-3" /> Reset order
          </button>
        )}
      </div>

      {displayed.length === 0 && (
        <div className="text-center py-16 text-slate-400">No items to display on the timeline yet.</div>
      )}

      {/* Timeline */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="timeline">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="relative">
              {/* vertical line */}
              <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 z-0" />

              {displayed.map((item, index) => {
                const cfg = TYPE_CONFIG[item.type];
                const Icon = cfg.icon;
                return (
                  <Draggable key={`${item.type}-${item.id}`} draggableId={`${item.type}-${item.id}`} index={index}>
                    {(drag, snapshot) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        className={`flex gap-4 mb-3 relative z-10 ${snapshot.isDragging ? 'opacity-80' : ''}`}
                      >
                        {/* Dot + drag handle column */}
                        <div className="flex flex-col items-center w-14 shrink-0">
                          <div {...drag.dragHandleProps} className="p-1 cursor-grab text-slate-300 hover:text-slate-500 mt-0.5">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 border-white shadow ${cfg.dot} mt-0.5`} />
                        </div>

                        {/* Card */}
                        <div
                          className={`flex-1 border rounded-lg px-4 py-3 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-300' : ''}`}
                          onClick={() => setEditItem(item)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge className={`${cfg.color} gap-1 py-0`}>
                                  <Icon className="w-3 h-3" />
                                  {cfg.label}
                                </Badge>
                                <span className="text-xs text-slate-400">{formatDate(item.date)}</span>
                              </div>
                              <p className="font-medium text-slate-800 text-sm truncate">{item.title || '(no title)'}</p>
                              {item.sub && <p className="text-xs text-slate-500 mt-0.5 capitalize">{item.sub}</p>}
                            </div>
                            <span className="text-xs text-slate-300 shrink-0 mt-1">click to edit</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {editItem && <EditDialog item={editItem} onClose={() => setEditItem(null)} />}
    </div>
  );
}