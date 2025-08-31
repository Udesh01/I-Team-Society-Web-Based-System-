import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null
}) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return null;
  }

  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;