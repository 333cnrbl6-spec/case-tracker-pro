import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function ConflictChecker({ witnessName = '', documentContent = '', incidentId = '', onClose = () => {} }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckConflicts = async () => {
    if (!witnessName && !documentContent) {
      setError('Please provide witness name or document content');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('checkConflictOfInterest', {
        witnessName,
        documentContent,
        incidentId
      });

      setResults(response.data.analysis);
      if (response.data.analysis.conflicts_detected) {
        toast.warning('Conflicts detected - review before proceeding');
      } else {
        toast.success('No conflicts detected');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Conflict check failed');
    } finally {
      setLoading(false);
    }
  };

  const severityConfig = {
    low: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    medium: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    high: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  };

  return (
    <div className="space-y-4">
      {/* Input Section */}
      {!results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-indigo-600" />
              Conflict of Interest Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {witnessName && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-600 font-medium">Witness Name</p>
                  <p className="text-sm text-blue-900 mt-1">{witnessName}</p>
                </div>
              )}

              {documentContent && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                  <p className="text-xs text-purple-600 font-medium">Document Content</p>
                  <p className="text-sm text-purple-900 mt-1 line-clamp-3">{documentContent}</p>
                </div>
              )}
            </div>

            <Button
              onClick={handleCheckConflicts}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Check for Conflicts
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className={`border-2 ${severityConfig[results.severity].border} ${severityConfig[results.severity].bg}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {React.createElement(severityConfig[results.severity].icon, {
                  className: `w-6 h-6 ${severityConfig[results.severity].color} flex-shrink-0 mt-1`
                })}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900">
                      {results.conflicts_detected ? 'Conflicts Detected' : 'No Conflicts Found'}
                    </h3>
                    <Badge className={`capitalize ${
                      results.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      results.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      results.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {results.severity}
                    </Badge>
                    <Badge variant="outline" className="ml-auto">
                      {results.confidence_score}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700">
                    {results.conflicts_detected 
                      ? `${results.conflicts.length} potential conflict(s) identified` 
                      : 'This person/content appears clear of conflicts'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conflicts List */}
          {results.conflicts_detected && results.conflicts.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-base">Identified Conflicts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.conflicts.map((conflict, idx) => (
                  <div key={idx} className="border border-red-200 bg-white rounded p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{conflict.type}</h4>
                      <Badge variant="destructive" className="ml-2">
                        {conflict.rule_violated}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{conflict.details}</p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Related Party:</span> {conflict.related_party}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {results.recommendations.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0 text-xs font-medium">
                        {idx + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={() => {
              setResults(null);
              onClose();
            }}>
              Close
            </Button>
            <Button 
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                toast.success('Conflict check saved');
                setResults(null);
                onClose();
              }}
            >
              Accept & Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}