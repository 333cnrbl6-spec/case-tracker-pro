import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function StatCard({ icon: Icon, label, value, subtitle, trend, bgGradient = 'from-primary to-secondary' }) {
  return (
    <Card className={`bg-gradient-to-br ${bgGradient} text-white border-0 shadow-lg hover:shadow-xl transition-shadow`}>
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-white/20 rounded-lg p-3">
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              trend.direction === 'up'
                ? 'bg-green-400/30 text-green-200'
                : 'bg-red-400/30 text-red-200'
            }`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </span>
          )}
        </div>
        <p className="text-sm text-white/80 mb-1">{label}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
        {subtitle && <p className="text-xs text-white/70 mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}