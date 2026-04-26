import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileText, Clock, CheckCircle, Search, Upload, Loader2, AlertCircle, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function CaseDocumentAnalyzer() {
  const [selectedCase, setSelectedCase] = useState('');
  const [docType, setDocType] = useState('contract');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: cases = [] } = useQuery({
    queryKey: ['casesForDocAnalysis'],
    queryFn: () => base44.entities.LegalCase.list()
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['documentAnalyses', selectedCase],
    queryFn: () => selectedCase ? base44.entities.DocumentAnalysis.filter({ case_id: selectedCase }) : Promise.resolve([]),
    enabled: !!selectedCase
  });

  const analyzeMutation = useMutation({
    mutationFn: async (file) => {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      
      const result = await base44.functions.invoke('analyzeDocumentClauses', {
        case_id: selectedCase,
        document_name: file.name,
        document_type: docType,
        file_url: uploadRes.file_url
      });
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentAnalyses'] });
      setUploading(false);
      fileInputRef.current.value = '';
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCase) return;

    setUploading(true);
    analyzeMutation.mutate(file);
  };

  const filteredAnalyses = analyses.filter(a =>
    a.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.parties?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const riskCount = selectedAnalysis?.risk_flags?.length || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Document Analysis Hub</h1>
        <p className="text-slate-600 mt-1">Extract clauses, dates, and obligations from contracts and briefs</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
          <TabsTrigger value="repository">Document Repository</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Analyze New Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Case Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Case</label>
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                >
                  <option value="">Choose a case...</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.case_ref} - {c.client_name}</option>
                  ))}
                </select>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                >
                  <option value="contract">Contract</option>
                  <option value="brief">Brief</option>
                  <option value="agreement">Agreement</option>
                  <option value="statement">Statement</option>
                  <option value="report">Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Document</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    disabled={!selectedCase || uploading}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedCase || uploading}
                    className="text-slate-600 hover:text-slate-900 font-medium disabled:opacity-50"
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing document...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-slate-400" />
                        <p>Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500">PDF, DOC, DOCX, or TXT</p>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {analyzeMutation.isPending && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                  Processing document with AI... This may take a moment.
                </div>
              )}

              {analyzeMutation.isSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✓ Document analyzed successfully! {analyzeMutation.data.clauses_count} clauses, {analyzeMutation.data.dates_count} dates, {analyzeMutation.data.obligations_count} obligations extracted.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Repository Tab */}
        <TabsContent value="repository" className="space-y-6 mt-6">
          {/* Search & Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search documents, parties, clauses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 text-sm"
                >
                  <option value="">All cases</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.case_ref}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Document Grid */}
          {filteredAnalyses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAnalyses.map((analysis) => (
                <Card
                  key={analysis.id}
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{analysis.document_name}</CardTitle>
                        <p className="text-xs text-slate-500 mt-1">
                          <Badge variant="outline" className="mr-2">{analysis.document_type}</Badge>
                          {format(parseISO(analysis.created_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                      {analysis.risk_flags?.length > 0 && (
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600 line-clamp-2">{analysis.summary}</p>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="font-semibold text-blue-900">{analysis.key_clauses?.length || 0}</p>
                        <p className="text-blue-700">Clauses</p>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <p className="font-semibold text-yellow-900">{analysis.key_dates?.length || 0}</p>
                        <p className="text-yellow-700">Dates</p>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <p className="font-semibold text-orange-900">{analysis.obligations?.length || 0}</p>
                        <p className="text-orange-700">Obligations</p>
                      </div>
                    </div>

                    {analysis.parties?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {analysis.parties.slice(0, 2).map((party, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{party}</Badge>
                        ))}
                        {analysis.parties.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{analysis.parties.length - 2}</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No documents analyzed yet. Upload a document to get started.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail View Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAnalysis(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedAnalysis.document_name}</CardTitle>
                <p className="text-sm text-slate-500 mt-2">{selectedAnalysis.summary}</p>
              </div>
              <button onClick={() => setSelectedAnalysis(null)} className="text-2xl text-slate-400 hover:text-slate-600">×</button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Risk Flags */}
              {selectedAnalysis.risk_flags?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Risk Flags ({selectedAnalysis.risk_flags.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedAnalysis.risk_flags.map((flag, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
                        {flag}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Clauses */}
              {selectedAnalysis.key_clauses?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Key Clauses ({selectedAnalysis.key_clauses.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedAnalysis.key_clauses.map((clause, idx) => (
                      <div key={idx} className="border border-slate-200 p-3 rounded text-sm">
                        <p className="font-medium text-slate-900">{clause.clause_type}</p>
                        <p className="text-slate-600 mt-1">{clause.text}</p>
                        <Badge className="mt-2 bg-blue-100 text-blue-700">Relevance: {clause.relevance_score}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Dates */}
              {selectedAnalysis.key_dates?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    Important Dates ({selectedAnalysis.key_dates.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedAnalysis.key_dates.map((dateEntry, idx) => (
                      <div key={idx} className="border border-slate-200 p-3 rounded text-sm">
                        <p className="font-medium text-slate-900">{format(parseISO(dateEntry.date), 'dd MMMM yyyy')}</p>
                        <p className="text-slate-600">{dateEntry.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Obligations */}
              {selectedAnalysis.obligations?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Obligations ({selectedAnalysis.obligations.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedAnalysis.obligations.map((obl, idx) => (
                      <div key={idx} className="border border-slate-200 p-3 rounded text-sm">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-medium text-slate-900">{obl.party}</p>
                          <Badge variant={obl.status === 'completed' ? 'default' : 'outline'}>{obl.status}</Badge>
                        </div>
                        <p className="text-slate-600">{obl.obligation}</p>
                        {obl.deadline && <p className="text-xs text-slate-500 mt-1">Deadline: {obl.deadline}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}