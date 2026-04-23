import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';

// Generic filter bar — pass a `config` array of filter definitions
// config = [{ key, label, type: 'select'|'date'|'text'|'rics', options?: [{value, label}] }]
// filters = { search: '', [key]: value, ... }
// onChange(filters)

export default function FilterBar({ config = [], filters, onChange, resultCount, totalCount }) {
  const [expanded, setExpanded] = useState(false);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'search' && v && v !== 'all').length;
  const hasSearch = filters.search?.length > 0;

  const set = (key, value) => onChange({ ...filters, [key]: value });

  const clearAll = () => {
    const cleared = { search: '' };
    config.forEach(c => { cleared[c.key] = 'all'; });
    onChange(cleared);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl mb-5 overflow-hidden">
      {/* Search row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={filters.search || ''}
            onChange={e => set('search', e.target.value)}
            placeholder="Search…"
            className="pl-9 h-9 text-sm border-slate-200"
          />
          {filters.search && (
            <button onClick={() => set('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(e => !e)}
          className={`gap-2 shrink-0 h-9 ${activeFilterCount > 0 ? 'border-indigo-400 text-indigo-700 bg-indigo-50' : ''}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
              {activeFilterCount}
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>

        {(activeFilterCount > 0 || hasSearch) && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-slate-500 h-9 shrink-0 gap-1.5">
            <X className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}

        {totalCount !== undefined && (
          <span className="text-sm text-slate-500 shrink-0">
            {resultCount !== totalCount ? <><strong className="text-slate-800">{resultCount}</strong> / {totalCount}</> : <strong className="text-slate-800">{totalCount}</strong>}
          </span>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {config.map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{f.label}</label>
                {f.type === 'select' && (
                  <Select value={filters[f.key] || 'all'} onValueChange={v => set(f.key, v)}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {f.label}s</SelectItem>
                      {f.options?.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {f.type === 'date' && (
                  <input
                    type="date"
                    value={filters[f.key] || ''}
                    onChange={e => set(f.key, e.target.value || 'all')}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                )}
                {f.type === 'text' && (
                  <Input
                    value={filters[f.key] === 'all' ? '' : (filters[f.key] || '')}
                    onChange={e => set(f.key, e.target.value || 'all')}
                    placeholder={`Filter by ${f.label.toLowerCase()}`}
                    className="h-8 text-xs bg-white"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-200">
              {config.filter(c => filters[c.key] && filters[c.key] !== 'all').map(c => {
                const val = filters[c.key];
                const option = c.options?.find(o => o.value === val);
                return (
                  <Badge key={c.key} variant="secondary" className="gap-1 text-xs pr-1">
                    <span className="text-slate-500">{c.label}:</span> {option?.label || val}
                    <button onClick={() => set(c.key, 'all')} className="ml-0.5 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}