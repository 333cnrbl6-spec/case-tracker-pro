import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export default function DamageCharts() {
  // Property-level value degradation data
  const propertyDegradation = [
    { 
      property: '29 Clifton Road',
      agreed: 65000,
      belcherValuation: 48000,
      loss: 17000,
    },
    {
      property: 'Property 2',
      agreed: 62000,
      belcherValuation: 50000,
      loss: 12000,
    },
    {
      property: 'Property 3',
      agreed: 58000,
      belcherValuation: 47000,
      loss: 11000,
    }
  ];

  // Line item degradation for 29 Clifton Road
  const lineItemDegradation = [
    { item: 'Electrical Faceplates', agreed: 500, belcherQS: 2048, note: 'Inflated 310%' },
    { item: 'Lighting Pendants', agreed: 70, belcherQS: 283, note: 'Inflated 304%' },
    { item: 'Wallpaper Stripping', agreed: 325, belcherQS: 325, note: 'Unchanged' },
    { item: 'General Works', agreed: 12000, belcherQS: 8500, note: 'Reduced 29%' },
    { item: 'Structural', agreed: 18000, belcherQS: 14000, note: 'Reduced 22%' },
    { item: 'Finishing', agreed: 8500, belcherQS: 6200, note: 'Reduced 27%' },
  ];

  // Timeline of value impact
  const valueTimeline = [
    { date: 'Nov 2023', agreedValue: 185000, actualValue: 185000, event: 'Agreement confirmed' },
    { date: 'Dec 2023', agreedValue: 185000, actualValue: 145000, event: 'Belcher reduces valuation' },
    { date: 'Jan 2024', agreedValue: 185000, actualValue: 145000, event: 'Conditions imposed' },
    { date: 'Feb 2024', agreedValue: 185000, actualValue: 140000, event: 'Conflict discovered' },
    { date: 'Mar 2024', agreedValue: 185000, actualValue: 135000, event: 'Access issues compound' },
  ];

  // Loss breakdown
  const lossBreakdown = [
    { name: 'Direct Valuation Loss', value: 40000 },
    { name: 'Consequential Delays', value: 8000 },
    { name: 'Additional Professional Fees', value: 5000 },
    { name: 'Opportunity Cost', value: 12000 },
  ];

  const totalLoss = lossBreakdown.reduce((s, l) => s + l.value, 0);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl">Appendix A: Damage Analysis — Charts & Data</CardTitle>
        <p className="text-sm text-slate-600">
          Visual representation of financial impact caused by Belcher's actions across all properties.
        </p>
      </CardHeader>
      <CardContent className="space-y-10">

        {/* Chart 1: Property Value Degradation */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Chart 1: Property-Level Value Degradation</h3>
          <p className="text-sm text-slate-600 mb-4">Agreed valuation vs. Belcher's post-completion assessment per property</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={propertyDegradation} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="property" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `£${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="agreed" name="Agreed Value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="belcherValuation" name="Belcher Valuation" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Line Item Analysis */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Chart 2: 29 Clifton Road — Line Item Discrepancies</h3>
          <p className="text-sm text-slate-600 mb-4">Shows both inflation (used to justify presence) and reduction (actual damage) at item level</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 border">Line Item</th>
                  <th className="text-right p-3 border">Agreed Cost</th>
                  <th className="text-right p-3 border">Belcher QS Value</th>
                  <th className="text-right p-3 border">Variance</th>
                  <th className="text-left p-3 border">Note</th>
                </tr>
              </thead>
              <tbody>
                {lineItemDegradation.map((item, idx) => {
                  const variance = item.belcherQS - item.agreed;
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-3 border font-medium">{item.item}</td>
                      <td className="p-3 border text-right">£{item.agreed.toLocaleString()}</td>
                      <td className="p-3 border text-right">£{item.belcherQS.toLocaleString()}</td>
                      <td className={`p-3 border text-right font-semibold ${variance > 0 ? 'text-amber-700' : variance < 0 ? 'text-red-700' : 'text-slate-500'}`}>
                        {variance > 0 ? '+' : ''}£{variance.toLocaleString()}
                      </td>
                      <td className="p-3 border text-xs text-slate-600">{item.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart 3: Value Timeline */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Chart 3: Value Degradation Timeline</h3>
          <p className="text-sm text-slate-600 mb-4">How the total case value eroded over time due to Belcher's actions</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={valueTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} domain={[120000, 200000]} />
                <Tooltip 
                  formatter={(v) => `£${v.toLocaleString()}`}
                  labelFormatter={(label) => {
                    const item = valueTimeline.find(t => t.date === label);
                    return `${label} — ${item?.event || ''}`;
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="agreedValue" name="Agreed Value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="actualValue" name="Effective Value" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Loss Breakdown */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Chart 4: Total Loss Breakdown</h3>
          <p className="text-sm text-slate-600 mb-4">Categorisation of all damages attributable to Belcher's conduct</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={lossBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {lossBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `£${v.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex flex-col justify-center">
              {lossBreakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <p className="text-sm font-medium">{item.name}</p>
                  </div>
                  <p className="font-bold text-slate-900">£{item.value.toLocaleString()}</p>
                </div>
              ))}
              <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 mt-2">
                <p className="font-bold text-lg">Total Estimated Loss</p>
                <p className="font-bold text-xl text-red-700">£{totalLoss.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}