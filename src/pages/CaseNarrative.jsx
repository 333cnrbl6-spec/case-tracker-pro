import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import NarrativeHeader from '@/components/narrative/NarrativeHeader';
import ChronologicalNarrative from '@/components/narrative/ChronologicalNarrative';
import DamageCharts from '@/components/narrative/DamageCharts';
import UndefinedEntities from '@/components/narrative/UndefinedEntities';

export default function CaseNarrative() {
  const { data: incidents = [], isLoading: loadingInc } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-date'),
  });

  const { data: communications = [], isLoading: loadingComm } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list('-date'),
  });

  const { data: evidence = [], isLoading: loadingEv } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list('-date_collected'),
  });

  const isLoading = loadingInc || loadingComm || loadingEv;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-600">Compiling case narrative...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-8 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4 mr-2" /> Print / Export
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        <NarrativeHeader
          incidents={incidents}
          communications={communications}
          evidence={evidence}
        />

        <ChronologicalNarrative
          incidents={incidents}
          communications={communications}
          evidence={evidence}
        />

        <DamageCharts />

        <UndefinedEntities />

        {/* Disclaimer */}
        <div className="border-t-2 border-slate-300 pt-6 mt-10 text-xs text-slate-500 space-y-2">
          <p><strong>Disclaimer:</strong> This narrative has been compiled from documented evidence, communications, and incident records held within this case management system. All quotations are drawn from evidenced communications. This document is intended for legal review purposes and does not constitute legal advice.</p>
          <p>Generated: {new Date().toLocaleDateString('en-GB')} | Document reference: BRAD-BELCH-NARRATIVE-001</p>
        </div>
      </div>
    </div>
  );
}