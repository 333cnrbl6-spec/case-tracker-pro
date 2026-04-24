import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield, LayoutDashboard, AlertTriangle, MessageSquare, FileText,
  Scale, BookOpen, Network, ClipboardList, BarChart2, Bell,
  CheckSquare, FileSearch, ChevronDown, ChevronRight, X, Menu,
  Gavel, Map, Activity, Clock, Users, Settings, TrendingUp,
  Layers, Search, FileBarChart, ShieldCheck, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/event-timeline', icon: Clock, label: 'Interactive Timeline' },
      { path: '/timeline', icon: Clock, label: 'Event Timeline' },
      { path: '/network-map', icon: Network, label: 'Network Map' },
    ],
  },
  {
    label: 'Case Evidence',
    items: [
      { path: '/incidents', icon: AlertTriangle, label: 'Incidents' },
      { path: '/breach-discovery', icon: Sparkles, label: 'Breach Discovery' },
      { path: '/communications', icon: MessageSquare, label: 'Communications' },
      { path: '/evidence', icon: FileText, label: 'Evidence' },
      { path: '/scanner', icon: FileSearch, label: 'Evidence Scanner' },
      { path: '/evidence-validator', icon: CheckSquare, label: 'Evidence Validator' },
      { path: '/batch-export', icon: Layers, label: 'Batch Export' },
    ],
  },
  {
    label: 'RICS Compliance',
    items: [
      { path: '/rics-rules', icon: BookOpen, label: 'Rules Library' },
      { path: '/rics-compliance', icon: ShieldCheck, label: 'Compliance Dashboard' },
      { path: '/rics-risk', icon: TrendingUp, label: 'Risk Module' },
      { path: '/assessment', icon: ClipboardList, label: 'RICS Assessment' },
      { path: '/compliance-checklist', icon: CheckSquare, label: 'Compliance Checklist' },
    ],
  },
  {
    label: 'Legal Tools',
    items: [
      { path: '/legal-analysis', icon: Scale, label: 'Legal Analysis' },
      { path: '/case-narrative', icon: FileText, label: 'Case Narrative' },
      { path: '/case-narrative-builder', icon: Layers, label: 'Narrative Builder' },
      { path: '/solicitor-brief', icon: Gavel, label: 'Solicitor Brief' },
      { path: '/action-bundle', icon: FileBarChart, label: 'Legal Action Bundle' },
      { path: '/disclosure-bundle', icon: FileBarChart, label: 'Disclosure Bundle' },
      { path: '/next-steps', icon: ChevronRight, label: 'Legal Next Steps' },
      { path: '/rics-breach-notification', icon: Bell, label: 'Breach Notification' },
      { path: '/rics-documents', icon: FileText, label: 'RICS Documents' },
    ],
  },
  {
    label: 'Case Management',
    items: [
      { path: '/case-manager', icon: Layers, label: 'Case Manager' },
      { path: '/case-overview', icon: LayoutDashboard, label: 'Case Overview' },
      { path: '/case-risk-dashboard', icon: TrendingUp, label: 'Risk Dashboard' },
      { path: '/incident-tasks', icon: ClipboardList, label: 'Task Manager' },
      { path: '/incident-reporter', icon: AlertTriangle, label: 'Incident Reporter' },
      { path: '/communication-mapper', icon: Map, label: 'Comm. Mapper' },
    ],
  },
  {
    label: 'Analytics & Reporting',
    items: [
      { path: '/executive-dashboard', icon: TrendingUp, label: 'Executive Dashboard' },
      { path: '/analytics', icon: BarChart2, label: 'Analytics' },
      { path: '/practice-analytics', icon: Activity, label: 'Practice Analytics' },
      { path: '/fee-earner-analytics', icon: Users, label: 'Fee Earner Analytics' },
      { path: '/risk-dashboard', icon: TrendingUp, label: 'Risk Dashboard' },
      { path: '/compliance-reports', icon: FileBarChart, label: 'Compliance Reports' },
      { path: '/audit-log', icon: Search, label: 'Audit Log' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/compliance-alerts', icon: Bell, label: 'Compliance Alerts' },
      { path: '/entity-database', icon: Users, label: 'Entity Database' },
      { path: '/permissions', icon: Settings, label: 'Permissions' },
      { path: '/onboarding', icon: CheckSquare, label: 'Setup & Onboarding' },
    ],
  },
];

function NavGroup({ group, collapsed, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();
  const hasActive = group.items.some(i => i.path === location.pathname);

  if (collapsed) {
    return (
      <div className="py-1">
        {group.items.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              className={cn(
                'flex items-center justify-center w-9 h-9 mx-auto rounded-lg mb-0.5 transition-colors',
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="w-4 h-4" />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
      >
        {group.label}
        {open
          ? <ChevronDown className="w-3 h-3" />
          : <ChevronRight className="w-3 h-3" />
        }
      </button>
      {open && (
        <div className="space-y-0.5">
          {group.items.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppSidebar({ collapsed, onToggle }) {
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-200',
          collapsed ? 'w-14' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-14 border-b border-slate-200 shrink-0', collapsed ? 'justify-center px-0' : 'px-4 gap-3')}>
          <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm leading-tight">RICS Monitor</p>
              <p className="text-xs text-slate-400 truncate">Compliance Command</p>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 shrink-0"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0">
          {NAV_GROUPS.map((group, i) => (
            <NavGroup
              key={group.label}
              group={group}
              collapsed={collapsed}
              defaultOpen={i < 2}
            />
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-slate-200 p-3">
            <Link
              to="/pricing"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Upgrade Plan</span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}