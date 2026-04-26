import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, Users, FileCheck, Zap } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function ComplianceNotifications() {
  const [alerts, setAlerts] = useState([]);

  const { data: cases = [] } = useQuery({
    queryKey: ['legalCases'],
    queryFn: () => base44.entities.LegalCase.list()
  });

  useEffect(() => {
    const newAlerts = [];

    cases.forEach(c => {
      if (c.status === 'active') {
        // Limitation date approaching
        if (c.limitation_date) {
          const daysUntil = differenceInDays(parseISO(c.limitation_date), new Date());
          const thresholds = [1, 3, 7, 14, 30];
          if (thresholds.includes(daysUntil)) {
            newAlerts.push({
              id: `limitation-${c.id}`,
              type: 'limitation_date',
              severity: daysUntil <= 7 ? 'critical' : daysUntil <= 14 ? 'warning' : 'info',
              title: `Limitation date in ${daysUntil} days`,
              case: c.case_ref,
              icon: AlertTriangle
            });
          }
        }

        // Client care letter not sent
        if (!c.client_care_letter_sent && c.created_date) {
          const daysSinceCreation = differenceInDays(new Date(), parseISO(c.created_date));
          if (daysSinceCreation >= 14) {
            newAlerts.push({
              id: `care-letter-${c.id}`,
              type: 'care_letter',
              severity: 'warning',
              title: 'Client care letter not sent',
              case: c.case_ref,
              icon: FileCheck
            });
          }
        }

        // No client contact in 30 days
        if (c.last_client_contact) {
          const daysSinceContact = differenceInDays(new Date(), parseISO(c.last_client_contact));
          if (daysSinceContact >= 30) {
            newAlerts.push({
              id: `contact-${c.id}`,
              type: 'client_contact',
              severity: 'info',
              title: `No client contact for ${daysSinceContact} days`,
              case: c.case_ref,
              icon: Users
            });
          }
        }

        // Settlement authority not obtained
        if (!c.settlement_authority_obtained) {
          newAlerts.push({
            id: `settlement-${c.id}`,
            type: 'settlement_auth',
            severity: 'warning',
            title: 'Settlement authority not obtained',
            case: c.case_ref,
            icon: Zap
          });
        }
      }
    });

    setAlerts(newAlerts);
  }, [cases]);

  if (alerts.length === 0) {
    return null;
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      {criticalCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">{criticalCount} critical legal compliance alert(s)</p>
              <p className="text-sm text-red-700">Action required immediately</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual alerts */}
      {alerts.map((alert) => {
        const Icon = alert.icon;
        const colors = {
          critical: 'border-red-200 bg-red-50',
          warning: 'border-yellow-200 bg-yellow-50',
          info: 'border-blue-200 bg-blue-50'
        };
        const textColors = {
          critical: 'text-red-700',
          warning: 'text-yellow-700',
          info: 'text-blue-700'
        };
        const iconColors = {
          critical: 'text-red-600',
          warning: 'text-yellow-600',
          info: 'text-blue-600'
        };

        return (
          <Card key={alert.id} className={`border-2 ${colors[alert.severity]}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColors[alert.severity]}`} />
              <div className="flex-1">
                <p className={`font-semibold ${textColors[alert.severity]}`}>{alert.title}</p>
                <p className={`text-sm ${textColors[alert.severity]} opacity-75`}>Case: {alert.case}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}