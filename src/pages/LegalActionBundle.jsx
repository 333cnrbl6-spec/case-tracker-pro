import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function LegalActionBundle() {
  const [expandedSections, setExpandedSections] = useState({});
  const [exporting, setExporting] = useState(false);

  const { data: bundle, isLoading, error } = useQuery({
    queryKey: ['legalActionBundle'],
    queryFn: async () => {
      const res = await base44.functions.invoke('generateLegalActionBundle', {});
      return res.data;
    }
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const exportToDocument = async () => {
    setExporting(true);
    try {
      const doc = generateDocument(bundle);
      const link = document.createElement('a');
      link.href = 'data:text/html,' + encodeURIComponent(doc);
      link.download = `Legal_Action_Bundle_${new Date().toISOString().split('T')[0]}.html`;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-600">Compiling legal action bundle...</p>
        </div>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Generating Bundle</h3>
              <p className="text-sm text-red-800">{error?.message || 'Unable to generate bundle'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{bundle.caseSummary.title}</h1>
            <p className="text-slate-600">Generated {new Date(bundle.generatedDate).toLocaleDateString()}</p>
          </div>
          <Button 
            onClick={exportToDocument}
            disabled={exporting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export to Document'}
          </Button>
        </div>

        {/* Case Summary */}
        <Card className="mb-6 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg">Case Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Claimant</p>
                <p className="text-lg font-semibold text-slate-900">{bundle.parties.claimant}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Defendant</p>
                <p className="text-lg font-semibold text-slate-900">{bundle.parties.defendant}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Jurisdiction</p>
                <p className="text-slate-900">{bundle.caseSummary.jurisdiction}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Total Claim Value</p>
                <p className="text-2xl font-bold text-indigo-600">£{bundle.caseSummary.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-slate-900">{bundle.incidentsCount}</p>
              <p className="text-sm text-slate-600">Documented Incidents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-slate-900">{bundle.communicationsCount}</p>
              <p className="text-sm text-slate-600">Communications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-slate-900">{bundle.evidenceCount}</p>
              <p className="text-sm text-slate-600">Evidence Items</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <SectionCard
          title="Chronological Timeline"
          section="timeline"
          expanded={expandedSections.timeline}
          onToggle={toggleSection}
        >
          <div className="space-y-4">
            {bundle.timeline.map((event, idx) => (
              <div key={idx} className="border-l-4 border-indigo-300 pl-4 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-indigo-600 uppercase">{event.type}</p>
                    <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                  </div>
                  <p className="text-xs text-slate-600">{new Date(event.date).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-slate-700 mb-2">{event.description}</p>
                {event.details && (
                  <div className="text-xs space-y-1">
                    {event.details.violations && event.details.violations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.details.violations.map((v, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Damages Calculation */}
        <SectionCard
          title="Damages Calculation"
          section="damages"
          expanded={expandedSections.damages}
          onToggle={toggleSection}
        >
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-slate-50">
              <p className="font-semibold text-slate-900 mb-1">{bundle.damagesCalculation.directLoss.label}</p>
              <p className="text-2xl font-bold text-slate-900">£{bundle.damagesCalculation.directLoss.amount.toLocaleString()}</p>
              <p className="text-xs text-slate-600 mt-2">{bundle.damagesCalculation.directLoss.evidence}</p>
            </div>

            {bundle.damagesCalculation.consequentialLoss.amount > 0 && (
              <div className="border rounded-lg p-4 bg-slate-50">
                <p className="font-semibold text-slate-900 mb-3">{bundle.damagesCalculation.consequentialLoss.label}</p>
                <div className="space-y-2">
                  {bundle.damagesCalculation.consequentialLoss.breakdown.map((item, idx) => (
                    item.amount > 0 && (
                      <div key={idx} className="flex justify-between text-sm">
                        <p className="text-slate-700">{item.item}</p>
                        <p className="font-semibold text-slate-900">£{item.amount.toLocaleString()}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4 bg-indigo-50 border-indigo-200">
              <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-slate-900">Total Claim</p>
                <p className="text-3xl font-bold text-indigo-600">£{bundle.damagesCalculation.totalClaim.toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white rounded p-3 border border-indigo-200">
                  <p className="text-slate-600 mb-1">Conservative</p>
                  <p className="font-bold text-slate-900">£{bundle.damagesCalculation.settlementRange.conservative.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded p-3 border border-indigo-200">
                  <p className="text-slate-600 mb-1">Reasonable</p>
                  <p className="font-bold text-slate-900">£{Math.round(bundle.damagesCalculation.settlementRange.reasonable).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded p-3 border border-indigo-200">
                  <p className="text-slate-600 mb-1">Aggressive</p>
                  <p className="font-bold text-slate-900">£{bundle.damagesCalculation.settlementRange.aggressive.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <SectionCard
            title="Case Strengths"
            section="strengths"
            expanded={expandedSections.strengths}
            onToggle={toggleSection}
          >
            <div className="space-y-3">
              {bundle.strengths.map((strength, idx) => (
                <div key={idx} className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">{strength.point}</p>
                    <p className="text-sm text-slate-600">{strength.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Case Weaknesses"
            section="weaknesses"
            expanded={expandedSections.weaknesses}
            onToggle={toggleSection}
          >
            <div className="space-y-3">
              {bundle.weaknesses.map((weakness, idx) => (
                <div key={idx} className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">{weakness.point}</p>
                    <p className="text-sm text-slate-600"><strong>Mitigation:</strong> {weakness.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Settlement Strategy */}
        <SectionCard
          title="Settlement Strategy & Recommendation"
          section="settlement"
          expanded={expandedSections.settlement}
          onToggle={toggleSection}
        >
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-indigo-600 uppercase mb-1">Opening Position</p>
              <p className="text-3xl font-bold text-indigo-600">£{bundle.settlementStrategy.openingPosition.toLocaleString()}</p>
            </div>

            {bundle.settlementStrategy.negotiationPhases.map((phase, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <p className="font-semibold text-slate-900 mb-2">{phase.phase}</p>
                <p className="text-sm text-slate-700 mb-3">{phase.rationale}</p>
                <div className="text-xs space-y-1">
                  {phase.target && <p><strong>Target:</strong> £{phase.target.toLocaleString()}</p>}
                  {phase.range && <p><strong>Range:</strong> {phase.range}</p>}
                  {phase.likelihood && <p><strong>Likelihood:</strong> {phase.likelihood}</p>}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-amber-600 uppercase mb-2">Walk-Away Number</p>
                <p className="text-2xl font-bold text-amber-700">£{bundle.settlementStrategy.walkAwayNumber.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-green-600 uppercase mb-2">Trial Win Probability</p>
                <p className="text-2xl font-bold text-green-700">{bundle.settlementStrategy.trialRisk.winProbability}</p>
                <p className="text-xs text-green-700 mt-2">{bundle.settlementStrategy.trialRisk.rationale}</p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* RICS Violations */}
        {bundle.ricsViolations.length > 0 && (
          <SectionCard
            title="RICS Standards Violations"
            section="rics"
            expanded={expandedSections.rics}
            onToggle={toggleSection}
          >
            <div className="space-y-3">
              {bundle.ricsViolations.map((violation, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-slate-900">{violation.standard}</p>
                    <Badge variant={violation.severity === 'pattern' ? 'destructive' : 'secondary'}>
                      {violation.severity === 'pattern' ? '⚠️ Pattern' : 'Single Incident'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{violation.frequency} occurrence{violation.frequency > 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Legal Claims */}
        {bundle.legalClaims.length > 0 && (
          <SectionCard
            title="Legal Claims Summary"
            section="claims"
            expanded={expandedSections.claims}
            onToggle={toggleSection}
          >
            <div className="space-y-2">
              {bundle.legalClaims.map((claim, idx) => (
                <div key={idx} className="flex justify-between items-center border-b pb-3">
                  <p className="font-semibold text-slate-900">{claim.type}</p>
                  <Badge variant={claim.strength.includes('strong') ? 'default' : 'secondary'}>
                    {claim.strength}
                  </Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, section, expanded, onToggle, children }) {
  return (
    <Card className="mb-6">
      <CardHeader 
        className="cursor-pointer hover:bg-slate-50"
        onClick={() => onToggle(section)}
      >
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

function generateDocument(bundle) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Legal Action Bundle - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
    h1 { color: #1f2937; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .summary { background: #f3f4f6; padding: 20px; border-left: 4px solid #4f46e5; margin: 20px 0; }
    .section { margin: 20px 0; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
    th { background: #f3f4f6; font-weight: bold; }
    .positive { color: #059669; }
    .negative { color: #dc2626; }
    .neutral { color: #6b7280; }
    .damages { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .timeline { border-left: 3px solid #4f46e5; margin: 15px 0; padding-left: 20px; }
    .timeline-item { margin: 15px 0; page-break-inside: avoid; }
    @media print { page-break-after: always; }
  </style>
</head>
<body>
  <h1>${bundle.caseSummary.title}</h1>
  <p style="color: #6b7280;">Generated: ${new Date(bundle.generatedDate).toLocaleString()}</p>

  <div class="summary">
    <h2 style="margin-top: 0;">Case Summary</h2>
    <p><strong>Claimant:</strong> ${bundle.parties.claimant}</p>
    <p><strong>Defendant:</strong> ${bundle.parties.defendant}</p>
    <p><strong>Jurisdiction:</strong> ${bundle.caseSummary.jurisdiction}</p>
    <p><strong>Total Claim Value:</strong> <span style="font-size: 1.2em; color: #4f46e5;">£${bundle.caseSummary.totalValue.toLocaleString()}</span></p>
    <p><strong>Description:</strong> ${bundle.caseSummary.description}</p>
  </div>

  <div class="section">
    <h2>Case Metrics</h2>
    <p>• <strong>${bundle.incidentsCount} Documented Incidents</strong></p>
    <p>• <strong>${bundle.communicationsCount} Communications</strong></p>
    <p>• <strong>${bundle.evidenceCount} Evidence Items</strong></p>
  </div>

  <div class="section">
    <h2>Damages Calculation</h2>
    <div class="damages">
      <p><strong>${bundle.damagesCalculation.directLoss.label}</strong></p>
      <p style="font-size: 1.3em; color: #4f46e5;">£${bundle.damagesCalculation.directLoss.amount.toLocaleString()}</p>
      <p style="margin-top: 10px;">Evidence: ${bundle.damagesCalculation.directLoss.evidence}</p>
    </div>
    
    ${bundle.damagesCalculation.consequentialLoss.amount > 0 ? `
    <div class="damages">
      <p><strong>${bundle.damagesCalculation.consequentialLoss.label}</strong></p>
      ${bundle.damagesCalculation.consequentialLoss.breakdown.map(item => 
        item.amount > 0 ? `<p>• ${item.item}: £${item.amount.toLocaleString()}</p>` : ''
      ).join('')}
    </div>
    ` : ''}

    <div style="background: #dcfce7; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p><strong>TOTAL CLAIM: £${bundle.damagesCalculation.totalClaim.toLocaleString()}</strong></p>
      <p style="margin: 10px 0;">Settlement Range:</p>
      <p>• Conservative: £${bundle.damagesCalculation.settlementRange.conservative.toLocaleString()}</p>
      <p>• Reasonable: £${Math.round(bundle.damagesCalculation.settlementRange.reasonable).toLocaleString()}</p>
      <p>• Aggressive: £${bundle.damagesCalculation.settlementRange.aggressive.toLocaleString()}</p>
    </div>
  </div>

  <div class="section">
    <h2>Chronological Timeline</h2>
    <div class="timeline">
      ${bundle.timeline.map(event => `
        <div class="timeline-item">
          <p><strong>${event.date}</strong> - <strong>${event.type}</strong></p>
          <p><strong>${event.title}</strong></p>
          <p>${event.description}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <h2>Case Strengths</h2>
    ${bundle.strengths.map(strength => `
      <p class="positive">✓ <strong>${strength.point}</strong></p>
      <p style="margin-left: 20px; margin-top: -10px;">${strength.evidence}</p>
    `).join('')}
  </div>

  <div class="section">
    <h2>Case Weaknesses & Mitigations</h2>
    ${bundle.weaknesses.map(weakness => `
      <p class="negative">⚠ <strong>${weakness.point}</strong></p>
      <p style="margin-left: 20px; margin-top: -10px;"><strong>Mitigation:</strong> ${weakness.mitigation}</p>
    `).join('')}
  </div>

  <div class="section">
    <h2>Settlement Strategy</h2>
    <p><strong>Opening Position:</strong> £${bundle.settlementStrategy.openingPosition.toLocaleString()}</p>
    <p><strong>Walk-Away Number:</strong> £${bundle.settlementStrategy.walkAwayNumber.toLocaleString()}</p>
    <p><strong>Trial Win Probability:</strong> ${bundle.settlementStrategy.trialRisk.winProbability}</p>
    <p><strong>Rationale:</strong> ${bundle.settlementStrategy.trialRisk.rationale}</p>
  </div>

  ${bundle.ricsViolations.length > 0 ? `
  <div class="section">
    <h2>RICS Standards Violations</h2>
    ${bundle.ricsViolations.map(v => `
      <p>• <strong>${v.standard}</strong> - ${v.frequency} occurrence${v.frequency > 1 ? 's' : ''} (${v.severity})</p>
    `).join('')}
  </div>
  ` : ''}

  <p style="margin-top: 50px; border-top: 1px solid #d1d5db; padding-top: 20px; color: #6b7280; font-size: 0.9em;">
    This document has been generated from case evidence and assessment data. It is suitable for review by legal counsel. 
    Disclaimer: This is not legal advice. Consult with a qualified solicitor for specific legal guidance.
  </p>
</body>
</html>
  `;
}