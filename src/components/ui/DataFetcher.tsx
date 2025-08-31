import React, { useEffect, useState } from 'react';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/LoadingSkeleton';
import { useLoadingState } from '@/hooks/useLoadingState';

interface DataFetcherProps {
  children: React.ReactNode;
  loading: boolean;
  error?: string | null;
  data?: any;
  requiresAuth?: boolean;
  timeout?: number; // Custom timeout in milliseconds
  loadingMessage?: string;
  emptyStateConfig?: {
    title?: string;
    description?: string;
    variant?: 'no-auth' | 'no-data' | 'no-results';
  };
  errorStateConfig?: {
    title?: string;
    description?: string;
  };
  onRetry?: () => void;
}

/**
 * DataFetcher is a wrapper component that handles loading, error, and empty states
 * with automatic timeout handling to prevent infinite spinners
 */
export const DataFetcher: React.FC<DataFetcherProps> = ({
  children,
  loading,
  error,
  data,
  requiresAuth = true,
  timeout = 15000, // 15 seconds default
  loadingMessage = 'Loading...',
  emptyStateConfig,
  errorStateConfig,
  onRetry
}) => {
  const [timeoutReached, setTimeoutReached] = useState(false);

  const loadingState = useLoadingState({
    isLoading: loading && !timeoutReached,
    error: timeoutReached ? 'Loading timeout reached' : error,
    data,
    requiresAuth
  });

  // Set up timeout to prevent infinite loading
  useEffect(() => {
    if (!loading) {
      setTimeoutReached(false);
      return;
    }

    const timer = setTimeout(() => {
      console.warn('⚠️ DataFetcher: Loading timeout reached after', timeout, 'ms');
      setTimeoutReached(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [loading, timeout]);

  // Reset timeout when loading changes to false
  useEffect(() => {
    if (!loading) {
      setTimeoutReached(false);
    }
  }, [loading]);

  if (loadingState.shouldShowLoading) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  if (loadingState.shouldShowEmpty) {
    return (
      <EmptyState
        variant={emptyStateConfig?.variant || 'no-auth'}
        title={emptyStateConfig?.title}
        description={emptyStateConfig?.description}
        action={{
          label: 'Go to Login',
          onClick: () => window.location.href = '/login'
        }}
      />
    );
  }

  if (loadingState.shouldShowError || timeoutReached) {
    const isTimeout = timeoutReached;
    return (
      <ErrorState
        title={isTimeout ? 'Loading Timeout' : (errorStateConfig?.title || 'Error Loading Data')}
        description={
          isTimeout 
            ? 'The data is taking too long to load. Please try refreshing the page.'
            : (errorStateConfig?.description || 'There was an error loading the requested data')
        }
        error={isTimeout ? 'Request timeout after ' + (timeout / 1000) + ' seconds' : error}
        onRetry={onRetry || (() => window.location.reload())}
      />
    );
  }

  if (loadingState.shouldShowNoData) {
    return (
      <EmptyState
        title="No Data Available"
        description="There is no data to display at the moment"
        variant="no-data"
      />
    );
  }

  return <>{children}</>;
};

export default DataFetcher;
