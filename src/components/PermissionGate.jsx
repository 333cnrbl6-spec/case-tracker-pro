import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';

/**
 * Permission Gate Component
 * Conditionally renders content based on user role and required permission
 */
export default function PermissionGate({
  userRole,
  resource,
  action,
  children,
  fallback = null,
  showAlert = true,
}) {
  const hasAccess = hasPermission(userRole, resource, action);

  if (hasAccess) {
    return children;
  }

  if (!showAlert) {
    return fallback;
  }

  return fallback || (
    <Alert className="bg-amber-50 border-amber-200">
      <Lock className="w-4 h-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        You don't have permission to access this content. Required role: {action}
      </AlertDescription>
    </Alert>
  );
}