import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingDown, FileSpreadsheet, AlertTriangle, PoundSterling, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import CostScheduleDropZone from '@/components/CostScheduleDropZone';

const PROPERTIES = ['29 Clifton Road', '4 Trinity Buildings', '5 Victoria Street', '4 Victoria Street', 'Trinity Buildings', 'Yardie Lane', 'Waltons Parade'];

const KNOWN_SCHEDULES = [
  // 4 Trinity Buildings
  { file: 'Costschedule-4Trinity2.xlsx', property: '4 Trinity Buildings', date: '2023-03-13', label: 'Valuation #1 (13 Mar 2023)', bradleyTotal: null, vivid: false, ratesAgreed: true },
  { file: 'Costschedule-4Trinity030420232.xlsx', property: '4 Trinity Buildings', date: '2023-03-29', label: 'Valuation 29 Mar 2023', bradleyTotal: null, vivid: false, ratesAgreed: true },
  { file: 'Costschedule-4Trinity03042023version1xlsb2.xlsx', property: '4 Trinity Buildings', date: '2023-03-29', label: 'Valuation 29 Mar 2023 (v1 xlsb)', bradleyTotal: null, vivid: false, ratesAgreed: true },
  // 29 Clifton Road
  { file: 'Costschedule-29CliftonRoad-Valuations.xlsx', property: '29 Clifton Road', date: '2023-03-29', label: 'Initial (VIVID counter)', bradleyTotal: null, vividTotal: null, vivid: true, ratesAgreed: false },
  { file: 'Costschedule-29CliftonRoad-Valuations3105231.xlsx', property: '29 Clifton Road', date: '2023-05-31', label: 'Valuation 31 May 2023 (v1)', bradleyTotal: null, vividTotal: null, vivid: true },
  { file: 'Costschedule-29CliftonRoad-Valuations3105232.xlsx', property: '29 Clifton Road', date: '2023-05-31', label: 'Valuation 31 May 2023 (v2)', bradleyTotal: null, vividTotal: null, vivid: true },
  { file: 'Costschedule-29CliftonRoad-Valuations3105235.xlsx', property: '29 Clifton Road', date: '2023-05-31', label: 'Valuation 31 May 2023 (v5 — baseline)', bradleyTotal: null, vividTotal: null, vivid: true },
  { file: 'Costschedule-29CliftonRoad-Valuations010620231.xlsx', property: '29 Clifton Road', date: '2023-06-01', label: 'Valuation 1 Jun 2023 (v1)', bradleyTotal: null, vividTotal: null, vivid: true },
  { file: 'Costschedule-29CliftonRoad-Valuations010620231.xlsx', property: '29 Clifton Road', date: '2023-06-01', label: 'Valuation 1 Jun 2023 (v2)', bradleyTotal: null, vividTotal: null, vivid: true },
  { file: 'Costschedule-29CliftonRoad-Valuations010620233.xlsx', property: '29 Clifton Road', date: '2023-06-01', label: 'Valuation 1 Jun 2023 (v3)', bradleyTotal: null, vividTotal: null, vivid: true },
  { file: 'Costschedule-29CliftonRoad-Valuations090620232.xlsx', property: '29 Clifton Road', date: '2023-06-09', label: 'Valuation 9 Jun 2023 (materials sheet)', bradleyTotal: null, vividTotal: null, vivid: true, hasMaterialsSheet: true },
  { file: 'Costschedule-29CliftonRoadmalcolmguidance1.xlsx', property: '29 Clifton Road', date: '2023-03-29', label: 'Malcolm Guidance Version', bradleyTotal: null, vivid: false, sharedWithMalcolm: true },
  { file: 'CostSchedule29Clifton-LiveandSharedwithMalcolm2.xlsx', property: '29 Clifton Road', date: '2023-03-29', label: 'LIVE — Shared with Malcolm', bradleyTotal: null, vivid: false, sharedWithMalcolm: true },
];

