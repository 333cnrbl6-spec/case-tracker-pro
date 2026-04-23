import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AutoTagPreview({ tagData, onAccept, onReject, loading }) {
  if (!tagData) return null;

  const severityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const evidenceTypeColors = {
    document: 'bg-slate-100 text-slate-800',
    communication: 'bg-purple-100 text-purple-800',
    report: 'bg-indigo-100 text-indigo-800',
    valuation: 'bg-amber-100 text-amber-800',
    contract: 'bg-green-100 text-green-800',
    witness_statement: 'bg-pink-100 text-pink-800',
    photograph: 'bg-teal-100 text-teal-800',
    recording_transcript: 'bg-cyan-100 text-cyan-800',
    other: 'bg-gray-100 text-gray-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <CardTitle className="text-base">AI Auto-Tagging</CardTitle>
                <p className="text-xs text-slate-600 mt-1">Confidence: {tagData.confidence_score}%</p>
              </div>
            </div>
            {loading && (
              <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Title & Description */}
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">{tagData.title}</h4>
            <p className="text-sm text-slate-700 mt-1">{tagData.description}</p>
          </div>

          {/* Key Findings */}
          {tagData.key_findings && tagData.key_findings.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Key Findings:</p>
              <ul className="space-y-1">
                {tagData.key_findings.map((finding, i) => (
                  <li key={i} className="text-xs text-slate-700 flex gap-2">
                    <span className="text-indigo-600">•</span> {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Badge className={evidenceTypeColors[tagData.evidence_type]}>
                {tagData.evidence_type.replace(/_/g, ' ')}
              </Badge>
              <Badge variant="outline">{tagData.relevance.replace(/_/g, ' ')}</Badge>
              <Badge className={severityColors[tagData.severity]}>
                {tagData.severity.toUpperCase()} severity
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                {tagData.strength} strength
              </Badge>
            </div>
          </div>

          {/* Related Incidents */}
          {tagData.related_incidents && tagData.related_incidents.length > 0 && (
            <div className="bg-white rounded p-2.5 border border-indigo-100">
              <p className="text-xs font-medium text-slate-700 mb-2">Linked to {tagData.related_incidents.length} incident(s)</p>
              <div className="space-y-1">
                {tagData.related_incidents.map((incId, i) => (
                  <div key={i} className="text-xs text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    {incId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tagData.severity_reason && (
            <div className="bg-white rounded p-2.5 border border-indigo-100">
              <p className="text-xs text-slate-700">
                <span className="font-medium">Severity reason:</span> {tagData.severity_reason}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-indigo-200">
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={loading}
              className="flex-1"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Revise
            </Button>
            <Button
              size="sm"
              onClick={onAccept}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Accept & Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}