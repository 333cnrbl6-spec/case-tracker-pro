import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, FileText, Zap, ChevronDown, ChevronRight } from 'lucide-react';

const statusColors = {
  pending: 'bg-slate-100 text-slate-600',
  processing: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
};

export default function BundleProcessor() {
  const [fragmentStatuses, setFragmentStatuses] = useState({});
  const [expandedResults, setExpandedResults] = useState({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const queryClient = useQueryClient();

  const clearErrors = () => {
    setFragmentStatuses(prev => {
      const cleared = { ...prev };
      Object.keys(cleared).forEach(id => {
        if (cleared[id].status === 'error') delete cleared[id];
      });
      return cleared;
    });
  };

  const hasErrors = Object.values(fragmentStatuses).some(s => s.status === 'error');

  const { data: evidence = [], isLoading } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list('-date_collected'),
  });

  // Only show evidence records that have a PDF file_url and haven't been processed yet
  const pdfFragments = evidence.filter(e =>
    e.file_url && e.file_url.includes('.pdf') && !e.notes?.startsWith('PROCESSED FRAGMENT')
  );

  const processFragment = async (item) => {
    setFragmentStatuses(prev => ({ ...prev, [item.id]: { status: 'processing' } }));
    try {
      const response = await base44.functions.invoke('processBundleFragment', {
        evidence_id: item.id,
        file_url: item.file_url,
        title: item.title,
      });
      const result = response.data;
      setFragmentStatuses(prev => ({
        ...prev,
        [item.id]: { status: 'done', result }
      }));
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    } catch (err) {
      setFragmentStatuses(prev => ({
        ...prev,
        [item.id]: { status: 'error', error: err.message }
      }));
    }
  };

  const processAll = async () => {
    setIsRunningAll(true);
    for (const item of pdfFragments) {
      if (!fragmentStatuses[item.id] || fragmentStatuses[item.id].status === 'pending') {
        await processFragment(item);
      }
    }
    setIsRunningAll(false);
  };

  const toggleExpand = (id) => {
    setExpandedResults(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalExtracted = Object.values(fragmentStatuses)
    .filter(s => s.status === 'done')
    .reduce((sum, s) => sum + (s.result?.documents_extracted || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bundle Processor</h1>
          <p className="text-slate-600">
            AI extracts and classifies every document, email and record from your uploaded PDF fragments.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-500">PDF Fragments</p>
              <p className="text-2xl font-bold text-slate-900">{pdfFragments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-500">Processed</p>
              <p className="text-2xl font-bold text-green-700">
                {Object.values(fragmentStatuses).filter(s => s.status === 'done').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-500">Records Extracted</p>
              <p className="text-2xl font-bold text-indigo-700">{totalExtracted}</p>
            </CardContent>
          </Card>
        </div>

        {pdfFragments.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No unprocessed PDF fragments found</p>
              <p className="text-sm text-slate-400 mt-1">Upload PDFs via the Evidence Scanner first</p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.href = '/scanner'}>
                Go to Evidence Scanner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-600">{pdfFragments.length} fragment{pdfFragments.length > 1 ? 's' : ''} ready to process</p>
              <div className="flex items-center gap-2">
              {hasErrors && (
                <Button variant="outline" onClick={clearErrors} className="text-red-600 border-red-300 hover:bg-red-50">
                  Clear Errors
                </Button>
              )}
              <Button
                onClick={processAll}
                disabled={isRunningAll}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isRunningAll ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />Process All Fragments</>
                )}
              </Button>
              </div>
            </div>

            <div className="space-y-3">
              {pdfFragments.map((item) => {
                const status = fragmentStatuses[item.id];
                const expanded = expandedResults[item.id];
                const result = status?.result;

                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3 pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.date_collected}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[status?.status || 'pending']}>
                            {status?.status || 'pending'}
                          </Badge>
                          {!status || status.status === 'pending' ? (
                            <Button size="sm" variant="outline" onClick={() => processFragment(item)}>
                              Analyse
                            </Button>
                          ) : status.status === 'processing' ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          ) : status.status === 'done' ? (
                            <Button size="sm" variant="ghost" onClick={() => toggleExpand(item.id)}>
                              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </Button>
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {/* Results panel */}
                    {status?.status === 'done' && expanded && result && (
                      <CardContent className="pt-0 border-t bg-slate-50">
                        <div className="py-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">
                              {result.documents_extracted} document{result.documents_extracted !== 1 ? 's' : ''} extracted
                            </span>
                          </div>
                          {result.fragment_summary && (
                            <p className="text-sm text-slate-700 bg-white rounded p-3 border">
                              {result.fragment_summary}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs">
                            {result.date_range && (
                              <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded">
                                📅 {result.date_range}
                              </span>
                            )}
                            {result.key_parties?.map((p, i) => (
                              <span key={i} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                {p}
                              </span>
                            ))}
                          </div>
                          {result.saved_records?.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Extracted records:</p>
                              {result.saved_records.map((r, i) => (
                                <div key={i} className="text-xs text-slate-600 bg-white border rounded px-3 py-1.5 flex justify-between">
                                  <span className="truncate">{r.subject}</span>
                                  <span className="text-slate-400 ml-2 flex-shrink-0">{r.date}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}

                    {status?.status === 'error' && (
                      <CardContent className="pt-0 border-t bg-red-50">
                        <p className="text-xs text-red-600 py-2">{status.error}</p>
                        <Button size="sm" variant="outline" onClick={() => processFragment(item)} className="mb-2">
                          Retry
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}