// Key disputed line items extracted from file previews
const KEY_DISPUTES = [
  {
    property: '29 Clifton Road',
    item: 'Replace all faceplates and switches with new white',
    location: 'All rooms',
    bradleyRate: 2048,
    vividComment: 'I think you have added a zero in error.',
    vividValue: 248,
    finalValuation: 250,
    loss: 1798,
    notes: 'VIVID claimed £2,048 was a typo for £248. Bradley\'s rate is defensible given the scope. Final agreed £250 — 87.8% reduction.'
  },
  {
    property: '29 Clifton Road',
    item: 'Replace light pendants with new fitted with LED bulb',
    location: 'All rooms',
    bradleyRate: 283,
    vividComment: 'Leave out',
    vividValue: 0,
    finalValuation: 35,
    loss: 248,
    notes: 'VIVID initially refused entirely. Some partial payment eventually negotiated. Multiple versions show this fluctuating.'
  },
  {
    property: '29 Clifton Road',
    item: 'Strip wall paper throughout',
    location: 'All rooms',
    bradleyRate: 325,
    vividComment: null,
    vividValue: null,
    finalValuation: 325,
    loss: 0,
    notes: 'Accepted in full — no dispute on this item.'
  },
];

const MATERIALS_EXPENDITURE = [
  { supplier: 'Howdens (kitchen units)', amount: 1044, corroborates: '4 Trinity Buildings kitchen installation photographs' },
  { supplier: 'Mark Jones Electrical', amount: 400, corroborates: 'Mark Jones Invoice No. 2 (April 2023, Victoria Street)' },
  { supplier: 'Nutria', amount: 1000, corroborates: 'Specialist materials/supplies' },
  { supplier: 'Enreach', amount: 278, corroborates: 'Telecoms/specialist works' },
  { supplier: 'Paint', amount: 90, corroborates: 'Decorating works documented in photographs' },
];

