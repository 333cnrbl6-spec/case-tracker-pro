import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, TrendingDown, PoundSterling, AlertTriangle, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ─── Static known data ────────────────────────────────────────────────────────

const PROPERTY_DATA = [
  {
    property: '4 Trinity Buildings',
    contractValue: 11200,
    paidToDate: 7912.24,
    outstanding: 3287.76,
    status: 'Withheld — retention + payment 6 + additionals',
    notes: 'Rates agreed across all line items. Belcher withheld retention and final payments without justification.',
    source: 'Cost schedules: Valuation #1 (13 Mar 2023), 29 Mar 2023 (x2)',
  },
  {
    property: '29 Clifton Road',
    contractValue: 38400,
    paidToDate: null, // not yet confirmed
    outstanding: null, // partial data only
    status: 'Disputed — downvaluation across ~40+ line items',
    notes: 'VIVID countered Bradley rates. Confirmed disputes on electrical items alone = £2,046 loss (partial data). Full schedule analysis pending.',
    source: 'Cost schedules: 13 versions, 29 Mar – 9 Jun 2023. Malcolm guidance versions shared with Belcher.',
    partialLoss: 2046,
    partialItemCount: 2,
    totalItemsEstimate: 40,
  },
  {
    property: '5 Victoria Street',
    contractValue: null,
    paidToDate: null,
    outstanding: null,
    status: 'Awaiting schedule upload',
    notes: 'Mark Jones Electrical Invoice No. 2 (£400) relates to this property, April 2023.',
    source: 'No cost schedule yet uploaded.',
  },
  {
    property: '4 Victoria Street',
    contractValue: null,
    paidToDate: null,
    outstanding: null,
    status: 'Awaiting schedule upload',
    notes: '',
    source: 'No cost schedule yet uploaded.',
  },
  {
    property: 'Yardie Lane',
    contractValue: null,
    paidToDate: null,
    outstanding: null,
    status: 'Awaiting schedule upload',
    notes: '',
    source: 'No cost schedule yet uploaded.',
  },
  {
    property: 'Waltons Parade (Preston)',
    contractValue: null,
    paidToDate: null,
    outstanding: null,
    status: 'Awaiting schedule upload',
    notes: '',
    source: 'No cost schedule yet uploaded.',
  },
  {
    property: 'Vadre Lane',
    contractValue: null,
    paidToDate: null,
    outstanding: null,
    status: 'Awaiting schedule upload',
    notes: '',
    source: 'No cost schedule yet uploaded.',
  },
];

