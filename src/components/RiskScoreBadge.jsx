import React from 'react';
import { LEVEL_STYLES } from '@/lib/riskScoring';
import { ShieldAlert } from 'lucide-react';

/**
 * Compact risk score badge.
 * Props: score (0-100), level ('low'|'medium'|'high'|'critical'), size ('sm'|'md')
 */
export default function RiskScoreBadge({ score, level, size = 'md' }) {
  const styles = LEVEL_STYLES[level] || LEVEL_STYLES.low;

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${styles.label}`}>
        <span>{score}</span>
        <span className="opacity-70">/100</span>
        <span>· {styles.word}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${styles.label}`}>
      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold leading-none">{score}</span>
        <span className="text-xs opacity-60">/100</span>
      </div>
      <span className="text-xs font-semibold">{styles.word}</span>
    </div>
  );
}