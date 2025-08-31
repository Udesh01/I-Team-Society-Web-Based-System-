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
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  Target,
  Zap,
  Star,
  ArrowRight,
  Edit,
  Eye,
  Activity,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

interface StaffStats {
  eventsCreated: number;
  totalParticipants: number;
  averageAttendance: number;
  upcomingEvents: number;
  completedEvents: number;
  membershipStatus: string;
  membershipTier: string;
  membershipDaysLeft: number;
  eventCapacityUtilization: number;
  recentEvents: Array<{
    id: string;
    title: string;
    date: string;
    participants: number;
    status: string;
  }>;
  performanceMetrics: {
    thisMonth: {
      eventsCreated: number;
      participants: number;
      avgRating: number;
    };
    lastMonth: {
      eventsCreated: number;
      participants: number;
      avgRating: number;
    };
  };
}

const ModernStaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StaffStats>({
    eventsCreated: 0,
    totalParticipants: 0,
    averageAttendance: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    membershipStatus: "pending",
    membershipTier: "bronze",
    membershipDaysLeft: 0,
    eventCapacityUtilization: 0,
    recentEvents: [],
    performanceMetrics: {
      thisMonth: { eventsCreated: 0, participants: 0, avgRating: 0 },
      lastMonth: { eventsCreated: 0, participants: 0, avgRating: 0 },
    },
  });

  const fetchStaffData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch staff profile
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

      // Fetch events created by staff
      const { data: events } = await supabase
        .from("events")
        .select(
          `
          *,
          event_registrations(count)
        `
        )
        .eq("created_by", user.id)
        .order("event_date", { ascending: false });

      // Calculate statistics
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const eventsCreated = events?.length || 0;
      const totalParticipants =
        events?.reduce(
          (sum, event) => sum + (event.event_registrations?.[0]?.count || 0),
          0
        ) || 0;
      const averageAttendance =
        eventsCreated > 0 ? Math.round(totalParticipants / eventsCreated) : 0;

      const upcomingEvents =
        events?.filter((event) => new Date(event.event_date) > now).length || 0;

      const completedEvents =
        events?.filter((event) => new Date(event.event_date) < now).length || 0;

      // Calculate capacity utilization
      const eventsWithCapacity =
        events?.filter((e) => e.max_participants) || [];
      const eventCapacityUtilization =
        eventsWithCapacity.length > 0
          ? Math.round(
              eventsWithCapacity.reduce(
                (sum, event) =>
                  sum +
                  ((event.event_registrations?.[0]?.count || 0) /
                    (event.max_participants || 1)) *
                    100,
                0
              ) / eventsWithCapacity.length
            )
          : 0;

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

      // Recent events
      const recentEvents =
        events?.slice(0, 5).map((event) => ({
          id: event.id,
          title: event.title,
          date: event.event_date,
          participants: event.event_registrations?.[0]?.count || 0,
          status: event.status,
        })) || [];

      // Performance metrics
      const thisMonthEvents =
        events?.filter((event) => {
          const eventDate = new Date(event.event_date);
          return (
            eventDate.getMonth() === currentMonth &&
            eventDate.getFullYear() === currentYear
          );
        }) || [];

      const lastMonthEvents =
        events?.filter((event) => {
          const eventDate = new Date(event.event_date);
          return (
            eventDate.getMonth() === lastMonth &&
            eventDate.getFullYear() === lastMonthYear
          );
        }) || [];

      const performanceMetrics = {
        thisMonth: {
          eventsCreated: thisMonthEvents.length,
          participants: thisMonthEvents.reduce(
            (sum, event) => sum + (event.event_registrations?.[0]?.count || 0),
            0
          ),
          avgRating: 4.5, // Placeholder - would come from event feedback
        },
        lastMonth: {
          eventsCreated: lastMonthEvents.length,
          participants: lastMonthEvents.reduce(
            (sum, event) => sum + (event.event_registrations?.[0]?.count || 0),
            0
          ),
          avgRating: 4.3, // Placeholder
        },
      };

      setStats({
        eventsCreated,
        totalParticipants,
        averageAttendance,
        upcomingEvents,
        completedEvents,
        membershipStatus: membership?.status || "pending",
        membershipTier: membership?.tier || "bronze",
        membershipDaysLeft,
        eventCapacityUtilization,
        recentEvents,
        performanceMetrics,
      });

      toast.success("Dashboard updated successfully");
    } catch (error) {
      console.error("Error fetching staff data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🎯 ModernStaffDashboard: useEffect triggered", {
      user: user,
      userId: user?.id,
      hasUser: !!user,
    });
    if (user?.id) {
      fetchStaffData();
      const interval = setInterval(fetchStaffData, 30000);
      return () => clearInterval(interval);
    } else {
      console.log("🎯 ModernStaffDashboard: No user ID, skipping data fetch");
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id

  if (loading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  const getPerformanceChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl p-4 md:p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold mb-2">
              Staff Dashboard 🚀
            </h1>
            <p className="text-purple-100 mb-4 text-sm md:text-base">
              Manage events and track your impact
            </p>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm">
                {stats.membershipTier.charAt(0).toUpperCase() +
                  stats.membershipTier.slice(1)}{" "}
                Member
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm">
                {stats.eventsCreated} Events Created
              </Badge>
            </div>
          </div>
          <div className="text-center lg:text-right">
            <div className="text-2xl md:text-3xl font-bold">
              {stats.totalParticipants}
            </div>
            <div className="text-purple-100 text-sm md:text-base">
              Total Participants
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
                  Events Created
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.eventsCreated}
                </p>
                <p className="text-xs text-blue-600">
                  +
                  {getPerformanceChange(
                    stats.performanceMetrics.thisMonth.eventsCreated,
                    stats.performanceMetrics.lastMonth.eventsCreated
                  )}
                  % from last month
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
                  Total Participants
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.totalParticipants}
                </p>
                <p className="text-xs text-green-600">
                  +
                  {getPerformanceChange(
                    stats.performanceMetrics.thisMonth.participants,
                    stats.performanceMetrics.lastMonth.participants
                  )}
                  % from last month
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Avg. Attendance
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.averageAttendance}
                </p>
                <p className="text-xs text-purple-600">per event</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">
                  Capacity Usage
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.eventCapacityUtilization}%
                </p>
                <p className="text-xs text-orange-600">optimization rate</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {stats.performanceMetrics.thisMonth.eventsCreated}
                  </div>
                  <div className="text-sm text-blue-600">Events This Month</div>
                  <div className="text-xs text-gray-500 mt-1">
                    vs {stats.performanceMetrics.lastMonth.eventsCreated} last
                    month
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {stats.performanceMetrics.thisMonth.participants}
                  </div>
                  <div className="text-sm text-green-600">Participants</div>
                  <div className="text-xs text-gray-500 mt-1">
                    vs {stats.performanceMetrics.lastMonth.participants} last
                    month
                  </div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">
                    {stats.performanceMetrics.thisMonth.avgRating}
                  </div>
                  <div className="text-sm text-yellow-600">Avg. Rating</div>
                  <div className="text-xs text-gray-500 mt-1">
                    vs {stats.performanceMetrics.lastMonth.avgRating} last month
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Event Success Rate</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Participant Satisfaction</span>
                    <span>
                      {stats.performanceMetrics.thisMonth.avgRating * 20}%
                    </span>
                  </div>
                  <Progress
                    value={stats.performanceMetrics.thisMonth.avgRating * 20}
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentEvents.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(event.date).toLocaleDateString()} •{" "}
                          {event.participants} participants
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            event.status === "active" ? "default" : "secondary"
                          }
                        >
                          {event.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/dashboard/events?view=${event.id}`)
                          }
                          title="View Event Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/dashboard/events?edit=${event.id}`)
                          }
                          title="Edit Event"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events created yet</p>
                  <Button
                    className="mt-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    onClick={() => navigate("/dashboard/events")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-between bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                onClick={() => navigate("/dashboard/events")}
              >
                <span>Create New Event</span>
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("/dashboard/events")}
              >
                <span>Manage Events</span>
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("/dashboard/events")}
              >
                <span>View Analytics</span>
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("/dashboard/events")}
              >
                <span>Event Templates</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Event Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Event Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Upcoming Events</p>
                  <p className="text-sm text-blue-600">Ready to go</p>
                </div>
                <Badge className="bg-blue-100 text-blue-700">
                  {stats.upcomingEvents}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">Completed Events</p>
                  <p className="text-sm text-green-600">
                    Successfully finished
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700">
                  {stats.completedEvents}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-orange-900">Capacity Usage</p>
                  <p className="text-sm text-orange-600">Average utilization</p>
                </div>
                <Badge className="bg-orange-100 text-orange-700">
                  {stats.eventCapacityUtilization}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Membership Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Membership Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="mb-4">
                  <Badge
                    className={`text-lg px-4 py-2 ${
                      stats.membershipStatus === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {stats.membershipStatus.charAt(0).toUpperCase() +
                      stats.membershipStatus.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {stats.membershipTier.charAt(0).toUpperCase() +
                    stats.membershipTier.slice(1)}{" "}
                  Tier
                </div>
                {stats.membershipStatus === "active" && (
                  <div className="text-xs text-gray-500">
                    {stats.membershipDaysLeft} days remaining
                  </div>
                )}
                {stats.membershipStatus !== "active" && (
                  <Button
                    size="sm"
                    className="mt-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    onClick={() => navigate("/dashboard/membership")}
                  >
                    Complete Payment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips & Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-600" />
                Tips & Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">
                    💡 Pro Tip
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Events with interactive elements have 40% higher attendance
                    rates!
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    📊 Insight
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Your events perform best on weekday evenings between 6-8 PM.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">🎯 Goal</p>
                  <p className="text-xs text-green-700 mt-1">
                    Aim for 80% capacity utilization for optimal engagement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernStaffDashboard;
