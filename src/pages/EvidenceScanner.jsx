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

  const uploadFile = async (file) => {
    const uploadRes = await base44.integrations.Core.UploadFile({ file });
    return uploadRes.file_url;
  };

  const processFiles = async (files) => {
    setScanning(true);
    setScannedItems([]);
    const newItems = [];

    for (const file of files) {
      try {
        // Upload file - PDFs and large files go via backend (no size limit)
        const fileUrl = await uploadFile(file);

        // Check for duplicates
        const allEvidence = await base44.entities.Evidence.list();
        if (allEvidence.some(e => e.file_url === fileUrl)) {
          newItems.push({ 
            file: file.name, 
            status: 'error', 
            error: 'This document has already been uploaded' 
          });
          continue;
        }

        // Generate title from filename
        const title = file.name.replace(/\.[^/.]+$/, '');

        // Create Evidence record with basic metadata
        const evidenceData = {
          date_collected: new Date().toISOString().split('T')[0],
          title: title,
          description: `Uploaded: ${file.name}`,
          evidence_type: 'document',
          file_url: fileUrl,
          relevance: 'context',
          strength: 'moderate',
          notes: ''
        };

        newItems.push({
          file: file.name,
          status: 'success',
          data: evidenceData
        });
      } catch (err) {
        newItems.push({ 
          file: file.name, 
          status: 'error', 
          error: err.message || 'Upload failed' 
        });
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
          <p className="text-slate-600">Upload documents and evidence files without size restrictions</p>
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
              <input
                id="file-input"
                type="file"
                onChange={handleChange}
                multiple
                className="hidden"
              />
              {scanning ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-sm text-slate-600">Uploading documents...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload className="w-10 h-10 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">Drop documents here</p>
                    <p className="text-sm text-slate-600">Any file type, unlimited size</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('file-input').click()}>
                    Browse Files
                  </Button>
                  <p className="text-xs text-slate-500">
                    Batch uploads • No file size limits • Duplicate detection
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
              <CardTitle>Upload Results ({scannedItems.length})</CardTitle>
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
                            <p className="font-medium text-slate-900">{item.file}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">document</Badge>
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
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          const filtered = scannedItems.filter((_, i) => i !== idx);
                          setScannedItems(filtered);
                        }}
                      >
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