import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Settings, LogOut, User, Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SaaSAdminHeader() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
      <div className="px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RM</span>
          </div>
          <span className="font-bold hidden sm:inline">RICS Monitor</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search cases, incidents..."
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="rounded-full"
            >
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                  <p className="font-semibold text-sm">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <div className="p-2 space-y-1">
                  <Link to="/settings">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                      <Settings className="w-4 h-4" /> Settings
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm text-red-600 hover:text-red-700"
                    onClick={() => logout(true)}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}