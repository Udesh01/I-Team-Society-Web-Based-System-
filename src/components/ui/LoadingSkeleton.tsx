import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, Users, Calendar, RefreshCw, LogIn, User } from 'lucide-react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'avatar' | 'button' | 'dashboard';
  count?: number;
  height?: string;
  width?: string;
}

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "animate-pulse rounded-md bg-gray-200",
      className
    )}
  />
);

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'text',
  count = 1,
  height = 'h-4',
  width = 'w-full'
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Card className={className}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
        );

      case 'avatar':
        return <Skeleton className={cn("rounded-full h-10 w-10", className)} />;

      case 'button':
        return <Skeleton className={cn("h-10 w-24 rounded-md", className)} />;

      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl p-6">
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Content area skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'text':
      default:
        return Array.from({ length: count }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(height, width, className)}
          />
        ));
    }
  };

  return <>{renderSkeleton()}</>;
};

// Empty State Component
interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'no-auth' | 'no-data' | 'no-results';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
  variant = 'no-data'
}) => {
  const getDefaultContent = () => {
    switch (variant) {
      case 'no-auth':
        return {
          icon: <User className="h-12 w-12 text-muted-foreground" />,
          title: 'Authentication Required',
          description: 'Please log in to access this content'
        };
      case 'no-results':
        return {
          icon: <Calendar className="h-12 w-12 text-muted-foreground" />,
          title: 'No Results Found',
          description: 'Try adjusting your search or filters'
        };
      case 'no-data':
      default:
        return {
          icon: <Users className="h-12 w-12 text-muted-foreground" />,
          title: 'No Data Available',
          description: 'There is no data to display at the moment'
        };
    }
  };

  const defaultContent = getDefaultContent();

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">
          {icon || defaultContent.icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title || defaultContent.title}
        </h3>
        <p className="text-gray-500 mb-6 max-w-md">
          {description || defaultContent.description}
        </p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Error State Component
interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'An error occurred while loading the data',
  error,
  onRetry,
  className
}) => {
  return (
    <Card className={cn('border-red-200 bg-red-50', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          {title}
        </h3>
        <p className="text-red-700 mb-4">
          {description}
        </p>
        {error && (
          <p className="text-sm text-red-600 mb-6 font-mono bg-red-100 p-2 rounded max-w-md">
            {error}
          </p>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Loading Spinner Component
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mb-4',
        sizeClasses[size]
      )} />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSkeleton;
