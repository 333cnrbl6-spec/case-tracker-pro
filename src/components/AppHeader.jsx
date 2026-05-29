import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import GlobalSearch from '@/components/GlobalSearch';
import { Shield, ChevronRight } from 'lucide-react';

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/incidents': 'Incidents',
  '/evidence': 'Evidence',
  '/communications': 'Communications',
  '/rics-rules': 'RICS Rules Library',
  '/rics-risk': 'RICS Risk Assessment',
  '/rics-compliance': 'RICS Compliance Dashboard',
  '/assessment': 'RICS Assessment',
  '/compliance-checklist': 'Compliance Checklist',
  '/compliance-advisor': 'Compliance Advisor',
  '/rics-breach-notification': 'Breach Notification',
  '/rics-documents': 'RICS Documents',
  '/timeline': 'Event Timeline',
  '/event-timeline': 'Interactive Timeline',
  '/network-map': 'Network Map',
  '/case-manager': 'Case Manager',
  '/case-overview': 'Case Overview',
  '/case-risk-dashboard': 'Case Risk Dashboard',
  '/case-narrative-builder': 'Narrative Builder',
  '/case-narrative': 'Case Narrative',
  '/case-tracker-pro': 'Case Tracker Pro',
  '/audit-log': 'Audit Log',
  '/compliance-dashboard': 'Compliance',
  '/risk-dashboard': 'Risk Dashboard',
  '/compliance-reports': 'Compliance Reports',
  '/compliance-audit': 'Compliance Audit',
  '/compliance-alerts': 'Compliance Alerts',
  '/legal-analysis': 'Legal Analysis',
  '/solicitor-brief': 'Solicitor Brief',
  '/action-bundle': 'Legal Action Bundle',
  '/disclosure-bundle': 'Disclosure Bundle',
  '/next-steps': 'Legal Next Steps',
  '/breach-discovery': 'Breach Discovery',
  '/scanner': 'Evidence Scanner',
  '/evidence-validator': 'Evidence Validator',
  '/batch-export': 'Batch Export',
  '/analytics': 'Analytics',
  '/executive-dashboard': 'Executive Dashboard',
  '/practice-analytics': 'Practice Analytics',
  '/fee-earner-analytics': 'Fee Earner Analytics',
  '/incident-tasks': 'Task Manager',
  '/incident-reporter': 'Incident Reporter',
  '/communication-mapper': 'Communication Mapper',
  '/entity-database': 'Entity Database',
  '/cost-schedules': 'Cost Schedules',
  '/financial-loss': 'Financial Loss Summary',
  '/milestone-timeline': 'Milestone Timeline',
  '/document-templates': 'Document Templates',
  '/document-bundle-compiler': 'Bundle Compiler',
  '/client-portal-manager': 'Client Portal',
  '/permissions': 'Permissions',
  '/settings': 'Firm Settings',
  '/onboarding': 'Setup & Onboarding',
  '/pricing': 'Pricing',
  '/help': 'Help & Docs',
};

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
  other: 'Specialist',
};

function getBrandLabel(areas) {
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

export default function AppHeader() {
  const location = useLocation();
  const [practiceAreas, setPracticeAreas] = useState([]);
  const label = ROUTE_LABELS[location.pathname];

  useEffect(() => {
    base44.entities.PracticeProfile.list().then(profiles => {
      if (profiles?.[0]?.practice_areas) {
        setPracticeAreas(profiles[0].practice_areas);
      }
    }).catch(() => {});
  }, []);

  const brandLabel = getBrandLabel(practiceAreas);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 h-14 flex items-center px-6 gap-4">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="font-semibold text-slate-900 text-sm">{brandLabel}</span>
          {practiceAreas.length > 0 && (
            <span className="text-xs text-slate-400 leading-none">
              {practiceAreas.slice(0, 3).map(a => AREA_LABELS[a] || a).join(' · ')}
            </span>
          )}
        </div>
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