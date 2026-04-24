import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, Download, Eye, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function SolicitorBriefGenerator() {
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [selectedComms, setSelectedComms] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState([]);
  const [briefData, setBriefData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list(),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const generateBrief = useMutation({
    mutationFn: async () => {
      if (selectedIncidents.length === 0) {
        throw new Error('Please select at least one incident');
      }

      const result = await base44.functions.invoke('generateSolicitorBrief', {
        incidentIds: selectedIncidents,
        communicationIds: selectedComms,
        evidenceIds: selectedEvidence,
        incidents: incidents.filter(i => selectedIncidents.includes(i.id)),
        communications: communications.filter(c => selectedComms.includes(c.id)),
        evidence: evidence.filter(e => selectedEvidence.includes(e.id)),
      });

      return result.data;
    },
    onSuccess: (data) => {
      setBriefData(data.brief);
      setShowPreview(true);
      toast.success('Solicitor brief generated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate brief');
    }
  });

  const downloadBrief = () => {
    if (!briefData) return;

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 7;
      let yPos = margin;

      const addText = (text, fontSize = 11, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        
        if (yPos + lines.length * lineHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        
        doc.text(lines, margin, yPos);
        yPos += lines.length * lineHeight + 3;
      };

      // Header
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('SOLICITOR BRIEF', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, pageWidth / 2, yPos, { align: 'center' });
      doc.text('CONFIDENTIAL - PRIVILEGED AND WITHOUT PREJUDICE', pageWidth / 2, yPos + 5, { align: 'center' });
      yPos += 15;

      // Executive Summary
      addText('Executive Summary', 13, true);
      addText(briefData.executive_summary, 11, false);
      yPos += 5;

      // Factual Background
      addText('Factual Background', 13, true);
      addText(briefData.factual_background, 11, false);
      yPos += 5;

      // Claims
      if (briefData.claims?.length > 0) {
        addText('Identified Legal Claims', 13, true);
        briefData.claims.forEach(claim => {
          addText(claim.claim_type, 12, true);
          addText(claim.basis, 11, false);
          addText(`Elements: ${claim.elements?.join(', ')}`, 10, false);
          yPos += 2;
        });
      }

      // Evidence
      addText('Evidence Strength Assessment', 13, true);
      addText(`Overall Strength: ${briefData.evidence_strength}`, 11, true);
      addText(briefData.evidence_analysis, 11, false);
      if (briefData.evidence_gaps?.length > 0) {
        addText('Evidence Gaps:', 11, true);
        briefData.evidence_gaps.forEach(gap => addText(`• ${gap}`, 10, false));
      }
      yPos += 5;

      // Damages
      if (briefData.damages_categories?.length > 0) {
        addText('Damages Estimation', 13, true);
        briefData.damages_categories.forEach(cat => {
          addText(`${cat.type}: ${cat.estimated_range}`, 11, true);
          addText(cat.description, 10, false);
        });
        addText(`Total Estimated Range: ${briefData.total_damages_range}`, 11, true);
      }
      yPos += 5;

      // Strategy
      addText('Recommended Litigation Strategy', 13, true);
      addText('Phase 1: Pre-Litigation', 12, true);
      addText(briefData.strategy_phase1, 11, false);
      addText('Phase 2: Litigation', 12, true);
      addText(briefData.strategy_phase2, 11, false);
      addText('Risk Assessment', 12, true);
      addText(briefData.risk_assessment, 11, false);

      doc.save(`Solicitor_Brief_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Brief downloaded as PDF');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  const toggleIncident = (id) => {
    setSelectedIncidents(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleComm = (id) => {
    setSelectedComms(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleEvidence = (id) => {
    setSelectedEvidence(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const selectAllIncidents = () => {
    setSelectedIncidents(incidents.map(i => i.id));
  };

  const deselectAllIncidents = () => {
    setSelectedIncidents([]);
  };

  const selectAllComms = () => {
    setSelectedComms(communications.map(c => c.id));
  };

  const deselectAllComms = () => {
    setSelectedComms([]);
  };

  const selectAllEvidence = () => {
    setSelectedEvidence(evidence.map(e => e.id));
  };

  const deselectAllEvidence = () => {
    setSelectedEvidence([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Solicitor Brief Generator</h1>
          <p className="text-lg text-slate-600">AI-powered legal brief drafting with claims analysis and strategy recommendations</p>
        </div>

        {!briefData ? (
          <>
            {/* Selection Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Incidents Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Select Incidents ({selectedIncidents.length})</CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllIncidents}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        All
                      </button>
                      <button
                        onClick={deselectAllIncidents}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        None
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {incidents.length === 0 ? (
                    <p className="text-sm text-slate-500">No incidents logged</p>
                  ) : (
                    incidents.map(incident => (
                      <div key={incident.id} className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIncidents.includes(incident.id)}
                          onChange={() => toggleIncident(incident.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{incident.title}</p>
                          <p className="text-xs text-slate-500">{incident.date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Communications Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Select Communications ({selectedComms.length})</CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllComms}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        All
                      </button>
                      <button
                        onClick={deselectAllComms}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        None
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {communications.length === 0 ? (
                    <p className="text-sm text-slate-500">No communications logged</p>
                  ) : (
                    communications.map(comm => (
                      <div key={comm.id} className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedComms.includes(comm.id)}
                          onChange={() => toggleComm(comm.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{comm.subject}</p>
                          <p className="text-xs text-slate-500">{comm.type} • {comm.date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Evidence Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Select Evidence ({selectedEvidence.length})</CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllEvidence}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        All
                      </button>
                      <button
                        onClick={deselectAllEvidence}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        None
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {evidence.length === 0 ? (
                    <p className="text-sm text-slate-500">No evidence logged</p>
                  ) : (
                    evidence.map(evid => (
                      <div key={evid.id} className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedEvidence.includes(evid.id)}
                          onChange={() => toggleEvidence(evid.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{evid.title}</p>
                          <p className="text-xs text-slate-500">{evid.evidence_type}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => generateBrief.mutate()}
                disabled={selectedIncidents.length === 0 || generateBrief.isPending}
                size="lg"
                className="gap-2 bg-slate-900 hover:bg-slate-800"
              >
                {generateBrief.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                Generate Solicitor Brief
              </Button>
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base">What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ Executive summary of claims</li>
                  <li>✓ Detailed factual background</li>
                  <li>✓ Legal analysis of potential claims</li>
                  <li>✓ Evidence strength assessment</li>
                  <li>✓ Damages estimation framework</li>
                  <li>✓ Recommended litigation strategy</li>
                  <li>✓ Risk assessment and next steps</li>
                </ul>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Brief Preview */}
            <div className="flex justify-between items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Generated Brief Preview</h2>
              <div className="flex gap-2">
                <Button
                  onClick={downloadBrief}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Download Brief
                </Button>
                <Button
                  onClick={() => setBriefData(null)}
                  variant="outline"
                >
                  Generate New
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg border shadow">
              <BriefPreview brief={briefData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BriefPreview({ brief }) {
  const [expandedSections, setExpandedSections] = React.useState({
    summary: true,
    background: true,
    claims: true,
    evidence: true,
    damages: true,
    strategy: true,
  });

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SectionHeader = ({ title, sectionKey }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-900 cursor-pointer"
    >
      <span>{title}</span>
      <span className="text-sm">
        {expandedSections[sectionKey] ? '▼' : '▶'}
      </span>
    </button>
  );

  return (
    <div className="space-y-0">
      {/* Executive Summary */}
      <div className="border-b">
        <SectionHeader title="Executive Summary" sectionKey="summary" />
        {expandedSections.summary && (
          <div className="p-6 prose prose-sm max-w-none">
            <p className="text-slate-700 whitespace-pre-wrap">{brief.executive_summary}</p>
          </div>
        )}
      </div>

      {/* Factual Background */}
      <div className="border-b">
        <SectionHeader title="Factual Background" sectionKey="background" />
        {expandedSections.background && (
          <div className="p-6 prose prose-sm max-w-none">
            <p className="text-slate-700 whitespace-pre-wrap">{brief.factual_background}</p>
          </div>
        )}
      </div>

      {/* Key Claims */}
      <div className="border-b">
        <SectionHeader title="Identified Legal Claims" sectionKey="claims" />
        {expandedSections.claims && (
          <div className="p-6 space-y-4">
            {brief.claims?.map((claim, idx) => (
              <div key={idx} className="border-l-4 border-indigo-500 pl-4">
                <h4 className="font-semibold text-slate-900">{claim.claim_type}</h4>
                <p className="text-sm text-slate-700 mt-1">{claim.basis}</p>
                <p className="text-xs text-slate-600 mt-2">
                  <strong>Elements:</strong> {claim.elements?.join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidence Assessment */}
      <div className="border-b">
        <SectionHeader title="Evidence Strength Assessment" sectionKey="evidence" />
        {expandedSections.evidence && (
          <div className="p-6 space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Overall Strength: <Badge>{brief.evidence_strength}</Badge></p>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{brief.evidence_analysis}</p>
            {brief.evidence_gaps?.length > 0 && (
              <div className="bg-amber-50 p-3 rounded border border-amber-200">
                <p className="text-sm font-medium text-amber-900 mb-2">Evidence Gaps:</p>
                <ul className="text-sm text-amber-800 space-y-1">
                  {brief.evidence_gaps.map((gap, idx) => (
                    <li key={idx}>• {gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Damages Estimation */}
      <div className="border-b">
        <SectionHeader title="Damages Estimation" sectionKey="damages" />
        {expandedSections.damages && (
          <div className="p-6 space-y-4">
            {brief.damages_categories?.map((category, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-slate-900">{category.type}</p>
                  <Badge variant="outline">{category.estimated_range}</Badge>
                </div>
                <p className="text-sm text-slate-700">{category.description}</p>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-slate-700"><strong>Total Estimated Range:</strong> {brief.total_damages_range}</p>
            </div>
          </div>
        )}
      </div>

      {/* Litigation Strategy */}
      <div>
        <SectionHeader title="Recommended Litigation Strategy" sectionKey="strategy" />
        {expandedSections.strategy && (
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Phase 1: Pre-Litigation</h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{brief.strategy_phase1}</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Phase 2: Litigation</h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{brief.strategy_phase2}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Risk Assessment</h4>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{brief.risk_assessment}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}