import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Plus, Edit2, Trash2, Loader2, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import FilterBar from '@/components/FilterBar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RuleRecommendations from '@/components/RuleRecommendations';
import IncidentRulesPanel from '@/components/IncidentRulesPanel';
import IncidentAIAssistant from '@/components/IncidentAIAssistant';
import RiskScoreBadge from '@/components/RiskScoreBadge';
import { scoreIncident } from '@/lib/riskScoring';
import RemediationPlan from '@/components/RemediationPlan';
import AISummaryBanner from '@/components/AISummaryBanner';
import IncidentAISummary from '@/components/IncidentAISummary';
import RICSRiskAssessor from '@/components/RICSRiskAssessor';

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function Incidents() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ search: '', severity: 'all', incident_type: 'all', status: 'all', date_from: 'all', date_to: 'all', rics_violation: 'all' });
  const [linkedRules, setLinkedRules] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    description: '',
    incident_type: 'professional_conduct',
    severity: 'medium',
    witnesses: [],
    evidence_notes: '',
    rics_violations: [],
    legal_issues: [],
  });

  const queryClient = useQueryClient();
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-date'),
  });

  const filteredIncidents = incidents.filter(i => {
    const q = filters.search?.toLowerCase() || '';
    if (q && !i.title?.toLowerCase().includes(q) && !i.description?.toLowerCase().includes(q) &&
        !i.rics_violations?.some(v => v.toLowerCase().includes(q)) &&
        !i.incident_type?.toLowerCase().includes(q)) return false;
    if (filters.severity !== 'all' && i.severity !== filters.severity) return false;
    if (filters.incident_type !== 'all' && i.incident_type !== filters.incident_type) return false;
    if (filters.status !== 'all' && i.status !== filters.status) return false;
    if (filters.date_from !== 'all' && filters.date_from && i.date < filters.date_from) return false;
    if (filters.date_to !== 'all' && filters.date_to && i.date > filters.date_to) return false;
    if (filters.rics_violation !== 'all' && filters.rics_violation &&
        !i.rics_violations?.some(v => v.toLowerCase().includes(filters.rics_violation.toLowerCase()))) return false;
    return true;
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Incident.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  const resetForm = () => {
    setFormData({
      date: '',
      title: '',
      description: '',
      incident_type: 'professional_conduct',
      severity: 'medium',
      witnesses: [],
      evidence_notes: '',
      rics_violations: [],
      legal_issues: [],
    });
    setEditingId(null);
    setLinkedRules([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      rics_violations: linkedRules.length > 0 ? linkedRules : formData.rics_violations
    };
    if (editingId) {
      updateMutation.mutate(dataToSave);
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleEditIncident = (incident) => {
    setEditingId(incident.id);
    setFormData(incident);
    setLinkedRules(incident.rics_violations || []);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Incidents & Breaches</h1>
          <div className="flex gap-2">
            <Link to="/incident-kanban">
              <Button variant="outline" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Kanban Board
              </Button>
            </Link>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4" />
                Log New Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>{editingId ? 'Edit Incident' : 'Log New Incident'}</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-4">
               {formData.description && (
                 <IncidentAIAssistant
                   description={formData.description}
                   onApplySuggestions={(suggestions) => {
                     setFormData(prev => ({
                       ...prev,
                       incident_type: suggestions.incident_type || prev.incident_type,
                       severity: suggestions.severity || prev.severity,
                       rics_violations: suggestions.rics_violations || prev.rics_violations
                     }));
                     setLinkedRules(suggestions.rics_violations || linkedRules);
                   }}
                 />
               )}
               {formData.title && formData.description && (
                 <RuleRecommendations
                   incident={formData}
                   evidence={evidence.filter(e => 
                     formData.evidence_notes?.includes(e.data.title)
                   ).map(e => e.data)}
                   linkedRules={linkedRules}
                   onLinkedRulesChange={setLinkedRules}
                 />
               )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief title of incident"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Incident Type</label>
                  <Select value={formData.incident_type} onValueChange={(v) => setFormData({ ...formData, incident_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="communication">Communication Issue</SelectItem>
                      <SelectItem value="professional_conduct">Professional Conduct</SelectItem>
                      <SelectItem value="document_issue">Document/Report Issue</SelectItem>
                      <SelectItem value="gatekeeping">Gatekeeping Behavior</SelectItem>
                      <SelectItem value="information_control">Information Control</SelectItem>
                      <SelectItem value="harassment">Harassment/Bullying</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed account of the incident"
                    required
                    className="min-h-32"
                  />
                </div>

                <div>
                   <label className="text-sm font-medium">Evidence Notes</label>
                   <Textarea
                     value={formData.evidence_notes}
                     onChange={(e) => setFormData({ ...formData, evidence_notes: e.target.value })}
                     placeholder="What evidence supports this incident?"
                     className="min-h-24"
                   />
                 </div>

                {linkedRules.length > 0 && (
                  <IncidentRulesPanel
                    linkedRules={linkedRules}
                    onUnlink={(ruleNumber) => setLinkedRules(linkedRules.filter(r => r !== ruleNumber))}
                  />
                )}

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">Save Incident</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="mb-6">
          <RICSRiskAssessor compact={true} />
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          totalCount={incidents.length}
          resultCount={filteredIncidents.length}
          config={[
            { key: 'severity', label: 'Severity', type: 'select', options: [
              { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
            ]},
            { key: 'incident_type', label: 'Type', type: 'select', options: [
              { value: 'communication', label: 'Communication' },
              { value: 'professional_conduct', label: 'Professional Conduct' },
              { value: 'document_issue', label: 'Document Issue' },
              { value: 'gatekeeping', label: 'Gatekeeping' },
              { value: 'information_control', label: 'Information Control' },
              { value: 'harassment', label: 'Harassment' },
              { value: 'other', label: 'Other' },
            ]},
            { key: 'status', label: 'Status', type: 'select', options: [
              { value: 'open', label: 'Open' }, { value: 'reviewed', label: 'Reviewed' },
              { value: 'assessed', label: 'Assessed' }, { value: 'escalated', label: 'Escalated' },
            ]},
            { key: 'date_from', label: 'Date From', type: 'date' },
            { key: 'date_to', label: 'Date To', type: 'date' },
            { key: 'rics_violation', label: 'RICS Violation', type: 'text' },
          ]}
        />

        {incidents.length > 0 && (
          <div className="mb-6">
            <AISummaryBanner
              title="AI Summary — All Incidents"
              colorScheme="indigo"
              prompt={`You are a legal compliance expert. Provide a concise 3–5 bullet point summary of the following incidents for a RICS conduct investigation file. Highlight: overall severity patterns, the most serious breaches, recurring themes across incidents, key RICS violations identified, and the overall strength of the case.

Incidents (most recent first):
${incidents.map((inc, i) => `${i + 1}. [${inc.severity?.toUpperCase()}] ${inc.date} | ${inc.incident_type?.replace(/_/g, ' ')} | ${inc.title} | ${inc.description?.slice(0, 150)} ${inc.rics_violations?.length ? '| RICS: ' + inc.rics_violations.join(', ') : ''} ${inc.legal_issues?.length ? '| Legal: ' + inc.legal_issues.join(', ') : ''}`).join('\n')}`}
            />
          </div>
        )}

        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-slate-500">{incidents.length === 0 ? 'No incidents logged yet. Start documenting your case.' : 'No incidents match the current filters.'}</p>
            </Card>
          ) : (
            filteredIncidents.map((incident) => {
              const risk = scoreIncident(incident);
              return (
              <Card key={incident.id} className="border-l-4 border-l-red-600">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        {incident.title}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap items-center">
                        <Badge className={severityColors[incident.severity]}>
                          {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                        </Badge>
                        <Badge variant="outline">{incident.incident_type.replace(/_/g, ' ')}</Badge>
                        <span className="text-xs text-slate-500">{new Date(incident.date).toLocaleDateString()}</span>
                        <RiskScoreBadge score={risk.score} level={risk.level} size="sm" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="ghost" size="icon" onClick={() => handleEditIncident(incident)}>
                         <Edit2 className="w-4 h-4" />
                       </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(incident.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-700">{incident.description}</p>
                  <IncidentAISummary incident={incident} evidence={evidence} communications={communications} />
                  {incident.evidence_notes && (
                    <div className="bg-slate-50 p-3 rounded text-sm">
                      <p className="font-medium text-slate-700 mb-1">Evidence:</p>
                      <p className="text-slate-600">{incident.evidence_notes}</p>
                    </div>
                  )}
                  {(incident.rics_violations?.length > 0 || incident.legal_issues?.length > 0) && (
                    <div className="flex gap-4 pt-2">
                      {incident.rics_violations?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">RICS Violations:</p>
                          <div className="flex flex-wrap gap-1">
                            {incident.rics_violations.map((v, i) => (
                              <Badge key={i} variant="destructive" className="text-xs">{v}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {incident.legal_issues?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Legal Issues:</p>
                          <div className="flex flex-wrap gap-1">
                            {incident.legal_issues.map((l, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{l}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                <div className="pt-3 border-t border-slate-100">
                  <RemediationPlan incident={incident} />
                </div>
                </CardContent>
                </Card>
                );
                })
                )}
        </div>
      </div>
    </div>
  );
}