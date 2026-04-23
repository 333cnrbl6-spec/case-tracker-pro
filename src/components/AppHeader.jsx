import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalSearch from '@/components/GlobalSearch';
import { Shield, Home, ChevronRight } from 'lucide-react';

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/incidents': 'Incidents',
  '/evidence': 'Evidence',
  '/communications': 'Communications',
  '/rics-rules': 'RICS Rules',
  '/rics-risk': 'Risk Assessment',
  '/timeline': 'Timeline',
  '/network-map': 'Network Map',
  '/case-manager': 'Case Manager',
  '/audit-log': 'Audit Log',
  '/compliance-dashboard': 'Compliance',
  '/risk-dashboard': 'Risk Dashboard',
};

export default function AppHeader() {
  const location = useLocation();
  const label = ROUTE_LABELS[location.pathname];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 h-14 flex items-center px-6 gap-4">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-sm hidden sm:block">RICS Monitor</span>
      </Link>

      {label && (
        <div className="flex items-center gap-1.5 text-sm text-slate-400 shrink-0">
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 font-medium">{label}</span>
        </div>
      )}

      <div className="flex-1 flex justify-center">
        <GlobalSearch />
      </div>
    </header>
  );
}