// Role-based permission definitions
const PERMISSIONS = {
  // Incident permissions
  incidents: {
    view_all: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    view_sensitive: ['Lead Investigator', 'Legal Counsel', 'admin'],
    create: ['Lead Investigator', 'Legal Counsel', 'admin'],
    edit: ['Lead Investigator', 'Legal Counsel', 'admin'],
    delete: ['Lead Investigator', 'admin'],
    export: ['Lead Investigator', 'Legal Counsel', 'admin'],
  },

  // Evidence permissions
  evidence: {
    view_all: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    view_sensitive: ['Lead Investigator', 'Legal Counsel', 'admin'],
    upload: ['Lead Investigator', 'Legal Counsel', 'admin'],
    delete: ['Lead Investigator', 'admin'],
    validate: ['Legal Counsel', 'admin'],
  },

  // Communications permissions
  communications: {
    view_all: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    view_sensitive: ['Lead Investigator', 'Legal Counsel', 'admin'],
    create: ['Lead Investigator', 'Legal Counsel', 'admin'],
    edit: ['Lead Investigator', 'Legal Counsel', 'admin'],
    delete: ['Lead Investigator', 'admin'],
  },

  // Task permissions
  tasks: {
    view_all: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    create: ['Lead Investigator', 'Legal Counsel', 'admin'],
    edit_own: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    edit_all: ['Lead Investigator', 'admin'],
    assign: ['Lead Investigator', 'admin'],
    delete: ['Lead Investigator', 'admin'],
  },

  // RICS assessment permissions
  rics_assessment: {
    view: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    create: ['Lead Investigator', 'Legal Counsel', 'admin'],
    edit: ['Lead Investigator', 'Legal Counsel', 'admin'],
    publish: ['Legal Counsel', 'admin'],
  },

  // Legal analysis permissions
  legal_analysis: {
    view: ['Legal Counsel', 'Lead Investigator', 'admin'],
    create: ['Legal Counsel', 'admin'],
    edit: ['Legal Counsel', 'admin'],
    publish: ['Legal Counsel', 'admin'],
  },

  // Case management permissions
  case_manager: {
    view_all: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    view_sensitive: ['Lead Investigator', 'Legal Counsel', 'admin'],
    create: ['Legal Counsel', 'admin'],
    edit: ['Legal Counsel', 'admin'],
    delete: ['admin'],
  },

  // Compliance & reports permissions
  compliance: {
    view_dashboard: ['Lead Investigator', 'Legal Counsel', 'General Auditor', 'admin'],
    view_sensitive_metrics: ['Lead Investigator', 'Legal Counsel', 'admin'],
    generate_reports: ['Legal Counsel', 'Lead Investigator', 'admin'],
    export_data: ['Lead Investigator', 'Legal Counsel', 'admin'],
  },

  // Admin permissions
  admin: {
    manage_users: ['admin'],
    view_audit_logs: ['admin'],
    system_settings: ['admin'],
  },
};

/**
 * Check if a user has a specific permission
 * @param {string} userRole - The user's role
 * @param {string} resource - The resource type (e.g., 'incidents', 'evidence')
 * @param {string} action - The action (e.g., 'view', 'edit', 'delete')
 * @returns {boolean} True if user has permission
 */
export function hasPermission(userRole, resource, action) {
  if (!userRole || !resource || !action) return false;
  
  const resourcePerms = PERMISSIONS[resource];
  if (!resourcePerms) return false;
  
  const allowedRoles = resourcePerms[action];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(userRole);
}

/**
 * Filter data based on user role
 * @param {array} data - The data to filter
 * @param {string} userRole - The user's role
 * @param {string} resource - The resource type
 * @returns {array} Filtered data
 */
export function filterSensitiveData(data, userRole, resource) {
  if (!Array.isArray(data)) return data;
  
  // Check if user can view sensitive data
  const canViewSensitive = hasPermission(userRole, resource, 'view_sensitive');
  
  if (canViewSensitive) {
    return data;
  }
  
  // Remove sensitive fields based on resource type
  return data.map(item => {
    const filtered = { ...item };
    
    switch (resource) {
      case 'incidents':
        delete filtered.legal_issues;
        delete filtered.settlement_details;
        break;
      case 'evidence':
        delete filtered.legal_privilege;
        delete filtered.confidential_notes;
        break;
      case 'communications':
        delete filtered.privileged_content;
        break;
      case 'case_manager':
        delete filtered.estimated_value;
        delete filtered.settlement_authority_obtained;
        break;
      default:
        break;
    }
    
    return filtered;
  });
}

/**
 * Get accessible resources for a user
 * @param {string} userRole - The user's role
 * @returns {object} Map of accessible resources and actions
 */
export function getAccessibleResources(userRole) {
  const accessible = {};
  
  Object.entries(PERMISSIONS).forEach(([resource, actions]) => {
    accessible[resource] = Object.entries(actions)
      .filter(([, roles]) => roles.includes(userRole))
      .map(([action]) => action);
  });
  
  return accessible;
}

/**
 * Check if user can edit/delete a specific item
 * @param {string} userRole - The user's role
 * @param {string} resource - The resource type
 * @param {string} createdBy - Email of who created the item
 * @param {string} userEmail - Current user's email
 * @returns {boolean} True if user can modify
 */
export function canModifyItem(userRole, resource, createdBy, userEmail) {
  // Admin can always modify
  if (userRole === 'admin') return true;
  
  // Check general edit permission
  if (hasPermission(userRole, resource, 'edit')) {
    return true;
  }
  
  // Check edit_own permission
  if (hasPermission(userRole, resource, 'edit_own') && createdBy === userEmail) {
    return true;
  }
  
  return false;
}

export default PERMISSIONS;