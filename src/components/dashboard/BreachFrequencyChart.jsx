import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#65a30d',
};

const CustomTooltip = ({ active, payload, label, onDrillDown }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill }} />
          <span className="text-slate-600 capitalize">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
      <p className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline" onClick={() => onDrillDown && onDrillDown(label)}>
        Click bar to view incidents →
      </p>
    </div>
  );
};

export default function BreachFrequencyChart({ incidents, onDrillDown }) {
  // Build last 6 months data
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return {
      month: format(d, 'MMM yy'),
      start: startOfMonth(d),
      end: endOfMonth(d),
    };
  });

  const data = months.map(({ month, start, end }) => {
    const inMonth = incidents.filter(inc => {
      const d = new Date(inc.date);
      return d >= start && d <= end;
    });
    return {
      month,
      critical: inMonth.filter(i => i.severity === 'critical').length,
      high: inMonth.filter(i => i.severity === 'high').length,
      medium: inMonth.filter(i => i.severity === 'medium').length,
      low: inMonth.filter(i => i.severity === 'low').length,
    };
  });

  const handleBarClick = (data) => {
    if (data && onDrillDown) onDrillDown(data.activeLabel);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-red-500" />
          Breach Frequency (Last 6 Months)
        </CardTitle>
        <p className="text-xs text-slate-500">Click a bar to drill into incidents for that month</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip onDrillDown={onDrillDown} />} />
            <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLORS.critical} radius={[0, 0, 0, 0]} />
            <Bar dataKey="high" stackId="a" fill={SEVERITY_COLORS.high} />
            <Bar dataKey="medium" stackId="a" fill={SEVERITY_COLORS.medium} />
            <Bar dataKey="low" stackId="a" fill={SEVERITY_COLORS.low} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 flex-wrap">
          {Object.entries(SEVERITY_COLORS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs text-slate-600 capitalize">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: v }} />
              {k}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}