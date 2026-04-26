import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import GlobalSearch from './GlobalSearch';
import SaaSAdminHeader from './SaaSAdminHeader';
import MobileNavBar from './MobileNavBar';
import ErrorBoundary from './ErrorBoundary';
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
          </header>
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
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
        <MobileNavBar />
      </div>
    </>
  );
}