import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function Incidents() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Incidents & Breaches</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4" />
                Log New Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Incident' : 'Log New Incident'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">Save Incident</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {incidents.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-slate-500">No incidents logged yet. Start documenting your case.</p>
            </Card>
          ) : (
            incidents.map((incident) => (
              <Card key={incident.id} className="border-l-4 border-l-red-600">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        {incident.title}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={severityColors[incident.severity]}>
                          {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                        </Badge>
                        <Badge variant="outline">{incident.incident_type.replace(/_/g, ' ')}</Badge>
                        <span className="text-xs text-slate-500">{new Date(incident.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingId(incident.id);
                        setFormData(incident);
                        setOpen(true);
                      }}>
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
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}