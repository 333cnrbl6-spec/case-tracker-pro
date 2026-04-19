import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download, AlertCircle, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function IncidentReporter() {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

  const { data: incidents = [], isLoading } = useQuery({
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

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const generateReportMutation = useMutation({
    mutationFn: async (incidentId) => {
      setGeneratingId(incidentId);
      const response = await base44.functions.invoke('generateIncidentReport', {
        incidentId
      });
      return response.data;
    },
    onSuccess: (data, incidentId) => {
      const incident = incidents.find(i => i.id === incidentId);
      const filename = `Incident_Report_${incident?.data.title.substring(0, 30).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setGeneratingId(null);
    },
    onError: () => {
      setGeneratingId(null);
    }
  });

  const getIncidentStats = (incidentId) => {
    const incidentTasks = tasks.filter(t => t.data.incident_id === incidentId);
    const relatedComms = communications.filter(c =>
      incidents.find(i => i.id === incidentId)?.data.title && 
      c.data.subject?.includes(incidents.find(i => i.id === incidentId)?.data.title.substring(0, 20))
    );
    const relatedEvidence = evidence.filter(e =>
      e.data.related_incidents?.includes(incidentId)
    );

    return {
      tasks: incidentTasks.length,
      communications: relatedComms.length,
      evidence: relatedEvidence.length,
      completedTasks: incidentTasks.filter(t => t.data.status === 'completed').length
    };
  };

  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    reviewed: 'bg-purple-100 text-purple-800',
    assessed: 'bg-indigo-100 text-indigo-800',
    escalated: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-slate-700" />
            <h1 className="text-4xl font-bold text-slate-900">Incident Report Generator</h1>
          </div>
          <p className="text-slate-600">Generate formal PDF reports for RICS conduct investigations</p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Each report includes incident details, all associated tasks, communications, and supporting evidence formatted for formal regulatory submission.
          </AlertDescription>
        </Alert>

        {/* Incident List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-slate-600">Loading incidents...</p>
          </div>
        ) : incidents.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No incidents found. Create an incident to generate a report.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {incidents.map(incident => {
              const stats = getIncidentStats(incident.id);
              return (
                <Card
                  key={incident.id}
                  className={`border-l-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedIncident === incident.id ? 'ring-2 ring-blue-400' : ''
                  }`}
                  style={{ borderLeftColor: incident.data.severity === 'critical' ? '#dc2626' : '#f59e0b' }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900 mb-2">{incident.data.title}</h3>
                        <p className="text-sm text-slate-600">{incident.data.description?.substring(0, 100)}...</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={severityColors[incident.data.severity]}>
                          {incident.data.severity.toUpperCase()}
                        </Badge>
                        <Badge className={statusColors[incident.data.status]}>
                          {incident.data.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3 mb-4 py-4 border-t border-b border-slate-200">
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">{stats.tasks}</div>
                        <p className="text-xs text-slate-600">Tasks</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">{stats.completedTasks}/{stats.tasks}</div>
                        <p className="text-xs text-slate-600">Completed</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">{stats.communications}</div>
                        <p className="text-xs text-slate-600">Communications</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">{stats.evidence}</div>
                        <p className="text-xs text-slate-600">Evidence Items</p>
                      </div>
                    </div>

                    {/* RICS Violations */}
                    {incident.data.rics_violations && incident.data.rics_violations.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-slate-700 mb-2">RICS Violations:</p>
                        <div className="flex flex-wrap gap-2">
                          {incident.data.rics_violations.slice(0, 3).map((violation, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">
                              {violation}
                            </Badge>
                          ))}
                          {incident.data.rics_violations.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{incident.data.rics_violations.length - 3} more</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 mb-4">
                      <div>
                        <span className="font-semibold">Incident Date:</span> {new Date(incident.data.date).toLocaleDateString('en-GB')}
                      </div>
                      <div>
                        <span className="font-semibold">Logged:</span> {new Date(incident.created_date).toLocaleDateString('en-GB')}
                      </div>
                    </div>

                    {/* Action */}
                    <Button
                      onClick={() => generateReportMutation.mutate(incident.id)}
                      disabled={generatingId === incident.id}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {generatingId === incident.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Generate & Download Report
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}