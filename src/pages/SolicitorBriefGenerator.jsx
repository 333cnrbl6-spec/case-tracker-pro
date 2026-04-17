import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

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
        incidents: incidents.filter(i => selectedIncidents.includes(i.id)).map(i => i.data),
        communications: communications.filter(c => selectedComms.includes(c.id)).map(c => c.data),
        evidence: evidence.filter(e => selectedEvidence.includes(e.id)).map(e => e.data),
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

    const htmlContent = generateHTML(briefData);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Solicitor_Brief_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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
                  <CardTitle className="text-base">Select Incidents ({selectedIncidents.length})</CardTitle>
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
                          <p className="text-sm font-medium text-slate-900">{incident.data?.title}</p>
                          <p className="text-xs text-slate-500">{incident.data?.date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Communications Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select Communications ({selectedComms.length})</CardTitle>
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
                          <p className="text-sm font-medium text-slate-900">{comm.data?.subject}</p>
                          <p className="text-xs text-slate-500">{comm.data?.type} • {comm.data?.date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Evidence Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select Evidence ({selectedEvidence.length})</CardTitle>
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
                          <p className="text-sm font-medium text-slate-900">{evid.data?.title}</p>
                          <p className="text-xs text-slate-500">{evid.data?.evidence_type}</p>
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

function generateHTML(brief) {
  const date = new Date().toISOString().split('T')[0];
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Solicitor Brief</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a202c; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { color: #2d3748; margin-top: 30px; }
    h3 { color: #4a5568; }
    .header { text-align: center; margin-bottom: 40px; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .claim { border-left: 4px solid #4f46e5; padding-left: 15px; margin-bottom: 15px; }
    .evidence-gap { background: #fef3c7; padding: 10px; border-radius: 5px; margin: 10px 0; }
    .damages { background: #f3f4f6; padding: 10px; border-radius: 5px; margin: 10px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #999; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SOLICITOR BRIEF</h1>
    <p>Generated: ${date}</p>
    <p>CONFIDENTIAL - PRIVILEGED AND WITHOUT PREJUDICE</p>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <p>${brief.executive_summary.replace(/\n/g, '<br>')}</p>
  </div>

  <div class="section">
    <h2>Factual Background</h2>
    <p>${brief.factual_background.replace(/\n/g, '<br>')}</p>
  </div>

  <div class="section">
    <h2>Identified Legal Claims</h2>
    ${brief.claims?.map(claim => `
      <div class="claim">
        <h3>${claim.claim_type}</h3>
        <p>${claim.basis}</p>
        <p><strong>Elements:</strong> ${claim.elements?.join(', ')}</p>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>Evidence Strength Assessment</h2>
    <p><strong>Overall Strength:</strong> ${brief.evidence_strength}</p>
    <p>${brief.evidence_analysis.replace(/\n/g, '<br>')}</p>
    ${brief.evidence_gaps?.length > 0 ? `
      <div class="evidence-gap">
        <strong>Evidence Gaps:</strong>
        <ul>${brief.evidence_gaps.map(gap => `<li>${gap}</li>`).join('')}</ul>
      </div>
    ` : ''}
  </div>

  <div class="section">
    <h2>Damages Estimation</h2>
    ${brief.damages_categories?.map(cat => `
      <div class="damages">
        <strong>${cat.type}:</strong> ${cat.estimated_range}<br>
        ${cat.description}
      </div>
    `).join('')}
    <p><strong>Total Estimated Range:</strong> ${brief.total_damages_range}</p>
  </div>

  <div class="section">
    <h2>Recommended Litigation Strategy</h2>
    <h3>Phase 1: Pre-Litigation</h3>
    <p>${brief.strategy_phase1.replace(/\n/g, '<br>')}</p>
    <h3>Phase 2: Litigation</h3>
    <p>${brief.strategy_phase2.replace(/\n/g, '<br>')}</p>
    <h3>Risk Assessment</h3>
    <p>${brief.risk_assessment.replace(/\n/g, '<br>')}</p>
  </div>

  <div class="footer">
    <p>This brief is generated for legal assessment purposes. Professional legal advice should be obtained before proceeding.</p>
  </div>
</body>
</html>
  `;
}