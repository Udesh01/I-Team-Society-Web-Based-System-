import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Users,
  GraduationCap,
  Briefcase,
  Shield,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🏠 Dashboard: useEffect triggered", {
      user: user,
      userId: user?.id,
      hasUser: !!user,
    });
    if (user?.id) {
      fetchUserRole();
    } else {
      console.log("🏠 Dashboard: No user ID, stopping loading");
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id

  const fetchUserRole = async () => {
    try {
      console.log("🔍 Dashboard: Fetching role for user:", user?.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

      if (error) {
        console.error("❌ Dashboard: Error fetching role:", error);
        // If profile doesn't exist, create it first or redirect to profile setup
        if (error.code === "PGRST116") {
          console.log(
            "⚠️ Dashboard: No profile found, user needs to complete profile setup"
          );
          setError("Profile not found. Please complete your profile setup.");
          setLoading(false);
          return;
        }
        throw error;
      }

      const role = data?.role;
      console.log("🎭 Dashboard: User role fetched:", role);

      if (!role) {
        console.log(
          "⚠️ Dashboard: No role assigned, showing fallback dashboard"
        );
        setError(
          "No role assigned. Please contact support to set up your account."
        );
        setUserRole(null);
        setLoading(false);
        return;
      }

      setUserRole(role);

      // Small delay to ensure state is updated before navigation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Auto-redirect to appropriate Modern Dashboard (Primary)
      if (role === "admin") {
        console.log(
          "🔄 Dashboard: Auto-redirecting admin to Modern Admin Dashboard"
        );
        navigate("/dashboard/admin/modern", { replace: true });
      } else if (role === "staff") {
        console.log(
          "🔄 Dashboard: Auto-redirecting staff to Modern Staff Dashboard"
        );
        navigate("/dashboard/modern-staff", { replace: true });
      } else if (role === "student") {
        console.log(
          "🔄 Dashboard: Auto-redirecting student to Modern Student Dashboard"
        );
        navigate("/dashboard/modern-student", { replace: true });
      } else {
        console.log(
          "⚠️ Dashboard: Unknown role, showing fallback dashboard:",
          role
        );
        setError(`Unknown user role: ${role}. Please contact support.`);
      }
    } catch (error: any) {
      console.error("❌ Dashboard: Error in fetchUserRole:", error);
      setError(
        error.message ||
          "Failed to load dashboard. Please try refreshing the page."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iteam-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
                className="w-full"
              >
                Go to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback dashboard for users without roles or when auto-redirect fails
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome to I-Team Society! 👋
        </h1>
        <p className="text-blue-100 mb-4">
          Choose your dashboard below or update your profile to get started.
        </p>
        {userRole && (
          <Badge className="bg-white/20 text-white border-white/30">
            Role: {userRole}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/dashboard/modern-student")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Student Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Access events, view your membership, and track achievements.
            </p>
            <Button className="w-full">
              Go to Student Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/dashboard/modern-staff")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              Staff Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Create and manage events, view analytics, and more.
            </p>
            <Button className="w-full">
              Go to Staff Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/dashboard/admin/modern")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Admin Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Full system control, user management, and analytics.
            </p>
            <Button className="w-full">
              Go to Admin Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/profile")}
              className="justify-start"
            >
              <User className="h-4 w-4 mr-2" />
              Update Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/events")}
              className="justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Browse Events
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
