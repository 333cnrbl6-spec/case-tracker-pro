import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

const TYPE_LABELS = {
  communication: 'Communication',
  professional_conduct: 'Prof. Conduct',
  document_issue: 'Document Issue',
  gatekeeping: 'Gatekeeping',
  information_control: 'Info Control',
  harassment: 'Harassment',
  other: 'Other',
};

export default function IncidentTypeChart({ incidents, onDrillDown }) {
  const counts = incidents.reduce((acc, inc) => {
    const t = inc.incident_type || 'other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([type, value]) => ({
    name: TYPE_LABELS[type] || type,
    value,
    type,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieIcon className="w-4 h-4 text-indigo-500" />
          Incidents by Type
        </CardTitle>
        <p className="text-xs text-slate-500">Click a segment to drill down</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              onClick={(entry) => onDrillDown && onDrillDown(null, entry.type)}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [v, n]} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}