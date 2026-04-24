import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageSquare, FileText, Filter, Download, GripVertical, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const eventTypeConfig = {
  incident: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Incident'
  },
  communication: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Communication'
  },
  evidence: {
    icon: FileText,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Evidence'
  }
};

const severityColors = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-600 text-white',
  medium: 'bg-yellow-600 text-white',
  low: 'bg-blue-600 text-white'
};

export default function InteractiveEventTimeline() {
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [events, setEvents] = useState([]);
  const [orderedEventIds, setOrderedEventIds] = useState([]);
  const queryClient = useQueryClient();

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-date'),
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list('-date'),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list('-date_collected'),
  });

  // Combine all events
  useMemo(() => {
    const combined = [
      ...incidents.map(i => ({
        id: `incident-${i.id}`,
        originalId: i.id,
        type: 'incident',
        date: i.date,
        title: i.title,
        description: i.description,
        severity: i.severity,
        content: i,
      })),
      ...communications.map(c => ({
        id: `communication-${c.id}`,
        originalId: c.id,
        type: 'communication',
        date: c.date,
        title: `${c.from} → ${c.to}`,
        description: c.subject,
        severity: c.tone || 'neutral',
        content: c,
      })),
      ...evidence.map(e => ({
        id: `evidence-${e.id}`,
        originalId: e.id,
        type: 'evidence',
        date: e.date_collected,
        title: e.title,
        description: e.description,
        severity: e.strength || 'moderate',
        content: e,
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    setEvents(combined);
    if (orderedEventIds.length === 0) {
      setOrderedEventIds(combined.map(e => e.id));
    }
  }, [incidents, communications, evidence]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return orderedEventIds
      .map(id => events.find(e => e.id === id))
      .filter(e => e && (filterType === 'all' || e.type === filterType))
      .filter(e => e && (filterSeverity === 'all' || e.severity === filterSeverity));
  }, [events, orderedEventIds, filterType, filterSeverity]);

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const newOrder = Array.from(orderedEventIds);
    const [movedId] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, movedId);
    setOrderedEventIds(newOrder);
  };

  const exportTimeline = () => {
    const csvContent = [
      ['Date', 'Type', 'Title', 'Description', 'Severity'],
      ...filteredEvents.map(e => [
        e.date,
        e.type,
        e.title,
        e.description,
        e.severity
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeline-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Timeline exported to CSV');
  };

  const eventTypeCounts = {
    incident: events.filter(e => e.type === 'incident').length,
    communication: events.filter(e => e.type === 'communication').length,
    evidence: events.filter(e => e.type === 'evidence').length
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-indigo-600" /> Interactive Event Timeline
          </h1>
          <p className="text-slate-600">Chronological view of incidents, communications, and evidence with drag-and-drop reordering</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filter by Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Events', count: events.length },
                    { value: 'incident', label: 'Incidents', count: eventTypeCounts.incident },
                    { value: 'communication', label: 'Communications', count: eventTypeCounts.communication },
                    { value: 'evidence', label: 'Evidence', count: eventTypeCounts.evidence },
                  ].map(option => (
                    <Button
                      key={option.value}
                      onClick={() => setFilterType(option.value)}
                      variant={filterType === option.value ? 'default' : 'outline'}
                      className={filterType === option.value ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                      size="sm"
                    >
                      {option.label} ({option.count})
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Filter by Severity</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Severities' },
                    { value: 'critical', label: 'Critical' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ].map(option => (
                    <Button
                      key={option.value}
                      onClick={() => setFilterSeverity(option.value)}
                      variant={filterSeverity === option.value ? 'default' : 'outline'}
                      className={filterSeverity === option.value ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                      size="sm"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={exportTimeline} variant="outline" className="gap-2" size="sm">
                <Download className="w-4 h-4" /> Export Timeline (CSV)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-300"></div>

          {/* Events */}
          {filteredEvents.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-slate-500">No events match the selected filters</p>
            </Card>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="timeline">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-4"
                  >
                    {filteredEvents.map((event, index) => {
                      const config = eventTypeConfig[event.type];
                      const Icon = config.icon;

                      return (
                        <Draggable key={event.id} draggableId={event.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`relative transition-all ${snapshot.isDragging ? 'opacity-50' : ''}`}
                            >
                              <Card className={`${config.bg} ${config.border} border ml-16 hover:shadow-md transition-shadow`}>
                                <CardContent className="pt-4 pb-4">
                                  <div className="flex items-start gap-4">
                                    {/* Drag handle + dot */}
                                    <div className="relative -left-20 flex flex-col items-center">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded"
                                      >
                                        <GripVertical className="w-4 h-4 text-slate-400" />
                                      </div>
                                      <div className={`absolute -left-4.5 top-6 w-3 h-3 rounded-full ${config.color.replace('text-', 'bg-')} border-2 border-white`}></div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <Icon className={`w-4 h-4 ${config.color}`} />
                                        <span className="font-semibold text-slate-900">{event.title}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {config.label}
                                        </Badge>
                                        {event.severity && (
                                          <Badge className={`text-xs ${severityColors[event.severity] || severityColors.low}`}>
                                            {event.severity}
                                          </Badge>
                                        )}
                                      </div>

                                      <p className="text-sm text-slate-700 mb-2">{event.description}</p>

                                      <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(event.date).toLocaleDateString('en-GB', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </div>

                                      {/* Type-specific details */}
                                      {event.type === 'incident' && event.content.rics_violations?.length > 0 && (
                                        <div className="mt-2 text-xs">
                                          <p className="text-slate-600">RICS Violations: {event.content.rics_violations.join(', ')}</p>
                                        </div>
                                      )}
                                      {event.type === 'evidence' && event.content.file_url && (
                                        <a href={event.content.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
                                          View File →
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
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
          )}
        </div>

        {/* Summary */}
        {filteredEvents.length > 0 && (
          <Card className="mt-8 bg-slate-100">
            <CardContent className="pt-4">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Timeline Summary:</span> {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} spanning from{' '}
                <span className="font-mono text-slate-900">
                  {new Date(filteredEvents[0].date).toLocaleDateString('en-GB')}
                </span>
                {' '}to{' '}
                <span className="font-mono text-slate-900">
                  {new Date(filteredEvents[filteredEvents.length - 1].date).toLocaleDateString('en-GB')}
                </span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}