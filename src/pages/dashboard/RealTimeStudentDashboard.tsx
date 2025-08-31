import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import MembershipStatus from "@/components/membership/MembershipStatus";
import EIDCard from "@/components/membership/EIDCard";
import EventList from "@/components/events/EventList";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import {
  Calendar,
  Users,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Trophy,
  Target,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface StudentProfile {
  first_name: string;
  last_name: string;
  photo_url?: string;
  student_details: {
    student_id: string;
    faculty: string;
    department: string;
    degree: string;
    level: number;
  };
}

interface Membership {
  id: string;
  status: string;
  tier: string;
  amount: number;
  start_date?: string;
  end_date?: string;
  eid?: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string;
  status: string;
}

interface EventRegistration {
  id: string;
  event_id: string;
  attended: boolean;
  registered_at: string;
  events: Event;
}

const RealTimeStudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<EventRegistration[]>(
    []
  );
  const [stats, setStats] = useState({
    eventsRegistered: 0,
    eventsAttended: 0,
    attendanceRate: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    membershipDaysLeft: 0,
    totalEvents: 0,
    achievements: [],
  });

  const fetchStudentData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch student profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

      if (profileError || !profileData) {
        console.error("Missing profile data", profileError);
        toast.error("Unable to load profile. Please try refreshing the page.");
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // Fetch membership data
      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() to handle missing memberships gracefully

      if (membershipError && membershipError.code !== "PGRST116") {
        throw membershipError;
      }
      setMembership(membershipData);

      // Fetch event registrations
      const { data: registrationsData, error: registrationsError } =
        await supabase
          .from("event_registrations")
          .select(
            `
          *,
          events(*)
        `
          )
          .eq("user_id", user.id);

      if (registrationsError) throw registrationsError;
      setRegisteredEvents(registrationsData || []);

      // Calculate statistics
      const now = new Date();
      const eventsRegistered = registrationsData?.length || 0;
      const eventsAttended =
        registrationsData?.filter((r) => r.attended).length || 0;
      const attendanceRate =
        eventsRegistered > 0
          ? Math.round((eventsAttended / eventsRegistered) * 100)
          : 0;

      const upcomingEvents =
        registrationsData?.filter((r) => new Date(r.events.event_date) > now)
          .length || 0;

      const completedEvents =
        registrationsData?.filter((r) => new Date(r.events.event_date) < now)
          .length || 0;

      // Calculate membership days left
      let membershipDaysLeft = 0;
      if (membershipData?.end_date) {
        const endDate = new Date(membershipData.end_date);
        const diffTime = endDate.getTime() - now.getTime();
        membershipDaysLeft = Math.max(
          0,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        );
      }

      // Get total available events
      const { data: allEvents } = await supabase
        .from("events")
        .select("id")
        .eq("status", "active");

      const totalEvents = allEvents?.length || 0;

      // Calculate achievements
      const achievements = [];
      if (eventsAttended >= 1)
        achievements.push({ title: "First Event", icon: "🎯" });
      if (eventsAttended >= 5)
        achievements.push({ title: "Active Participant", icon: "🏆" });
      if (eventsAttended >= 10)
        achievements.push({ title: "Event Champion", icon: "👑" });
      if (attendanceRate >= 80)
        achievements.push({ title: "Consistent Attendee", icon: "⭐" });
      if (membershipData?.status === "active")
        achievements.push({ title: "Active Member", icon: "✅" });

      setStats({
        eventsRegistered,
        eventsAttended,
        attendanceRate,
        upcomingEvents,
        completedEvents,
        membershipDaysLeft,
        totalEvents,
        achievements,
      });

      setLastUpdated(new Date());
      toast.success("Dashboard updated successfully");
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    console.log("🔄 RealTimeStudentDashboard: useEffect triggered", {
      user: user,
      userId: user?.id,
      hasUser: !!user,
    });
    if (user?.id) {
      fetchStudentData();
      const interval = setInterval(fetchStudentData, 30000);
      return () => clearInterval(interval);
    } else {
      console.log(
        "🔄 RealTimeStudentDashboard: No user ID, skipping data fetch"
      );
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase
        .channel("student_memberships")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "memberships",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchStudentData();
          }
        )
        .subscribe(),

      supabase
        .channel("student_registrations")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "event_registrations",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchStudentData();
          }
        )
        .subscribe(),

      supabase
        .channel("events_updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "events",
          },
          () => {
            fetchStudentData();
          }
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [user?.id]);

  const handlePayment = () => {
    console.log("Redirect to payment");
  };

  const handleRenew = () => {
    console.log("Redirect to renewal");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iteam-primary mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "Student";

  // Generate E-ID card data if membership is active
  const eidCardData =
    membership?.status === "active" && membership.eid
      ? {
          eid: membership.eid,
          firstName: profile?.first_name || "",
          lastName: profile?.last_name || "",
          role: "student",
          photoUrl: profile?.photo_url,
          validFrom: membership.start_date || "",
          validTo: membership.end_date || "",
          qrCodeData: `${window.location.origin}/member/${membership.eid}`,
        }
      : null;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-iteam-primary to-iteam-primary/80 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
            <p className="opacity-90">
              {profile?.student_details?.student_id} • Level{" "}
              {profile?.student_details?.level} •{" "}
              {profile?.student_details?.degree}
            </p>
            <p className="text-sm opacity-75">
              Last updated: {lastUpdated.toLocaleTimeString()} | Auto-refresh:
              30s
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Role</div>
            <div className="text-lg font-semibold">Student</div>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchStudentData}
              disabled={loading}
              className="mt-2"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Events Registered</p>
                <p className="text-2xl font-bold">{stats.eventsRegistered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Events Attended</p>
                <p className="text-2xl font-bold">{stats.eventsAttended}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Attendance Rate</p>
                <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Membership</p>
                <Badge
                  className={`${
                    membership?.status === "active"
                      ? "bg-green-500"
                      : membership?.status === "pending_payment"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  } text-white capitalize`}
                >
                  {membership?.status || "None"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Membership Status */}
        <div className="lg:col-span-2">
          {membership && (
            <MembershipStatus
              status={membership.status as any}
              tier={membership.tier as any}
              startDate={membership.start_date}
              endDate={membership.end_date}
              amount={membership.amount}
              onPayment={handlePayment}
              onRenew={handleRenew}
            />
          )}
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.achievements.length > 0 ? (
              stats.achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <span className="font-medium">{achievement.title}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No achievements yet</p>
                <p className="text-sm">Attend events to earn achievements!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Event Participation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Events Attended</span>
                <span>
                  {stats.eventsAttended} / {stats.eventsRegistered}
                </span>
              </div>
              <Progress value={stats.attendanceRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Available Events</span>
                <span>
                  {stats.eventsRegistered} / {stats.totalEvents}
                </span>
              </div>
              <Progress
                value={
                  stats.totalEvents > 0
                    ? (stats.eventsRegistered / stats.totalEvents) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Membership Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {membership?.status === "active" && stats.membershipDaysLeft > 0 ? (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Days Remaining</span>
                  <span>{stats.membershipDaysLeft} days</span>
                </div>
                <Progress
                  value={Math.max(
                    0,
                    Math.min(100, (stats.membershipDaysLeft / 365) * 100)
                  )}
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Membership expires on{" "}
                  {membership.end_date
                    ? new Date(membership.end_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm text-gray-600">
                  {membership?.status === "pending_payment"
                    ? "Payment pending"
                    : membership?.status === "pending_approval"
                      ? "Approval pending"
                      : "No active membership"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Available Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
          {eidCardData && <TabsTrigger value="eid">E-ID Card</TabsTrigger>}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Available Events</CardTitle>
            </CardHeader>
            <CardContent>
              {membership?.status === "active" ? (
                <EventList userRole="student" />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Please complete your membership payment to access events.
                  </p>
                  {membership?.status === "pending_payment" && (
                    <Button
                      onClick={handlePayment}
                      className="bg-iteam-primary hover:bg-iteam-primary/90"
                    >
                      Complete Payment
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-events">
          <Card>
            <CardHeader>
              <CardTitle>My Registered Events</CardTitle>
            </CardHeader>
            <CardContent>
              {registeredEvents.length > 0 ? (
                <div className="space-y-4">
                  {registeredEvents.map((registration) => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {registration.events.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(
                            registration.events.event_date
                          ).toLocaleDateString()}{" "}
                          • {registration.events.location}
                        </p>
                        <p className="text-sm text-gray-500">
                          Registered:{" "}
                          {new Date(
                            registration.registered_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge
                          variant={
                            registration.attended ? "default" : "secondary"
                          }
                        >
                          {registration.attended ? "Attended" : "Registered"}
                        </Badge>
                        <Badge variant="outline">
                          {new Date(registration.events.event_date) > new Date()
                            ? "Upcoming"
                            : "Past"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    You haven't registered for any events yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {eidCardData && (
          <TabsContent value="eid">
            <Card>
              <CardHeader>
                <CardTitle>Your E-ID Card</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <EIDCard memberData={eidCardData} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="notifications">
          <NotificationCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeStudentDashboard;
