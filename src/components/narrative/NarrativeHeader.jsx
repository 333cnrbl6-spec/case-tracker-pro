import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function NarrativeHeader({ incidents, communications, evidence }) {
  return (
    <div className="mb-10">
      <div className="border-b-2 border-slate-900 pb-6 mb-6">
        <p className="text-xs tracking-widest text-slate-500 uppercase mb-2">Confidential — Case Narrative Document</p>
        <h1 className="text-4xl font-bold text-slate-900 mb-1">
          Bradley v. Belcher
        </h1>
        <p className="text-lg text-slate-600">
          Full Chronological Case Narrative — Professional Misconduct & Financial Loss
        </p>
      </div>

      <Card className="bg-slate-900 text-white border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Claimant</p>
              <p className="text-lg font-semibold">Mr Bradley</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Defendant</p>
              <p className="text-lg font-semibold">Malcolm Belcher MRICS</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Key Third Party</p>
              <p className="text-lg font-semibold">Sean Powell</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Date Compiled</p>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
            <Badge className="bg-indigo-600">{incidents.length} Incidents</Badge>
            <Badge className="bg-indigo-600">{communications.length} Communications</Badge>
            <Badge className="bg-indigo-600">{evidence.length} Evidence Items</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}