import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2, FileCheck, Clock, Link2, FileText, MessageSquare, ChevronDown, ChevronUp, ExternalLink, Download } from 'lucide-react';
import AnnotationPanel from '@/components/AnnotationPanel';
import { toast } from 'sonner';
import { exportValidationPDF } from '@/lib/exportValidationPDF';
import AISummaryBanner from '@/components/AISummaryBanner';

const TYPE_META = {
  evidence: { label: 'Evidence', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  communication: { label: 'Communication', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  incident: { label: 'Incident', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

function LinkedItemCard({ type, record, isActive, onClick }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  const title = record.title || record.subject || record.from || 'Unnamed';
  const sub = record.date || record.date_collected || record.type || record.evidence_type || '';
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2 rounded border text-left transition-all ${isActive ? meta.bg + ' ring-1 ring-offset-0' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${meta.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{title}</p>
        {sub && <p className="text-xs text-slate-500 capitalize">{sub.replace(/_/g, ' ')}</p>}
      </div>
      <Badge variant="outline" className="text-xs shrink-0">{meta.label}</Badge>
      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
    </button>
  );
}

function LinkedItemDetail({ item, onClose }) {
  const meta = TYPE_META[item.type];
  const r = item.record;
  return (
    <div className={`rounded-lg border p-4 ${meta.bg} space-y-2`}>
      <div className="flex justify-between items-center">
        <span className={`text-xs font-bold uppercase tracking-wide ${meta.color}`}>{meta.label} Detail</span>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800">✕ Close</button>
      </div>
      {item.type === 'evidence' && (
        <div className="space-y-1 text-sm">
          <p><strong>Title:</strong> {r.title}</p>
          {r.evidence_type && <p><strong>Type:</strong> {r.evidence_type.replace(/_/g, ' ')}</p>}
          {r.date_collected && <p><strong>Date Collected:</strong> {r.date_collected}</p>}
          {r.relevance && <p><strong>Relevance:</strong> {r.relevance.replace(/_/g, ' ')}</p>}
          {r.strength && <p><strong>Strength:</strong> {r.strength}</p>}
          {r.description && <p className="text-slate-600">{r.description}</p>}
          {r.notes && <p className="italic text-slate-500">{r.notes}</p>}
          <AnnotationPanel entityName="Evidence" recordId={r.id} field="annotations" value={r.annotations || ''} queryKey={['evidence']} />
        </div>
      )}
      {item.type === 'communication' && (
        <div className="space-y-1 text-sm">
          <p><strong>Subject:</strong> {r.subject}</p>
          {r.from && <p><strong>From:</strong> {r.from}</p>}
          {r.to && <p><strong>To:</strong> {r.to}</p>}
          {r.date && <p><strong>Date:</strong> {r.date}</p>}
          {r.type && <p><strong>Type:</strong> {r.type.replace(/_/g, ' ')}</p>}
          {r.tone && <p><strong>Tone:</strong> {r.tone}</p>}
          {r.content && <p className="text-slate-600 border-t pt-2 mt-2">{r.content}</p>}
          {r.concerning_elements?.length > 0 && (
            <div>
              <strong>Concerning Elements:</strong>
              <ul className="list-disc ml-4 text-slate-600">
                {r.concerning_elements.map((el, i) => <li key={i}>{el}</li>)}
              </ul>
            </div>
          )}
          <AnnotationPanel entityName="Communication" recordId={r.id} field="annotations" value={r.annotations || ''} queryKey={['communications']} />
        </div>
      )}
      {item.type === 'incident' && (
        <div className="space-y-1 text-sm">
          <p><strong>Title:</strong> {r.title}</p>
          {r.date && <p><strong>Date:</strong> {r.date}</p>}
          {r.incident_type && <p><strong>Type:</strong> {r.incident_type.replace(/_/g, ' ')}</p>}
          {r.severity && <p><strong>Severity:</strong> {r.severity}</p>}
          {r.description && <p className="text-slate-600">{r.description}</p>}
          {r.rics_violations?.length > 0 && (
            <div>
              <strong>RICS Violations:</strong>
              <ul className="list-disc ml-4 text-slate-600">
                {r.rics_violations.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const VALIDATION_TYPES = {
  missing: 'Missing Documentation',
  sequence: 'Timeline Discrepancy',
  contradiction: 'Factual Contradiction',
  compliance: 'RICS Requirement Gap',
  evidence_gap: 'Evidence Gap'
};

const SEVERITY_ICONS = {
  critical: <AlertCircle className="w-5 h-5 text-red-600" />,
  high: <AlertTriangle className="w-5 h-5 text-orange-600" />,
  medium: <AlertTriangle className="w-5 h-5 text-amber-600" />,
  low: <AlertTriangle className="w-5 h-5 text-blue-600" />
};

export default function EvidenceValidator() {
  const [selectedEvidence, setSelectedEvidence] = useState([]);
  const [selectedCommunications, setSelectedCommunications] = useState([]);
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [validationReport, setValidationReport] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState(null);
  const [expandedLinks, setExpandedLinks] = useState({});
  const [activeLinkedItem, setActiveLinkedItem] = useState(null); // { type, id }

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list(),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const validateEvidence = useMutation({
    mutationFn: async () => {
      if (selectedEvidence.length === 0) {
        throw new Error('Select at least one piece of evidence');
      }

      const evidenceData = evidence
        .filter(e => selectedEvidence.includes(e.id))
        .map(e => ({ id: e.id, ...(e.data ?? e) }));

      const communicationData = communications
        .filter(c => selectedCommunications.includes(c.id))
        .map(c => ({ id: c.id, ...(c.data ?? c) }));

      const incidentData = incidents
        .filter(i => selectedIncidents.includes(i.id))
        .map(i => ({ id: i.id, ...(i.data ?? i) }));

      const result = await base44.functions.invoke('validateEvidence', {
        evidence: evidenceData,
        communications: communicationData,
        incidents: incidentData
      });

      setValidationReport(result.data);
      return result.data;
    },
    onError: (error) => {
      toast.error(error.message || 'Validation failed');
    }
  });

  const toggleEvidence = (id) => {
    setSelectedEvidence(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const toggleCommunication = (id) => {
    setSelectedCommunications(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleIncident = (id) => {
    setSelectedIncidents(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredIssues = validationReport?.issues?.filter(issue =>
    filterSeverity === null || issue.severity === filterSeverity
  ) || [];

  // Build lookup maps from selected items
  const evidenceMap = Object.fromEntries(evidence.filter(e => selectedEvidence.includes(e.id)).map(e => [e.id, { ...(e.data ?? e), id: e.id }]));
  const commMap = Object.fromEntries(communications.filter(c => selectedCommunications.includes(c.id)).map(c => [c.id, { ...(c.data ?? c), id: c.id }]));
  const incidentMap = Object.fromEntries(incidents.filter(i => selectedIncidents.includes(i.id)).map(i => [i.id, { ...(i.data ?? i), id: i.id }]));

  const toggleLinks = (issueIdx) => {
    setExpandedLinks(prev => ({ ...prev, [issueIdx]: !prev[issueIdx] }));
  };

  // Resolve linked items from an issue's relatedIds field (array of {type, id})
  // Also do best-effort fuzzy match from relatedItems text if relatedIds not present
  const resolveLinkedItems = (issue) => {
    const linked = [];
    if (issue.relatedIds) {
      issue.relatedIds.forEach(ref => {
        if (ref.type === 'evidence' && evidenceMap[ref.id]) linked.push({ type: 'evidence', record: evidenceMap[ref.id] });
        else if (ref.type === 'communication' && commMap[ref.id]) linked.push({ type: 'communication', record: commMap[ref.id] });
        else if (ref.type === 'incident' && incidentMap[ref.id]) linked.push({ type: 'incident', record: incidentMap[ref.id] });
      });
    }
    // Fallback: match relatedItems text against record titles/subjects
    if (linked.length === 0 && issue.relatedItems) {
      issue.relatedItems.forEach(text => {
        const lower = text.toLowerCase();
        Object.values(evidenceMap).forEach(r => { if (r.title && lower.includes(r.title.toLowerCase())) linked.push({ type: 'evidence', record: r }); });
        Object.values(commMap).forEach(r => { if (r.subject && lower.includes(r.subject.toLowerCase())) linked.push({ type: 'communication', record: r }); });
        Object.values(incidentMap).forEach(r => { if (r.title && lower.includes(r.title.toLowerCase())) linked.push({ type: 'incident', record: r }); });
      });
    }
    return linked;
  };

  if (validationReport) {
    const criticalCount = validationReport.issues.filter(i => i.severity === 'critical').length;
    const highCount = validationReport.issues.filter(i => i.severity === 'high').length;
    const overallStatus = criticalCount > 0 ? 'Critical' : highCount > 0 ? 'High' : 'Moderate';

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Validation Report</h1>
              <p className="text-slate-600 mt-1">Generated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => exportValidationPDF({
                  report: validationReport,
                  evidenceMap,
                  commMap,
                  incidentMap,
                  resolveLinkedItems,
                })}
                className="gap-2 bg-slate-900 hover:bg-slate-800"
              >
                <Download className="w-4 h-4" /> Export PDF
              </Button>
              <Button onClick={() => { setValidationReport(null); setActiveLinkedItem(null); setExpandedLinks({}); }} variant="outline">
                Validate New Set
              </Button>
            </div>
          </div>

          {/* AI Summary Banner */}
          <AISummaryBanner
            title="AI Summary — Validation Report"
            colorScheme="indigo"
            prompt={`You are a legal compliance expert. Summarise the following evidence validation report for a RICS conduct investigation. Be concise and actionable — 3 to 5 bullet points covering: overall risk level, the most critical issues, key patterns observed, and the most important recommended next steps.

Validation report data:
- Total issues: ${validationReport.issues.length}
- Critical issues: ${validationReport.issues.filter(i => i.severity === 'critical').length}
- High issues: ${validationReport.issues.filter(i => i.severity === 'high').length}
- Timeline integrity: ${validationReport.timelineIntegrity ? 'Verified' : 'Issues found'}
- Communication alignment: ${validationReport.communicationAlignment ? 'Aligned' : 'Discrepancies found'}
- Issues: ${JSON.stringify(validationReport.issues.map(i => ({ title: i.title, severity: i.severity, type: i.type, description: i.description, recommendation: i.recommendation })))}`}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Total Issues</p>
                <p className="text-2xl font-bold text-slate-900">{validationReport.issues.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">High</p>
                <p className="text-2xl font-bold text-orange-600">{highCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Overall Status</p>
                <Badge className={
                  overallStatus === 'Critical' ? 'bg-red-100 text-red-800' :
                  overallStatus === 'High' ? 'bg-orange-100 text-orange-800' :
                  'bg-amber-100 text-amber-800'
                }>
                  {overallStatus}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Documents Analyzed:</strong> {validationReport.documentsAnalyzed}</p>
              <p><strong>RICS Requirements Checked:</strong> {validationReport.ricsRequirementsChecked}</p>
              <p><strong>Timeline Integrity:</strong> {validationReport.timelineIntegrity ? 'Verified' : 'Issues Found'}</p>
              <p><strong>Communication-Incident Alignment:</strong> {validationReport.communicationAlignment ? 'Aligned' : 'Discrepancies Found'}</p>
            </CardContent>
          </Card>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterSeverity === null ? 'default' : 'outline'}
              onClick={() => setFilterSeverity(null)}
              size="sm"
            >
              All Issues ({validationReport.issues.length})
            </Button>
            <Button
              variant={filterSeverity === 'critical' ? 'default' : 'outline'}
              onClick={() => setFilterSeverity('critical')}
              size="sm"
              className="text-red-600"
            >
              Critical ({criticalCount})
            </Button>
            <Button
              variant={filterSeverity === 'high' ? 'default' : 'outline'}
              onClick={() => setFilterSeverity('high')}
              size="sm"
              className="text-orange-600"
            >
              High ({highCount})
            </Button>
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            {filteredIssues.length === 0 ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-slate-700 font-semibold">No issues found</p>
                </CardContent>
              </Card>
            ) : (
              filteredIssues.map((issue, idx) => {
                const linkedItems = resolveLinkedItems(issue);
                const linksOpen = expandedLinks[idx];
                return (
                  <Card key={idx} className={
                    issue.severity === 'critical' ? 'border-red-200 bg-red-50' :
                    issue.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                    issue.severity === 'medium' ? 'border-amber-200 bg-amber-50' :
                    'border-blue-200 bg-blue-50'
                  }>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {SEVERITY_ICONS[issue.severity]}
                          <div>
                            <h3 className="font-semibold text-slate-900">{issue.title}</h3>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {VALIDATION_TYPES[issue.type] || issue.type}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={
                          issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          issue.severity === 'medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {issue.severity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-slate-700">{issue.description}</p>

                      {issue.evidence && (
                        <div className="bg-white p-3 rounded border border-slate-200 text-sm">
                          <p className="font-semibold text-slate-900 mb-1">Evidence:</p>
                          <p className="text-slate-700">{issue.evidence}</p>
                        </div>
                      )}

                      {issue.recommendation && (
                        <div className="bg-white p-3 rounded border border-slate-200 text-sm">
                          <p className="font-semibold text-slate-900 mb-1">Recommendation:</p>
                          <p className="text-slate-700">{issue.recommendation}</p>
                        </div>
                      )}

                      {/* Linked Items */}
                      {(linkedItems.length > 0 || (issue.relatedItems && issue.relatedItems.length > 0)) && (
                        <div>
                          <button
                            onClick={() => toggleLinks(idx)}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                          >
                            <Link2 className="w-4 h-4" />
                            Linked Items ({linkedItems.length > 0 ? linkedItems.length : issue.relatedItems?.length})
                            {linksOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {linksOpen && (
                            <div className="mt-2 space-y-2">
                              {linkedItems.length > 0 ? (
                                linkedItems.map((linked, li) => (
                                  <LinkedItemCard
                                    key={li}
                                    type={linked.type}
                                    record={linked.record}
                                    isActive={activeLinkedItem?.type === linked.type && activeLinkedItem?.id === linked.record.id}
                                    onClick={() => setActiveLinkedItem(
                                      activeLinkedItem?.id === linked.record.id ? null : { type: linked.type, id: linked.record.id, record: linked.record }
                                    )}
                                  />
                                ))
                              ) : (
                                issue.relatedItems.map((item, i) => (
                                  <div key={i} className="flex items-start gap-2 bg-white border border-slate-200 rounded p-2 text-sm text-slate-600">
                                    <Link2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </div>
                                ))
                              )}

                              {/* Expanded record detail */}
                              {activeLinkedItem && linkedItems.some(l => l.record.id === activeLinkedItem.id) && (
                                <LinkedItemDetail item={activeLinkedItem} onClose={() => setActiveLinkedItem(null)} />
                              )}
                            </div>
                          )}
                        </div>
                      )}
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Evidence Validator</h1>
          <p className="text-lg text-slate-600">AI-powered cross-reference checking: RICS compliance, timeline verification, and discrepancy detection</p>
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evidence Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Evidence ({selectedEvidence.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {evidence.length === 0 ? (
                <p className="text-sm text-slate-500">No evidence uploaded</p>
              ) : (
                evidence.map(e => (
                  <div key={e.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      checked={selectedEvidence.includes(e.id)}
                      onChange={() => toggleEvidence(e.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{(e.data ?? e).title}</p>
                      <p className="text-xs text-slate-500">{(e.data ?? e).evidence_type}</p>
                      {(e.data ?? e).date_collected && (
                        <p className="text-xs text-slate-500">📅 {(e.data ?? e).date_collected}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Communications Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Communications ({selectedCommunications.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {communications.length === 0 ? (
                <p className="text-sm text-slate-500">No communications logged</p>
              ) : (
                communications.map(c => (
                  <div key={c.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      checked={selectedCommunications.includes(c.id)}
                      onChange={() => toggleCommunication(c.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{(c.data ?? c).subject}</p>
                      <p className="text-xs text-slate-500">{(c.data ?? c).type}</p>
                      <p className="text-xs text-slate-500">📅 {(c.data ?? c).date}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Incidents Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Incidents ({selectedIncidents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {incidents.length === 0 ? (
                <p className="text-sm text-slate-500">No incidents logged</p>
              ) : (
                incidents.map(i => (
                  <div key={i.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      checked={selectedIncidents.includes(i.id)}
                      onChange={() => toggleIncident(i.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{(i.data ?? i).title}</p>
                      <p className="text-xs text-slate-500">{(i.data ?? i).incident_type}</p>
                      <p className="text-xs text-slate-500">📅 {(i.data ?? i).date}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Validate Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => validateEvidence.mutate()}
            disabled={selectedEvidence.length === 0 || validateEvidence.isPending}
            size="lg"
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            {validateEvidence.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileCheck className="w-5 h-5" />
            )}
            Validate Evidence
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">What Gets Checked</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>✓ <strong>Missing Documentation:</strong> Identifies evidence gaps against RICS requirements</p>
            <p>✓ <strong>Timeline Verification:</strong> Confirms chronological consistency of dates and events</p>
            <p>✓ <strong>Cross-Reference Analysis:</strong> Flags contradictions between communications and incident reports</p>
            <p>✓ <strong>RICS Compliance:</strong> Verifies evidence supports claimed rule violations</p>
            <p>✓ <strong>Evidence Quality:</strong> Assesses strength and relevance of documentation</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}