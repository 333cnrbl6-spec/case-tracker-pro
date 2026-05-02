import React, { useState } from 'react';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Plus, Search, Calendar, User, Briefcase, ChevronRight, GitCommitHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { daysUntil } from '@/lib/dateUtils';
import CaseTimeline from '@/components/CaseTimeline';
import DuplicateCaseMerger from '@/components/DuplicateCaseMerger';
import EntityConflictAlert from '@/components/EntityConflictAlert';
import CaseTypeGuidance from '@/components/CaseTypeGuidance';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  under_review: 'bg-blue-100 text-blue-800',
  settled: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-100 text-slate-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  litigation: 'bg-red-100 text-red-800',
};

const CASE_TYPE_LABELS = {
  personal_injury: 'Personal Injury',
  employment: 'Employment',
  property_dispute: 'Property Dispute',
  professional_negligence: 'Professional Negligence',
  insurance_claim: 'Insurance Claim',
  contractual_dispute: 'Contractual Dispute',
  rics_complaint: 'RICS Complaint',
  other: 'Other'
};


function LimitationBadge({ date }) {
  if (!date) return null;
  const days = daysUntil(date);
  if (days > 90) return null;
  const color = days <= 7 ? 'bg-red-600 text-white' : days <= 30 ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-white';
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>
      <AlertTriangle className="w-3 h-3" />
      {days <= 0 ? 'LIMITATION OVERDUE' : `Limitation: ${days}d`}
    </span>
  );
}

const EMPTY_FORM = {
  case_ref: '', case_type: 'professional_negligence', status: 'active',
  client_name: '', client_email: '', opponent_name: '', assigned_fee_earner: '',
  incident_date: '', limitation_date: '', estimated_value: '',
  facts: '', instructions: '', court_deadline: '', client_care_letter_sent: false,
};