const MATERIALS_EXPENDITURE = [
  { supplier: 'Howdens (kitchen units)', amount: 1044, property: '4 Trinity Buildings' },
  { supplier: 'Mark Jones Electrical', amount: 400, property: '5 Victoria Street' },
  { supplier: 'Nutria', amount: 1000, property: '29 Clifton Road' },
  { supplier: 'Enreach', amount: 278, property: '29 Clifton Road' },
  { supplier: 'Paint', amount: 90, property: '29 Clifton Road' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PropertyRow({ p, index }) {
  const [expanded, setExpanded] = useState(false);
  const hasData = p.contractValue !== null;
  const lossConfirmed = p.outstanding ?? p.partialLoss ?? null;
  const pct = hasData && p.paidToDate ? Math.round((p.paidToDate / p.contractValue) * 100) : null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 w-5">{index + 1}</span>
          <span className="font-semibold text-slate-800 flex-1 text-sm">{p.property}</span>

          {hasData ? (
            <>
              <span className="font-mono text-slate-700 text-sm w-24 text-right">£{p.contractValue.toLocaleString()}</span>
              <span className="font-mono text-slate-600 text-sm w-24 text-right">
                {p.paidToDate !== null ? `£${p.paidToDate.toLocaleString()}` : '—'}
              </span>
              <span className={`font-mono font-bold text-sm w-28 text-right ${lossConfirmed ? 'text-red-700' : 'text-slate-400'}`}>
                {lossConfirmed ? `-£${lossConfirmed.toLocaleString()}` : '—'}
              </span>
              {p.partialLoss && !p.outstanding && (
                <Badge className="text-xs bg-amber-100 text-amber-800 border-0">Partial only</Badge>
              )}
              {p.outstanding && (
                <Badge className="text-xs bg-red-100 text-red-800 border-0">Withheld</Badge>
              )}
            </>
          ) : (
            <>
              <span className="font-mono text-slate-400 text-sm w-24 text-right">—</span>
              <span className="font-mono text-slate-400 text-sm w-24 text-right">—</span>
              <span className="font-mono text-slate-400 text-sm w-28 text-right">—</span>
              <Badge className="text-xs bg-slate-100 text-slate-500 border-0">Pending upload</Badge>
            </>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
        </div>

        {hasData && pct !== null && (
          <div className="mt-2 ml-8">
            <div className="h-1.5 bg-slate-200 rounded-full">
              <div className="h-1.5 bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{pct}% paid — {100 - pct}% withheld/disputed</p>
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-slate-50 border-t space-y-1.5 text-xs">
          <p className="text-slate-700"><span className="font-semibold">Status:</span> {p.status}</p>
          {p.notes && <p className="text-slate-600 italic">{p.notes}</p>}
          <p className="text-slate-500"><span className="font-semibold">Source:</span> {p.source}</p>
          {p.partialLoss && (
            <p className="text-amber-700 font-semibold">
              ⚠️ Confirmed partial loss: -£{p.partialLoss.toLocaleString()} ({p.partialItemCount} of ~{p.totalItemsEstimate} items analysed)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Manual ledger entry ──────────────────────────────────────────────────────

function ManualLedger({ entries, setEntries }) {
  const [form, setForm] = useState({ property: '', description: '', agreed: '', paid: '' });

  const add = () => {
    if (!form.property || !form.agreed) return;
    setEntries(prev => [...prev, { ...form, agreed: parseFloat(form.agreed) || 0, paid: parseFloat(form.paid) || 0, id: Date.now() }]);
    setForm({ property: '', description: '', agreed: '', paid: '' });
  };

  const total = { agreed: entries.reduce((s, e) => s + e.agreed, 0), paid: entries.reduce((s, e) => s + e.paid, 0) };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PoundSterling className="w-4 h-4 text-green-600" />
          Manual Payment Ledger Entries
          <Badge className="text-xs bg-slate-100 text-slate-600 border-0">Session only — add confirmed payment data here</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          <Input placeholder="Property" value={form.property} onChange={e => setForm(f => ({ ...f, property: e.target.value }))} className="text-xs" />
          <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="text-xs md:col-span-2" />
          <Input placeholder="Agreed £" type="number" value={form.agreed} onChange={e => setForm(f => ({ ...f, agreed: e.target.value }))} className="text-xs" />
          <Input placeholder="Paid £" type="number" value={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.value }))} className="text-xs" />
        </div>
        <Button size="sm" onClick={add} className="mb-4 gap-1"><Plus className="w-3.5 h-3.5" /> Add Entry</Button>

        {entries.length > 0 && (
          <div className="space-y-1">
            {entries.map(e => (
              <div key={e.id} className="flex items-center gap-3 text-xs bg-white border rounded px-3 py-2">
                <span className="font-semibold text-slate-700 w-32 truncate">{e.property}</span>
                <span className="text-slate-600 flex-1">{e.description}</span>
                <span className="font-mono text-slate-700 w-20 text-right">£{e.agreed.toLocaleString()}</span>
                <span className="font-mono text-green-700 w-20 text-right">£{e.paid.toLocaleString()}</span>
                <span className="font-mono font-bold text-red-700 w-20 text-right">-£{(e.agreed - e.paid).toLocaleString()}</span>
                <button onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))}><Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
              </div>
            ))}
            <div className="flex gap-3 text-xs font-bold border-t pt-2 mt-2">
              <span className="flex-1 text-right text-slate-600">Ledger totals:</span>
              <span className="font-mono text-slate-700 w-20 text-right">£{total.agreed.toLocaleString()}</span>
              <span className="font-mono text-green-700 w-20 text-right">£{total.paid.toLocaleString()}</span>
              <span className="font-mono text-red-700 w-20 text-right">-£{(total.agreed - total.paid).toLocaleString()}</span>
              <span className="w-5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function FinancialLossSummary() {
  const [ledgerEntries, setLedgerEntries] = useState([]);

  const { data: evidenceRecords = [], refetch } = useQuery({
    queryKey: ['evidence-financial'],
    queryFn: () => base44.entities.Evidence.list('-date_collected'),
  });

  // Pull any evidence records that look like invoices / payment records
  const invoiceEvidence = evidenceRecords.filter(e =>
    ['valuation', 'contract', 'document'].includes(e.evidence_type) &&
    (e.title?.toLowerCase().includes('invoice') ||
      e.title?.toLowerCase().includes('payment') ||
      e.title?.toLowerCase().includes('cost') ||
      e.title?.toLowerCase().includes('valuation') ||
      e.title?.toLowerCase().includes('schedule'))
  );

  // ── Aggregated numbers ──
  const knownContractTotal = PROPERTY_DATA.reduce((s, p) => s + (p.contractValue || 0), 0);
  const knownPaidTotal = PROPERTY_DATA.reduce((s, p) => s + (p.paidToDate || 0), 0);
  const confirmedOutstanding = PROPERTY_DATA.reduce((s, p) => s + (p.outstanding || 0), 0);
  const confirmedPartialLoss = PROPERTY_DATA.reduce((s, p) => s + (p.partialLoss || 0), 0);
  const materialsTotal = MATERIALS_EXPENDITURE.reduce((s, m) => s + m.amount, 0);
  const ledgerLoss = ledgerEntries.reduce((s, e) => s + (e.agreed - e.paid), 0);

  const totalConfirmedLoss = confirmedOutstanding + confirmedPartialLoss + ledgerLoss;
  const propertiesPending = PROPERTY_DATA.filter(p => p.contractValue === null).length;

  // Chart data — properties with known figures
  const chartData = PROPERTY_DATA
    .filter(p => p.contractValue !== null)
    .map(p => ({
      name: p.property.replace(' Buildings', '').replace(' Road', ' Rd').replace(' Street', ' St'),
      agreed: p.contractValue,
      paid: p.paidToDate || 0,
      loss: (p.outstanding || p.partialLoss || 0),
    }));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <Link to="/cost-schedules" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Cost Schedule Analysis
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Financial Loss Summary</h1>
              <p className="text-slate-600 mt-1">Agreed contract value vs final paid — total impact of Belcher's downvaluations</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Top-line totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-300 bg-white">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Known Contract Value</p>
              <p className="text-2xl font-bold text-slate-800">£{knownContractTotal.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">{PROPERTY_DATA.filter(p => p.contractValue).length} of {PROPERTY_DATA.length} properties</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-green-700 uppercase mb-1">Paid To Date</p>
              <p className="text-2xl font-bold text-green-800">£{knownPaidTotal.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">{knownContractTotal ? Math.round((knownPaidTotal / knownContractTotal) * 100) : 0}% of known contract value</p>
            </CardContent>
          </Card>
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-red-700 uppercase mb-1">Confirmed Loss</p>
              <p className="text-2xl font-bold text-red-800">£{totalConfirmedLoss.toLocaleString()}</p>
              <p className="text-xs text-red-600 mt-1">Withheld + confirmed downvaluation items</p>
            </CardContent>
          </Card>
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Properties Unquantified</p>
              <p className="text-2xl font-bold text-amber-800">{propertiesPending}</p>
              <p className="text-xs text-amber-600 mt-1">Schedules not yet uploaded — loss unknown</p>
            </CardContent>
          </Card>
        </div>

        {/* Waterfall alert */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800 mb-1">Quantified loss is a floor, not a ceiling</p>
              <p className="text-red-700">
                £{confirmedOutstanding.toLocaleString()} withheld (Trinity) + £{confirmedPartialLoss.toLocaleString()} confirmed downvaluation (29 Clifton, 2 of ~40 items) = <strong>£{totalConfirmedLoss.toLocaleString()} confirmed so far</strong>.
                {' '}With {propertiesPending} properties still unquantified and ~{38} further line items unanalysed at Clifton Road alone, total financial impact is expected to be substantially higher.
              </p>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        {chartData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Agreed vs Paid by Property</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `£${v.toLocaleString()}`} />
                  <Bar dataKey="agreed" name="Agreed" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="loss" name="Confirmed Loss" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Per-property breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Property-by-Property Breakdown
            </CardTitle>
            <div className="flex gap-6 text-xs text-slate-500 mt-1">
              <span className="w-24 text-right font-semibold">Agreed</span>
              <span className="w-24 text-right font-semibold">Paid</span>
              <span className="w-28 text-right font-semibold text-red-700">Loss / Outstanding</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {PROPERTY_DATA.map((p, i) => <PropertyRow key={p.property} p={p} index={i} />)}
          </CardContent>
        </Card>

        {/* Materials corroboration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PoundSterling className="w-4 h-4 text-amber-600" />
              Corroborating Materials Expenditure
            </CardTitle>
            <p className="text-xs text-slate-500">Actual out-of-pocket spend — demonstrates genuine work was performed</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {MATERIALS_EXPENDITURE.map((m, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-1.5 last:border-0 text-sm">
                  <div>
                    <span className="font-medium text-slate-800">{m.supplier}</span>
                    <span className="text-slate-400 text-xs ml-2">— {m.property}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-800">£{m.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold text-sm">
                <span className="text-slate-700">Total documented materials</span>
                <span className="font-mono text-amber-800">£{materialsTotal.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual ledger */}
        <ManualLedger entries={ledgerEntries} setEntries={setLedgerEntries} />

        {/* Evidence records from DB */}
        {invoiceEvidence.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relevant Evidence Records (from database)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoiceEvidence.map(e => (
                <div key={e.id} className="border rounded p-3 text-sm flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{e.title}</p>
                    {e.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{e.description}</p>}
                    <p className="text-xs text-slate-400">{e.date_collected}</p>
                  </div>
                  <Badge className={`text-xs flex-shrink-0 ${e.strength === 'critical' ? 'bg-red-100 text-red-800' : e.strength === 'strong' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                    {e.strength}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}