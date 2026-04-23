import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import GlobalSearch from './GlobalSearch';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Main content area — offset by sidebar width */}
      <div className={cn('flex-1 flex flex-col min-w-0 transition-all duration-200', collapsed ? 'ml-14' : 'ml-60')}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 h-14 flex items-center px-4 gap-4 shrink-0">
          {/* Mobile hamburger (lg and below the sidebar collapses differently) */}
          <button
            className="lg:hidden p-1 rounded hover:bg-slate-100 text-slate-500"
            onClick={() => setCollapsed(c => !c)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex justify-center">
            <GlobalSearch />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}