export default function CostScheduleAnalysis() {
  const [selectedProperty, setSelectedProperty] = useState('All');

  const { data: evidenceRecords = [], isLoading, refetch } = useQuery({
    queryKey: ['evidence-costschedules'],
    queryFn: () => base44.entities.Evidence.list('-date_collected'),
  });

  const costScheduleEvidence = evidenceRecords.filter(e =>
    e.title?.toLowerCase().includes('cost schedule') || e.title?.toLowerCase().includes('trinity') || e.title?.toLowerCase().includes('clifton') || e.notes?.includes('drop zone')
  );

  const confirmedLoss = KEY_DISPUTES.reduce((sum, d) => sum + d.loss, 0);
  const materialsTotal = MATERIALS_EXPENDITURE.reduce((sum, m) => sum + m.amount, 0);
  const knownByProperty = KNOWN_SCHEDULES.reduce((acc, s) => {
    acc[s.property] = (acc[s.property] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Cost Schedule Analysis</h1>
              <p className="text-slate-600 mt-1">Tracking Bradley's agreed rates vs surveyor downvaluations across all properties</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs font-semibold text-red-700 uppercase">Downvaluation Loss (partial)</span>
              </div>
              <p className="text-2xl font-bold text-red-800">£{confirmedLoss.toLocaleString()}</p>
              <p className="text-xs text-red-600 mt-1">29 Clifton Rd — 2 of ~40 items only</p>
            </CardContent>
          </Card>
          <Card className="border-red-300 bg-red-100">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-700" />
                <span className="text-xs font-semibold text-red-800 uppercase">Outstanding — Trinity</span>
              </div>
              <p className="text-2xl font-bold text-red-900">£3,287.76</p>
              <p className="text-xs text-red-700 mt-1">Retention + Payment 6 + Additionals withheld</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <PoundSterling className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-semibold text-amber-700 uppercase">Materials Documented</span>
              </div>
              <p className="text-2xl font-bold text-amber-800">£{materialsTotal.toLocaleString()}</p>
              <p className="text-xs text-amber-600 mt-1">Actual expenditure from 9 June materials sheet</p>
            </CardContent>
          </Card>
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
                <span className="text-xs font-semibold text-indigo-700 uppercase">Schedule Files</span>
              </div>
              <p className="text-2xl font-bold text-indigo-800">{costScheduleEvidence.length}</p>
              <p className="text-xs text-indigo-600 mt-1">Cost schedules in evidence database</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-600 uppercase">Properties</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{Object.keys(knownByProperty).length}</p>
              <p className="text-xs text-slate-500 mt-1">Properties with schedule evidence. More expected.</p>
            </CardContent>
          </Card>
        </div>

        {/* Drop zone */}
        <CostScheduleDropZone onSaved={() => refetch()} />

        {/* Disputed line items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Confirmed Disputed Line Items — 29 Clifton Road
            </CardTitle>
            <p className="text-xs text-slate-500">From file preview data (first 3 rows). Full analysis pending complete file read.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-semibold text-slate-700">Item</th>
                    <th className="pb-2 font-semibold text-slate-700 text-right">Bradley</th>
                    <th className="pb-2 font-semibold text-amber-700 text-right">VIVID Counter</th>
                    <th className="pb-2 font-semibold text-red-700 text-right">Final Paid</th>
                    <th className="pb-2 font-semibold text-red-800 text-right">Loss</th>
                    <th className="pb-2 font-semibold text-slate-600">VIVID Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {KEY_DISPUTES.map((d, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-800">{d.item}</p>
                        <p className="text-xs text-slate-500">{d.location}</p>
                      </td>
                      <td className="py-3 text-right font-mono text-slate-800">£{d.bradleyRate.toLocaleString()}</td>
                      <td className="py-3 text-right font-mono text-amber-700">
                        {d.vividValue !== null ? `£${d.vividValue.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 text-right font-mono text-red-600">
                        {d.finalValuation !== null ? `£${d.finalValuation.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-red-800">
                        {d.loss > 0 ? `-£${d.loss.toLocaleString()}` : <span className="text-green-700">£0</span>}
                      </td>
                      <td className="py-3 pl-4 max-w-xs">
                        {d.vividComment ? (
                          <span className="text-xs italic text-amber-800 bg-amber-50 px-2 py-1 rounded">"{d.vividComment}"</span>
                        ) : (
                          <span className="text-xs text-green-700">Accepted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-red-50">
                    <td colSpan={4} className="py-2 font-bold text-slate-700 text-right pr-4">Confirmed loss (these items only):</td>
                    <td className="py-2 font-bold text-red-800 text-right font-mono">-£{confirmedLoss.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-slate-500 bg-slate-100 rounded p-2">
              ⚠️ This represents only ~3 of approximately 40+ line items. Total loss across all items at all properties will be substantially higher once full schedules are analysed.
            </div>
          </CardContent>
        </Card>

        {/* Materials expenditure */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PoundSterling className="w-4 h-4 text-amber-600" />
              Actual Materials Expenditure — 9 June 2023 Sheet (29 Clifton Road)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MATERIALS_EXPENDITURE.map((m, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{m.supplier}</p>
                    <p className="text-xs text-slate-500">{m.corroborates}</p>
                  </div>
                  <span className="font-mono font-semibold text-slate-800">£{m.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold">
                <span className="text-slate-700">Total documented expenditure</span>
                <span className="font-mono text-amber-800">£{materialsTotal.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule file inventory */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              Cost Schedule File Inventory
              <Badge className="ml-2 bg-indigo-100 text-indigo-800 text-xs">More expected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {['4 Trinity Buildings', '29 Clifton Road'].map(prop => (
              <div key={prop} className="mb-5">
                <h3 className="font-semibold text-slate-800 mb-2 text-sm border-b pb-1">{prop}</h3>
                <div className="space-y-1">
                  {KNOWN_SCHEDULES.filter(s => s.property === prop).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm py-1">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-700 flex-1">{s.label}</span>
                      <div className="flex gap-1">
                        {s.ratesAgreed && <Badge className="text-xs bg-green-100 text-green-800">Rates agreed</Badge>}
                        {s.vivid && <Badge className="text-xs bg-amber-100 text-amber-800">VIVID counter</Badge>}
                        {s.sharedWithMalcolm && <Badge className="text-xs bg-red-100 text-red-800">Shared with Belcher</Badge>}
                        {s.hasMaterialsSheet && <Badge className="text-xs bg-blue-100 text-blue-800">Materials sheet</Badge>}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{s.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-4 p-3 bg-slate-100 rounded text-xs text-slate-600">
              <strong>Additional properties expected:</strong> Victoria Street (4 &amp; 5), Trinity Buildings flats, Yardie Lane, Waltons Parade (Preston), Vadre Lane. Upload further cost schedules via Evidence Scanner or drop them directly when ready.
            </div>
          </CardContent>
        </Card>

        {/* Evidence from database */}
        {costScheduleEvidence.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saved Cost Schedule Evidence Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {costScheduleEvidence.map(e => (
                  <div key={e.id} className="border rounded p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-800">{e.title}</p>
                      <Badge className="text-xs bg-green-100 text-green-700 flex-shrink-0">Saved</Badge>
                    </div>
                    {e.description && <p className="text-xs text-slate-500 mt-1">{e.description}</p>}
                    <p className="text-xs text-slate-400 mt-1">{e.date_collected}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}