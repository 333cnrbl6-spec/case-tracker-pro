import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, FileText, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_ROUTES = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: AlertTriangle, label: 'Incidents', path: '/incidents' },
  { icon: FileText, label: 'Evidence', path: '/evidence' },
  { icon: BarChart2, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function MobileNavBar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 md:hidden">
      <div className="flex items-center justify-around h-16">
        {MOBILE_ROUTES.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}