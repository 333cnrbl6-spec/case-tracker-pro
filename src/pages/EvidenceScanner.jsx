import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, CheckCircle2, AlertCircle, Trash2, Link as LinkIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

export default function EvidenceScanner() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-date'),
  });

  const createEvidenceMutation = useMutation({
    mutationFn: (data) => base44.entities.Evidence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      toast({ title: 'Evidence saved', description: 'Document added to case.' });
    },
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const processFiles = async (files) => {
    setScanning(true);
    const newItems = [];

    for (const file of files) {
      try {
        // Upload file
        const uploadRes = await base44.integrations.Core.UploadFile({ file });
        const fileUrl = uploadRes.file_url;

        // Extract and analyze content
        const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: fileUrl,
          json_schema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Document title' },
              description: { type: 'string', description: 'Full extracted content summary' },
              evidence_type: {
                type: 'string',
                enum: ['document', 'communication', 'report', 'valuation', 'contract', 'witness_statement', 'photograph', 'recording_transcript', 'other'],
                description: 'Evidence type'
              },
              relevance: {
                type: 'string',
                enum: ['rics_violation', 'legal_violation', 'pattern', 'credibility', 'context', 'other'],
                description: 'Relevance category'
              },
              key_findings: { type: 'array', items: { type: 'string' }, description: 'Critical findings' },
              date: { type: 'string', description: 'Date mentioned in document' }
            },
            required: ['title', 'description', 'evidence_type']
          }
        });

        if (extractRes.status === 'error') {
          newItems.push({ file: file.name, status: 'error', error: extractRes.details });
          continue;
        }

        const data = extractRes.output;

        // Intelligent incident linking via LLM
        let linkedIncident = null;
        if (incidents.length > 0) {
          const incidentSummaries = incidents.map(i => `[${i.id}] ${i.title}: ${i.description}`).join('\n\n');
          const linkRes = await base44.integrations.Core.InvokeLLM({
            prompt: `Given this extracted document content, which of these incidents does it relate to? Return just the incident ID if there's a clear match, or "none" if not related.\n\nDocument: ${data.description}\n\nIncidents:\n${incidentSummaries}`,
          });

          const matchedId = incidents.find(i => linkRes.includes(i.id))?.id;
          linkedIncident = matchedId || null;
        }

        // Create Evidence record
        const evidenceData = {
          date_collected: data.date || new Date().toISOString().split('T')[0],
          title: data.title || file.name,
          description: data.description,
          evidence_type: data.evidence_type || 'document',
          file_url: fileUrl,
          relevance: data.relevance || 'other',
          strength: 'moderate',
          notes: data.key_findings?.join('\n') || '',
          related_incidents: linkedIncident ? [linkedIncident] : []
        };

        newItems.push({
          file: file.name,
          status: 'success',
          data: evidenceData,
          linkedIncident,
          linkedTitle: incidents.find(i => i.id === linkedIncident)?.title
        });
      } catch (err) {
        newItems.push({ file: file.name, status: 'error', error: err.message });
      }
    }

    setScannedItems(newItems);
    setScanning(false);
  };

  const handleDrop = (e) => {
    handleDrag(e);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleSaveAll = async () => {
    const successItems = scannedItems.filter(i => i.status === 'success');
    for (const item of successItems) {
      await createEvidenceMutation.mutateAsync(item.data);
    }
    setScannedItems([]);
  };

  const handleClear = () => {
    setScannedItems([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Evidence Scanner</h1>
          <p className="text-slate-600">Scan printed documents and automatically extract evidence, categorize, and link to relevant incidents</p>
        </div>

        {/* Drop Zone */}
        <Card className="border-2 border-dashed border-slate-300 mb-8">
          <CardContent className="pt-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50'
              }`}
            >
              {scanning ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-sm text-slate-600">Scanning and extracting evidence...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload className="w-10 h-10 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">Drop scanned documents here</p>
                    <p className="text-sm text-slate-600">PDF, images, or document files</p>
                  </div>
                  <input
                    type="file"
                    onChange={handleChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff"
                    multiple
                    disabled={scanning}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm" disabled={scanning}>
                    Browse Files
                  </Button>
                  <p className="text-xs text-slate-500">
                    Supports batch uploads • AI extracts content • Auto-links to incidents
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scanned Results */}
        {scannedItems.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Scan Results ({scannedItems.length})</CardTitle>
              <div className="flex gap-2">
                {scannedItems.some(i => i.status === 'success') && (
                  <Button size="sm" onClick={handleSaveAll} className="bg-green-600 hover:bg-green-700">
                    Save All ({scannedItems.filter(i => i.status === 'success').length})
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleClear}>
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {scannedItems.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-slate-50">
                  {item.status === 'success' ? (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <p className="font-medium text-slate-900">{item.data.title}</p>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{item.data.description.substring(0, 150)}...</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{item.data.evidence_type.replace(/_/g, ' ')}</Badge>
                            <Badge variant="outline">{item.data.relevance.replace(/_/g, ' ')}</Badge>
                            {item.linkedIncident && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <LinkIcon className="w-3 h-3 mr-1" />
                                {item.linkedTitle?.substring(0, 30)}...
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setScannedItems(scannedItems.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.file}</p>
                        <p className="text-xs text-red-600">{item.error}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setScannedItems(scannedItems.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}