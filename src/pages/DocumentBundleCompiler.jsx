import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileText, Download, Plus, Trash2, Eye, CheckCircle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function DocumentBundleCompiler() {
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('chronological');
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  const { data: cases = [] } = useQuery({
    queryKey: ['casesForBundle'],
    queryFn: () => base44.entities.LegalCase.list()
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['documentAnalysesForBundle', selectedCase],
    queryFn: () => selectedCase ? base44.entities.DocumentAnalysis.filter({ case_id: selectedCase }) : Promise.resolve([]),
    enabled: !!selectedCase
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['documentBundles', selectedCase],
    queryFn: () => selectedCase ? base44.entities.DocumentBundle.filter({ case_id: selectedCase }) : Promise.resolve([]),
    enabled: !!selectedCase
  });

  const compileMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCase || selectedDocs.length === 0 || !bundleName) {
        throw new Error('Missing required fields');
      }

      const result = await base44.functions.invoke('compileDocumentBundle', {
        case_id: selectedCase,
        document_ids: selectedDocs,
        bundle_name: bundleName,
        bundle_description: bundleDescription,
        sort_order: sortOrder,
        court_format: true
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentBundles'] });
      setSelectedDocs([]);
      setBundleName('');
      setBundleDescription('');
      setShowPreview(false);
    }
  });

  const toggleDocSelection = (docId) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectedDocsList = analyses.filter(a => selectedDocs.includes(a.id));
  const currentCase = cases.find(c => c.id === selectedCase);

  // Sort documents based on selection
  const getSortedDocs = () => {
    const docs = [...selectedDocsList];
    if (sortOrder === 'chronological') {
      docs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    } else if (sortOrder === 'reverse_chronological') {
      docs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortOrder === 'type') {
      docs.sort((a, b) => a.document_type.localeCompare(b.document_type));
    }
    return docs;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Document Bundle Compiler</h1>
        <p className="text-slate-600 mt-1">Compile analyzed documents into court-ready indexed PDF bundles</p>
      </div>

      <Tabs defaultValue="compiler" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="compiler">Compile Bundle</TabsTrigger>
          <TabsTrigger value="history">Bundle History</TabsTrigger>
        </TabsList>

        {/* Compiler Tab */}
        <TabsContent value="compiler" className="space-y-6 mt-6">
          {/* Case Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Case</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedCase}
                onChange={(e) => {
                  setSelectedCase(e.target.value);
                  setSelectedDocs([]);
                }}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              >
                <option value="">Choose a case...</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.case_ref} - {c.client_name}</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {selectedCase && (
            <>
              {/* Bundle Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Bundle Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bundle Name</label>
                    <Input
                      value={bundleName}
                      onChange={(e) => setBundleName(e.target.value)}
                      placeholder="e.g., Claimant's Disclosure Bundle - April 2026"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description (Optional)</label>
                    <textarea
                      value={bundleDescription}
                      onChange={(e) => setBundleDescription(e.target.value)}
                      placeholder="Brief description of bundle contents..."
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sort Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    >
                      <option value="chronological">Chronological (earliest first)</option>
                      <option value="reverse_chronological">Reverse Chronological (latest first)</option>
                      <option value="type">By Document Type</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Document Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Select Documents ({selectedDocs.length})</span>
                    {analyses.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDocs(analyses.map(a => a.id))}
                      >
                        Select All
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyses.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {analyses.map((analysis) => (
                        <div key={analysis.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                          <Checkbox
                            checked={selectedDocs.includes(analysis.id)}
                            onCheckedChange={() => toggleDocSelection(analysis.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{analysis.document_name}</p>
                            <p className="text-xs text-slate-600 mt-1">{analysis.summary?.slice(0, 100)}...</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{analysis.document_type}</Badge>
                              <Badge variant="outline" className="text-xs">{format(parseISO(analysis.created_date), 'dd MMM')}</Badge>
                              {analysis.risk_flags?.length > 0 && (
                                <Badge variant="outline" className="text-xs text-red-600">
                                  {analysis.risk_flags.length} risks
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No analyzed documents for this case. Upload and analyze documents first.</p>
                  )}
                </CardContent>
              </Card>

              {/* Document Preview */}
              {selectedDocs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bundle Preview ({selectedDocs.length} documents)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                    {getSortedDocs().map((doc, idx) => (
                      <div key={doc.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded text-sm">
                        <span className="font-semibold text-slate-600 w-6">Tab {idx + 1}</span>
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="flex-1">{doc.document_name}</span>
                        <span className="text-xs text-slate-500">{doc.document_type}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Compile Button */}
              <div className="flex gap-2">
                <Button
                  onClick={() => compileMutation.mutate()}
                  disabled={selectedDocs.length === 0 || !bundleName || compileMutation.isPending}
                  className="flex-1"
                >
                  {compileMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Compiling PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Compile Court-Ready Bundle
                    </>
                  )}
                </Button>
              </div>

              {compileMutation.isSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">Bundle created successfully!</p>
                      <p className="text-sm text-green-700 mt-1">{compileMutation.data.document_count} documents indexed and paginated</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = compileMutation.data.pdf_url;
                          link.download = `${compileMutation.data.bundle_name}.pdf`;
                          link.click();
                        }}
                        className="mt-2"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {compileMutation.isError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  Error: {compileMutation.error?.message}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          {selectedCase ? (
            bundles.length > 0 ? (
              <div className="space-y-3">
                {bundles.map((bundle) => (
                  <Card key={bundle.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{bundle.bundle_name}</h3>
                          <p className="text-sm text-slate-600 mt-1">{bundle.description}</p>
                          <div className="flex gap-2 mt-3">
                            <Badge variant="outline">{bundle.document_count} documents</Badge>
                            <Badge variant="outline">{format(parseISO(bundle.created_date), 'dd MMM yyyy')}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = bundle.pdf_url;
                            link.download = `${bundle.bundle_name}.pdf`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No bundles created yet for this case</p>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">Select a case to view bundle history</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}