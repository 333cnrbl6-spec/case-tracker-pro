import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Loader2,
  Check,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AutomatedBundleGenerator() {
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeIncidents, setIncludeIncidents] = useState(true);
  const [includeComms, setIncludeComms] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState([]);
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [selectedComms, setSelectedComms] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedBundles, setGeneratedBundles] = useState([]);

  // Fetch cases
  const { data: cases = [] } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list('-created_date'),
  });

  // Fetch evidence
  const { data: allEvidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list('-created_date'),
  });

  // Fetch incidents
  const { data: allIncidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-created_date'),
  });

  // Fetch communications
  const { data: allComms = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list('-created_date'),
  });

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  const filteredEvidence = allEvidence.filter((e) =>
    !searchTerm || e.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredIncidents = allIncidents.filter((i) =>
    !searchTerm || i.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredComms = allComms.filter((c) =>
    !searchTerm ||
    c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.from?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleEvidenceSelection = (id) => {
    setSelectedEvidence((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleIncidentSelection = (id) => {
    setSelectedIncidents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCommSelection = (id) => {
    setSelectedComms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllEvidence = () => {
    setSelectedEvidence(
      selectedEvidence.length === filteredEvidence.length
        ? []
        : filteredEvidence.map((e) => e.id)
    );
  };

  const selectAllIncidents = () => {
    setSelectedIncidents(
      selectedIncidents.length === filteredIncidents.length
        ? []
        : filteredIncidents.map((i) => i.id)
    );
  };

  const selectAllComms = () => {
    setSelectedComms(
      selectedComms.length === filteredComms.length
        ? []
        : filteredComms.map((c) => c.id)
    );
  };

  const handleGenerateBundle = async () => {
    if (!selectedCaseId) {
      toast.error('Please select a case');
      return;
    }

    if (!includeEvidence && !includeIncidents && !includeComms) {
      toast.error('Select at least one document type to include');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateAutomatedBundle', {
        case_id: selectedCaseId,
        case_ref: selectedCase?.case_ref,
        include_evidence: includeEvidence,
        include_incidents: includeIncidents,
        include_communications: includeComms,
        evidence_ids: selectedEvidence,
        incident_ids: selectedIncidents,
        communication_ids: selectedComms,
      });

      if (response.data?.success && response.data?.pdfBase64) {
        // Convert base64 to blob and download
        const binaryString = atob(response.data.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const fileName = response.data.fileName || `Bundle_${selectedCase?.case_ref}_${new Date().toISOString().split('T')[0]}.pdf`;
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Add to generated bundles list
        setGeneratedBundles(prev => [...prev, {
          id: `${selectedCaseId}-${Date.now()}`,
          caseRef: selectedCase?.case_ref,
          fileName,
          docCount: (includeEvidence ? selectedEvidence.length : 0) +
                    (includeIncidents ? selectedIncidents.length : 0) +
                    (includeComms ? selectedComms.length : 0),
          timestamp: new Date().toLocaleTimeString(),
        }]);
        
        toast.success('Bundle generated and downloaded');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate bundle');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderOpen className="w-8 h-8" />
            Automated Bundle Generator
          </h1>
          <p className="text-slate-600 mt-2">
            Compile evidence, incidents, and communications into a professional UK court-formatted PDF bundle
          </p>
        </div>

        {/* Case Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">1. Select Case</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose a case..." />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.case_ref} - {c.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCase && (
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm font-medium">
                  <strong>{selectedCase.case_ref}</strong> | {selectedCase.client_name}
                </p>
                {selectedCase.opponent_name && (
                  <p className="text-xs text-slate-600 mt-1">
                    vs {selectedCase.opponent_name}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCaseId && (
          <>
            {/* Document Type Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">2. Select Document Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded hover:bg-slate-50">
                  <Checkbox
                    id="include-evidence"
                    checked={includeEvidence}
                    onCheckedChange={setIncludeEvidence}
                  />
                  <label
                    htmlFor="include-evidence"
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-medium">Evidence Documents</p>
                    <p className="text-xs text-slate-600">
                      {allEvidence.length} available
                    </p>
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded hover:bg-slate-50">
                  <Checkbox
                    id="include-incidents"
                    checked={includeIncidents}
                    onCheckedChange={setIncludeIncidents}
                  />
                  <label
                    htmlFor="include-incidents"
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-medium">Incident Reports</p>
                    <p className="text-xs text-slate-600">
                      {allIncidents.length} available
                    </p>
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded hover:bg-slate-50">
                  <Checkbox
                    id="include-comms"
                    checked={includeComms}
                    onCheckedChange={setIncludeComms}
                  />
                  <label
                    htmlFor="include-comms"
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-medium">Communications Logs</p>
                    <p className="text-xs text-slate-600">
                      {allComms.length} available
                    </p>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Document Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Evidence */}
              {includeEvidence && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Evidence ({selectedEvidence.length})
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllEvidence}
                        className="text-xs"
                      >
                        {selectedEvidence.length === filteredEvidence.length
                          ? 'Clear'
                          : 'All'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredEvidence.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded"
                        >
                          <Checkbox
                            checked={selectedEvidence.includes(e.id)}
                            onCheckedChange={() =>
                              toggleEvidenceSelection(e.id)
                            }
                          />
                          <label className="flex-1 cursor-pointer text-sm">
                            <p className="font-medium line-clamp-2">
                              {e.title}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {e.evidence_type}
                            </Badge>
                          </label>
                        </div>
                      ))}
                      {filteredEvidence.length === 0 && (
                        <p className="text-xs text-slate-500 py-4">
                          No evidence documents
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Incidents */}
              {includeIncidents && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Incidents ({selectedIncidents.length})
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllIncidents}
                        className="text-xs"
                      >
                        {selectedIncidents.length === filteredIncidents.length
                          ? 'Clear'
                          : 'All'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredIncidents.map((i) => (
                        <div
                          key={i.id}
                          className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded"
                        >
                          <Checkbox
                            checked={selectedIncidents.includes(i.id)}
                            onCheckedChange={() =>
                              toggleIncidentSelection(i.id)
                            }
                          />
                          <label className="flex-1 cursor-pointer text-sm">
                            <p className="font-medium line-clamp-2">
                              {i.title}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {i.incident_type}
                            </Badge>
                          </label>
                        </div>
                      ))}
                      {filteredIncidents.length === 0 && (
                        <p className="text-xs text-slate-500 py-4">
                          No incident reports
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Communications */}
              {includeComms && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Communications ({selectedComms.length})
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllComms}
                        className="text-xs"
                      >
                        {selectedComms.length === filteredComms.length
                          ? 'Clear'
                          : 'All'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredComms.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded"
                        >
                          <Checkbox
                            checked={selectedComms.includes(c.id)}
                            onCheckedChange={() => toggleCommSelection(c.id)}
                          />
                          <label className="flex-1 cursor-pointer text-sm">
                            <p className="font-medium line-clamp-1">
                              {c.from} → {c.to}
                            </p>
                            <p className="text-xs text-slate-600">
                              {c.subject}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {c.type}
                            </Badge>
                          </label>
                        </div>
                      ))}
                      {filteredComms.length === 0 && (
                        <p className="text-xs text-slate-500 py-4">
                          No communications
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Generation Summary */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      Bundle will include{' '}
                      {(includeEvidence ? selectedEvidence.length : 0) +
                        (includeIncidents ? selectedIncidents.length : 0) +
                        (includeComms ? selectedComms.length : 0)}{' '}
                      documents
                    </p>
                    <p className="text-sm text-slate-600">
                      UK court-formatted PDF with pagination, index, and tabs
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateBundle}
                    disabled={
                      generating ||
                      (!includeEvidence &&
                        !includeIncidents &&
                        !includeComms)
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Generate & Download Bundle
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generated Bundles */}
            {generatedBundles.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="w-5 h-5" /> Generated Bundles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generatedBundles.map(bundle => (
                      <div
                        key={bundle.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{bundle.caseRef}</p>
                          <p className="text-xs text-slate-600">{bundle.docCount} documents • {bundle.timestamp}</p>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Check className="w-3 h-3" /> Downloaded
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Format Specifications */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  UK Court Bundle Format
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-slate-700">
                <div className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Professional A4 pagination with footer page numbers</span>
                </div>
                <div className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Comprehensive index of all documents</span>
                </div>
                <div className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Tab separators for each section</span>
                </div>
                <div className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Title page with case reference</span>
                </div>
                <div className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Declaration page for solicitor certification</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}