import React, { createContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const PermissionContext = createContext();

export function PermissionProvider({ children }) {
  const [permissions, setPermissions] = useState({
    role: 'user',
    tier: 'free',
    modules: [],
    canAccessSales: false,
    canAccessMarketing: false,
    canAccessAdmin: false,
    canManageTeam: false,
    canAccessReporting: false,
    email: null,
    loading: true
  });

  // CONFIGURE THIS FOR YOUR APP
  const DEVELOPER_EMAIL = 'developer@casenarrative.io';

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        setPermissions(prev => ({ ...prev, loading: false }));
        return;
      }

      const isDeveloper = user.email === DEVELOPER_EMAIL;
      const roleFromUser = user.role || 'user';
      const actualRole = isDeveloper ? 'developer' : roleFromUser;
      const tier = user.subscription_tier || 'free';

      // CUSTOMIZE MODULES BY TIER FOR CASENARRATIVE
      const baseModules = {
        'free': ['dashboard', 'cases', 'incidents', 'evidence'],
        'starter': ['dashboard', 'cases', 'incidents', 'evidence', 'communications', 'analytics'],
        'professional': ['dashboard', 'cases', 'incidents', 'evidence', 'communications', 'analytics', 'rics_compliance', 'narrative_generation', 'reporting'],
        'premium': ['dashboard', 'cases', 'incidents', 'evidence', 'communications', 'analytics', 'rics_compliance', 'narrative_generation', 'reporting', 'network_analysis', 'settlement_insights'],
        'enterprise': ['dashboard', 'cases', 'incidents', 'evidence', 'communications', 'analytics', 'rics_compliance', 'narrative_generation', 'reporting', 'network_analysis', 'settlement_insights', 'api_access', 'whitelabel', 'sso']
      };

      const modules = baseModules[tier] || baseModules.free;

      setPermissions({
        role: actualRole,
        tier,
        modules,
        canAccessSales: isDeveloper || actualRole === 'admin',
        canAccessMarketing: isDeveloper || actualRole === 'admin',
        canAccessAdmin: isDeveloper || actualRole === 'admin',
        canManageTeam: actualRole === 'admin' || actualRole === 'developer',
        canAccessReporting: modules.includes('reporting') || actualRole === 'admin',
        email: user.email,
        loading: false
      });
    } catch (err) {
      console.error('Failed to load permissions:', err);
      setPermissions(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <PermissionContext.Provider value={{ ...permissions, reloadPermissions: loadPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const ctx = React.useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionProvider');
  return ctx;
}