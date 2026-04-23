import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, AlertTriangle, Download, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function DisclosureBundleBuilder() {
  const [selectedEvidence, setSelectedEvidence] = useState([]);
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [bundleName, setBundleName] = useState('Disclosure Bundle');
  const [bundleDescription, setBundleDescription] = useState('');
  const [searchEvidence, setSearchEvidence] = useState('');
  const [searchIncidents, setSearchIncidents] = useState('');
  const [generating, setGenerating] = useState(false);

  const queryClient = useQueryClient();

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list('-updated_date', 100),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-updated_date', 100),
  });

  const filteredEvidence = evidence.filter(e => 
    e.title.toLowerCase().includes(searchEvidence.toLowerCase())
  );

  const filteredIncidents = incidents.filter(i => 
    i.title.toLowerCase().includes(searchIncidents.toLowerCase())
  );

  const handleGenerateBundle = async () => {
    if (selectedEvidence.length === 0 && selectedIncidents.length === 0) {
      toast.error('Please select at least one piece of evidence or incident');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateDisclosureBundle', {
        evidenceIds: selectedEvidence,
        incidentIds: selectedIncidents,
        bundleName,
        bundleDescription,
      });

      if (response.data.file_url) {
        const link = document.createElement('a');
        link.href = response.data.file_url;
        link.download = `${bundleName.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Disclosure Bundle generated successfully');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate bundle');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Disclosure Bundle Generator</h1>
        <p className="text-slate-600">Select evidence and incidents to create a paginated PDF bundle with table of contents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bundle Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Bundle Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Bundle Name</label>
              <Input
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                placeholder="e.g., Final Disclosure Bundle"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Description (Optional)</label>
              <textarea
                value={bundleDescription}
                onChange={(e) => setBundleDescription(e.target.value)}
                placeholder="Additional notes for the bundle"
                className="w-full h-24 p-2 border border-slate-200 rounded-lg text-sm resize-none"
              />
            </div>

            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">
                  Evidence selected: <strong>{selectedEvidence.length}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">
                  Incidents selected: <strong>{selectedIncidents.length}</strong>
                </span>
              </div>
            </div>

            <Button
              onClick={handleGenerateBundle}
              disabled={generating || (selectedEvidence.length === 0 && selectedIncidents.length === 0)}
              className="w-full mt-6"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF Bundle
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Evidence Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Evidence ({selectedEvidence.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search evidence..."
              value={searchEvidence}
              onChange={(e) => setSearchEvidence(e.target.value)}
              className="mb-3"
            />
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredEvidence.length > 0 ? (
                filteredEvidence.map((item) => (
                  <label key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={selectedEvidence.includes(item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEvidence([...selectedEvidence, item.id]);
                        } else {
                          setSelectedEvidence(selectedEvidence.filter(id => id !== item.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.evidence_type}</p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No evidence found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Incidents Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Incidents ({selectedIncidents.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search incidents..."
              value={searchIncidents}
              onChange={(e) => setSearchIncidents(e.target.value)}
              className="mb-3"
            />
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((item) => (
                  <label key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={selectedIncidents.includes(item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIncidents([...selectedIncidents, item.id]);
                        } else {
                          setSelectedIncidents(selectedIncidents.filter(id => id !== item.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(item.date).toLocaleDateString()} • {item.severity}
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No incidents found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}