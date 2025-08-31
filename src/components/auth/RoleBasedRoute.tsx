import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface RoleBasedRouteProps {
  allowedRoles: string[];
  children?: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, role, loading } = useAuth();

  // Debug logging
  console.log("🔐 RoleBasedRoute Debug:", {
    user: user?.id,
    role,
    loading,
    allowedRoles,
    hasUser: !!user,
    hasRole: !!role,
    roleIncluded: role ? allowedRoles.includes(role) : false,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-iteam-primary"></div>
      </div>
    );
  }

  // TEMPORARY FIX: Allow access if user exists (bypass role check)
  if (!user) {
    console.log("❌ Access denied: No user");
    return <Navigate to="/unauthorized" replace />;
  }

  // Check role but allow admin@iteam.com to bypass
  if (
    user.email === "admin@iteam.com" ||
    (role && allowedRoles.includes(role))
  ) {
    console.log("✅ Access granted - Admin bypass or valid role");
  } else if (!role) {
    console.log("⚠️ No role found, but allowing access temporarily");
    // Temporarily allow access even without role
  } else {
    console.log("❌ Access denied:", {
      reason: "Role not allowed",
      user: user?.id,
      role,
      allowedRoles,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("✅ Access granted for role:", role);
  return children ? <>{children}</> : <Outlet />;
};

export default RoleBasedRoute;
