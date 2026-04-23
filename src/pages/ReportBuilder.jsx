import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';

export default function ReportBuilder() {
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [selectedCommunications, setSelectedCommunications] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState([]);
  const [reportTitle, setReportTitle] = useState('Incident Case Brief');
  const [reportScope, setReportScope] = useState('');
  const [generatingId, setGeneratingId] = useState(null);
  const [error, setError] = useState(null);

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

  const handleGenerateReport = async () => {
    if (selectedIncidents.length === 0) {
      setError('Please select at least one incident');
      return;
    }

    setGeneratingId('report');
    setError(null);

    try {
      const response = await base44.functions.invoke('generateIncidentBrief', {
        incidentIds: selectedIncidents,
        communicationIds: selectedCommunications,
        evidenceIds: selectedEvidence,
        reportTitle,
        reportScope,
      });

      if (response.data.pdf_url) {
        const a = document.createElement('a');
        a.href = response.data.pdf_url;
        a.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setGeneratingId(null);
    }
  };

  const toggleIncident = (id) => {
    setSelectedIncidents(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleCommunication = (id) => {
    setSelectedCommunications(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleEvidence = (id) => {
    setSelectedEvidence(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Report Builder</h1>
          <p className="text-slate-600">Compile incidents, communications, and evidence into a professional case brief for stakeholders</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Configuration */}
          <div className="col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-base">Report Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Report Title</label>
                  <Input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="mt-1"
                    placeholder="Incident Case Brief"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Executive Scope (optional)</label>
                  <Textarea
                    value={reportScope}
                    onChange={(e) => setReportScope(e.target.value)}
                    className="mt-1 min-h-20 text-xs"
                    placeholder="Brief summary of what this report covers and why it was generated..."
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="space-y-1 text-xs text-slate-600 mb-3">
                    <p>Selected:</p>
                    <p>• {selectedIncidents.length} incident{selectedIncidents.length !== 1 ? 's' : ''}</p>
                    <p>• {selectedCommunications.length} communication{selectedCommunications.length !== 1 ? 's' : ''}</p>
                    <p>• {selectedEvidence.length} evidence item{selectedEvidence.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex gap-2">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleGenerateReport}
                  disabled={generatingId === 'report' || selectedIncidents.length === 0}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {generatingId === 'report' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Generate PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Selection Lists */}
          <div className="col-span-2 space-y-6">
            {/* Incidents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Incidents ({selectedIncidents.length}/{incidents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {incidents.length === 0 ? (
                    <p className="text-sm text-slate-500">No incidents available</p>
                  ) : (
                    incidents.map(inc => (
                      <label key={inc.id} className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                        <Checkbox
                          checked={selectedIncidents.includes(inc.id)}
                          onCheckedChange={() => toggleIncident(inc.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{inc.title}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs py-0">{inc.severity}</Badge>
                            <Badge variant="outline" className="text-xs py-0">{inc.incident_type.replace(/_/g, ' ')}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{new Date(inc.date).toLocaleDateString()}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Communications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Communications ({selectedCommunications.length}/{communications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {communications.length === 0 ? (
                    <p className="text-sm text-slate-500">No communications available</p>
                  ) : (
                    communications.map(comm => (
                      <label key={comm.id} className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                        <Checkbox
                          checked={selectedCommunications.includes(comm.id)}
                          onCheckedChange={() => toggleCommunication(comm.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{comm.subject}</p>
                          <p className="text-xs text-slate-600">{comm.from} → {comm.to}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(comm.date).toLocaleDateString()}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Evidence */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Evidence ({selectedEvidence.length}/{evidence.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {evidence.length === 0 ? (
                    <p className="text-sm text-slate-500">No evidence available</p>
                  ) : (
                    evidence.map(ev => (
                      <label key={ev.id} className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                        <Checkbox
                          checked={selectedEvidence.includes(ev.id)}
                          onCheckedChange={() => toggleEvidence(ev.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{ev.title}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs py-0">{ev.evidence_type.replace(/_/g, ' ')}</Badge>
                            <Badge variant="outline" className="text-xs py-0">{ev.strength}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{new Date(ev.date_collected).toLocaleDateString()}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}