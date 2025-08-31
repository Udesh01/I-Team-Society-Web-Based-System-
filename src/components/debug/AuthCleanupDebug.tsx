import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthCleanup, resetAuth, clearUserCache } from '@/utils/authCleanup';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';

export const AuthCleanupDebug: React.FC = () => {
  const { user, role, signOut } = useAuth();
  const queryClient = useQueryClient();

  const handleTestFullCleanup = async () => {
    try {
      toast.info('Testing full auth cleanup...');
      await resetAuth();
      toast.success('Full cleanup completed successfully!');
    } catch (error) {
      console.error('Full cleanup test failed:', error);
      toast.error('Full cleanup test failed!');
    }
  };

  const handleTestCacheCleanup = async () => {
    try {
      toast.info('Testing cache cleanup...');
      await clearUserCache();
      toast.success('Cache cleanup completed successfully!');
    } catch (error) {
      console.error('Cache cleanup test failed:', error);
      toast.error('Cache cleanup test failed!');
    }
  };

  const handleEmergencyReset = () => {
    try {
      toast.info('Initiating emergency reset...');
      AuthCleanup.emergencyReset();
    } catch (error) {
      console.error('Emergency reset failed:', error);
      toast.error('Emergency reset failed!');
    }
  };

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    return {
      totalQueries: cache.getAll().length,
      queryKeys: cache.getAll().map(query => JSON.stringify(query.queryKey))
    };
  };

  const cacheStats = getCacheStats();

  return (
    <div className="fixed top-4 left-4 z-50 w-96">
      <Card className="bg-blue-50 border-blue-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-800 flex items-center justify-between">
            🧹 Auth Cleanup Debug
            <Badge variant={user ? "default" : "secondary"}>
              {user ? "Authenticated" : "Unauthenticated"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-3">
          {/* User Info */}
          <div className="space-y-1">
            <div><strong>User ID:</strong> {user?.id || 'None'}</div>
            <div><strong>Email:</strong> {user?.email || 'None'}</div>
            <div><strong>Role:</strong> {role || 'None'}</div>
          </div>

          {/* Cache Stats */}
          <div className="border-t pt-2">
            <div><strong>Query Cache:</strong></div>
            <div className="ml-2 text-xs">
              <div>Total Queries: {cacheStats.totalQueries}</div>
              {cacheStats.totalQueries > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-blue-600">View Query Keys</summary>
                  <div className="mt-1 max-h-20 overflow-y-auto bg-gray-100 p-1 rounded text-xs">
                    {cacheStats.queryKeys.map((key, index) => (
                      <div key={index}>{key}</div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-2 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestCacheCleanup}
              className="w-full text-xs"
              disabled={!user}
            >
              🧹 Test Cache Cleanup
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestFullCleanup}
              className="w-full text-xs bg-yellow-100 hover:bg-yellow-200"
              disabled={!user}
            >
              🔄 Test Full Cleanup
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="w-full text-xs bg-orange-100 hover:bg-orange-200"
              disabled={!user}
            >
              🚪 Normal Sign Out
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmergencyReset}
              className="w-full text-xs"
            >
              🚨 Emergency Reset
            </Button>
          </div>

          {/* Instructions */}
          <div className="border-t pt-2 text-xs text-gray-600">
            <div><strong>Usage:</strong></div>
            <ul className="ml-2 space-y-1 text-xs">
              <li>• <strong>Cache Cleanup:</strong> Clears only query cache</li>
              <li>• <strong>Full Cleanup:</strong> Signs out + clears all cache</li>
              <li>• <strong>Normal Sign Out:</strong> Uses enhanced signOut</li>
              <li>• <strong>Emergency:</strong> Force page reload</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCleanupDebug;
