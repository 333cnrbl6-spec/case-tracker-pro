import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Shield, LayoutDashboard, AlertTriangle, MessageSquare, FileText,
  Scale, BookOpen, Network, ClipboardList, BarChart2, Bell,
  CheckSquare, FileSearch, ChevronDown, ChevronRight, X, Menu,
  Gavel, Map, Activity, Clock, Users, Settings, TrendingUp,
  Layers, Search, FileBarChart, ShieldCheck, Sparkles, Building2,
  Briefcase, Heart, Globe, Lock, Leaf, Home, Car, Landmark, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// All possible nav groups — tagged by practice area relevance
// groups with `always: true` always show; others show only if the user has a matching practice area
const ALL_NAV_GROUPS = [
  {
    label: 'Overview',
    always: true,
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/event-timeline', icon: Clock, label: 'Interactive Timeline' },
      { path: '/network-map', icon: Network, label: 'Network Map' },
    ],
  },
  {
    label: 'Case Management',
    always: true,
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
    label: 'Case Evidence',
    always: true,
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
    label: 'Legal Tools',
    always: true,
    items: [
      { path: '/legal-analysis', icon: Scale, label: 'Legal Analysis' },
      { path: '/case-narrative-builder', icon: Layers, label: 'Narrative Builder' },
      { path: '/solicitor-brief', icon: Gavel, label: 'Solicitor Brief' },
      { path: '/action-bundle', icon: FileBarChart, label: 'Legal Action Bundle' },
      { path: '/disclosure-bundle', icon: FileBarChart, label: 'Disclosure Bundle' },
      { path: '/next-steps', icon: ChevronRight, label: 'Legal Next Steps' },
    ],
  },
  // — Specialism-specific groups —
  {
    label: 'RICS Compliance',
    areas: ['rics_surveying', 'professional_negligence', 'property_disputes'],
    items: [
      { path: '/rics-rules', icon: BookOpen, label: 'Rules Library' },
      { path: '/rics-compliance', icon: ShieldCheck, label: 'Compliance Dashboard' },
      { path: '/rics-risk', icon: TrendingUp, label: 'Risk Module' },
      { path: '/assessment', icon: ClipboardList, label: 'RICS Assessment' },
      { path: '/compliance-checklist', icon: CheckSquare, label: 'Compliance Checklist' },
      { path: '/rics-breach-notification', icon: Bell, label: 'Breach Notification' },
      { path: '/rics-documents', icon: FileText, label: 'RICS Documents' },
      { path: '/compliance-advisor', icon: ShieldCheck, label: 'Compliance Advisor' },
    ],
  },
  {
    label: 'Professional Negligence',
    areas: ['professional_negligence'],
    items: [
      { path: '/breach-discovery', icon: Sparkles, label: 'Breach Discovery' },
      { path: '/entity-database', icon: Users, label: 'Professional Database' },
      { path: '/cost-schedules', icon: FileBarChart, label: 'Cost Schedules' },
      { path: '/financial-loss', icon: TrendingUp, label: 'Financial Loss Summary' },
    ],
  },
  {
    label: 'Personal Injury',
    areas: ['personal_injury'],
    items: [
      { path: '/financial-loss', icon: TrendingUp, label: 'Financial Loss Summary' },
      { path: '/cost-schedules', icon: FileBarChart, label: 'Cost Schedules' },
      { path: '/milestone-timeline', icon: Clock, label: 'Milestone Timeline' },
    ],
  },
  {
    label: 'Employment Law',
    areas: ['employment_law'],
    items: [
      { path: '/incident-kanban', icon: Layers, label: 'Incident Kanban' },
      { path: '/communications', icon: MessageSquare, label: 'Communications Log' },
      { path: '/timeline', icon: Clock, label: 'Event Timeline' },
    ],
  },
  {
    label: 'Property & Conveyancing',
    areas: ['property_disputes'],
    items: [
      { path: '/network-map', icon: Network, label: 'Party Network Map' },
      { path: '/entity-database', icon: Users, label: 'Entity Database' },
      { path: '/document-templates', icon: FileText, label: 'Document Templates' },
    ],
  },
  {
    label: 'Commercial Litigation',
    areas: ['commercial_litigation'],
    items: [
      { path: '/disclosure-bundle', icon: FileBarChart, label: 'Disclosure Bundle' },
      { path: '/document-bundle-compiler', icon: Layers, label: 'Bundle Compiler' },
      { path: '/cost-schedules', icon: FileBarChart, label: 'Cost Schedules' },
      { path: '/financial-loss', icon: TrendingUp, label: 'Financial Loss' },
    ],
  },
  {
    label: 'Data & Privacy',
    areas: ['data_privacy'],
    items: [
      { path: '/compliance-audit', icon: ShieldCheck, label: 'Compliance Audit' },
      { path: '/compliance-alerts', icon: Bell, label: 'Compliance Alerts' },
      { path: '/audit-log', icon: Search, label: 'Audit Log' },
    ],
  },
  {
    label: 'Criminal Law',
    areas: ['criminal_law'],
    items: [
      { path: '/evidence', icon: FileText, label: 'Evidence' },
      { path: '/timeline', icon: Clock, label: 'Event Timeline' },
      { path: '/witness-portal', icon: Users, label: 'Witness Portal' },
    ],
  },
  {
    label: 'Family Law',
    areas: ['family_law'],
    items: [
      { path: '/document-templates', icon: FileText, label: 'Document Templates' },
      { path: '/client-portal-manager', icon: Users, label: 'Client Portal' },
      { path: '/milestone-timeline', icon: Clock, label: 'Milestone Timeline' },
    ],
  },
  {
    label: 'Analytics & Reporting',
    always: true,
    items: [
      { path: '/executive-dashboard', icon: TrendingUp, label: 'Executive Dashboard' },
      { path: '/analytics', icon: BarChart2, label: 'Analytics' },
      { path: '/practice-analytics', icon: Activity, label: 'Practice Analytics' },
      { path: '/fee-earner-analytics', icon: Users, label: 'Fee Earner Analytics' },
      { path: '/compliance-reports', icon: FileBarChart, label: 'Compliance Reports' },
      { path: '/audit-log', icon: Search, label: 'Audit Log' },
    ],
  },
  {
    label: 'System',
    always: true,
    items: [
      { path: '/permissions', icon: Settings, label: 'Permissions' },
      { path: '/settings', icon: Settings, label: 'Firm Settings' },
      { path: '/onboarding', icon: CheckSquare, label: 'Setup & Onboarding' },
      { path: '/curated-onboarding', icon: Sparkles, label: 'Curated Onboarding' },
    ],
  },
];

