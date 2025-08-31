import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserService } from "@/services/supabase/user.service";
import { AuthService } from "@/services/supabase/auth.service";

export const useUser = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived booleans for better state management
  const hasUser = !!user?.id;
  const isAuthenticating = authLoading;
  const isLoadingData = loading;
  const hasProfile = !!profile;
  const hasError = !!error;

  useEffect(() => {
    const loadUserData = async () => {
      console.log('👤 useUser: loadUserData called', {
        user,
        userId: user?.id,
        hasUser,
        isAuthenticating
      });

      // Don't start loading data if still authenticating or no user
      if (isAuthenticating) {
        console.log('👤 useUser: Still authenticating, waiting...');
        return;
      }

      if (!hasUser) {
        console.log('👤 useUser: No user, clearing data and stopping loading');
        setProfile(null);
        setRole(null);
        setIsAdmin(false);
        setIsStaff(false);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('👤 useUser: Loading user data for:', user.id);
        const [profileData, roleData, adminCheck, staffCheck] =
          await Promise.all([
            UserService.getProfile(user.id),
            AuthService.getUserRole(user.id),
            AuthService.isAdmin(user.id),
            AuthService.isStaff(user.id),
          ]);

        setProfile(profileData);
        setRole(roleData);
        setIsAdmin(adminCheck);
        setIsStaff(staffCheck);
        
        console.log('✅ useUser: Data loaded successfully', {
          hasProfile: !!profileData,
          role: roleData,
          isAdmin: adminCheck,
          isStaff: staffCheck
        });
      } catch (err: any) {
        console.error('❌ useUser: Error loading user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, isAuthenticating, hasUser]);

  // Determine rendering states based on derived booleans
  const shouldShowLoading = isAuthenticating || (hasUser && isLoadingData);
  const shouldShowEmpty = !hasUser && !isAuthenticating;
  const shouldShowError = hasError && !shouldShowLoading;
  const shouldShowData = hasUser && !isLoadingData && !hasError && hasProfile;

  return {
    // User data
    profile,
    userProfile: profile,
    role,
    isAdmin,
    isStaff,
    
    // Loading states
    loading: shouldShowLoading,
    error,
    
    // Derived booleans for components
    hasUser,
    isAuthenticating,
    isLoadingData,
    hasProfile,
    hasError,
    
    // Rendering decision booleans
    shouldShowLoading,
    shouldShowEmpty,
    shouldShowError,
    shouldShowData,
    
    // Original user for direct access
    user,
  };
};
