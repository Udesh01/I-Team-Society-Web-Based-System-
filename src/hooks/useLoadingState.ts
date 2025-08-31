import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

/**
 * Hook that provides comprehensive loading state management with derived booleans
 * Ensures proper loading/empty state handling across components
 */
export const useLoadingState = ({
  isLoading = false,
  error = null,
  data = null,
  requiresAuth = true
}: {
  isLoading?: boolean;
  error?: string | null;
  data?: any;
  requiresAuth?: boolean;
}) => {
  const { user, loading: authLoading } = useAuth();

  // Derived booleans for better readability and consistency
  const hasUser = !!user?.id;
  const isAuthenticating = authLoading;
  const isDataLoading = isLoading;
  const hasError = !!error;
  const hasData = data !== null && data !== undefined;
  
  // Determine overall loading state
  const shouldShowLoading = useMemo(() => {
    if (requiresAuth) {
      // If authentication is required, show loading if:
      // - Still authenticating, OR
      // - Has user and data is loading
      return isAuthenticating || (hasUser && isDataLoading);
    } else {
      // If no authentication required, just check data loading
      return isDataLoading;
    }
  }, [requiresAuth, isAuthenticating, hasUser, isDataLoading]);

  // Determine if we should show empty state
  const shouldShowEmpty = useMemo(() => {
    if (requiresAuth && !hasUser && !isAuthenticating) {
      return true; // User not authenticated
    }
    return false;
  }, [requiresAuth, hasUser, isAuthenticating]);

  // Determine if we should show error state
  const shouldShowError = useMemo(() => {
    return hasError && !shouldShowLoading;
  }, [hasError, shouldShowLoading]);

  // Determine if we should show data
  const shouldShowData = useMemo(() => {
    if (requiresAuth) {
      return hasUser && !isDataLoading && !hasError && hasData;
    } else {
      return !isDataLoading && !hasError && hasData;
    }
  }, [requiresAuth, hasUser, isDataLoading, hasError, hasData]);

  // Determine if we should show no data state (different from empty)
  const shouldShowNoData = useMemo(() => {
    if (requiresAuth) {
      return hasUser && !isDataLoading && !hasError && !hasData;
    } else {
      return !isDataLoading && !hasError && !hasData;
    }
  }, [requiresAuth, hasUser, isDataLoading, hasError, hasData]);

  return {
    // Derived state booleans
    hasUser,
    isAuthenticating,
    isDataLoading,
    hasError,
    hasData,
    
    // Rendering decision booleans
    shouldShowLoading,
    shouldShowEmpty,
    shouldShowError,
    shouldShowData,
    shouldShowNoData,
    
    // Original values for direct access
    user,
    error,
    data
  };
};

export default useLoadingState;
