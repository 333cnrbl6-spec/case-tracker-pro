import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, MessageSquare, CheckCircle2, Filter, X, Calendar } from 'lucide-react';
import TimelineEvent from '@/components/TimelineEvent';

export default function EventTimeline() {
  const [filterIncident, setFilterIncident] = useState(null);
  const [filterParticipant, setFilterParticipant] = useState(null);
  const [filterEventType, setFilterEventType] = useState(null);
  const [searchText, setSearchText] = useState('');

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['incident-tasks'],
    queryFn: () => base44.entities.IncidentTask.list(),
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list(),
  });

  // Aggregate all events
  const allEvents = useMemo(() => {
    const events = [];

    incidents.forEach(incident => {
      events.push({
        type: 'incident',
        date: incident.data.date,
        data: incident.data,
        id: incident.id,
        sortDate: new Date(incident.data.date)
      });
    });

    tasks.forEach(task => {
      events.push({
        type: 'task',
        date: task.created_date,
        data: task.data,
        id: task.id,
        sortDate: new Date(task.created_date)
      });
    });

    communications.forEach(comm => {
      events.push({
        type: 'communication',
        date: comm.data.date,
        data: comm.data,
        id: comm.id,
        sortDate: new Date(comm.data.date)
      });
    });

    return events.sort((a, b) => b.sortDate - a.sortDate);
  }, [incidents, tasks, communications]);

  // Get unique participants
  const participants = useMemo(() => {
    const set = new Set();
    communications.forEach(c => {
      set.add(c.data.from);
      set.add(c.data.to);
    });
    tasks.forEach(t => {
      if (t.data.assigned_to) set.add(t.data.assigned_to);
    });
    return Array.from(set).sort();
  }, [communications, tasks]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      if (filterIncident && event.type === 'incident' && event.id !== filterIncident) return false;
      if (filterIncident && event.type === 'task') {
        const relatedTask = tasks.find(t => t.id === event.id);
        const incident = incidents.find(i => i.id === relatedTask?.data.incident_id);
        if (incident?.id !== filterIncident) return false;
      }
      if (filterEventType && event.type !== filterEventType) return false;

      if (filterParticipant) {
        if (event.type === 'communication') {
          if (event.data.from !== filterParticipant && event.data.to !== filterParticipant) return false;
        } else if (event.type === 'task') {
          if (event.data.assigned_to !== filterParticipant) return false;
        } else {
          return false;
        }
      }

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const title = event.type === 'incident' ? event.data.title : 
                      event.type === 'task' ? event.data.title :
                      event.data.subject;
        return title.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }, [allEvents, filterIncident, filterParticipant, filterEventType, searchText, tasks, incidents]);

  const hasActiveFilters = filterIncident || filterParticipant || filterEventType || searchText;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-6 h-6 text-slate-700" />
            <h1 className="text-4xl font-bold text-slate-900">Event Timeline</h1>
          </div>
          <p className="text-slate-600">Chronological view of all incidents, tasks, and communications</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Search</label>
                <Input
                  placeholder="Search titles..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Event Type</label>
                <Select value={filterEventType || ''} onValueChange={(val) => setFilterEventType(val || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Types</SelectItem>
                    <SelectItem value="incident">Incidents</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                    <SelectItem value="communication">Communications</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Incident</label>
                <Select value={filterIncident || ''} onValueChange={(val) => setFilterIncident(val || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All incidents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Incidents</SelectItem>
                    {incidents.map(incident => (
                      <SelectItem key={incident.id} value={incident.id}>
                        {incident.data.title.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Participant</label>
                <Select value={filterParticipant || ''} onValueChange={(val) => setFilterParticipant(val || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All participants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Participants</SelectItem>
                    {participants.map(p => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  {searchText && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Search: "{searchText}"
                      <button onClick={() => setSearchText('')} className="ml-1 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {filterEventType && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Type: {filterEventType}
                      <button onClick={() => setFilterEventType(null)} className="ml-1 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {filterIncident && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Incident
                      <button onClick={() => setFilterIncident(null)} className="ml-1 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {filterParticipant && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {filterParticipant}
                      <button onClick={() => setFilterParticipant(null)} className="ml-1 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSearchText('');
                      setFilterEventType(null);
                      setFilterIncident(null);
                      setFilterParticipant(null);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Timeline ({filteredEvents.length} events)</span>
              {filteredEvents.length === 0 && (
                <Badge variant="outline">No matching events</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No events match your filters</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-slate-100" />
                <div className="relative pl-4">
                  {filteredEvents.map((event, idx) => (
                    <TimelineEvent
                      key={event.id}
                      event={event}
                      isConnected={idx < filteredEvents.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}