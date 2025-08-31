import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Users,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Trophy,
  Target,
  Zap,
  Star,
  Gift,
  ArrowRight,
  Play,
  Download,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import LoadingSkeleton, {
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from "@/components/ui/LoadingSkeleton";
import { useLoadingState } from "@/hooks/useLoadingState";
import DataFetcher from "@/components/ui/DataFetcher";

interface StudentStats {
  eventsRegistered: number;
  eventsAttended: number;
  attendanceRate: number;
  upcomingEvents: number;
  membershipStatus: string;
  membershipTier: string;
  membershipDaysLeft: number;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedDate?: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
}

const ModernStudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StudentStats>({
    eventsRegistered: 0,
    eventsAttended: 0,
    attendanceRate: 0,
    upcomingEvents: 0,
    membershipStatus: "pending",
    membershipTier: "bronze",
    membershipDaysLeft: 0,
    achievements: [],
    recentActivities: [],
    upcomingDeadlines: [],
  });

  // Derived booleans for better state management
  const hasUser = !!user?.id;
  const hasData =
    stats.eventsRegistered > 0 ||
    stats.recentActivities.length > 0 ||
    stats.achievements.length > 0;

  const fetchStudentData = async () => {
    console.log("🎓 ModernStudentDashboard: fetchStudentData called", {
      user: user,
      userId: user?.id,
      hasUser: !!user,
    });

    if (!user) {
      console.log("🎓 ModernStudentDashboard: No user, returning");
      return;
    }

    try {
      setLoading(true);

      // Fetch student profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

      // Fetch membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() to handle missing memberships gracefully

      // Fetch event registrations (simplified)
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("user_id", user.id);

      // Fetch events separately to avoid join issues
      const { data: events } = await supabase.from("events").select("*");

      // Manually join the data
      const registrationsWithEvents =
        registrations?.map((reg) => {
          const event = events?.find((e) => e.id === reg.event_id);
          return {
            ...reg,
            events: event || {},
          };
        }) || [];

      // Fetch recent activities (notifications)
      const { data: activities } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Calculate statistics using the manually joined data
      const now = new Date();
      const eventsRegistered = registrationsWithEvents?.length || 0;
      const eventsAttended =
        registrationsWithEvents?.filter((r) => r.attended).length || 0;
      const attendanceRate =
        eventsRegistered > 0
          ? Math.round((eventsAttended / eventsRegistered) * 100)
          : 0;
      const upcomingEvents =
        registrationsWithEvents?.filter(
          (r) => r.events.event_date && new Date(r.events.event_date) > now
        ).length || 0;

      // Calculate membership days left
      let membershipDaysLeft = 0;
      if (membership?.end_date) {
        const endDate = new Date(membership.end_date);
        const diffTime = endDate.getTime() - now.getTime();
        membershipDaysLeft = Math.max(
          0,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        );
      }

      // Generate achievements
      const achievements = [
        {
          id: "1",
          title: "First Steps",
          description: "Registered for your first event",
          icon: "🎯",
          earned: eventsRegistered >= 1,
          earnedDate:
            eventsRegistered >= 1
              ? registrationsWithEvents?.[0]?.registered_at
              : undefined,
        },
        {
          id: "2",
          title: "Active Participant",
          description: "Attended 5 events",
          icon: "🏆",
          earned: eventsAttended >= 5,
          earnedDate:
            eventsAttended >= 5
              ? registrationsWithEvents?.filter((r) => r.attended)[4]
                  ?.registered_at
              : undefined,
        },
        {
          id: "3",
          title: "Consistent Attendee",
          description: "Maintain 80% attendance rate",
          icon: "⭐",
          earned: attendanceRate >= 80 && eventsRegistered >= 3,
          earnedDate:
            attendanceRate >= 80 ? new Date().toISOString() : undefined,
        },
        {
          id: "4",
          title: "Event Champion",
          description: "Attended 10 events",
          icon: "👑",
          earned: eventsAttended >= 10,
          earnedDate:
            eventsAttended >= 10
              ? registrationsWithEvents?.filter((r) => r.attended)[9]
                  ?.registered_at
              : undefined,
        },
        {
          id: "5",
          title: "Active Member",
          description: "Maintain active membership",
          icon: "✅",
          earned: membership?.status === "active",
          earnedDate:
            membership?.status === "active" ? membership.start_date : undefined,
        },
      ];

      // Generate recent activities
      const recentActivities =
        activities?.map((activity) => ({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          description: activity.message,
          timestamp: activity.created_at,
        })) || [];

      // Generate upcoming deadlines
      const upcomingDeadlines = [
        ...(membership?.end_date && membershipDaysLeft <= 30
          ? [
              {
                id: "membership",
                title: "Membership Renewal",
                date: membership.end_date,
                type: "membership",
              },
            ]
          : []),
        ...(registrationsWithEvents
          ?.filter(
            (r) => r.events.event_date && new Date(r.events.event_date) > now
          )
          .slice(0, 3)
          .map((r) => ({
            id: r.id,
            title: r.events.title || "Event",
            date: r.events.event_date,
            type: "event",
          })) || []),
      ];

      setStats({
        eventsRegistered,
        eventsAttended,
        attendanceRate,
        upcomingEvents,
        membershipStatus: membership?.status || "pending",
        membershipTier: membership?.tier || "bronze",
        membershipDaysLeft,
        achievements,
        recentActivities,
        upcomingDeadlines,
      });

      toast.success("Dashboard updated successfully");
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🎓 ModernStudentDashboard: useEffect triggered", {
      user: user,
      userId: user?.id,
      hasUser: !!user,
    });
    if (user?.id) {
      fetchStudentData();
      const interval = setInterval(fetchStudentData, 30000); // Auto-refresh every 30 seconds
      return () => clearInterval(interval);
    } else {
      console.log("🎓 ModernStudentDashboard: No user ID, skipping data fetch");
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  return (
    <DataFetcher
      loading={loading}
      error={error}
      data={hasData ? stats : null}
      loadingMessage="Loading student dashboard..."
      emptyStateConfig={{
        title: "No User Data",
        description: "Please log in as a student to see your dashboard",
        variant: "no-auth",
      }}
      errorStateConfig={{
        title: "Failed to Load Dashboard",
        description: "There was an error loading your data",
      }}
      onRetry={() => window.location.reload()}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-2xl p-4 md:p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-blue-100 mb-4 text-sm md:text-base">
                Ready to continue your learning journey?
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm">
                  {stats.membershipTier.charAt(0).toUpperCase() +
                    stats.membershipTier.slice(1)}{" "}
                  Member
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm">
                  {stats.eventsAttended} Events Attended
                </Badge>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="text-2xl md:text-3xl font-bold">
                {stats.attendanceRate}%
              </div>
              <div className="text-blue-100 text-sm md:text-base">
                Attendance Rate
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Events Registered
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.eventsRegistered}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Events Attended
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.eventsAttended}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Upcoming Events
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.upcomingEvents}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">
                    Achievements
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.achievements.filter((a) => a.earned).length}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* Progress Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Event Attendance Goal</span>
                    <span>{stats.eventsAttended}/10 events</span>
                  </div>
                  <Progress
                    value={(stats.eventsAttended / 10) * 100}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Attendance Rate</span>
                    <span>{stats.attendanceRate}%</span>
                  </div>
                  <Progress value={stats.attendanceRate} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Membership Status</span>
                    <Badge
                      variant={
                        stats.membershipStatus === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {stats.membershipStatus}
                    </Badge>
                  </div>
                  {stats.membershipStatus === "active" && (
                    <div className="text-xs text-gray-500">
                      {stats.membershipDaysLeft || 0} days remaining
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent activities</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        achievement.earned
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {achievement.description}
                        </p>
                        {achievement.earned && achievement.earnedDate && (
                          <p className="text-xs text-green-600 mt-1">
                            Earned{" "}
                            {new Date(
                              achievement.earnedDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {achievement.earned && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.upcomingDeadlines.length > 0 ? (
                  <div className="space-y-3">
                    {stats.upcomingDeadlines.map((deadline) => (
                      <div
                        key={deadline.id}
                        className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {deadline.title}
                          </p>
                          <p className="text-xs text-gray-600 capitalize">
                            {deadline.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-700">
                            {new Date(deadline.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-red-600">
                            {Math.ceil(
                              (new Date(deadline.date).getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No upcoming deadlines</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-between bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  onClick={() => navigate("/dashboard/events")}
                >
                  <span>Browse Events</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate("/dashboard/profile")}
                >
                  <span>View E-ID Card</span>
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate("/dashboard/profile")}
                >
                  <span>Update Profile</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {stats.membershipStatus !== "active" && (
                  <Button
                    variant="outline"
                    className="w-full justify-between border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => navigate("/dashboard/membership")}
                  >
                    <span>Complete Payment</span>
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DataFetcher>
  );
};

export default ModernStudentDashboard;
