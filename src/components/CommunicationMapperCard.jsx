import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Flag, AlertTriangle, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

function ToneBadge({ tone }) {
  const colors = {
    neutral: 'bg-slate-100 text-slate-800',
    professional: 'bg-blue-100 text-blue-800',
    dismissive: 'bg-amber-100 text-amber-800',
    aggressive: 'bg-red-100 text-red-800',
    threatening: 'bg-red-200 text-red-900',
    unprofessional: 'bg-orange-100 text-orange-800'
  };
  return <Badge className={colors[tone] || colors.neutral}>{tone}</Badge>;
}

export default function CommunicationMapperCard({
  communication,
  incidents,
  evidence,
  expanded,
  onToggleExpand,
  onAnalyze,
  isAnalyzing
}) {
  const comm = communication.data;
  const [selectedViolations, setSelectedViolations] = useState(comm?.mapped_violations || []);
  const [selectedIssues, setSelectedIssues] = useState(comm?.mapped_legal_issues || []);

  const discrepancies = comm?.discrepancies || [];
  const linkedEvidence = evidence.filter(e => comm?.linked_evidence?.includes(e.id));
  const hasDiscrepancies = discrepancies.length > 0;
  const isMapped = selectedViolations.length > 0 || selectedIssues.length > 0;
  const missingEvidence = isMapped && linkedEvidence.length === 0;

  // Extract all unique violations and issues from incidents
  const allViolations = [...new Set(incidents.flatMap(i => i.data?.rics_violations || []))];
  const allIssues = [...new Set(incidents.flatMap(i => i.data?.legal_issues || []))];

  const handleViolationToggle = (violation) => {
    setSelectedViolations(prev =>
      prev.includes(violation) ? prev.filter(v => v !== violation) : [...prev, violation]
    );
  };

  const handleIssueToggle = (issue) => {
    setSelectedIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  return (
    <Card className={cn(
      'transition-all',
      hasDiscrepancies && 'border-red-300 bg-red-50',
      missingEvidence && !hasDiscrepancies && 'border-amber-300 bg-amber-50'
    )}>
      <CardHeader
        className="cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-900">{comm?.subject}</h3>
              <ToneBadge tone={comm?.tone} />
              {hasDiscrepancies && (
                <Badge className="bg-red-600 text-white flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  Discrepancy
                </Badge>
              )}
              {missingEvidence && !hasDiscrepancies && (
                <Badge className="bg-amber-600 text-white">Missing Evidence</Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 mb-2">
              {comm?.type} • From {comm?.from} to {comm?.to} • {comm?.date}
            </p>
            <p className="text-sm text-slate-700 line-clamp-2">{comm?.content}</p>
          </div>
          <ChevronDown
            className={cn('w-5 h-5 text-slate-400 transition-transform', expanded && 'rotate-180')}
          />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6 border-t pt-6">
          {/* Full Content */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Full Content</h4>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
              {comm?.content}
            </p>
          </div>

          {/* Discrepancies */}
          {hasDiscrepancies && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Flagged Discrepancies
              </h4>
              <ul className="space-y-1">
                {discrepancies.map((disc, idx) => (
                  <li key={idx} className="text-sm text-red-800">• {disc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* RICS Violations Mapping */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Map to RICS Violations</h4>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {allViolations.map((violation) => (
                <div key={violation} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedViolations.includes(violation)}
                    onChange={() => handleViolationToggle(violation)}
                  />
                  <label className="text-sm text-slate-700 cursor-pointer flex-1">
                    {violation}
                  </label>
                </div>
              ))}
            </div>
            {selectedViolations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                {selectedViolations.map((v) => (
                  <Badge key={v} variant="outline">{v}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Legal Issues Mapping */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Map to Legal Issues</h4>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {allIssues.map((issue) => (
                <div key={issue} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIssues.includes(issue)}
                    onChange={() => handleIssueToggle(issue)}
                  />
                  <label className="text-sm text-slate-700 cursor-pointer flex-1">
                    {issue}
                  </label>
                </div>
              ))}
            </div>
            {selectedIssues.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                {selectedIssues.map((i) => (
                  <Badge key={i} variant="outline" className="bg-blue-50">{i}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Linked Evidence */}
          {linkedEvidence.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Supporting Evidence</h4>
              <div className="space-y-2">
                {linkedEvidence.map((e) => (
                  <div key={e.id} className="text-sm bg-slate-50 p-2 rounded border border-slate-200">
                    <p className="font-medium text-slate-900">{e.data?.title}</p>
                    <p className="text-xs text-slate-600">{e.data?.evidence_type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Button */}
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Analyze This Communication
          </Button>
        </CardContent>
      )}
    </Card>
  );
}