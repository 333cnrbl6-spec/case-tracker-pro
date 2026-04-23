import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AutoTagPreview from '@/components/AutoTagPreview';

export default function DocumentDropZone({ onEvidenceCreated }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [autoTagData, setAutoTagData] = useState(null);
  const [taggedFile, setTaggedFile] = useState(null);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const processFiles = async (files) => {
    const file = files[0];
    if (!file) return;

    // No file size restrictions - unlimited uploads

    setUploading(true);
    setError(null);
    setExtractedData(null);

    try {
      // Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadRes.file_url;

      // Validate upload and check for duplicates
      const validationRes = await base44.functions.invoke('validateFileUpload', {
        fileName: file.name,
        fileSize: file.size,
        fileUrl
      });

      if (!validationRes.data.valid) {
        setError(validationRes.data.error);
        return;
      }

      // Extract data from document
      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Document title or main subject' },
            description: { type: 'string', description: 'Key content summary' },
            evidence_type: { 
              type: 'string', 
              enum: ['document', 'communication', 'report', 'valuation', 'contract', 'witness_statement', 'photograph', 'recording_transcript', 'other'],
              description: 'Type of evidence'
            },
            relevance: {
              type: 'string',
              enum: ['rics_violation', 'legal_violation', 'pattern', 'credibility', 'context', 'other'],
              description: 'Why this matters'
            },
            key_findings: { type: 'array', items: { type: 'string' }, description: 'Critical points from document' }
          },
          required: ['title', 'description', 'evidence_type']
        }
      });

      if (extractRes.status === 'error') {
        setError(extractRes.details);
        return;
      }

      const data = extractRes.output;
      setExtractedData(data);
      setTaggedFile({ name: file.name, url: fileUrl });

      // Trigger AI auto-tagging
      setTagging(true);
      try {
        const tagResult = await base44.functions.invoke('aiAutoTagDocument', {
          fileUrl,
          fileName: file.name
        });

        setAutoTagData(tagResult.data);
      } catch (tagErr) {
        console.warn('Auto-tagging failed, continuing with manual tags:', tagErr);
        // Continue with manual extraction data
        await createEvidenceRecord(data, fileUrl);
      } finally {
        setTagging(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to process document');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    handleDrag(e);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const createEvidenceRecord = async (data, fileUrl) => {
    const evidenceRecord = await base44.entities.Evidence.create({
      date_collected: new Date().toISOString().split('T')[0],
      title: data.title || taggedFile.name,
      description: data.description || '',
      evidence_type: data.evidence_type || 'document',
      file_url: fileUrl,
      relevance: data.relevance || 'other',
      strength: data.strength || 'moderate',
      related_incidents: data.related_incidents || [],
      notes: data.key_findings?.join('\n') || ''
    });

    queryClient.invalidateQueries({ queryKey: ['evidence'] });
    if (onEvidenceCreated) {
      onEvidenceCreated(evidenceRecord);
    }

    setTimeout(() => {
      setExtractedData(null);
      setAutoTagData(null);
      setTaggedFile(null);
    }, 1500);
  };

  const handleAcceptTags = async () => {
    if (autoTagData && taggedFile) {
      await createEvidenceRecord(autoTagData, taggedFile.url);
    }
  };

  const handleRejectTags = () => {
    setAutoTagData(null);
    setTagging(false);
  };

  return (
    <Card className="border-2 border-dashed border-slate-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Smart Document Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {autoTagData && (
          <AutoTagPreview 
            tagData={autoTagData} 
            onAccept={handleAcceptTags}
            onReject={handleRejectTags}
            loading={tagging}
          />
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm text-slate-600">Scanning document...</p>
            </div>
          ) : extractedData ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <p className="font-medium text-slate-900">Evidence Added</p>
              <p className="text-xs text-slate-600">{extractedData.title}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
              <Button size="sm" variant="outline" onClick={() => setError(null)}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <FileText className="w-8 h-8 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">Drop documents here</p>
                <p className="text-xs text-slate-600">or click to browse</p>
              </div>
              <input
                type="file"
                onChange={handleChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="sm">
                Browse Files
              </Button>
            </div>
          )}
          </div>

          <p className="text-xs text-slate-500 mt-2">
          Supports: PDF, Word, Text, Images (unlimited size). AI extracts key data and auto-categorizes evidence. Duplicates detected automatically.
        </p>
      </CardContent>
    </Card>
  );
}