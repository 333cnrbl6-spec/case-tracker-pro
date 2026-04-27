import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CriticalLimitationBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data: cases = [] } = useQuery({
    queryKey: ['legalCases'],
    queryFn: () => base44.entities.LegalCase.list(),
    refetchInterval: 10 * 60 * 1000,
  });

  if (dismissed) return null;

  const critical = cases.filter(c => {
    if (c.status === 'closed' || c.status === 'settled') return false;
    if (!c.limitation_date) return false;
    const days = differenceInDays(parseISO(c.limitation_date), new Date());
    return days <= 7;
  }).sort((a, b) => new Date(a.limitation_date) - new Date(b.limitation_date));

  if (critical.length === 0) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-3 text-sm">
      <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
      <div className="flex-1">
        <strong>CRITICAL: </strong>
        {critical.length === 1
          ? `${critical[0].case_ref} (${critical[0].client_name}) — limitation date in ${Math.max(0, differenceInDays(parseISO(critical[0].limitation_date), new Date()))} day(s). Act immediately.`
          : `${critical.length} cases have limitation dates within 7 days. Immediate action required.`
        }
      </div>
      <Link to="/compliance-alerts" className="underline font-semibold whitespace-nowrap hover:opacity-90">View Alerts</Link>
      <button onClick={() => setDismissed(true)} className="ml-2 hover:opacity-75"><X className="w-4 h-4" /></button>
    </div>
  );
}