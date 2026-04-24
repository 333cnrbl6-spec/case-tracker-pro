import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, CheckCircle2, AlertCircle, Trash2, Brain, Link as LinkIcon, FileText } from 'lucide-react';
import EvidenceDocumentSnip from '@/components/EvidenceDocumentSnip';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

const REAL_PARTIES = ['bradley', 'belcher', 'powell', 'mark jones', 'trinity', 'victoria street', 'clifton road', 'yardie', 'waltons', 'llandudno', 'vadre', 'craig-y-don', 'powell & co', 'powell and co', 'mrics'];

function isSampleData(text) {
  const lower = (text || '').toLowerCase();
  const sampleMarkers = ['john smith', 'xyz company', 'abc surveyor', 'processed fragment', 'sample data', 'lorem ipsum', 'test document', 'placeholder', 'example complaint'];
  return sampleMarkers.some(m => lower.includes(m));
}

function StatusBadge({ status }) {
  const map = {
    uploading: { label: 'Uploading...', class: 'bg-blue-100 text-blue-800' },
    analysing: { label: 'AI Analysing...', class: 'bg-purple-100 text-purple-800' },
    matching: { label: 'Matching records...', class: 'bg-amber-100 text-amber-800' },
    saving: { label: 'Saving...', class: 'bg-slate-100 text-slate-700' },
    saved: { label: 'Saved', class: 'bg-green-100 text-green-800' },
    duplicate: { label: 'Duplicate — skipped', class: 'bg-slate-100 text-slate-500' },
    sample: { label: 'Sample data — rejected', class: 'bg-red-100 text-red-800' },
    error: { label: 'Error', class: 'bg-red-100 text-red-800' },
  };
  const s = map[status] || { label: status, class: 'bg-slate-100 text-slate-700' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.class}`}>{s.label}</span>;
}

export default function EvidenceScanner() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: existingEvidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const { data: existingComms = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list(),
  });

  const { data: existingIncidents = [], isLoading: incidentsLoading } = useQuery({
     queryKey: ['incidents'],
     queryFn: () => base44.entities.Incident.list(),
   });

   const isDataReady = !isProcessing && !incidentsLoading;

   const updateItem = (idx, patch) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const processFile = async (file, idx) => {
    try {
      // 0. File size validation
      if (file.size > MAX_FILE_SIZE) {
        updateItem(idx, { status: 'error', error: `File exceeds 100MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)` });
        return;
      }

      // 1. Upload
      updateItem(idx, { status: 'uploading' });
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadRes.file_url;

      // 2. Duplicate check
      if (existingEvidence.some(e => e.file_url === fileUrl)) {
        updateItem(idx, { status: 'duplicate' });
        return;
      }

      // 3. AI Analysis — OCR + classify
      updateItem(idx, { status: 'analysing' });
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a legal case analyst for a RICS professional misconduct case involving contractor Bradley, surveyor Malcolm Belcher MRICS, and property owner Sean Powell. 

Analyse this document and extract structured information. The real parties are: Bradley (contractor), Malcolm Belcher (MRICS surveyor), Sean Powell (property owner/client), Mark Jones (electrician/subcontractor), Powell & Co.

Properties involved: Trinity Buildings Llandudno, Victoria Street Craig-y-Don, Clifton Road, Yardie Lane, Waltons Parade Preston, Vadre Lane.

Return ONLY real case data. If this looks like a sample/template/placeholder document with generic names like John Smith, XYZ etc, set is_sample_data to true.

Extract:
- document_type: one of [letter, email, invoice, cost_schedule, valuation_report, photograph_description, legal_document, contract, other]
- date: ISO date string if determinable, else null
- from_party: who sent/authored it
- to_party: who it was addressed to  
- subject_summary: one sentence
- key_content: 2-3 sentences of the most legally significant content
- real_parties_mentioned: array of real party names found
- evidence_type: one of [document, communication, report, valuation, contract, witness_statement, photograph, recording_transcript, other]
- relevance: one of [rics_violation, legal_violation, pattern, credibility, context, other]
- strength: one of [weak, moderate, strong, critical]
- is_sample_data: boolean
- suggested_title: concise professional title for this document`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            document_type: { type: 'string' },
            date: { type: 'string' },
            from_party: { type: 'string' },
            to_party: { type: 'string' },
            subject_summary: { type: 'string' },
            key_content: { type: 'string' },
            real_parties_mentioned: { type: 'array', items: { type: 'string' } },
            evidence_type: { type: 'string' },
            relevance: { type: 'string' },
            strength: { type: 'string' },
            is_sample_data: { type: 'boolean' },
            suggested_title: { type: 'string' },
          }
        }
      });

      // 4. Sample data guard
      if (analysis.is_sample_data || isSampleData(analysis.key_content) || isSampleData(analysis.subject_summary)) {
        updateItem(idx, { status: 'sample', analysis });
        return;
      }

      // 5. Match to existing records
      updateItem(idx, { status: 'matching', analysis });

      let matchedEvidenceId = null;
      let matchedCommId = null;

      if (analysis.date && analysis.from_party) {
        // Try to match an existing Communication record
        const commMatch = existingComms.find(c => {
          const dateMatch = c.date === analysis.date || (analysis.date && c.date && c.date.startsWith(analysis.date.slice(0, 7)));
          const partyMatch = (c.from || '').toLowerCase().includes((analysis.from_party || '').toLowerCase().slice(0, 6))
            || (c.subject || '').toLowerCase().includes((analysis.subject_summary || '').toLowerCase().slice(0, 20));
          return dateMatch && partyMatch;
        });
        if (commMatch) matchedCommId = commMatch.id;

        // Try to match an existing Evidence record
        const evMatch = existingEvidence.find(e => {
          const titleMatch = (e.title || '').toLowerCase().includes((analysis.from_party || '').toLowerCase().slice(0, 6))
            || (e.title || '').toLowerCase().includes((analysis.subject_summary || '').toLowerCase().slice(0, 15));
          const dateMatch = e.date_collected === analysis.date || (analysis.date && e.date_collected && e.date_collected.startsWith(analysis.date.slice(0, 7)));
          return titleMatch || dateMatch;
        });
        if (evMatch) matchedEvidenceId = evMatch.id;
      }

      // 6. Save — update existing match or create new
      updateItem(idx, { status: 'saving' });

      const evidencePayload = {
        title: analysis.suggested_title || file.name.replace(/\.[^/.]+$/, ''),
        description: analysis.subject_summary || '',
        evidence_type: analysis.evidence_type || 'document',
        file_url: fileUrl,
        relevance: analysis.relevance || 'context',
        strength: analysis.strength || 'moderate',
        date_collected: analysis.date || new Date().toISOString().split('T')[0],
        notes: analysis.key_content || '',
      };

      if (matchedEvidenceId) {
        // Update existing record with file URL and enriched data
        await base44.entities.Evidence.update(matchedEvidenceId, { file_url: fileUrl, notes: analysis.key_content || '' });
        updateItem(idx, { status: 'saved', analysis, fileUrl, matchedEvidenceId, matchedCommId, action: 'updated_existing' });
      } else {
        // Create new record
        const created = await base44.entities.Evidence.create(evidencePayload);
        // If matched a communication, update that too
        if (matchedCommId) {
          await base44.entities.Communication.update(matchedCommId, { file_url: fileUrl });
        }
        updateItem(idx, { status: 'saved', analysis, fileUrl, matchedEvidenceId: created.id, matchedCommId, action: 'created_new' });
      }

      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['communications'] });

    } catch (err) {
      updateItem(idx, { status: 'error', error: err.message || 'Processing failed' });
    }
  };

  const processFiles = async (files) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const fileArray = Array.from(files);
    // Initialise all items first
    const initialItems = fileArray.map(f => ({ file: f.name, status: 'uploading', analysis: null, error: null }));
    setItems(initialItems);

    // Process all in parallel
    await Promise.all(fileArray.map((file, idx) => processFile(file, idx)));

    setIsProcessing(false);
    toast({ title: 'Batch processing complete', description: `${fileArray.length} document${fileArray.length > 1 ? 's' : ''} processed.` });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    handleDrag(e);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleChange = (e) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const saved = items.filter(i => i.status === 'saved').length;
  const skipped = items.filter(i => i.status === 'duplicate' || i.status === 'sample').length;
  const errors = items.filter(i => i.status === 'error').length;
  const inProgress = items.some(i => ['uploading', 'analysing', 'matching', 'saving'].includes(i.status));

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Evidence Scanner</h1>
          <p className="text-slate-600">Upload your document bundle — AI will read, classify, match to existing records, and auto-save everything. All file types accepted including Excel, Word, PDF and images.</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-fit">
            <Brain className="w-3.5 h-3.5" />
            Sample data guard active — only Bradley/Belcher/Powell case documents will be saved
          </div>
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
              <input id="file-input" type="file" onChange={handleChange} multiple accept="*/*" className="hidden" />
              {!isDataReady ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-sm font-medium text-slate-700">Loading evidence database...</p>
                </div>
              ) : inProgress ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-sm font-medium text-slate-700">Processing batch — do not close this page</p>
                  <p className="text-xs text-slate-500">Uploading → OCR → AI classify → match → save</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload className="w-10 h-10 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">Drop your entire document bundle here</p>
                    <p className="text-sm text-slate-600">PDFs, Excel, Word, images, CSV, scans — any file type, any order, any quantity</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.getElementById('file-input').click()}
                    disabled={!isDataReady}
                  >
                    Browse Files
                  </Button>
                  <p className="text-xs text-slate-500">Auto OCR • AI classify • Match existing records • Auto-save</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Bar */}
        {items.length > 0 && (
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="text-slate-600">{items.length} documents</span>
            {saved > 0 && <span className="text-green-700 font-semibold">{saved} saved</span>}
            {skipped > 0 && <span className="text-slate-500">{skipped} skipped</span>}
            {errors > 0 && <span className="text-red-600">{errors} errors</span>}
            {!inProgress && items.length > 0 && (
              <Button size="sm" variant="ghost" className="ml-auto text-xs" onClick={() => setItems([])}>Clear</Button>
            )}
          </div>
        )}

        {/* Results */}
        {items.length > 0 && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <p className="font-medium text-slate-900 text-sm truncate">{item.file}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Spinner for in-progress */}
                  {['uploading', 'analysing', 'matching', 'saving'].includes(item.status) && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {item.status === 'uploading' && 'Uploading file...'}
                      {item.status === 'analysing' && 'AI reading and classifying document...'}
                      {item.status === 'matching' && 'Matching to existing case records...'}
                      {item.status === 'saving' && 'Saving to evidence database...'}
                    </div>
                  )}

                  {/* Original document snip */}
                  {item.fileUrl && item.status === 'saved' && (
                    <EvidenceDocumentSnip fileUrl={item.fileUrl} title={item.analysis?.suggested_title || item.file} compact />
                  )}

                  {/* AI analysis result */}
                  {item.analysis && item.status === 'saved' && (
                    <div className="mt-2 space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded p-3">
                      {item.analysis.suggested_title && (
                        <p><span className="font-semibold text-slate-800">Title:</span> {item.analysis.suggested_title}</p>
                      )}
                      {item.analysis.date && (
                        <p><span className="font-semibold text-slate-800">Date:</span> {item.analysis.date}</p>
                      )}
                      {item.analysis.from_party && (
                        <p><span className="font-semibold text-slate-800">From:</span> {item.analysis.from_party} → {item.analysis.to_party}</p>
                      )}
                      {item.analysis.key_content && (
                        <p className="italic">"{item.analysis.key_content}"</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">{item.analysis.evidence_type}</Badge>
                        <Badge variant="outline" className="text-xs">{item.analysis.strength}</Badge>
                        <Badge variant="outline" className="text-xs">{item.analysis.relevance}</Badge>
                        {item.action === 'updated_existing' && (
                          <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">Matched & updated existing record</Badge>
                        )}
                        {item.matchedCommId && (
                          <Badge className="text-xs bg-indigo-100 text-indigo-800 border-indigo-200">Communication record linked</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sample data rejection */}
                  {item.status === 'sample' && (
                    <p className="text-xs text-red-600 mt-1">Rejected: document appears to contain sample/placeholder data not related to Bradley/Belcher/Powell case.</p>
                  )}

                  {/* Error */}
                  {item.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">{item.error}</p>
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