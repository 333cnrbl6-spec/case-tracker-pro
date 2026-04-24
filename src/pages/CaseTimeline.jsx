import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TimelineBuilder from '@/components/TimelineBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function CaseTimeline() {
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-date'),
  });

  const filteredIncidents = incidents.filter(i =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Case Timeline</h1>
          <p className="text-slate-600">Build your narrative by arranging evidence and communications chronologically</p>
        </div>

        {!selectedIncidentId ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex gap-2 items-center">
                <Search className="w-4 h-4" />
                Select an Incident
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredIncidents.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">No incidents found</p>
                ) : (
                  filteredIncidents.map(incident => (
                    <div
                      key={incident.id}
                      onClick={() => setSelectedIncidentId(incident.id)}
                      className="p-4 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{incident.title}</p>
                          <p className="text-xs text-slate-600 mt-1">{new Date(incident.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Badge className="text-xs" variant="outline">{incident.severity}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <button
              onClick={() => setSelectedIncidentId(null)}
              className="text-sm text-slate-600 hover:text-slate-900 mb-4 flex gap-1 items-center"
            >
              ← Back to incidents
            </button>
            <TimelineBuilder 
              incidentId={selectedIncidentId}
              onTimelineUpdate={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}