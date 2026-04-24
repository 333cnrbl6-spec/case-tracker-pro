import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

const iconMap = {
  high: <AlertTriangle className="w-5 h-5 text-red-600" />,
  medium: <AlertCircle className="w-5 h-5 text-orange-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
};

const bgMap = {
  high: 'bg-red-50 border-red-200',
  medium: 'bg-orange-50 border-orange-200',
  info: 'bg-blue-50 border-blue-200',
};

const badgeMap = {
  high: 'bg-red-600 text-white',
  medium: 'bg-orange-600 text-white',
  info: 'bg-blue-600 text-white',
};

export default function EntityConflictAlert({ clientName, opponentName, caseRef }) {
  const [conflicts, setConflicts] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientName && !opponentName) {
      setConflicts(null);
      return;
    }

    const checkConflicts = async () => {
      setLoading(true);
      try {
        const response = await base44.functions.invoke('checkEntityConflicts', {
          client_name: clientName,
          opponent_name: opponentName,
          case_ref: caseRef || 'new'
        });
        setConflicts(response);
      } catch (err) {
        console.error('Conflict check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(checkConflicts, 800);
    return () => clearTimeout(debounceTimer);
  }, [clientName, opponentName, caseRef]);

  if (loading) {
    return (
      <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        Checking for conflicts...
      </div>
    );
  }

  if (!conflicts || !conflicts.conflicts_found) {
    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        No conflicts detected in existing records
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-4">
      {conflicts.action_required && (
        <div className="bg-red-600 text-white rounded-lg p-3 text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">⚠️ Action Required</p>
            <p className="text-xs opacity-90">High-severity conflicts detected. Review before proceeding.</p>
          </div>
        </div>
      )}

      {conflicts.conflicts.map((conflict, idx) => (
        <Card key={idx} className={`border ${bgMap[conflict.severity]} p-3`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{iconMap[conflict.severity]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-sm text-slate-900">{conflict.title}</p>
                <Badge className={badgeMap[conflict.severity]}>{conflict.severity.toUpperCase()}</Badge>
              </div>
              <p className="text-xs text-slate-700">{conflict.description}</p>
              {conflict.existing_case && (
                <p className="text-xs text-slate-600 mt-1">
                  <strong>Existing Case:</strong> {conflict.existing_case}
                </p>
              )}
              {conflict.incident_count && (
                <p className="text-xs text-slate-600 mt-1">
                  <strong>Related Incidents:</strong> {conflict.incident_count}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}