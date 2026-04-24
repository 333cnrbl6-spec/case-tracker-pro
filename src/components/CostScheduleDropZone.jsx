import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, Loader2, X } from 'lucide-react';

export default function CostScheduleDropZone({ onSaved }) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState([]);
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  };

  const handlePick = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const saveAll = async () => {
    if (!files.length) return;
    setSaving(true);
    const results = [];

    for (const file of files) {
      try {
        // Upload the file to get a URL
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // Infer property from filename
        let property = 'Unknown property';
        const fn = file.name.toLowerCase();
        if (fn.includes('trinity')) property = '4 Trinity Buildings';
        else if (fn.includes('clifton')) property = '29 Clifton Road';
        else if (fn.includes('victoria')) property = 'Victoria Street';
        else if (fn.includes('yardie')) property = 'Yardie Lane';
        else if (fn.includes('walton') || fn.includes('preston')) property = 'Waltons Parade';

        // Save as Evidence record
        await base44.entities.Evidence.create({
          date_collected: new Date().toISOString().split('T')[0],
          title: `Cost Schedule — ${property} — ${file.name}`,
          description: `Cost schedule file uploaded directly. Property: ${property}. File: ${file.name}. Awaiting manual analysis of agreed rates vs VIVID valuations.`,
          evidence_type: 'document',
          file_url,
          relevance: 'rics_violation',
          strength: 'strong',
          notes: 'Uploaded via Cost Schedule Analysis page drop zone. Review for rate-agreed items and VIVID counter-valuations.',
        });

        results.push({ name: file.name, ok: true });
      } catch (err) {
        results.push({ name: file.name, ok: false, error: err.message });
      }
    }

    setSaved(results);
    setFiles([]);
    setSaving(false);
    if (onSaved) onSaved();
  };

  return (
    <Card className="mb-6 border-indigo-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="w-4 h-4 text-indigo-600" />
          Drop Cost Schedule Files Here
          <Badge className="ml-1 text-xs bg-green-100 text-green-800">No AI credits used</Badge>
        </CardTitle>
        <p className="text-xs text-slate-500">
          Drop Excel/CSV cost schedules directly — files are saved to Evidence without consuming AI build credits.
        </p>
      </CardHeader>
      <CardContent>
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Drag & drop cost schedule files here</p>
          <p className="text-xs text-slate-500 mt-1">Excel (.xlsx), CSV, or any document — or click to browse</p>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
            onChange={handlePick}
          />
        </div>

        {/* Queued files */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm border rounded px-3 py-2 bg-slate-50">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="flex-1 text-slate-700 truncate">{f.name}</span>
                <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <Button
              onClick={saveAll}
              disabled={saving}
              className="w-full mt-2"
              size="sm"
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving to Evidence...</> : `Save ${files.length} file${files.length > 1 ? 's' : ''} to Evidence`}
            </Button>
          </div>
        )}

        {/* Results */}
        {saved.length > 0 && (
          <div className="mt-3 space-y-1">
            {saved.map((r, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded ${r.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {r.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                <span>{r.name} — {r.ok ? 'saved to Evidence' : `failed: ${r.error}`}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}