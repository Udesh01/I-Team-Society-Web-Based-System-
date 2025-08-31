import { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive auth state cleanup utility
 * Clears all cached authentication data including:
 * - Supabase auth session
 * - React Query cache
 * - Any localStorage/sessionStorage auth data
 */
export class AuthCleanup {
  private static queryClient: QueryClient | null = null;

  /**
   * Register the QueryClient instance for cache cleanup
   */
  static setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Clear all browser storage auth-related data
   */
  private static clearBrowserStorage() {
    try {
      // Clear any potential auth-related localStorage items
      const authKeys = [
        'supabase.auth.token',
        'sb-auth-token',
        'auth-storage-key',
        'user-session',
        'auth-state'
      ];

      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      console.log('🧹 AuthCleanup: Browser storage cleared');
    } catch (error) {
      console.warn('⚠️ AuthCleanup: Error clearing browser storage:', error);
    }
  }

  /**
   * Clear React Query cache
   */
  private static clearQueryCache() {
    try {
      if (this.queryClient) {
        // Clear all cached queries
        this.queryClient.clear();
        
        // Alternatively, you could be more selective and only clear auth-related queries:
        // this.queryClient.removeQueries({ queryKey: ['user'] });
        // this.queryClient.removeQueries({ queryKey: ['profile'] });
        // this.queryClient.removeQueries({ queryKey: ['events'] });
        // this.queryClient.removeQueries({ queryKey: ['memberships'] });
        
        console.log('🧹 AuthCleanup: Query cache cleared');
      }
    } catch (error) {
      console.warn('⚠️ AuthCleanup: Error clearing query cache:', error);
    }
  }

  /**
   * Reset auth state - comprehensive cleanup function
   * This function should be called whenever user signs out or session expires
   */
  static async resetAuth(): Promise<void> {
    try {
      console.log('🔄 AuthCleanup: Starting comprehensive auth cleanup...');

      // 1. Sign out from Supabase (this clears the session)
      await supabase.auth.signOut();
      console.log('✅ AuthCleanup: Supabase auth session cleared');

      // 2. Clear React Query cache
      this.clearQueryCache();

      // 3. Clear browser storage
      this.clearBrowserStorage();

      // 4. Force garbage collection if available (for better memory cleanup)
      if (window.gc) {
        window.gc();
      }

      console.log('✅ AuthCleanup: Complete auth cleanup finished');
    } catch (error) {
      console.error('❌ AuthCleanup: Error during auth cleanup:', error);
      throw error;
    }
  }

  /**
   * Partial cleanup for specific scenarios (e.g., role changes)
   */
  static async clearUserCache(): Promise<void> {
    try {
      console.log('🔄 AuthCleanup: Clearing user-specific cache...');
      
      if (this.queryClient) {
        // Clear specific user-related queries
        this.queryClient.removeQueries({ queryKey: ['user'] });
        this.queryClient.removeQueries({ queryKey: ['profile'] });
        this.queryClient.removeQueries({ queryKey: ['events'] });
        this.queryClient.removeQueries({ queryKey: ['memberships'] });
        this.queryClient.removeQueries({ queryKey: ['notifications'] });
        this.queryClient.removeQueries({ queryKey: ['achievements'] });
      }

      console.log('✅ AuthCleanup: User cache cleared');
    } catch (error) {
      console.warn('⚠️ AuthCleanup: Error clearing user cache:', error);
    }
  }

  /**
   * Emergency cleanup - use when normal cleanup fails
   */
  static emergencyReset(): void {
    try {
      console.log('🚨 AuthCleanup: Emergency auth reset initiated...');

      // Force reload the page to clear all in-memory state
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ AuthCleanup: Emergency reset failed:', error);
    }
  }
}

/**
 * Convenience function for quick auth reset
 */
export const resetAuth = AuthCleanup.resetAuth.bind(AuthCleanup);

/**
 * Convenience function for clearing user cache
 */
export const clearUserCache = AuthCleanup.clearUserCache.bind(AuthCleanup);
