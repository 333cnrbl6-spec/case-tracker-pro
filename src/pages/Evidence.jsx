import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Trash2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DocumentDropZone from '../components/DocumentDropZone';
import AnnotationPanel from '../components/AnnotationPanel';
import EvidenceIncidentSuggestions from '../components/EvidenceIncidentSuggestions';
import EvidenceRuleCorrelations from '../components/EvidenceRuleCorrelations';
import EvidenceSummary from '../components/EvidenceSummary';

const strengthColors = {
  weak: 'bg-slate-100 text-slate-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  strong: 'bg-green-100 text-green-800',
  critical: 'bg-red-100 text-red-800',
};

export default function Evidence() {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Evidence & Documents</h1>
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

        <DocumentDropZone onEvidenceCreated={() => queryClient.invalidateQueries({ queryKey: ['evidence'] })} />

        <div className="space-y-4 mt-8">
           {evidence.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-slate-500">No evidence added yet. Start organizing your supporting documents.</p>
            </Card>
          ) : (
            evidence.map((item) => (
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

                  <div className="space-y-3 pt-2 border-t border-slate-200">
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
      </div>
    </div>
  );
}