export default function CaseManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFeeEarner, setFilterFeeEarner] = useState('all');
  const [filterLimitationDays, setFilterLimitationDays] = useState('all');
  const [view, setView] = useState('list'); // 'list' | 'timeline'
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [duplicatePair, setDuplicatePair] = useState(null);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingId
      ? base44.entities.LegalCase.update(editingId, data)
      : base44.entities.LegalCase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      setOpen(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
      toast.success(editingId ? 'Case updated' : 'Case created');
    },
    onError: (e) => toast.error(e.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalCase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      toast.success('Case deleted');
    }
  });

  const handleDelete = (caseId, caseRef) => {
    if (window.confirm(`Delete case ${caseRef}? This cannot be undone.`)) {
      deleteMutation.mutate(caseId);
    }
  };

  const handleEdit = (c) => {
    setFormData({ ...EMPTY_FORM, ...c, estimated_value: c.estimated_value || '' });
    setEditingId(c.id);
    setOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (data.estimated_value) data.estimated_value = parseFloat(data.estimated_value);
    else delete data.estimated_value;
    saveMutation.mutate(data);
  };

  const feeEarners = [...new Set(cases.map(c => c.assigned_fee_earner).filter(Boolean))];

  const filtered = cases.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.case_ref?.toLowerCase().includes(q) || c.client_name?.toLowerCase().includes(q) || c.opponent_name?.toLowerCase().includes(q);
    const matchType = filterType === 'all' || c.case_type === filterType;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchFeeEarner = filterFeeEarner === 'all' || c.assigned_fee_earner === filterFeeEarner;
    let matchLimitation = true;
    if (filterLimitationDays !== 'all' && c.limitation_date) {
      const days = daysUntil(c.limitation_date);
      matchLimitation = days !== null && days <= parseInt(filterLimitationDays);
    } else if (filterLimitationDays !== 'all') {
      matchLimitation = false;
    }
    return matchSearch && matchType && matchStatus && matchFeeEarner && matchLimitation;
  });

  const criticalLimitation = cases.filter(c => {
    const d = daysUntil(c.limitation_date);
    return d !== null && d <= 30 && c.status !== 'closed' && c.status !== 'settled';
  }).length;

  // Detect duplicate cases (same client, opponent, case type) — optimized with Set
  const findDuplicates = () => {
    const seen = new Map();
    for (const c of cases) {
      const key = `${c.client_name}|${c.opponent_name}|${c.case_type}`;
      if (seen.has(key)) {
        return [seen.get(key), c];
      }
      seen.set(key, c);
    }
    return null;
  };

  const duplicates = findDuplicates();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Case Manager</h1>
            <p className="text-slate-500 mt-1">{cases.length} cases {criticalLimitation > 0 && <span className="text-red-600 font-semibold">· {criticalLimitation} limitation dates within 30 days</span>}</p>
          </div>
          <div className="flex gap-3">
            <div className="flex border border-slate-200 rounded-md overflow-hidden">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <Briefcase className="w-4 h-4" /> Cases
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === 'timeline' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <GitCommitHorizontal className="w-4 h-4" /> Timeline
              </button>
            </div>
            <Link to="/practice-analytics">
              <Button variant="outline">Analytics</Button>
            </Link>
            <Link to="/compliance-alerts">
              <Button variant="outline" className={criticalLimitation > 0 ? 'border-red-500 text-red-600' : ''}>
                {criticalLimitation > 0 && <AlertTriangle className="w-4 h-4 mr-1" />}
                Alerts {criticalLimitation > 0 && `(${criticalLimitation})`}
              </Button>
            </Link>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setFormData(EMPTY_FORM); } }}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Plus className="w-4 h-4" /> New Case
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                   <DialogTitle>{editingId ? 'Edit Case' : 'New Case'}</DialogTitle>
                </DialogHeader>
                {!editingId && (formData.client_name || formData.opponent_name) && (
                  <EntityConflictAlert 
                    clientName={formData.client_name}
                    opponentName={formData.opponent_name}
                    caseRef={formData.case_ref}
                  />
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
                  {/* Form on left */}
                  <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Case Ref *</label>
                      <Input value={formData.case_ref} onChange={e => setFormData({ ...formData, case_ref: e.target.value })} placeholder="e.g. PI-2024-001" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Case Type *</label>
                      <Select value={formData.case_type} onValueChange={v => setFormData({ ...formData, case_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CASE_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Client Name *</label>
                      <Input value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Client Email</label>
                      <Input type="email" value={formData.client_email} onChange={e => setFormData({ ...formData, client_email: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Opponent</label>
                      <Input value={formData.opponent_name} onChange={e => setFormData({ ...formData, opponent_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Fee Earner</label>
                      <Input value={formData.assigned_fee_earner} onChange={e => setFormData({ ...formData, assigned_fee_earner: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Incident Date</label>
                      <Input type="date" value={formData.incident_date} onChange={e => setFormData({ ...formData, incident_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block text-red-600">⚠️ Limitation Date</label>
                      <Input type="date" value={formData.limitation_date} onChange={e => setFormData({ ...formData, limitation_date: e.target.value })} className="border-red-300 focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Status</label>
                      <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="settled">Settled</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="litigation">Litigation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Est. Value (£)</label>
                      <Input type="number" value={formData.estimated_value} onChange={e => setFormData({ ...formData, estimated_value: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Court Deadline</label>
                      <Input type="date" value={formData.court_deadline} onChange={e => setFormData({ ...formData, court_deadline: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Last Client Contact</label>
                      <Input type="date" value={formData.last_client_contact || ''} onChange={e => setFormData({ ...formData, last_client_contact: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Facts Summary</label>
                    <Textarea value={formData.facts} onChange={e => setFormData({ ...formData, facts: e.target.value })} placeholder="Key facts giving rise to the claim..." className="min-h-20" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Client Instructions</label>
                    <Textarea value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} placeholder="What the client wants to achieve..." className="min-h-16" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="ccl" checked={formData.client_care_letter_sent} onChange={e => setFormData({ ...formData, client_care_letter_sent: e.target.checked })} />
                    <label htmlFor="ccl" className="text-sm">Client care letter sent</label>
                    {formData.client_care_letter_sent && (
                      <Input type="date" className="w-40" value={formData.client_care_letter_date || ''} onChange={e => setFormData({ ...formData, client_care_letter_date: e.target.value })} />
                    )}
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Case' : 'Create Case'}
                    </Button>
                  </div>
                  </form>

                  {/* Guidance on right */}
                  {formData.case_type && (
                    <div className="lg:col-span-2">
                      <CaseTypeGuidance caseType={formData.case_type} />
                    </div>
                  )}
                  </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Timeline view */}
        {view === 'timeline' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <GitCommitHorizontal className="w-5 h-5 text-indigo-500" /> Case Timeline
              <span className="text-xs font-normal text-slate-400 ml-1">— drag to reorder · click to edit</span>
            </h2>
            <CaseTimeline />
          </Card>
        )}

        {/* Duplicate Alert */}
        {duplicates && view === 'list' && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-4 flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Duplicate cases detected</p>
                  <p className="text-xs text-amber-800 mt-1">
                    {duplicates[0].case_ref} and {duplicates[1].case_ref} appear to be the same case (same client, opponent, and type).
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setDuplicatePair(duplicates);
                  setMergeDialogOpen(true);
                }}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 shrink-0"
              >
                Merge
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {view === 'list' && <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input className="pl-9" placeholder="Search cases, clients..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Case Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(CASE_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="litigation">Litigation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterFeeEarner} onValueChange={setFilterFeeEarner}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Fee Earner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fee Earners</SelectItem>
                  {feeEarners.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterLimitationDays} onValueChange={setFilterLimitationDays}>
                <SelectTrigger className="w-52 border-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
                  <SelectValue placeholder="Limitation Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Limitation Dates</SelectItem>
                  <SelectItem value="30">Within 30 days ⚠️</SelectItem>
                  <SelectItem value="60">Within 60 days</SelectItem>
                  <SelectItem value="90">Within 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>}

        {/* Cases List */}
        {view === 'list' && isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading cases...</div>
        ) : view === 'list' && filtered.length === 0 ? (
          <Card className="text-center py-16">
            <p className="text-slate-400 text-lg">No cases found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting filters or create a new case</p>
          </Card>
        ) : view === 'list' ? (
          <div className="space-y-3">
            {filtered.map(c => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="font-bold text-slate-900">{c.case_ref}</span>
                        <Badge className={STATUS_COLORS[c.status]}>{c.status.replace(/_/g, ' ')}</Badge>
                        <Badge variant="outline">{CASE_TYPE_LABELS[c.case_type] || c.case_type}</Badge>
                        <LimitationBadge date={c.limitation_date} />
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {c.client_name}</span>
                        {c.opponent_name && <span>vs {c.opponent_name}</span>}
                        {c.assigned_fee_earner && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {c.assigned_fee_earner}</span>}
                        {c.limitation_date && <span className="flex items-center gap-1 text-red-600"><Calendar className="w-3.5 h-3.5" /> Limitation: {new Date(c.limitation_date).toLocaleDateString('en-GB')}</span>}
                        {c.estimated_value && <span>Est. £{c.estimated_value.toLocaleString()}</span>}
                      </div>
                      {c.facts && <p className="text-xs text-slate-500 mt-2 truncate">{c.facts}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(c)}>Edit</Button>
                      <Link to={`/case-narrative-builder?case_id=${c.id}`}>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                          AI Narrative <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(c.id, c.case_ref)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Duplicate Case Merger */}
        {duplicatePair && (
          <DuplicateCaseMerger
            case1={duplicatePair[0]}
            case2={duplicatePair[1]}
            open={mergeDialogOpen}
            onClose={() => {
              setMergeDialogOpen(false);
              setDuplicatePair(null);
            }}
          />
        )}
      </div>
    </div>
  );
}