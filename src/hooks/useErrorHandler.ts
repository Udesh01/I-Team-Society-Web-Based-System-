import { useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

interface ErrorHandlerOptions {
  showToast?: boolean;
  toastMessage?: string;
  logError?: boolean;
  onError?: (error: Error) => void;
}

export const useErrorHandler = () => {
  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      toastMessage,
      logError = true,
      onError
    } = options;

    // Convert unknown error to Error object
    const errorObj = error instanceof Error 
      ? error 
      : new Error(String(error));

    // Log error to console
    if (logError) {
      console.error('Error handled:', errorObj);
    }

    // Show toast notification
    if (showToast) {
      const message = toastMessage || errorObj.message || 'An unexpected error occurred';
      toast.error(message);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(errorObj);
    }

    return errorObj;
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  }, [handleError]);

  const createErrorHandler = useCallback((
    options: ErrorHandlerOptions = {}
  ) => {
    return (error: unknown) => handleError(error, options);
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    createErrorHandler
  };
};

export default useErrorHandler;
