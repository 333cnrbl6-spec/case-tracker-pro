import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { format, differenceInDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export default function ResolutionTimeChart({ incidents }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return {
      month: format(d, 'MMM yy'),
      start: startOfMonth(d),
      end: endOfMonth(d),
    };
  });

  const data = months.map(({ month, start, end }) => {
    const resolved = incidents.filter(inc => {
      const d = new Date(inc.date);
      return (inc.status === 'reviewed' || inc.status === 'assessed' || inc.status === 'escalated')
        && d >= start && d <= end;
    });
    const open = incidents.filter(inc => {
      const d = new Date(inc.date);
      return inc.status === 'open' && d >= start && d <= end;
    });
    const avgDays = resolved.length
      ? Math.round(resolved.reduce((sum, inc) => {
          return sum + differenceInDays(new Date(), new Date(inc.date));
        }, 0) / resolved.length)
      : null;
    return { month, avgDays, open: open.length, resolved: resolved.length };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-blue-500" />
          Case Resolution Time (Days)
        </CardTitle>
        <p className="text-xs text-slate-500">Average days to resolution per month</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="d" />
            <Tooltip formatter={(v) => v != null ? [`${v} days`, 'Avg. Resolution'] : ['N/A', '']} />
            <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '30d target', fontSize: 10, fill: '#f59e0b' }} />
            <Line
              type="monotone"
              dataKey="avgDays"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-4 h-0.5 bg-blue-500 inline-block" /> Avg resolution days
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-4 h-0.5 bg-amber-400 border-dashed border-t inline-block" /> 30-day target
          </div>
        </div>
      </CardContent>
    </Card>
  );
}