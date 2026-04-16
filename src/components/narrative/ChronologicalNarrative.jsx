import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown date';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function CommunicationEntry({ comm }) {
  const toneColors = {
    professional: 'bg-green-100 text-green-800',
    neutral: 'bg-slate-100 text-slate-700',
    dismissive: 'bg-amber-100 text-amber-800',
    aggressive: 'bg-red-100 text-red-800',
    threatening: 'bg-red-200 text-red-900',
    unprofessional: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="ml-6 border-l-2 border-indigo-200 pl-5 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline" className="text-xs font-mono">
          {comm.data.type?.toUpperCase()}
        </Badge>
        <Badge className={toneColors[comm.data.tone] || 'bg-slate-100 text-slate-700'}>
          {comm.data.tone}
        </Badge>
      </div>
      <p className="text-xs text-slate-500 mb-1">
        <strong>From:</strong> {comm.data.from} → <strong>To:</strong> {comm.data.to} | <strong>Date:</strong> {formatDate(comm.data.date)}
      </p>
      <p className="text-xs font-semibold text-slate-700 mb-2">Re: {comm.data.subject}</p>
      <div className="bg-white border rounded-lg p-3 text-sm text-slate-800 italic">
        "{comm.data.content}"
      </div>
      {comm.data.concerning_elements?.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-red-700 mb-1">Concerning Elements:</p>
          <div className="flex flex-wrap gap-1">
            {comm.data.concerning_elements.map((el, i) => (
              <Badge key={i} variant="outline" className="text-xs border-red-300 text-red-700">{el}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChronologicalNarrative({ incidents, communications, evidence }) {
  // Build unified timeline
  const timeline = [];

  incidents.forEach(inc => {
    if (inc?.data?.date) {
      timeline.push({
        date: inc.data.date,
        type: 'incident',
        sortDate: new Date(inc.data.date),
        item: inc
      });
    }
  });

  communications.forEach(comm => {
    if (comm?.data?.date) {
      timeline.push({
        date: comm.data.date,
        type: 'communication',
        sortDate: new Date(comm.data.date),
        item: comm
      });
    }
  });

  evidence.forEach(ev => {
    if (ev?.data?.date_collected) {
      timeline.push({
        date: ev.data.date_collected,
        type: 'evidence',
        sortDate: new Date(ev.data.date_collected),
        item: ev
      });
    }
  });

  // Sort chronologically
  timeline.sort((a, b) => a.sortDate - b.sortDate);

  // Group by phase
  const phases = [
    { title: 'Phase 1: Engagement & Agreement', start: '2023-01-01', end: '2023-11-30', 
      narrative: "Mr Bradley, a contractor, was engaged in refurbishment works across multiple properties connected to Sean Powell. Malcolm Belcher MRICS was appointed as Quantity Surveyor to provide professional valuations of the completed works. At this stage, Belcher confirmed in writing an agreed valuation fee of £185,000 across three properties, with full documentation and final reports included in scope." },
    { title: 'Phase 2: Post-Completion Manipulation', start: '2023-12-01', end: '2024-01-10',
      narrative: "Following completion of works, Belcher unilaterally reduced the agreed valuation from £185,000 to £145,000 — a £40,000 shortfall — and simultaneously imposed retrospective documentation requirements that had never been discussed during the original engagement. Mr Bradley attempted to contact Sean Powell directly to resolve the matter, but Belcher had established a gatekeeping protocol preventing direct communication. Powell himself objected to these new conditions, writing that they were 'never discussed' and felt like leverage. Belcher responded dismissively, claiming 'professional obligations' to justify his position." },
    { title: 'Phase 3: Escalating Professional Misconduct', start: '2024-01-11', end: '2024-04-30',
      narrative: "Belcher's conduct escalated further. He restricted a co-instructed architect's access to survey data, citing 'client confidentiality' inappropriately. He gained access to a property without explicit consent and conducted surveys outside the agreed scope. Most critically, Land Registry records revealed that Belcher had been acting as both valuer and selling agent in the same transaction — a direct conflict of interest that was never disclosed, in breach of RICS Professional Standard PS1. Throughout this period, Belcher sent communications described as aggressive and dismissive, including a letter to Mr Bradley containing inflammatory language such as 'pathetic, totally unprofessional, childlike behaviour'." }
  ];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl">Section 1: Chronological Case Narrative</CardTitle>
        <p className="text-sm text-slate-600">
          A complete end-to-end walkthrough of events as they unfolded, with evidenced communications and analysis.
        </p>
      </CardHeader>
      <CardContent className="space-y-10">
        {phases.map((phase, phaseIdx) => {
          const phaseItems = timeline.filter(t => {
            const d = t.date;
            return d >= phase.start && d <= phase.end;
          });

          return (
            <div key={phaseIdx}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                  {phaseIdx + 1}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{phase.title}</h3>
              </div>

              {/* Narrative summary */}
              <div className="bg-slate-50 border rounded-lg p-5 mb-4">
                <p className="text-sm text-slate-800 leading-relaxed">{phase.narrative}</p>
              </div>

              {/* Communications in this phase */}
              {phaseItems.filter(t => t.type === 'communication').length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                    Key Communications
                  </h4>
                  <div className="space-y-4">
                    {phaseItems.filter(t => t.type === 'communication').map((t, idx) => (
                      <CommunicationEntry key={idx} comm={t.item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Analyst commentary */}
              {phaseItems.filter(t => t.type === 'incident').length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                    What Mr Bradley Sought vs. What Belcher Did
                  </h4>
                  {phaseItems.filter(t => t.type === 'incident').map((t, idx) => {
                    const inc = t.item.data;
                    return (
                      <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
                        <p className="font-semibold text-slate-900 mb-2">{inc.title}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-green-700 uppercase mb-1">Mr Bradley's Objective</p>
                            <p className="text-slate-700">
                              {inc.title.includes('Cost') ? 'Fair payment at the agreed rate of £185,000 for completed refurbishment works.' :
                               inc.title.includes('Access') ? 'Proper survey conduct within agreed scope and with proper consent.' :
                               inc.title.includes('Conflict') ? 'Independent, unbiased professional valuation of the properties.' :
                               inc.title.includes('Restrict') ? 'Open collaboration between all instructed professionals.' :
                               inc.title.includes('Retrospective') ? 'Clear, pre-agreed scope of QS engagement before works commenced.' :
                               'Fair and professional treatment in accordance with agreed terms.'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-red-700 uppercase mb-1">What Belcher Did</p>
                            <p className="text-slate-700">{inc.description}</p>
                          </div>
                        </div>
                        {inc.rics_violations?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {inc.rics_violations.map((v, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-red-300 text-red-700">{v}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Supporting evidence */}
              {phaseItems.filter(t => t.type === 'evidence').length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                    Supporting Evidence
                  </h4>
                  <div className="space-y-2">
                    {phaseItems.filter(t => t.type === 'evidence').map((t, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm border-l-2 border-green-300 pl-3 py-1">
                        <Badge className={
                          t.item.data.strength === 'critical' ? 'bg-red-100 text-red-800' :
                          t.item.data.strength === 'strong' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {t.item.data.strength}
                        </Badge>
                        <div>
                          <p className="font-medium text-slate-900">{t.item.data.title}</p>
                          <p className="text-xs text-slate-600">{t.item.data.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Sean Powell Contact Attempt */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
          <h4 className="font-semibold text-indigo-900 mb-2">Key Finding: Mr Bradley's Attempts to Contact Sean Powell</h4>
          <p className="text-sm text-indigo-800 leading-relaxed mb-3">
            The evidence confirms that Belcher explicitly restricted Mr Bradley's ability to communicate directly with Sean Powell. 
            In a letter to Mr Bradley, Belcher demanded that <em>"all contractor communication must go through Belcher, not directly to Powell"</em> and 
            <em>"no phone contact to Powell's mobile"</em>, enforcing that <em>"all contact through office only with staff intermediary"</em>.
          </p>
          <p className="text-sm text-indigo-800 leading-relaxed mb-3">
            This gatekeeping behaviour is evidenced and confirmed by Belcher's own correspondence. Sean Powell is mentioned across 
            multiple communications and was the client who originally engaged Belcher. Powell himself objected to Belcher's retrospective conditions, 
            stating they were <em>"never discussed during engagement setup"</em> and appeared to be a <em>"leverage mechanism"</em>.
          </p>
          <p className="text-sm text-indigo-800 leading-relaxed">
            Mr Bradley was therefore prevented from resolving matters directly with the instructing party, 
            with Belcher acting as an information gatekeeper to maintain control over the engagement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}