// Map practice area IDs to display labels for the header badge
const AREA_LABELS = {
  personal_injury: 'Personal Injury',
  employment_law: 'Employment Law',
  property_disputes: 'Property',
  professional_negligence: 'Prof. Negligence',
  rics_surveying: 'RICS / Surveying',
  commercial_litigation: 'Commercial Lit.',
  criminal_law: 'Criminal',
  family_law: 'Family',
  immigration_law: 'Immigration',
  environmental_law: 'Environmental',
  public_law: 'Public Law',
  data_privacy: 'Data & Privacy',
  insurance: 'Insurance',
  intellectual_property: 'IP',
  other: 'Other',
};

// Primary brand label based on dominant specialism
function getPracticeLabel(areas) {
  if (!areas?.length) return 'CaseNarrative';
  if (areas.includes('rics_surveying') || areas.includes('professional_negligence')) return 'RICS Monitor';
  if (areas.includes('employment_law')) return 'Employment Platform';
  if (areas.includes('commercial_litigation')) return 'Commercial Litigation';
  if (areas.includes('personal_injury')) return 'PI Case Manager';
  if (areas.includes('family_law')) return 'Family Law Suite';
  if (areas.includes('criminal_law')) return 'Criminal Defence';
  if (areas.includes('data_privacy')) return 'Data & Privacy';
  return 'CaseNarrative';
}

function NavGroup({ group, collapsed, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();

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
                  ? 'bg-primary text-white'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
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
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider hover:text-sidebar-foreground/70 transition-colors"
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
                    ? 'bg-primary text-white font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
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
  const [practiceAreas, setPracticeAreas] = useState([]);

  useEffect(() => {
    base44.entities.PracticeProfile.list().then(profiles => {
      if (profiles?.[0]?.practice_areas) {
        setPracticeAreas(profiles[0].practice_areas);
      }
    }).catch(() => {});
  }, []);

  // Filter nav groups: always show 'always' groups; show specialism groups only if user has a matching area
  const visibleGroups = ALL_NAV_GROUPS.filter(g => {
    if (g.always) return true;
    if (!g.areas) return true;
    return g.areas.some(a => practiceAreas.includes(a));
  });

  // Deduplicate items within visible groups by path
  const seenPaths = new Set();
  const deduplicatedGroups = visibleGroups.map(g => ({
    ...g,
    items: g.items.filter(item => {
      if (seenPaths.has(item.path)) return false;
      seenPaths.add(item.path);
      return true;
    })
  })).filter(g => g.items.length > 0);

  const brandLabel = getPracticeLabel(practiceAreas);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200',
          collapsed ? 'w-14' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-14 border-b border-sidebar-border shrink-0', collapsed ? 'justify-center px-0' : 'px-4 gap-3')}>
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sidebar-foreground text-sm leading-tight truncate">{brandLabel}</p>
              <p className="text-xs text-sidebar-foreground/40 truncate">
                {practiceAreas.length > 0
                  ? practiceAreas.slice(0, 2).map(a => AREA_LABELS[a] || a).join(' · ')
                  : 'Legal Platform'}
              </p>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/40 shrink-0"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0">
          {deduplicatedGroups.map((group, i) => (
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
          <div className="border-t border-sidebar-border p-3">
            <Link
              to="/pricing"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/50 hover:bg-sidebar-accent transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Upgrade Plan</span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}