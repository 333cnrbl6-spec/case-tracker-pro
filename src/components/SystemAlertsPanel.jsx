import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react';

const alertTypeColors = {
  rule_pattern: 'border-l-amber-600 bg-amber-50',
  overdue_tasks: 'border-l-red-600 bg-red-50',
  high_severity_cluster: 'border-l-orange-600 bg-orange-50'
};

const alertTypeLabels = {
  rule_pattern: 'Rule Pattern',
  overdue_tasks: 'Overdue Tasks',
  high_severity_cluster: 'High Severity Cluster'
};

export default function SystemAlertsPanel() {
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: () => base44.entities.SystemAlert.filter({ status: { $in: ['active', 'acknowledged'] } }),
    refetchInterval: 60000, // Refetch every minute
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemAlert.update(data.id, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
    }
  });

  const handleAcknowledge = (alertId) => {
    updateMutation.mutate({ id: alertId, status: 'acknowledged' });
  };

  const handleResolve = (alertId) => {
    updateMutation.mutate({ id: alertId, status: 'resolved' });
  };

  if (alerts.length === 0) {
    return null;
  }

  const activeAlerts = alerts.filter(a => a?.status === 'active');
  const acknowledgedAlerts = alerts.filter(a => a?.status === 'acknowledged');

  return (
    <div className="space-y-4">
      {activeAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Active Alerts ({activeAlerts.length})
          </h3>
          <div className="space-y-3">
            {activeAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                isExpanded={expandedId === alert.id}
                onToggle={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                onAcknowledge={() => handleAcknowledge(alert.id)}
                onResolve={() => handleResolve(alert.id)}
              />
            ))}
          </div>
        </div>
      )}

      {acknowledgedAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Acknowledged ({acknowledgedAlerts.length})
          </h3>
          <div className="space-y-3">
            {acknowledgedAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                isExpanded={expandedId === alert.id}
                onToggle={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                onResolve={() => handleResolve(alert.id)}
                isAcknowledged
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, isExpanded, onToggle, onAcknowledge, onResolve, isAcknowledged }) {
  const alertData = alert;

  return (
    <Card className={`border-l-4 ${alertTypeColors[alertData.alert_type] || 'border-l-slate-400'}`}>
      <CardHeader className="pb-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-base">{alertData.title}</CardTitle>
              <Badge className={alertData.severity === 'critical' ? 'bg-red-600' : 'bg-amber-600'}>
                {alertData.severity}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {alertTypeLabels[alertData.alert_type]}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">{alertData.description}</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 border-t border-slate-200 pt-4">
          {alertData.incident_count && (
            <div className="text-sm">
              <span className="font-medium text-slate-700">Affected Incidents:</span>
              <span className="ml-2 text-slate-600">{alertData.incident_count}</span>
            </div>
          )}

          {alertData.overdue_task_count && (
            <div className="text-sm">
              <span className="font-medium text-slate-700">Overdue Tasks:</span>
              <span className="ml-2 text-slate-600">{alertData.overdue_task_count}</span>
            </div>
          )}

          {alertData.rule_number && (
            <div className="text-sm">
              <span className="font-medium text-slate-700">RICS Rule:</span>
              <span className="ml-2 font-mono text-slate-600">{alertData.rule_number}</span>
            </div>
          )}

          {alertData.recommended_action && (
            <div className="bg-white p-3 rounded border border-slate-200">
              <p className="text-xs font-medium text-slate-700 mb-1">Recommended Action:</p>
              <p className="text-xs text-slate-600">{alertData.recommended_action}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!isAcknowledged && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAcknowledge}
                className="flex-1"
              >
                Acknowledge
              </Button>
            )}
            <Button
              size="sm"
              onClick={onResolve}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Resolve
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}