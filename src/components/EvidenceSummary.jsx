import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle, Calendar, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function EvidenceSummary({ evidence, onSummaryGenerated }) {
  const [summary, setSummary] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Support both plain evidence objects and wrapped { data: {...} } objects
  const evidenceData = evidence?.data ?? evidence;

  const generateSummary = useMutation({
    mutationFn: async () => {
      if (!evidenceData?.file_url) {
        throw new Error('No file available to summarize');
      }
      const result = await base44.functions.invoke('summarizeEvidenceDocument', {
        evidence_id: evidence.id,
        file_url: evidenceData.file_url,
        evidence_title: evidenceData.title,
        evidence_type: evidenceData.evidence_type
      });
      return result.data;
    },
    onSuccess: (data) => {
      setSummary(data.summary);
      setIsExpanded(true);
      if (onSummaryGenerated) {
        onSummaryGenerated(data.summary);
      }
      toast.success('Summary generated');
    },
    onError: (error) => {
      toast.error(`Failed to generate summary: ${error.message}`);
    }
  });

  // Parse summary sections from the response
  const parseSummaryText = (text) => {
    if (!text) return {};

    const sections = {};
    const lines = text.split('\n');
    let currentSection = null;

    lines.forEach(line => {
      line = line.trim();
      
      if (line.includes('EXECUTIVE SUMMARY:')) {
        currentSection = 'executive';
        sections.executive = '';
      } else if (line.includes('KEY POINTS:')) {
        currentSection = 'keyPoints';
        sections.keyPoints = [];
      } else if (line.includes('IMPORTANT DATES:')) {
        currentSection = 'dates';
        sections.dates = [];
      } else if (line.includes('POTENTIAL RICS RULE VIOLATIONS:')) {
        currentSection = 'violations';
        sections.violations = [];
      } else if (line.includes('RELEVANCE TO CASE:')) {
        currentSection = 'relevance';
        sections.relevance = '';
      } else if (line.includes('CREDIBILITY & STRENGTH:')) {
        currentSection = 'strength';
        sections.strength = '';
      } else if (line && currentSection) {
        if (currentSection === 'executive' || currentSection === 'relevance' || currentSection === 'strength') {
          sections[currentSection] = (sections[currentSection] || '') + line + ' ';
        } else if (currentSection === 'keyPoints' || currentSection === 'dates' || currentSection === 'violations') {
          if (line.startsWith('-') || line.startsWith('•')) {
            sections[currentSection].push(line.substring(1).trim());
          }
        }
      }
    });

    return sections;
  };

  const parsedSummary = summary ? parseSummaryText(summary) : {};

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              AI Document Summary
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant={generateSummary.isPending ? 'outline' : 'default'}
            onClick={() => generateSummary.mutate()}
            disabled={generateSummary.isPending || !evidenceData?.file_url}
            className="gap-1"
          >
            {generateSummary.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {summary && isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {parsedSummary.executive && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Overview</p>
              <p className="text-sm text-slate-600">{parsedSummary.executive.trim()}</p>
            </div>
          )}

          {parsedSummary.keyPoints && parsedSummary.keyPoints.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Key Points</p>
              <ul className="space-y-1">
                {parsedSummary.keyPoints.map((point, idx) => (
                  <li key={idx} className="text-sm text-slate-600 flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedSummary.dates && parsedSummary.dates.length > 0 && (
            <div className="bg-amber-50 p-3 rounded border border-amber-200">
              <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Important Dates
              </p>
              <ul className="space-y-1">
                {parsedSummary.dates.map((date, idx) => (
                  <li key={idx} className="text-sm text-slate-600 font-mono">{date}</li>
                ))}
              </ul>
            </div>
          )}

          {parsedSummary.violations && parsedSummary.violations.length > 0 && (
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-600" /> Potential RICS Violations
              </p>
              <ul className="space-y-1">
                {parsedSummary.violations.map((violation, idx) => (
                  <li key={idx} className="text-sm text-slate-600 flex gap-2">
                    <Badge className="bg-red-600 text-xs h-fit">Risk</Badge>
                    <span>{violation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedSummary.relevance && (
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Case Relevance</p>
              <p className="text-sm text-slate-600">{parsedSummary.relevance.trim()}</p>
            </div>
          )}

          {parsedSummary.strength && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Evidentiary Strength</p>
              <p className="text-sm text-slate-600">{parsedSummary.strength.trim()}</p>
            </div>
          )}
        </CardContent>
      )}

      {!summary && !generateSummary.isPending && (
        <CardContent className="text-sm text-slate-500 py-3">
          {evidenceData?.file_url ? (
            'Click "Generate Summary" to analyze this document with AI.'
          ) : (
            'No file available to summarize.'
          )}
        </CardContent>
      )}
    </Card>
  );
}