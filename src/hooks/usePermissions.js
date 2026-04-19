import { useCallback } from 'react';
import { hasPermission, getAccessibleResources, canModifyItem, filterSensitiveData } from '@/lib/permissions';

/**
 * Custom hook for permission management
 * Provides utilities for checking permissions and filtering data
 */
export function usePermissions(userRole) {
  const check = useCallback((resource, action) => {
    return hasPermission(userRole, resource, action);
  }, [userRole]);

  const checkModify = useCallback((resource, createdBy, userEmail) => {
    return canModifyItem(userRole, resource, createdBy, userEmail);
  }, [userRole]);

  const filterData = useCallback((data, resource) => {
    return filterSensitiveData(data, userRole, resource);
  }, [userRole]);

  const getAccessible = useCallback(() => {
    return getAccessibleResources(userRole);
  }, [userRole]);

  return {
    check,
    checkModify,
    filterData,
    getAccessible,
    userRole,
  };
}

export default usePermissions;