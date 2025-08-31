
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { resetAuth } from "@/utils/authCleanup";
import { RoleManager } from "@/utils/roleManager";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants for session management
const ROLE_CACHE_KEY = 'user_role_cache';
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const roleCache = useRef<Map<string, { role: string | null, timestamp: number }>>(new Map());
  const ongoingRoleFetches = useRef<Map<string, Promise<string | null>>>(new Map());

  // Function to fetch user role using RoleManager with better fallback handling
  const fetchUserRole = useCallback(async (userId: string): Promise<string | null> => {
    try {
      console.log('🔍 AuthContext: Fetching role using RoleManager for user:', userId);
      
      const roleResult = await RoleManager.getUserRole(userId);
      
      console.log('📊 AuthContext: Role result:', {
        role: roleResult.role,
        source: roleResult.source,
        fromCache: roleResult.fromCache
      });
      
      // Store successful database results in localStorage for future fallback
      if (roleResult.source === 'database' && !roleResult.fromCache && roleResult.role) {
        RoleManager.storeRoleInLocalStorage(userId, roleResult.role);
      }
      
      // Log different sources
      switch (roleResult.source) {
        case 'database':
          console.log(roleResult.fromCache ? '📋' : '✅', 
            `AuthContext: Role ${roleResult.fromCache ? 'retrieved from cache' : 'fetched from database'}:`, 
            roleResult.role);
          break;
        case 'localStorage':
          console.log('📱 AuthContext: Role retrieved from localStorage fallback:', roleResult.role);
          break;
        case 'default':
          console.log('🔄 AuthContext: Using default role fallback:', roleResult.role);
          break;
        case 'error':
          console.log('❌ AuthContext: Error occurred, using default role:', roleResult.role);
          break;
      }
      
      return roleResult.role;
      
    } catch (error) {
      console.error('❌ AuthContext: RoleManager error:', error);
      // Return student as ultimate fallback
      return 'student';
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Set up a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ AuthContext: Loading timeout reached, forcing completion');
        setLoading(false);
      }
    }, 8000); // 8 second timeout

    // Function to handle session change
    const handleSession = async (newSession: Session | null) => {
      console.log('🔄 AuthContext: Session changed:', {
        hasUser: !!newSession?.user,
        userId: newSession?.user?.id,
        mounted
      });
      
      if (!mounted) {
        console.log('🔄 AuthContext: Component unmounted, skipping session handling');
        return;
      }
      
      // Clear the timeout since we're handling the session
      clearTimeout(loadingTimeout);
      
      // Always update session first
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        console.log('🔍 AuthContext: Fetching role for user:', newSession.user.id);
        // Fetch role for the user with improved error handling
        try {
          console.log('🔍 AuthContext: Starting role fetch for user:', newSession.user.id);
          
          // Use the improved fetchUserRole function with retries
          const userRole = await fetchUserRole(newSession.user.id);
          
          if (mounted) {
            if (userRole) {
              setRole(userRole);
              console.log('✅ AuthContext: Role set successfully to:', userRole);
            } else {
              console.warn('⚠️ AuthContext: No role found for user, continuing without role');
              console.info('ℹ️ Info: User session state when role not found:', { 
                userId: newSession.user.id,
                userEmail: newSession.user.email,
                sessionValid: !!newSession
              });
              setRole(null);
            }
          }
        } catch (error) {
          console.error('❌ AuthContext: Error fetching role:', error);
          console.debug('🐞 Debug: Error instance and user data:', { error, user: newSession?.user });
          if (mounted) {
            console.warn('⚠️ AuthContext: Continuing without role due to error');
            setRole(null);
          }
        }
      } else {
        if (mounted) {
          setRole(null);
          console.log('🎭 AuthContext: Role cleared (no user)');
        }
      }
      
      if (mounted) {
        setLoading(false);
        console.log('✅ AuthContext: Auth state updated, loading complete');
      }
    };

    // Set up auth state listener
    console.log('🔧 AuthContext: Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔔 AuthContext: Auth state change event:', event, {
          hasUser: !!newSession?.user,
          userId: newSession?.user?.id
        });
        await handleSession(newSession);
      }
    );

    // Check for existing session immediately with timeout protection
    console.log('🔍 AuthContext: Checking for existing session');
    const sessionPromise = supabase.auth.getSession();
    const sessionTimeout = new Promise((resolve) => 
      setTimeout(() => {
        console.warn('⚠️ AuthContext: Session check timeout, proceeding without session');
        resolve({ data: { session: null }, error: null });
      }, 5000)
    );
    
    Promise.race([sessionPromise, sessionTimeout]).then(async (result: any) => {
      const { data: { session: currentSession }, error } = result;
      
      if (error) {
        console.error('❌ AuthContext: Error getting session:', error);
        if (mounted) {
          setLoading(false);
        }
        return;
      }
      
      console.log('🔍 AuthContext: Initial session check:', {
        hasSession: !!currentSession,
        hasUser: !!currentSession?.user,
        userId: currentSession?.user?.id
      });
      await handleSession(currentSession);
    });

    return () => {
      console.log('🧹 AuthContext: Cleaning up auth listener');
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 AuthContext: Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ AuthContext: Error refreshing session:', error);
        // If refresh fails, sign out the user
        await signOut();
        return;
      }
      
      console.log('✅ AuthContext: Session refreshed successfully');
      // The onAuthStateChange listener will handle the new session
    } catch (error) {
      console.error('❌ AuthContext: Unexpected error refreshing session:', error);
      await signOut();
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('🚪 AuthContext: Starting sign out process...');
      // Use comprehensive auth cleanup that handles all cached data
      await resetAuth();
      console.log('✅ AuthContext: Sign out completed successfully');
    } catch (error) {
      console.error('❌ AuthContext: Error during sign out:', error);
      // Even if there's an error, ensure user is signed out
      await supabase.auth.signOut();
    }
  }, []); // No dependencies - function is stable

  // Memoize context value with stable primitives to prevent object identity thrash on Hot/Fast Refresh
  const contextValue = useMemo(() => ({
    user,
    session,
    role,
    loading,
    signOut,
    refreshSession
  }), [
    user?.id,    // Use stable primitive (id) instead of full user object
    user?.email, // Use stable primitive (email) instead of full user object
    session?.access_token, // Use stable primitive (token) instead of full session object
    role,
    loading,
    signOut,
    refreshSession
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export as named exports to fix Fast Refresh
export { AuthProvider, useAuth };

// Default export for convenience
export default AuthProvider;
