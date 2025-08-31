import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { UserService } from "@/services/supabase/user.service";
import { MembershipService } from "@/services/supabase/membership.service";
import { PaymentService } from "@/services/supabase/payment.service";
import { EventService } from "@/services/supabase/event.service";
import MembershipApproval from "@/components/admin/MembershipApproval";
import EventForm from "@/components/events/EventForm";
import EventList from "@/components/events/EventList";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadingState } from "@/hooks/useLoadingState";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, Calendar, TrendingUp } from "lucide-react";

const COLORS = ["#001155", "#4CAF50", "#FFC107", "#F44336"];

const AdminDashboard = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [refreshEvents, setRefreshEvents] = useState(0);

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["users"],
    queryFn: UserService.getAllUsers,
  });
  const { data: memberships = [], isLoading: membershipsLoading, error: membershipsError } = useQuery({
    queryKey: ["memberships"],
    queryFn: MembershipService.getAllMemberships,
  });
  const { data: payments = [], isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ["payments"],
    queryFn: PaymentService.getAllPayments,
  });
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ["events"],
    queryFn: EventService.getAllEvents,
  });

  // Derived booleans for loading state management
  const isLoading = usersLoading || membershipsLoading || paymentsLoading || eventsLoading;
  const hasError = usersError || membershipsError || paymentsError || eventsError;
  const hasData = users.length > 0 || memberships.length > 0 || payments.length > 0 || events.length > 0;
  
  // Use the loading state hook
  const loadingState = useLoadingState({
    isLoading,
    error: hasError ? 'Failed to load dashboard data' : null,
    data: { users, memberships, payments, events },
    requiresAuth: true
  });

  const stats = {
    totalUsers: users.length,
    activeMembers: memberships.filter((m) => m.status === "active").length,
    pendingPayments: payments.filter((p) => p.status === "pending").length,
    upcomingEvents: events.filter((e) => new Date(e.event_date) > new Date())
      .length,
  };

  // Calculate monthly membership growth data
  const membershipGrowthData = React.useMemo(() => {
    if (!memberships.length) return [];

    const monthlyData = {};
    memberships.forEach((membership) => {
      const date = new Date(membership.created_at);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .map(([month, count]) => ({
        month,
        members: count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }, [memberships]);

  // Calculate membership distribution data
  const membershipDistributionData = React.useMemo(() => {
    if (!memberships.length) return [];

    const distribution = {
      bronze: 0,
      silver: 0,
      gold: 0,
    };

    memberships.forEach((membership) => {
      if (membership.status === "active") {
        distribution[membership.tier]++;
      }
    });

    return Object.entries(distribution).map(([tier, count]) => ({
      tier: tier.charAt(0).toUpperCase() + tier.slice(1),
      value: count,
    }));
  }, [memberships]);

  const recentPayments = payments
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  // Handle different states using the loading state hook
  if (loadingState.shouldShowLoading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (loadingState.shouldShowEmpty) {
    return (
      <EmptyState
        variant="no-auth"
        title="Authentication Required"
        description="Please log in as an admin to access the dashboard"
        action={{
          label: "Go to Login",
          onClick: () => window.location.href = '/login'
        }}
      />
    );
  }

  if (loadingState.shouldShowError) {
    return (
      <ErrorState
        title="Failed to Load Dashboard"
        description="There was an error loading the admin dashboard data"
        error={hasError ? 'Multiple data sources failed to load' : null}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard/admin/payments">View Payments</Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/admin/users">Manage Users</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">Membership Approvals</TabsTrigger>
          <TabsTrigger value="events">Event Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered members in the system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Members
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeMembers}</div>
                <p className="text-xs text-muted-foreground">
                  Members with active membership
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Payments
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pendingPayments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Payments awaiting verification
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">
                  Events scheduled for future
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Membership Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Membership Growth</CardTitle>
                <CardDescription>
                  Monthly membership registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={membershipGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="members"
                        stroke="#001155"
                        strokeWidth={2}
                        dot={{ fill: "#001155" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Membership Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Membership Distribution</CardTitle>
                <CardDescription>Active members by tier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={membershipDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ tier, value }) => `${tier}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {membershipDistributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.profiles?.first_name}{" "}
                        {payment.profiles?.last_name}
                      </TableCell>
                      <TableCell>Rs. {payment.amount}</TableCell>
                      <TableCell>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "verified"
                              ? "default"
                              : payment.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/dashboard/admin/payments">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-right">
                <Button variant="outline" asChild>
                  <Link to="/dashboard/admin/payments">View All Payments</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <MembershipApproval />
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EventForm
              onEventCreated={() => setRefreshEvents((prev) => prev + 1)}
              editEvent={selectedEvent}
            />
            <div>
              <h3 className="text-lg font-semibold mb-4">Manage Events</h3>
              <EventList
                showActions={true}
                onEditEvent={setSelectedEvent}
                userRole="admin"
                key={refreshEvents}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
