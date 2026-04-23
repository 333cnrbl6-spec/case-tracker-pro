import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Trash2, ExternalLink, Download } from 'lucide-react';
import { generateEvidenceReport } from '@/lib/generatePDF';
import FilterBar from '@/components/FilterBar';
import AISummaryBanner from '@/components/AISummaryBanner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DocumentDropZone from '../components/DocumentDropZone';
import BatchAutoTagButton from '@/components/BatchAutoTagButton';
import AnnotationPanel from '../components/AnnotationPanel';
import EvidenceIncidentSuggestions from '../components/EvidenceIncidentSuggestions';
import EvidenceRuleCorrelations from '../components/EvidenceRuleCorrelations';
import EvidenceSummary from '../components/EvidenceSummary';
import OCRContradictionModule from '../components/OCRContradictionModule';
import DocumentViewer from '@/components/DocumentViewer';
import AnnotationManager from '@/components/AnnotationManager';
import StatementOfEvidenceReport from '@/components/StatementOfEvidenceReport';

const strengthColors = {
  weak: 'bg-slate-100 text-slate-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  strong: 'bg-green-100 text-green-800',
  critical: 'bg-red-100 text-red-800',
};

export default function Evidence() {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', evidence_type: 'all', strength: 'all', relevance: 'all', date_from: 'all', date_to: 'all' });
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid or annotate
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);
  const [formData, setFormData] = useState({
    date_collected: '',
    title: '',
    description: '',
    evidence_type: 'document',
    file_url: '',
    relevance: 'rics_violation',
    strength: 'moderate',
    notes: '',
  });

  const queryClient = useQueryClient();
  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list('-date_collected'),
  });

  const filteredEvidence = evidence.filter(e => {
    const q = filters.search?.toLowerCase() || '';
    if (q && !e.title?.toLowerCase().includes(q) && !e.description?.toLowerCase().includes(q) && !e.notes?.toLowerCase().includes(q)) return false;
    if (filters.evidence_type !== 'all' && e.evidence_type !== filters.evidence_type) return false;
    if (filters.strength !== 'all' && e.strength !== filters.strength) return false;
    if (filters.relevance !== 'all' && e.relevance !== filters.relevance) return false;
    if (filters.date_from !== 'all' && filters.date_from && e.date_collected < filters.date_from) return false;
    if (filters.date_to !== 'all' && filters.date_to && e.date_collected > filters.date_to) return false;
    return true;
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['rics-rules'],
    queryFn: () => base44.entities.RICSRule.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Evidence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      setOpen(false);
      setFormData({
        date_collected: '',
        title: '',
        description: '',
        evidence_type: 'document',
        file_url: '',
        relevance: 'rics_violation',
        strength: 'moderate',
        notes: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Evidence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleSelectEvidence = (id) => {
    setSelectedEvidenceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedItem = selectedEvidenceId ? evidence.find(e => e.id === selectedEvidenceId) : null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
           <div>
             <h1 className="text-3xl font-bold text-slate-900">Evidence & Documents</h1>
             {viewMode === 'annotate' && selectedEvidenceIds.length > 0 && (
               <p className="text-sm text-slate-600 mt-1">{selectedEvidenceIds.length} document(s) selected for annotation</p>
             )}
           </div>
           <div className="flex gap-2">
             <BatchAutoTagButton />
             <Button 
               variant={viewMode === 'annotate' ? 'default' : 'outline'}
               className="gap-2"
               onClick={() => {
                 setViewMode(viewMode === 'annotate' ? 'grid' : 'annotate');
                 setSelectedEvidenceIds([]);
               }}
             >
               {viewMode === 'annotate' ? '✓ Annotation Mode' : '📝 Start Annotation'}
             </Button>
             <Button variant="outline" className="gap-2" onClick={() => generateEvidenceReport(filteredEvidence)}>
               <Download className="w-4 h-4" />
               Download Report
             </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4" />
                Add Evidence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Evidence</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date Collected</label>
                    <Input
                      type="date"
                      value={formData.date_collected}
                      onChange={(e) => setFormData({ ...formData, date_collected: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={formData.evidence_type} onValueChange={(v) => setFormData({ ...formData, evidence_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="valuation">Valuation</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="witness_statement">Witness Statement</SelectItem>
                        <SelectItem value="photograph">Photograph</SelectItem>
                        <SelectItem value="recording_transcript">Recording Transcript</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., 'Belcher Survey Report - Dec 2023'"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this evidence show?"
                    className="min-h-24"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Relevance</label>
                    <Select value={formData.relevance} onValueChange={(v) => setFormData({ ...formData, relevance: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rics_violation">RICS Violation</SelectItem>
                        <SelectItem value="legal_violation">Legal Violation</SelectItem>
                        <SelectItem value="pattern">Pattern Evidence</SelectItem>
                        <SelectItem value="credibility">Credibility Issue</SelectItem>
                        <SelectItem value="context">Context</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Strength</label>
                    <Select value={formData.strength} onValueChange={(v) => setFormData({ ...formData, strength: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weak">Weak</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="strong">Strong</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">File URL (optional)</label>
                  <Input
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="Link to uploaded document"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional analysis or context"
                    className="min-h-20"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <DocumentDropZone onEvidenceCreated={() => queryClient.invalidateQueries({ queryKey: ['evidence'] })} />

        <div className="mt-6">
          <OCRContradictionModule />
        </div>

        {evidence.length > 0 && (
          <div className="mt-6">
            <AISummaryBanner
              title="AI Summary — Evidence"
              colorScheme="teal"
              prompt={`You are a legal compliance expert. Provide a concise 3–5 bullet point summary of the following evidence items collected for a RICS conduct investigation. Highlight: the strongest evidence, any critical patterns or gaps, overall evidence quality, and the most important next steps.

Evidence items:
${evidence.map((e, i) => `${i + 1}. [${e.strength?.toUpperCase()}] ${e.title} — Type: ${e.evidence_type?.replace(/_/g,' ')} | Relevance: ${e.relevance?.replace(/_/g,' ')} | ${e.description || ''} ${e.notes ? '| Notes: ' + e.notes : ''}`).join('\n')}`}
            />
          </div>
        )}

        <FilterBar
          filters={filters}
          onChange={setFilters}
          totalCount={evidence.length}
          resultCount={filteredEvidence.length}
          config={[
            { key: 'strength', label: 'Strength', type: 'select', options: [
              { value: 'weak', label: 'Weak' }, { value: 'moderate', label: 'Moderate' },
              { value: 'strong', label: 'Strong' }, { value: 'critical', label: 'Critical' },
            ]},
            { key: 'evidence_type', label: 'Type', type: 'select', options: [
              { value: 'document', label: 'Document' }, { value: 'communication', label: 'Communication' },
              { value: 'report', label: 'Report' }, { value: 'valuation', label: 'Valuation' },
              { value: 'contract', label: 'Contract' }, { value: 'witness_statement', label: 'Witness Statement' },
              { value: 'photograph', label: 'Photograph' }, { value: 'recording_transcript', label: 'Recording' },
              { value: 'other', label: 'Other' },
            ]},
            { key: 'relevance', label: 'Relevance', type: 'select', options: [
              { value: 'rics_violation', label: 'RICS Violation' }, { value: 'legal_violation', label: 'Legal Violation' },
              { value: 'pattern', label: 'Pattern' }, { value: 'credibility', label: 'Credibility' },
              { value: 'context', label: 'Context' }, { value: 'other', label: 'Other' },
            ]},
            { key: 'date_from', label: 'Date From', type: 'date' },
            { key: 'date_to', label: 'Date To', type: 'date' },
          ]}
        />

        {viewMode === 'annotate' && selectedEvidenceIds.length > 0 ? (
          <div className="space-y-6">
            <StatementOfEvidenceReport selectedEvidenceIds={selectedEvidenceIds} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {selectedEvidenceIds.map((id) => {
                  const item = evidence.find(e => e.id === id);
                  return item ? (
                    <div key={id}>
                      {item.file_url && (
                        <>
                          <h3 className="text-lg font-semibold text-slate-900 mb-3">{item.title}</h3>
                          <DocumentViewer 
                            fileUrl={item.file_url}
                            fileType={item.evidence_type === 'document' || item.evidence_type === 'report' ? 'pdf' : 'image'}
                            onHighlightCreate={async (highlight) => {
                              await base44.entities.Annotation.create({
                                evidence_id: id,
                                ...highlight,
                                significance: 'supporting',
                                created_by: user?.email || 'anonymous'
                              });
                              queryClient.invalidateQueries({ queryKey: ['annotations', id] });
                            }}
                            onHighlightDelete={async (annotationId) => {
                              await base44.entities.Annotation.delete(annotationId);
                              queryClient.invalidateQueries({ queryKey: ['annotations', id] });
                            }}
                          />
                        </>
                      )}
                    </div>
                  ) : null;
                })}
              </div>
              <div className="space-y-4">
                {selectedEvidenceIds.map((id) => (
                  <AnnotationManager key={id} evidenceId={id} />
                ))}
              </div>
            </div>
          </div>
        ) : (
        <div className="space-y-4">
           {filteredEvidence.length === 0 ? (
             <Card className="text-center py-12">
               <p className="text-slate-500">{evidence.length === 0 ? 'No evidence added yet. Start organizing your supporting documents.' : 'No evidence matches the current filters.'}</p>
             </Card>
           ) : (
             filteredEvidence.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base mb-2">
                        <FileText className="w-4 h-4" />
                        {item.title}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary">{item.evidence_type.replace(/_/g, ' ')}</Badge>
                        <Badge className={strengthColors[item.strength]}>
                          {item.strength.charAt(0).toUpperCase() + item.strength.slice(1)}
                        </Badge>
                        <Badge variant="outline">{item.relevance.replace(/_/g, ' ')}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-700">{item.description}</p>
                  {item.notes && (
                    <div className="bg-blue-50 p-3 rounded text-sm text-slate-700 border border-blue-100">
                      <p className="font-medium mb-1">Analysis Notes:</p>
                      {item.notes}
                    </div>
                  )}
                  <AnnotationPanel
                    entityName="Evidence"
                    recordId={item.id}
                    field="annotations"
                    value={item.annotations || ''}
                    queryKey={['evidence']}
                  />

                  <div
                    className="space-y-3 pt-2 border-t border-slate-200 cursor-grab active:cursor-grabbing bg-slate-50 rounded p-2"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'copy';
                      e.dataTransfer.setData('evidenceId', item.id);
                      e.dataTransfer.setData('evidenceTitle', item.title);
                    }}
                  >
                    <p className="text-xs text-slate-500 mb-1">💡 Drag to timeline to link</p>
                    <EvidenceSummary evidence={item} />

                    <EvidenceIncidentSuggestions
                      evidence={item}
                      incidents={incidents}
                      onLinkCreated={(incidentId) => {
                        // Link has been created
                      }}
                    />

                    <EvidenceRuleCorrelations
                      evidence={item}
                      rules={rules}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </div>
          )}
          </div>
          </div>
          );
          }