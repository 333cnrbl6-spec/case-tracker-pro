import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Mail, Phone, Scale, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ALERT_ICONS = {
  limitation_date: <AlertTriangle className="w-5 h-5" />,
  client_care_letter: <Mail className="w-5 h-5" />,
  no_client_contact: <Phone className="w-5 h-5" />,
  court_deadline: <Scale className="w-5 h-5" />,
  settlement_authority: <CheckCircle className="w-5 h-5" />,
};

const ALERT_LABELS = {
  limitation_date: 'Limitation Date',
  client_care_letter: 'Client Care Letter',
  no_client_contact: 'No Client Contact',
  court_deadline: 'Court Deadline',
  settlement_authority: 'Settlement Authority',
};

const SEVERITY_STYLES = {
  critical: 'bg-red-100 border-red-400 text-red-800',
  urgent: 'bg-orange-100 border-orange-400 text-orange-800',
  warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  info: 'bg-blue-100 border-blue-400 text-blue-800',
};

const SEVERITY_BADGE = {
  critical: 'bg-red-600 text-white',
  urgent: 'bg-orange-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
};

export default function ComplianceAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['compliance-alerts'],
    queryFn: () => base44.entities.ComplianceAlert.list('-created_date'),
  });

  const refreshMutation = useMutation({
    mutationFn: () => base44.functions.invoke('checkComplianceAlerts', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-alerts'] });
      toast.success('Compliance alerts refreshed');
    },
    onError: (e) => toast.error(e.message)
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ComplianceAlert.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compliance-alerts'] })
  });

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  const critical = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'urgent');
  const limitationAlerts = activeAlerts.filter(a => a.alert_type === 'limitation_date');

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Compliance Alerts</h1>
            <p className="text-slate-500 mt-1">
              {activeAlerts.length} active {critical.length > 0 && <span className="text-red-600 font-semibold">· {critical.length} critical/urgent</span>}
              {limitationAlerts.length > 0 && <span className="text-red-700 font-bold"> · ⚠️ {limitationAlerts.length} limitation date alert{limitationAlerts.length > 1 ? 's' : ''}</span>}
            </p>
          </div>
          <Button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            {refreshMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Alerts
          </Button>
        </div>

        {/* Critical Banner */}
        {critical.length > 0 && (
          <div className="bg-red-600 text-white rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold">{critical.length} Critical Alert{critical.length > 1 ? 's' : ''} Require Immediate Attention</p>
              <p className="text-sm opacity-90">Limitation date breaches can lead to professional negligence claims. Act immediately.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Loading alerts...</div>
        ) : activeAlerts.length === 0 ? (
          <Card className="text-center py-16">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-700">No Active Alerts</h2>
            <p className="text-slate-400 mt-1">All cases are compliant. Click "Refresh Alerts" to re-check.</p>
          </Card>
        ) : (
          <div className="space-y-3 mb-8">
            <h2 className="text-lg font-semibold text-slate-700">Active Alerts ({activeAlerts.length})</h2>
            {activeAlerts
              .sort((a, b) => {
                const order = { critical: 0, urgent: 1, warning: 2, info: 3 };
                return (order[a.severity] || 3) - (order[b.severity] || 3);
              })
              .map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => updateAlertMutation.mutate({ id: alert.id, status: 'acknowledged' })}
                  onResolve={() => updateAlertMutation.mutate({ id: alert.id, status: 'resolved' })}
                />
              ))}
          </div>
        )}

        {acknowledgedAlerts.length > 0 && (
          <div className="space-y-3 mb-8">
            <h2 className="text-lg font-semibold text-slate-500">Acknowledged ({acknowledgedAlerts.length})</h2>
            {acknowledgedAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onResolve={() => updateAlertMutation.mutate({ id: alert.id, status: 'resolved' })}
                acknowledged
              />
            ))}
          </div>
        )}

        {resolvedAlerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-400">Resolved ({resolvedAlerts.length})</h2>
            {resolvedAlerts.slice(0, 5).map(alert => (
              <AlertCard key={alert.id} alert={alert} resolved />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertCard({ alert, onAcknowledge, onResolve, acknowledged, resolved }) {
  return (
    <div className={`border-l-4 rounded-lg p-4 ${SEVERITY_STYLES[alert.severity]} flex items-start justify-between gap-4`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{ALERT_ICONS[alert.alert_type]}</div>
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm">{alert.case_ref}</span>
            <Badge className={SEVERITY_BADGE[alert.severity]}>{alert.severity?.toUpperCase()}</Badge>
            <Badge variant="outline" className="text-xs">{ALERT_LABELS[alert.alert_type]}</Badge>
          </div>
          <p className="text-sm">{alert.message}</p>
          {alert.deadline_date && (
            <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Deadline: {new Date(alert.deadline_date).toLocaleDateString('en-GB')}
            </p>
          )}
        </div>
      </div>
      {!resolved && (
        <div className="flex gap-2 shrink-0">
          {!acknowledged && onAcknowledge && (
            <Button size="sm" variant="outline" className="text-xs" onClick={onAcknowledge}>Acknowledge</Button>
          )}
          {onResolve && (
            <Button size="sm" variant="outline" className="text-xs bg-white" onClick={onResolve}>Resolved</Button>
          )}
        </div>
      )}
      {resolved && <Badge className="bg-slate-400 text-white shrink-0">Resolved</Badge>}
    </div>
  );
}