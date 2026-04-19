import React from 'react';
import { hasPermission } from '@/lib/permissions';

/**
 * Conditionally render UI elements based on permission
 * Used for showing/hiding buttons, forms, sections, etc.
 */
export function ConditionalRender({ userRole, resource, action, children }) {
  return hasPermission(userRole, resource, action) ? children : null;
}

/**
 * Show a disabled version of UI if user lacks permission
 */
export function ConditionalElement({
  userRole,
  resource,
  action,
  children,
  disabledFallback = null,
}) {
  const hasAccess = hasPermission(userRole, resource, action);

  if (hasAccess) {
    return children;
  }

  return disabledFallback;
}

/**
 * Disable element with permission check
 */
export function PermissionButton({ userRole, resource, action, children, ...props }) {
  const hasAccess = hasPermission(userRole, resource, action);

  return (
    <button
      {...props}
      disabled={!hasAccess || props.disabled}
      title={!hasAccess ? `Permission denied: ${action}` : props.title}
    >
      {children}
    </button>
  );
}

export default ConditionalRender;