import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function BatchAutoTagButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const queryClient = useQueryClient();

  const handleBatchTag = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('batchAutoTagEvidence', {});
      setResults(response.data.results);
      toast.success(response.data.message);
      
      // Refresh evidence list
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    } catch (err) {
      toast.error(err.message || 'Batch tagging failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" size="sm">
          <Zap className="w-4 h-4" />
          Auto-Tag All
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batch Auto-Tag Evidence</DialogTitle>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              This will analyze all uploaded evidence and automatically assign incident links, severity levels, and strength ratings based on document content.
            </p>
            <p className="text-xs text-slate-500">
              This process may take a few minutes depending on the number of documents. Already-tagged evidence will be skipped.
            </p>

            <Button
              onClick={handleBatchTag}
              disabled={loading}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Start Batch Auto-Tagging
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">Completed</p>
                  <p className="text-sm text-green-700 mt-1">{results.updated} evidence items updated with auto-tags</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded">
                <p className="text-slate-600 font-medium">{results.total}</p>
                <p className="text-xs text-slate-500">Total evidence</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-blue-600 font-medium">{results.processed}</p>
                <p className="text-xs text-blue-500">Processed</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-green-600 font-medium">{results.updated}</p>
                <p className="text-xs text-green-500">Updated</p>
              </div>
              <div className="bg-slate-50 p-3 rounded">
                <p className="text-slate-600 font-medium">{results.skipped}</p>
                <p className="text-xs text-slate-500">Skipped</p>
              </div>
            </div>

            {results.failed > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-700 font-medium mb-2">{results.failed} failed</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {results.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">
                      {err.title}: {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setResults(null);
                setOpen(false);
              }}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}