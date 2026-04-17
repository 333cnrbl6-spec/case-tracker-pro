import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, FileDown, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

function SeverityBadge({ severity }) {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-amber-100 text-amber-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-slate-100 text-slate-800'
  };
  return <Badge className={colors[severity] || colors.medium}>{severity}</Badge>;
}

export default function RICSBreachNotification() {
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [notificationTitle, setNotificationTitle] = useState('RICS Regulatory Breach Notification');

  const { data: incidents = [], isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const generatePDF = useMutation({
    mutationFn: async () => {
      if (selectedIncidents.length === 0) {
        throw new Error('Please select at least one incident');
      }

      const incidentDetails = incidents.filter(i => selectedIncidents.includes(i.id));
      const relevantEvidence = evidence.filter(e => 
        incidentDetails.some(i => i.data?.related_incidents?.includes(e.id))
      );

      const result = await base44.functions.invoke('generateRICSBreachPDF', {
        incidentIds: selectedIncidents,
        incidentDetails: incidentDetails.map(i => i.data),
        evidenceDetails: relevantEvidence.map(e => e.data),
        title: notificationTitle
      });

      return result.data;
    },
    onSuccess: (data) => {
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        toast.success('RICS breach notification PDF generated');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate PDF');
    }
  });

  const handleToggleIncident = (id) => {
    setSelectedIncidents(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIncidents.length === incidents.length) {
      setSelectedIncidents([]);
    } else {
      setSelectedIncidents(incidents.map(i => i.id));
    }
  };

  const criticalCount = selectedIncidents.length > 0 
    ? incidents.filter(i => selectedIncidents.includes(i.id) && i.data?.severity === 'critical').length
    : 0;

  const totalRicsViolations = selectedIncidents.length > 0
    ? incidents
        .filter(i => selectedIncidents.includes(i.id))
        .reduce((acc, i) => acc + (i.data?.rics_violations?.length || 0), 0)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">RICS Breach Notification Generator</h1>
          <p className="text-lg text-slate-600">Select incidents to compile into a formal regulatory breach report</p>
        </div>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notification Title</label>
              <input
                type="text"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="RICS Regulatory Breach Notification"
              />
            </div>
          </CardContent>
        </Card>

        {/* Selection Stats */}
        {selectedIncidents.length > 0 && (
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Selected Incidents</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedIncidents.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Critical Severity</p>
                  <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total RICS Violations</p>
                  <p className="text-2xl font-bold text-amber-600">{totalRicsViolations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Incident Selection */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Select Incidents</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
            >
              {selectedIncidents.length === incidents.length ? 'Deselect All' : 'Select All'}
            </Button>
          </CardHeader>
          <CardContent>
            {incidentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : incidents.length === 0 ? (
              <p className="text-slate-500 py-8">No incidents logged yet</p>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedIncidents.includes(incident.id)}
                      onChange={() => handleToggleIncident(incident.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{incident.data?.title}</h3>
                        <SeverityBadge severity={incident.data?.severity} />
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{incident.data?.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {incident.data?.rics_violations?.slice(0, 3).map((violation, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {violation}
                          </Badge>
                        ))}
                        {incident.data?.rics_violations?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{incident.data.rics_violations.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        📅 {incident.data?.date} | Incident Type: {incident.data?.incident_type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex gap-3 justify-end">
          <Button
            onClick={() => generatePDF.mutate()}
            disabled={selectedIncidents.length === 0 || generatePDF.isPending}
            size="lg"
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            {generatePDF.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileDown className="w-5 h-5" />
            )}
            Generate RICS Breach Notification PDF
          </Button>
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              What's Included in the Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>✓ Formal RICS regulatory breach notification header</li>
              <li>✓ Summary of all selected incidents with dates and severity</li>
              <li>✓ Comprehensive RICS rule violations grouped by type</li>
              <li>✓ Legal issues identified for each incident</li>
              <li>✓ Supporting evidence cross-referenced to incidents</li>
              <li>✓ Professional formatting suitable for RICS submission</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}