import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import GlobalSearch from './GlobalSearch';
import SaaSAdminHeader from './SaaSAdminHeader';
import MobileNavBar from './MobileNavBar';
import ErrorBoundary from './ErrorBoundary';
import NavBellAlerts from './NavBellAlerts';
import CriticalLimitationBanner from './CriticalLimitationBanner';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen bg-slate-50">
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

        <div className={cn('flex-1 flex flex-col min-w-0 transition-all duration-200', collapsed ? 'ml-14' : 'ml-60')}>
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 h-14 flex items-center px-4 gap-4 shrink-0">
            <div className="flex-1 flex justify-center">
              <GlobalSearch />
            </div>
            <NavBellAlerts />
          </header>
          <CriticalLimitationBanner />
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <footer className="border-t bg-slate-900 text-slate-300 py-8 px-4 text-xs">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <p>&copy; 2026 CaseNarrative. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white">Terms</a>
                <a href="#" className="hover:text-white">Privacy</a>
                <a href="#" className="hover:text-white">GDPR</a>
                <a href="mailto:support@casenarra.co.uk" className="hover:text-white">support@casenarra.co.uk</a>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col lg:hidden min-h-screen bg-slate-50">
        <SaaSAdminHeader />
        <main className="flex-1 overflow-y-auto pb-16">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <footer className="border-t bg-slate-900 text-slate-300 py-4 px-4 text-xs text-center">
          <p>&copy; 2026 CaseNarrative | <a href="mailto:support@casenarra.co.uk" className="hover:text-white">support@casenarra.co.uk</a></p>
        </footer>
        <MobileNavBar />
      </div>
    </>
  );
}