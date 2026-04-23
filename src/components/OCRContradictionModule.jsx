import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Loader2, AlertTriangle, CheckCircle2, Zap,
  FileText, ChevronDown, ChevronUp, Eye, X, Sparkles
} from 'lucide-react';

const SEVERITY_STYLE = {
  critical: 'bg-red-100 border-red-300 text-red-800',
  significant: 'bg-orange-100 border-orange-300 text-orange-800',
  moderate: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  minor: 'bg-slate-100 border-slate-300 text-slate-700',
};

const SEVERITY_DOT = {
  critical: 'bg-red-500',
  significant: 'bg-orange-500',
  moderate: 'bg-yellow-500',
  minor: 'bg-slate-400',
};

function ContradictionCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.minor;
  const dot = SEVERITY_DOT[item.severity] || SEVERITY_DOT.minor;

  return (
    <div className={`rounded-lg border p-3 ${style}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide">{item.severity}</span>
              <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
              <span className="text-xs opacity-70 truncate">{item.record_title}</span>
            </div>
            <p className="text-sm font-medium leading-snug">{item.contradiction_summary}</p>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-current opacity-60 hover:opacity-100 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 pl-4 border-l-2 border-current border-opacity-30">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">Document claims:</p>
            <p className="text-sm italic">"{item.document_claim}"</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">Existing record states:</p>
            <p className="text-sm italic">"{item.existing_claim}"</p>
          </div>
          {item.legal_significance && (
            <div className="bg-white/50 rounded p-2">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">Legal significance:</p>
              <p className="text-xs">{item.legal_significance}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OCRContradictionModule() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState('idle'); // idle | uploading | analysing | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showOCR, setShowOCR] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/tiff'];
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|png|jpg|jpeg|webp|tiff?)$/i)) {
      setErrorMsg('Only PDF and image files are supported.');
      return;
    }
    setFile(f);
    setResult(null);
    setErrorMsg('');
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const analyse = async () => {
    if (!file) return;
    setStage('uploading');
    setErrorMsg('');
    setResult(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setStage('analysing');
    const res = await base44.functions.invoke('ocrAndContradictAnalyse', { file_url, file_name: file.name });
    setResult(res.data);
    setStage('done');
  };

  const reset = () => { setFile(null); setResult(null); setStage('idle'); setErrorMsg(''); setShowOCR(false); };

  const contradictions = result?.analysis?.contradictions || [];
  const corroborations = result?.analysis?.corroborations || [];
  const newFacts = result?.analysis?.new_facts || [];
  const ricsFlags = result?.analysis?.rics_flags || [];

  return (
    <Card className="border-2 border-dashed border-violet-200 bg-violet-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-violet-900">
          <Sparkles className="w-5 h-5 text-violet-500" />
          OCR Document Analyser & Contradiction Detector
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Upload a PDF or image — AI extracts the text, then automatically cross-references it against all existing incidents and communications to flag contradictions.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Drop zone */}
        {stage === 'idle' && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed cursor-pointer transition-all p-6 text-center
                ${dragging ? 'border-violet-400 bg-violet-100' : file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-violet-400 hover:bg-violet-50'}`}
            >
              <input ref={inputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff,.tif" onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-slate-800 text-sm">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB · Ready to analyse</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); reset(); }} className="ml-2 text-slate-400 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-600">Drop a PDF or image here</p>
                  <p className="text-xs text-slate-400">PDF, PNG, JPG, WEBP supported</p>
                </div>
              )}
            </div>
            {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
            {file && (
              <Button onClick={analyse} className="w-full bg-violet-600 hover:bg-violet-700 gap-2">
                <Sparkles className="w-4 h-4" /> Extract & Analyse for Contradictions
              </Button>
            )}
          </>
        )}

        {/* Progress */}
        {(stage === 'uploading' || stage === 'analysing') && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            <p className="text-sm font-medium text-slate-700">
              {stage === 'uploading' ? 'Uploading document…' : 'Extracting text & cross-referencing records…'}
            </p>
            <p className="text-xs text-slate-400">
              {stage === 'analysing' ? 'This may take 15–30 seconds for thorough analysis' : ''}
            </p>
          </div>
        )}

        {/* Results */}
        {stage === 'done' && result && (
          <div className="space-y-4">
            {/* Overall assessment */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document Overview</p>
                <Badge variant="secondary" className="text-xs capitalize">{result.ocr?.document_type || 'Document'}</Badge>
              </div>
              <p className="text-sm text-slate-700">{result.analysis?.overall_assessment}</p>
              <div className="flex gap-3 flex-wrap pt-1">
                <span className="text-xs text-slate-500">People: {(result.ocr?.people_mentioned || []).join(', ') || 'None identified'}</span>
                {(result.ocr?.dates_mentioned || []).length > 0 && (
                  <span className="text-xs text-slate-500">Dates: {result.ocr.dates_mentioned.slice(0, 4).join(', ')}</span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Contradictions', value: contradictions.length, color: contradictions.length > 0 ? 'text-red-600' : 'text-slate-600', bg: contradictions.length > 0 ? 'bg-red-50' : 'bg-slate-50' },
                { label: 'Corroborations', value: corroborations.length, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'New Facts', value: newFacts.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'RICS Flags', value: ricsFlags.length, color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map(s => (
                <div key={s.label} className={`rounded-lg p-2 text-center ${s.bg}`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Contradictions */}
            {contradictions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-slate-800">Contradictions Found ({contradictions.length})</h3>
                </div>
                <div className="space-y-2">
                  {contradictions.map((c, i) => <ContradictionCard key={i} item={c} />)}
                </div>
              </div>
            )}

            {/* Corroborations */}
            {corroborations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <h3 className="text-sm font-semibold text-slate-800">Corroborates Existing Records ({corroborations.length})</h3>
                </div>
                <div className="space-y-1.5">
                  {corroborations.map((c, i) => (
                    <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">{c.type}</Badge>
                        <span className="text-xs text-slate-500">{c.record_title}</span>
                      </div>
                      <p className="text-sm text-green-800">{c.corroboration_summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Facts */}
            {newFacts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-slate-800">New Facts Not in Any Existing Record</h3>
                </div>
                <ul className="space-y-1">
                  {newFacts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-blue-50 border border-blue-100 rounded px-3 py-2">
                      <span className="text-blue-400 font-bold mt-0.5">→</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* RICS Flags */}
            {ricsFlags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-semibold text-slate-800">RICS Violations Evidenced</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ricsFlags.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-800 text-xs px-2.5 py-1 rounded-full">
                      <Zap className="w-3 h-3" />{f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted text toggle */}
            <div className="pt-1 border-t">
              <button onClick={() => setShowOCR(o => !o)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
                <FileText className="w-3.5 h-3.5" />
                {showOCR ? 'Hide' : 'Show'} extracted text
                {showOCR ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showOCR && (
                <pre className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {result.ocr?.extracted_text || 'No text extracted.'}
                </pre>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={reset} className="w-full">
              Analyse Another Document
            </Button>
          </div>
        )}

        {stage === 'error' && (
          <div className="text-center py-4 space-y-2">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm text-red-600">{errorMsg || 'Analysis failed. Please try again.'}</p>
            <Button variant="outline" size="sm" onClick={reset}>Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}