import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, Mail, Phone, X } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

function buildAlerts(cases) {
  const alerts = [];
  const now = new Date();
  cases.forEach(c => {
    if (c.status === 'closed' || c.status === 'settled') return;

    if (c.limitation_date) {
      const days = differenceInDays(parseISO(c.limitation_date), now);
      if (days <= 90 && days >= 0) {
        const severity = days <= 7 ? 'critical' : days <= 30 ? 'urgent' : 'warning';
        alerts.push({ id: `lim-${c.id}`, severity, case_ref: c.case_ref, client: c.client_name, message: `Limitation date in ${days} day${days !== 1 ? 's' : ''}` });
      } else if (days < 0) {
        alerts.push({ id: `lim-ov-${c.id}`, severity: 'critical', case_ref: c.case_ref, client: c.client_name, message: 'LIMITATION DATE OVERDUE!' });
      }
    }

    if (!c.client_care_letter_sent && c.created_date) {
      const daysSince = differenceInDays(now, parseISO(c.created_date));
      if (daysSince >= 14) alerts.push({ id: `ccl-${c.id}`, severity: 'warning', case_ref: c.case_ref, client: c.client_name, message: 'Client care letter not sent' });
    }

    if (c.last_client_contact) {
      const daysSince = differenceInDays(now, parseISO(c.last_client_contact));
      if (daysSince >= 30) alerts.push({ id: `contact-${c.id}`, severity: 'info', case_ref: c.case_ref, client: c.client_name, message: `No client contact in ${daysSince} days` });
    }
  });

  return alerts.sort((a, b) => {
    const order = { critical: 0, urgent: 1, warning: 2, info: 3 };
    return (order[a.severity] || 3) - (order[b.severity] || 3);
  });
}

const SEVERITY_COLORS = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  urgent: 'text-orange-700 bg-orange-50 border-orange-200',
  warning: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  info: 'text-blue-700 bg-blue-50 border-blue-200',
};

const SEVERITY_DOT = {
  critical: 'bg-red-600',
  urgent: 'bg-orange-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

export default function NavBellAlerts() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: cases = [] } = useQuery({
    queryKey: ['legalCases'],
    queryFn: () => base44.entities.LegalCase.list(),
    refetchInterval: 5 * 60 * 1000,
  });

  const alerts = buildAlerts(cases);
  const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'urgent').length;
  const totalCount = alerts.length;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        title="Compliance Alerts"
      >
        <Bell className="w-5 h-5" />
        {totalCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-xs font-bold px-1 ${criticalCount > 0 ? 'bg-red-600' : 'bg-orange-500'}`}>
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
              <span className="font-semibold text-sm text-slate-900">Compliance Alerts</span>
              {totalCount > 0 && <span className="text-xs text-slate-400">({totalCount})</span>}
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                All clear — no compliance alerts
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts.slice(0, 10).map(alert => (
                  <div key={alert.id} className={`px-4 py-3 border-l-4 ${SEVERITY_COLORS[alert.severity]}`} style={{ borderLeftColor: undefined }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[alert.severity]}`} />
                      <span className="font-semibold text-xs">{alert.case_ref}</span>
                      <span className="text-xs text-slate-500">{alert.client}</span>
                    </div>
                    <p className="text-xs ml-4">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-slate-100">
            <Link
              to="/compliance-alerts"
              onClick={() => setOpen(false)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all alerts & manage →
            </Link>
          </div>
        </div>
      )}

      {/* Critical banner shown in main UI when ≤7 days */}
      {alerts.filter(a => a.severity === 'critical').length > 0 && !open && (
        <div className="hidden" id="critical-alert-data" data-count={alerts.filter(a => a.severity === 'critical').length} />
      )}
    </div>
  );
}