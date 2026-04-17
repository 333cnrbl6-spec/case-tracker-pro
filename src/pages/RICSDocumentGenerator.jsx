import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, Download, Copy, Settings } from 'lucide-react';
import { toast } from 'sonner';

const DOCUMENT_TYPES = [
  {
    id: 'complaint',
    name: 'RICS Formal Complaint Letter',
    description: 'Formal complaint to RICS regarding surveyor professional misconduct',
    icon: '📋'
  },
  {
    id: 'response',
    name: 'Response to RICS Enquiry',
    description: 'Response letter to RICS investigator enquiries and questions',
    icon: '📧'
  },
  {
    id: 'disclosure',
    name: 'Disclosure Statement',
    description: 'Comprehensive disclosure of evidence and documentation to RICS',
    icon: '📄'
  }
];

export default function RICSDocumentGenerator() {
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState([]);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const generateDoc = useMutation({
    mutationFn: async () => {
      if (!selectedDocType || selectedIncidents.length === 0) {
        throw new Error('Please select document type and at least one incident');
      }

      const result = await base44.functions.invoke('generateRICSDocument', {
        documentType: selectedDocType,
        incidentIds: selectedIncidents,
        evidenceIds: selectedEvidence,
        incidents: incidents.filter(i => selectedIncidents.includes(i.id)).map(i => ({ id: i.id, ...i.data })),
        evidence: evidence.filter(e => selectedEvidence.includes(e.id)).map(e => ({ id: e.id, ...e.data })),
        senderName,
        senderEmail,
      });

      return result.data;
    },
    onSuccess: (data) => {
      setGeneratedDoc(data.document);
      toast.success('Document generated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate document');
    }
  });

  const downloadDocument = () => {
    if (!generatedDoc) return;

    const element = document.createElement('a');
    const file = new Blob([generatedDoc.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `RICS_${generatedDoc.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDoc.content);
    toast.success('Document copied to clipboard');
  };

  const toggleIncident = (id) => {
    setSelectedIncidents(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleEvidence = (id) => {
    setSelectedEvidence(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  if (generatedDoc) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{generatedDoc.title}</h1>
              <p className="text-slate-600 mt-1">Generated: {new Date().toLocaleDateString()}</p>
            </div>
            <Button
              onClick={() => setGeneratedDoc(null)}
              variant="outline"
            >
              Generate New
            </Button>
          </div>

          <div className="flex gap-3">
            <Button onClick={downloadDocument} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button onClick={copyToClipboard} variant="outline" className="gap-2">
              <Copy className="w-4 h-4" />
              Copy to Clipboard
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="bg-slate-50 p-6 rounded border border-slate-200 max-h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {generatedDoc.content}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                ℹ️ <strong>Note:</strong> This document has been AI-generated based on your incidents and evidence. Please review carefully and adapt as needed before submission to RICS.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">RICS Document Generator</h1>
          <p className="text-lg text-slate-600">AI-assisted drafting of complaint letters, responses, and disclosure statements</p>
        </div>

        {/* Document Type Selection */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Step 1: Select Document Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DOCUMENT_TYPES.map(docType => (
              <Card
                key={docType.id}
                className={`cursor-pointer transition-all ${selectedDocType === docType.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'}`}
                onClick={() => setSelectedDocType(docType.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-2xl">{docType.icon}</span>
                    {docType.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{docType.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {selectedDocType && (
          <>
            {/* Sender Details */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Sender Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Incidents & Evidence Selection */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Step 2: Select Content</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incidents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Incidents ({selectedIncidents.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                    {incidents.length === 0 ? (
                      <p className="text-sm text-slate-500">No incidents logged</p>
                    ) : (
                      incidents.map(incident => (
                        <div key={incident.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                          <Checkbox
                            checked={selectedIncidents.includes(incident.id)}
                            onChange={() => toggleIncident(incident.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{incident.data?.title}</p>
                            <Badge className="mt-1" variant="outline">{incident.data?.severity}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Evidence */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Supporting Evidence ({selectedEvidence.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                    {evidence.length === 0 ? (
                      <p className="text-sm text-slate-500">No evidence logged</p>
                    ) : (
                      evidence.map(evid => (
                        <div key={evid.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                          <Checkbox
                            checked={selectedEvidence.includes(evid.id)}
                            onChange={() => toggleEvidence(evid.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{evid.data?.title}</p>
                            <p className="text-xs text-slate-500">{evid.data?.evidence_type}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => generateDoc.mutate()}
                disabled={selectedIncidents.length === 0 || generateDoc.isPending}
                size="lg"
                className="gap-2 bg-slate-900 hover:bg-slate-800"
              >
                {generateDoc.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                Generate Document
              </Button>
            </div>
          </>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Document Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div>
              <strong>📋 Formal Complaint Letter:</strong> Initial formal complaint to RICS. Includes summary of allegations and request for investigation.
            </div>
            <div>
              <strong>📧 Response to RICS Enquiry:</strong> Response to specific questions from RICS investigators. Provides detailed answers and evidence references.
            </div>
            <div>
              <strong>📄 Disclosure Statement:</strong> Comprehensive list and description of all evidence and documentation being submitted to RICS.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}