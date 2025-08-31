import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  RoleBasedDataService,
  DashboardData,
} from "@/services/dashboard/role-based-data.service";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardData = () => {
  const { user, role } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    console.log("🔍 useDashboardData: fetchData called", {
      user: user,
      userId: user?.id,
      role: role,
      hasUser: !!user,
      hasRole: !!role,
    });

    if (!user) {
      console.log("🔍 useDashboardData: No user, skipping fetch", {
        user: user,
        userType: typeof user,
        userNull: user === null,
        userUndefined: user === undefined,
      });
      setLoading(false);
      return;
    }

    if (!role) {
      console.log("🔍 useDashboardData: No role yet, waiting...", {
        userId: user.id,
        role,
      });
      // Don't skip - try to fetch role from database directly
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

        if (!profile?.role) {
          console.log(
            "🔍 useDashboardData: No role in database, using student as default"
          );
          // Use student as default role
          const dashboardData = await RoleBasedDataService.fetchDashboardData(
            user.id,
            "student"
          );
          setData(dashboardData);
          setLoading(false);
          return;
        }

        console.log(
          "🔍 useDashboardData: Found role in database:",
          profile.role
        );
        // Use role from database
        const dashboardData = await RoleBasedDataService.fetchDashboardData(
          user.id,
          profile.role
        );
        setData(dashboardData);
        setLoading(false);
        return;
      } catch (err) {
        console.error(
          "🔍 useDashboardData: Error fetching role from database:",
          err
        );
        setError("Failed to fetch user role");
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      console.log(
        `🔍 useDashboardData: Fetching data for ${user.id} with role ${role}`
      );

      const dashboardData = await RoleBasedDataService.fetchDashboardData(
        user.id,
        role
      );
      setData(dashboardData);
      console.log(
        "✅ useDashboardData: Data fetched successfully",
        dashboardData
      );
    } catch (err: any) {
      console.error("❌ useDashboardData: Error fetching data:", err);
      setError(err.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when user or role changes
  useEffect(() => {
    console.log("🔍 useDashboardData: Effect triggered", {
      user: user,
      userId: user?.id,
      role,
      hasUser: !!user,
      hasRole: !!role,
      userType: typeof user,
      roleType: typeof role,
    });

    // Only fetch data if we have a user ID
    if (user?.id) {
      fetchData();
    } else {
      console.log(
        "🔍 useDashboardData: No user ID, clearing data and stopping loading"
      );
      setData(null);
      setError(null);
      setLoading(false);
    }
  }, [user?.id, role]);

  // Refresh function for manual data refresh
  const refresh = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    refresh,
    // Convenience accessors
    profile: data?.profile,
    membership: data?.membership,
    events: data?.events || [],
    registrations: data?.registrations || [],
    notifications: data?.notifications || [],
    stats: data?.stats,
    roleSpecificData: data?.roleSpecificData,
    // Role-based data accessors
    isAdmin: role === "admin",
    isStaff: role === "staff",
    isStudent: role === "student",
    userRole: role,
  };
};
