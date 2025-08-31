import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MembershipStatus from "@/components/membership/MembershipStatus";
import EIDCard from "@/components/membership/EIDCard";
import EventList from "@/components/events/EventList";
import EventForm from "@/components/events/EventForm";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import {
  Calendar,
  Users,
  Award,
  Settings,
  Plus,
  TrendingUp,
  CheckCircle,
  Clock,
  RefreshCw,
  BarChart3,
  UserCheck,
  CalendarCheck,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface StaffProfile {
  first_name: string;
  last_name: string;
  photo_url?: string;
  staff_details: {
    staff_id: string;
    position: string;
    department: string;
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
  registrations_count: number;
  max_participants?: number;
  status: string;
}

const RealTimeStaffDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [managedEvents, setManagedEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState({
    eventsManaged: 0,
    totalParticipants: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    averageAttendance: 0,
    activeEvents: 0,
    membershipDaysLeft: 0,
    eventCapacityUtilization: 0,
  });

  const fetchStaffData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch staff profile
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

      // Fetch managed events with registration counts
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(
          `
          *,
          event_registrations(count)
        `
        )
        .eq("created_by", user.id)
        .order("event_date", { ascending: false });

      if (eventsError) throw eventsError;

      const eventsWithCount =
        eventsData?.map((event) => ({
          ...event,
          registrations_count: event.event_registrations?.[0]?.count || 0,
        })) || [];

      setManagedEvents(eventsWithCount);

      // Calculate statistics
      const now = new Date();
      const totalEvents = eventsWithCount.length;
      const totalParticipants = eventsWithCount.reduce(
        (sum, event) => sum + event.registrations_count,
        0
      );
      const upcomingEvents = eventsWithCount.filter(
        (event) => new Date(event.event_date) > now
      ).length;
      const completedEvents = eventsWithCount.filter(
        (event) => new Date(event.event_date) < now
      ).length;
      const activeEvents = eventsWithCount.filter(
        (event) => event.status === "active"
      ).length;

      // Calculate average attendance
      const averageAttendance =
        totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;

      // Calculate capacity utilization
      const eventsWithCapacity = eventsWithCount.filter(
        (e) => e.max_participants
      );
      const capacityUtilization =
        eventsWithCapacity.length > 0
          ? Math.round(
              eventsWithCapacity.reduce(
                (sum, event) =>
                  sum +
                  (event.registrations_count / (event.max_participants || 1)) *
                    100,
                0
              ) / eventsWithCapacity.length
            )
          : 0;

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

      setStats({
        eventsManaged: totalEvents,
        totalParticipants: totalParticipants,
        upcomingEvents: upcomingEvents,
        completedEvents: completedEvents,
        averageAttendance: averageAttendance,
        activeEvents: activeEvents,
        membershipDaysLeft: membershipDaysLeft,
        eventCapacityUtilization: capacityUtilization,
      });

      setLastUpdated(new Date());
      toast.success("Dashboard updated successfully");
    } catch (error) {
      console.error("Error fetching staff data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    console.log("🔄 RealTimeStaffDashboard: useEffect triggered", {
      user: user,
      userId: user?.id,
      hasUser: !!user,
    });
    if (user?.id) {
      fetchStaffData();
      const interval = setInterval(fetchStaffData, 30000);
      return () => clearInterval(interval);
    } else {
      console.log("🔄 RealTimeStaffDashboard: No user ID, skipping data fetch");
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase
        .channel("staff_events")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "events",
            filter: `created_by=eq.${user.id}`,
          },
          () => {
            fetchStaffData();
          }
        )
        .subscribe(),

      supabase
        .channel("event_registrations_staff")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "event_registrations",
          },
          () => {
            fetchStaffData();
          }
        )
        .subscribe(),

      supabase
        .channel("staff_memberships")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "memberships",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchStaffData();
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

  const handleEventCreated = () => {
    fetchStaffData(); // Refresh data
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
    : "Staff";

  // Generate E-ID card data if membership is active
  const eidCardData =
    membership?.status === "active" && membership.eid
      ? {
          eid: membership.eid,
          firstName: profile?.first_name || "",
          lastName: profile?.last_name || "",
          role: "staff",
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
              {profile?.staff_details?.staff_id} •{" "}
              {profile?.staff_details?.position} •{" "}
              {profile?.staff_details?.department}
            </p>
            <p className="text-sm opacity-75">
              Last updated: {lastUpdated.toLocaleTimeString()} | Auto-refresh:
              30s
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Role</div>
            <div className="text-lg font-semibold">Staff Member</div>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchStaffData}
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
                <p className="text-sm opacity-90">Events Managed</p>
                <p className="text-2xl font-bold">{stats.eventsManaged}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Total Participants</p>
                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Avg. Attendance</p>
                <p className="text-2xl font-bold">{stats.averageAttendance}</p>
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

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarCheck className="h-5 w-5 text-blue-500" />
              <span>Event Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Upcoming Events</span>
              <Badge variant="secondary">{stats.upcomingEvents}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Completed Events</span>
              <Badge variant="default">{stats.completedEvents}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Active Events</span>
              <Badge variant="outline">{stats.activeEvents}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Capacity Utilization</span>
              <Badge variant="secondary">
                {stats.eventCapacityUtilization}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Average Attendance</span>
              <Badge variant="default">{stats.averageAttendance}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span>Membership</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {membership?.status === "active" && stats.membershipDaysLeft > 0 ? (
              <div>
                <div className="flex justify-between">
                  <span>Days Remaining</span>
                  <Badge variant="outline">{stats.membershipDaysLeft}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Expires:{" "}
                  {membership.end_date
                    ? new Date(membership.end_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            ) : (
              <div className="text-center py-2">
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

      {/* Membership Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-iteam-primary hover:bg-iteam-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                  </DialogHeader>
                  <EventForm onEventCreated={handleEventCreated} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Available Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
          <TabsTrigger value="manage">Event Management</TabsTrigger>
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
                <EventList userRole="staff" />
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
              <CardTitle>Events I'm Attending</CardTitle>
            </CardHeader>
            <CardContent>
              <EventList userRole="staff" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Events I Manage</CardTitle>
            </CardHeader>
            <CardContent>
              {managedEvents.length > 0 ? (
                <div className="space-y-4">
                  {managedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(event.event_date).toLocaleDateString()} •{" "}
                          {event.location}
                        </p>
                        <p className="text-sm text-gray-500">
                          {event.registrations_count} registered
                          {event.max_participants &&
                            ` / ${event.max_participants} max`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="outline">
                          {new Date(event.event_date) > new Date()
                            ? "Upcoming"
                            : "Past"}
                        </Badge>
                        <Badge
                          variant={
                            event.status === "active" ? "default" : "secondary"
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    You haven't created any events yet.
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-iteam-primary hover:bg-iteam-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                      </DialogHeader>
                      <EventForm onEventCreated={handleEventCreated} />
                    </DialogContent>
                  </Dialog>
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

export default RealTimeStaffDashboard;
