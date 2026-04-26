import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, Shield } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function SmartCaseSearch({ onCaseSelect }) {
  const [filters, setFilters] = useState({
    search: '',
    case_type: '',
    case_status: '',
    limitation_filter: '',
    value_min: '',
    value_max: ''
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['legalCases'],
    queryFn: () => base44.entities.LegalCase.list()
  });

  const filtered = useMemo(() => {
    return cases.filter(c => {
      const search = filters.search.toLowerCase();
      if (search && !c.case_ref.toLowerCase().includes(search) && 
          !c.client_name.toLowerCase().includes(search)) return false;
      if (filters.case_type && c.case_type !== filters.case_type) return false;
      if (filters.case_status && c.status !== filters.case_status) return false;
      if (filters.value_min && c.estimated_value < parseFloat(filters.value_min)) return false;
      if (filters.value_max && c.estimated_value > parseFloat(filters.value_max)) return false;

      // Limitation date filter (CRITICAL)
      if (filters.limitation_filter) {
        if (!c.limitation_date) return false;
        const daysUntil = differenceInDays(parseISO(c.limitation_date), new Date());
        if (filters.limitation_filter === '30' && daysUntil > 30) return false;
        if (filters.limitation_filter === '60' && daysUntil > 60) return false;
        if (filters.limitation_filter === '90' && daysUntil > 90) return false;
      }

      return true;
    });
  }, [cases, filters]);

  const getLimitationStatus = (limitationDate) => {
    if (!limitationDate) return null;
    const days = differenceInDays(parseISO(limitationDate), new Date());
    if (days < 0) return { label: 'EXPIRED', color: 'bg-red-100 text-red-700' };
    if (days < 7) return { label: `${days}d LEFT`, color: 'bg-red-100 text-red-700' };
    if (days < 30) return { label: `${days}d LEFT`, color: 'bg-yellow-100 text-yellow-700' };
    return { label: `${days}d LEFT`, color: 'bg-green-100 text-green-700' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Smart Case Search
        </CardTitle>
        <p className="text-xs text-slate-600 mt-2">Filter by limitation dates to identify cases requiring immediate action and prevent negligence claims</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Input
            placeholder="Case ref or client name"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="col-span-2"
          />
          <select
            value={filters.case_type}
            onChange={(e) => setFilters({ ...filters, case_type: e.target.value })}
            className="border rounded-md p-2 text-sm"
          >
            <option value="">All types</option>
            <option value="personal_injury">Personal Injury</option>
            <option value="employment">Employment</option>
            <option value="property_dispute">Property Dispute</option>
            <option value="professional_negligence">Professional Negligence</option>
            <option value="insurance_claim">Insurance Claim</option>
          </select>

          <select
            value={filters.case_status}
            onChange={(e) => setFilters({ ...filters, case_status: e.target.value })}
            className="border rounded-md p-2 text-sm"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="settled">Settled</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filters.limitation_filter}
            onChange={(e) => setFilters({ ...filters, limitation_filter: e.target.value })}
            className="border rounded-md p-2 text-sm col-span-2 md:col-span-1 font-semibold"
          >
            <option value="">All limitation dates</option>
            <option value="30">🚨 CRITICAL: Within 30 days</option>
            <option value="60">⚠️ HIGH: Within 60 days</option>
            <option value="90">📋 MEDIUM: Within 90 days</option>
          </select>
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No cases found</p>
          ) : (
            filtered.map((c) => {
              const limStatus = getLimitationStatus(c.limitation_date);
              return (
                <div
                  key={c.id}
                  onClick={() => onCaseSelect(c)}
                  className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">{c.case_ref}</p>
                      <p className="text-sm text-slate-600">{c.client_name} vs {c.opponent_name}</p>
                    </div>
                    {limStatus && (
                      <Badge className={limStatus.color}>
                        {limStatus.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">{c.case_type}</Badge>
                    <Badge variant="outline">£{c.estimated_value}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Compliance Alerts */}
        {(() => {
          const critical = filtered.filter(c => c.limitation_date && differenceInDays(parseISO(c.limitation_date), new Date()) < 30);
          const high = filtered.filter(c => c.limitation_date && differenceInDays(parseISO(c.limitation_date), new Date()) >= 30 && differenceInDays(parseISO(c.limitation_date), new Date()) < 60);
          
          return (
            <div className="space-y-2">
              {critical.length > 0 && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">{critical.length} case(s) - CRITICAL: Limitation date within 30 days</span>
                </div>
              )}
              {high.length > 0 && (
                <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">{high.length} case(s) - HIGH: Limitation date within 60 days</span>
                </div>
              )}
              {critical.length === 0 && high.length === 0 && filtered.length > 0 && (
                <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">All cases compliant - No urgent limitation deadlines</span>
                </div>
              )}
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}