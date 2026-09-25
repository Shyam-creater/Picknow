import { useMemo, useCallback } from 'react';
import { PERMISSIONS, ACTIONS } from '../constants/permissions';

const usePermissions = () => {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch (error) {
      console.error('Error parsing currentUser from localStorage:', error);
      return null;
    }
  }, []);

  const hasPermission = useCallback((module, action) => {
    if (!currentUser) return false;
    
    // Super admin has all permissions
    if (currentUser.role === 'super_admin') return true;
    
    // Check if user has specific permission
    return Array.isArray(currentUser.permissions?.[module]) && 
           currentUser.permissions[module].includes(action);
  }, [currentUser]);

  const canRead = useCallback((module) => hasPermission(module, ACTIONS.READ), [hasPermission]);
  const canWrite = useCallback((module) => hasPermission(module, ACTIONS.WRITE), [hasPermission]);
  const canDelete = useCallback((module) => hasPermission(module, ACTIONS.DELETE), [hasPermission]);

  const isSuperAdmin = useMemo(() => currentUser?.role === 'super_admin', [currentUser?.role]);

  return {
    hasPermission,
    canRead,
    canWrite,
    canDelete,
    isSuperAdmin,
    currentUser
  };
};

export default usePermissions; 