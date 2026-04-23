import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowUpRight, Loader2, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const COLUMNS = [
  {
    id: 'open',
    label: 'Initial Report',
    color: 'border-t-slate-400',
    headerColor: 'bg-slate-100 text-slate-700',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Newly logged, awaiting triage',
  },
  {
    id: 'reviewed',
    label: 'Under Review',
    color: 'border-t-blue-400',
    headerColor: 'bg-blue-50 text-blue-700',
    icon: <Loader2 className="w-4 h-4" />,
    description: 'Being actively investigated',
  },
  {
    id: 'assessed',
    label: 'Assessed',
    color: 'border-t-amber-400',
    headerColor: 'bg-amber-50 text-amber-700',
    icon: <ShieldAlert className="w-4 h-4" />,
    description: 'Reviewed, risk assessment complete',
  },
  {
    id: 'escalated',
    label: 'Escalated',
    color: 'border-t-red-500',
    headerColor: 'bg-red-50 text-red-700',
    icon: <ArrowUpRight className="w-4 h-4" />,
    description: 'Escalated for legal/formal action',
  },
];

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const SEVERITY_BORDER = {
  low: 'border-l-blue-300',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-400',
  critical: 'border-l-red-500',
};

function IncidentCard({ incident, index }) {
  return (
    <Draggable draggableId={incident.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border border-l-4 ${SEVERITY_BORDER[incident.severity] ?? 'border-l-slate-300'} shadow-sm p-3 mb-2 select-none transition-shadow ${snapshot.isDragging ? 'shadow-lg rotate-1 ring-2 ring-slate-300' : 'hover:shadow-md'}`}
        >
          <p className="text-sm font-semibold text-slate-900 leading-snug mb-2 line-clamp-2">{incident.title}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge className={`text-xs ${SEVERITY_COLORS[incident.severity] ?? ''}`}>
              {incident.severity}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {incident.incident_type?.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{incident.date}</span>
            {incident.rics_violations?.length > 0 && (
              <span className="text-xs text-red-600 font-medium">{incident.rics_violations.length} RICS</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function IncidentKanban() {
  const queryClient = useQueryClient();
  const [movingId, setMovingId] = useState(null);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Incident.update(id, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      const col = COLUMNS.find(c => c.id === status);
      toast.success(`Moved to "${col?.label ?? status}"`);
    },
    onSettled: () => setMovingId(null),
  });

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = incidents.filter(i => (i.status ?? 'open') === col.id);
    return acc;
  }, {});

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    setMovingId(draggableId);
    updateMutation.mutate({ id: draggableId, status: destination.droppableId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-slate-500" />
            Incident Status Board
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Drag and drop incidents to update their status. {incidents.length} total incident{incidents.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <Link to="/incidents">
          <Button variant="outline" className="gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" />
            List View
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const colIncidents = grouped[col.id] ?? [];
              return (
                <div key={col.id} className={`bg-white rounded-xl shadow-sm border-t-4 ${col.color} flex flex-col min-h-[500px]`}>
                  {/* Column Header */}
                  <div className={`px-4 py-3 rounded-t-lg ${col.headerColor} border-b border-slate-100`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        {col.icon}
                        {col.label}
                      </div>
                      <span className="text-xs font-bold bg-white bg-opacity-70 rounded-full px-2 py-0.5">
                        {colIncidents.length}
                      </span>
                    </div>
                    <p className="text-xs opacity-70">{col.description}</p>
                  </div>

                  {/* Droppable zone */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 transition-colors rounded-b-xl ${snapshot.isDraggingOver ? 'bg-slate-50' : ''}`}
                      >
                        {colIncidents.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex flex-col items-center justify-center h-32 text-slate-300 text-xs text-center gap-2">
                            <CheckCircle2 className="w-6 h-6" />
                            Drop incidents here
                          </div>
                        )}
                        {colIncidents.map((incident, index) => (
                          <div key={incident.id} className="relative">
                            {movingId === incident.id && (
                              <div className="absolute inset-0 bg-white bg-opacity-60 rounded-lg flex items-center justify-center z-10">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                              </div>
                            )}
                            <IncidentCard incident={incident} index={index} />
                          </div>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}