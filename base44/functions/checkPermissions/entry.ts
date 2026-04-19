import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Role-based permission definitions
const PERMISSIONS = {
  incidents: {
    view_all: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    view_sensitive: ['Lead Investigator', 'Legal Counsel', 'admin'],
    create: ['Lead Investigator', 'Legal Counsel', 'admin'],
    edit: ['Lead Investigator', 'Legal Counsel', 'admin'],
    delete: ['Lead Investigator', 'admin'],
    export: ['Lead Investigator', 'Legal Counsel', 'admin'],
  },
  evidence: {
    view_all: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    view_sensitive: ['Lead Investigator', 'Legal Counsel', 'admin'],
    upload: ['Lead Investigator', 'Legal Counsel', 'admin'],
    delete: ['Lead Investigator', 'admin'],
    validate: ['Legal Counsel', 'admin'],
  },
  communications: {
    view_all: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    view_sensitive: ['Lead Investigator', 'Legal Counsel', 'admin'],
    create: ['Lead Investigator', 'Legal Counsel', 'admin'],
    edit: ['Lead Investigator', 'Legal Counsel', 'admin'],
    delete: ['Lead Investigator', 'admin'],
  },
  case_manager: {
    view_all: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    view_sensitive: ['Lead Investigator', 'Legal Counsel', 'admin'],
  },
};

function hasPermission(userRole, resource, action) {
  if (!userRole || !resource || !action) return false;
  const resourcePerms = PERMISSIONS[resource];
  if (!resourcePerms) return false;
  const allowedRoles = resourcePerms[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Backend permission check function
 * Validates that user has required permission before accessing resources
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resource, action } = await req.json();

    if (!resource || !action) {
      return Response.json(
        { error: 'Missing resource or action' },
        { status: 400 }
      );
    }

    const hasAccess = hasPermission(user.role, resource, action);

    // Log permission check
    await base44.asServiceRole.entities.AuditLog.create({
      event_type: 'permission_check',
      action: `Permission check: ${resource}.${action}`,
      triggered_by: user.email,
      status: hasAccess ? 'success' : 'failure',
      error_message: hasAccess ? null : `Access denied to ${resource}.${action}`,
    });

    return Response.json({
      hasAccess,
      userRole: user.role,
      resource,
      action,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});