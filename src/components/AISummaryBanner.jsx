import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

/**
 * AISummaryBanner — generates and displays an AI summary for any set of data.
 *
 * Props:
 *   prompt       — string: the full LLM prompt to send
 *   title        — string: label shown on the banner (default "AI Summary")
 *   disabled     — bool: disable the generate button (e.g. no data yet)
 *   disabledMsg  — string: tooltip/hint shown when disabled
 *   colorScheme  — 'indigo' | 'purple' | 'teal' (default 'indigo')
 */
const SCHEMES = {
  indigo: {
    border: 'border-indigo-200',
    bg: 'bg-gradient-to-r from-indigo-50 to-violet-50',
    iconBg: 'bg-indigo-100',
    icon: 'text-indigo-600',
    label: 'text-indigo-700',
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    btnOutline: 'border-indigo-300 text-indigo-700 hover:bg-indigo-50',
    text: 'text-slate-700',
  },
  purple: {
    border: 'border-purple-200',
    bg: 'bg-gradient-to-r from-purple-50 to-fuchsia-50',
    iconBg: 'bg-purple-100',
    icon: 'text-purple-600',
    label: 'text-purple-700',
    btn: 'bg-purple-600 hover:bg-purple-700 text-white',
    btnOutline: 'border-purple-300 text-purple-700 hover:bg-purple-50',
    text: 'text-slate-700',
  },
  teal: {
    border: 'border-teal-200',
    bg: 'bg-gradient-to-r from-teal-50 to-cyan-50',
    iconBg: 'bg-teal-100',
    icon: 'text-teal-600',
    label: 'text-teal-700',
    btn: 'bg-teal-600 hover:bg-teal-700 text-white',
    btnOutline: 'border-teal-300 text-teal-700 hover:bg-teal-50',
    text: 'text-slate-700',
  },
};

export default function AISummaryBanner({
  prompt,
  title = 'AI Summary',
  disabled = false,
  disabledMsg = 'Add data first',
  colorScheme = 'indigo',
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const s = SCHEMES[colorScheme] || SCHEMES.indigo;

  const generate = async () => {
    setLoading(true);
    setSummary(null);
    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setSummary(typeof result === 'string' ? result : result?.summary || JSON.stringify(result));
    setLoading(false);
    setCollapsed(false);
  };

  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4 space-y-3`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${s.iconBg}`}>
            <Sparkles className={`w-4 h-4 ${s.icon}`} />
          </div>
          <span className={`font-semibold text-sm ${s.label}`}>{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {summary && (
            <button
              onClick={() => setCollapsed(c => !c)}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded border ${s.btnOutline} transition-colors`}
            >
              {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
          )}
          <Button
            size="sm"
            onClick={generate}
            disabled={disabled || loading}
            className={`gap-1.5 text-xs h-7 px-3 ${summary ? '' : s.btn}`}
            variant={summary ? 'outline' : 'default'}
            title={disabled ? disabledMsg : undefined}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : summary ? (
              <RefreshCw className="w-3 h-3" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate AI Summary'}
          </Button>
        </div>
      </div>

      {/* Summary body */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analysing and summarising — this may take a moment…</span>
        </div>
      )}

      {summary && !collapsed && (
        <div className={`text-sm leading-relaxed ${s.text} whitespace-pre-wrap border-t border-white/60 pt-3`}>
          {summary}
        </div>
      )}

      {!summary && !loading && (
        <p className="text-xs text-slate-400 italic">
          Click "Generate AI Summary" for an instant AI overview of {title.toLowerCase().replace('ai summary — ', '')}.
        </p>
      )}
    </div>
  );
}