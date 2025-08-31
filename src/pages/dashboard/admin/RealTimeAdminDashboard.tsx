import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  Eye,
  UserPlus,
  CalendarPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

const COLORS = [
  "#001155",
  "#4CAF50",
  "#FFC107",
  "#F44336",
  "#9C27B0",
  "#FF9800",
];

const RealTimeAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalAdmins: 0,
    activeMemberships: 0,
    pendingMemberships: 0,
    expiredMemberships: 0,
    rejectedMemberships: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalPayments: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentRegistrations: [],
    membershipsByTier: [],
    monthlyGrowth: [],
    eventAttendance: [],
    paymentTrends: [],
    userRoleDistribution: [],
  });

  // Fetch real-time data from Supabase
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Admin Dashboard: Starting data fetch...");

      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("❌ Auth error:", authError);
        throw new Error("Authentication failed");
      }
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      console.log("✅ User authenticated:", user.id);

      // Fetch users with role details - with better error handling
      console.log("📊 Fetching users data...");
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select(`
          *,
          student_details(*),
          staff_details(*)
        `);

      if (usersError) {
        console.error("❌ Users fetch error:", usersError);
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }
      
      console.log(`✅ Users fetched: ${users?.length || 0} records`);

      // Fetch memberships with user details
      console.log("👥 Fetching memberships data...");
      const { data: memberships, error: membershipsError } = await supabase
        .from("memberships")
        .select(`
          *,
          profiles!memberships_user_id_fkey(
            first_name,
            last_name,
            role
          )
        `);

      if (membershipsError) {
        console.error("❌ Memberships fetch error:", membershipsError);
        throw new Error(`Failed to fetch memberships: ${membershipsError.message}`);
      }
      
      console.log(`✅ Memberships fetched: ${memberships?.length || 0} records`);

      // Fetch events with registration counts
      console.log("📅 Fetching events data...");
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select(`
          *,
          event_registrations(count)
        `);

      if (eventsError) {
        console.error("❌ Events fetch error:", eventsError);
        throw new Error(`Failed to fetch events: ${eventsError.message}`);
      }
      
      console.log(`✅ Events fetched: ${events?.length || 0} records`);

      // Fetch payments with user details
      console.log("💳 Fetching payments data...");
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          *,
          profiles!payments_user_id_fkey(
            first_name,
            last_name,
            role
          )
        `);

      if (paymentsError) {
        console.error("❌ Payments fetch error:", paymentsError);
        // Don't throw error for payments as it might not exist yet
        console.warn("Continuing without payments data...");
      }
      
      console.log(`✅ Payments fetched: ${payments?.length || 0} records`);

      // Process data
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // User statistics
      const totalUsers = users.length;
      const totalStudents = users.filter((u) => u.role === "student").length;
      const totalStaff = users.filter((u) => u.role === "staff").length;
      const totalAdmins = users.filter((u) => u.role === "admin").length;

      // Membership statistics
      const activeMemberships = memberships.filter(
        (m) => m.status === "active"
      ).length;
      const pendingMemberships = memberships.filter(
        (m) => m.status === "pending_approval"
      ).length;
      const expiredMemberships = memberships.filter(
        (m) => m.status === "expired"
      ).length;
      const rejectedMemberships = memberships.filter(
        (m) => m.status === "rejected"
      ).length;

      // Event statistics
      const totalEvents = events.length;
      const upcomingEvents = events.filter(
        (e) => new Date(e.event_date) > now
      ).length;
      const completedEvents = events.filter(
        (e) => new Date(e.event_date) < now
      ).length;

      // Payment statistics
      const totalPayments = payments.length;
      const pendingPayments = payments.filter(
        (p) => p.status === "pending"
      ).length;
      const approvedPayments = payments.filter(
        (p) => p.status === "approved"
      ).length;
      const rejectedPayments = payments.filter(
        (p) => p.status === "rejected"
      ).length;

      // Revenue calculations
      const totalRevenue = payments
        .filter((p) => p.status === "approved")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const monthlyRevenue = payments
        .filter((p) => {
          const paymentDate = new Date(p.payment_date);
          return (
            p.status === "approved" &&
            paymentDate.getMonth() === currentMonth &&
            paymentDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      // Membership by tier
      const membershipsByTier = [
        {
          tier: "Bronze",
          count: memberships.filter(
            (m) => m.tier === "bronze" && m.status === "active"
          ).length,
        },
        {
          tier: "Silver",
          count: memberships.filter(
            (m) => m.tier === "silver" && m.status === "active"
          ).length,
        },
        {
          tier: "Gold",
          count: memberships.filter(
            (m) => m.tier === "gold" && m.status === "active"
          ).length,
        },
      ];

      // User role distribution
      const userRoleDistribution = [
        { role: "Students", count: totalStudents },
        { role: "Staff", count: totalStaff },
        { role: "Admins", count: totalAdmins },
      ];

      // Monthly growth data (last 6 months)
      const monthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthName = date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
        const monthMemberships = memberships.filter((m) => {
          const membershipDate = new Date(m.created_at);
          return (
            membershipDate.getMonth() === date.getMonth() &&
            membershipDate.getFullYear() === date.getFullYear()
          );
        }).length;

        monthlyGrowth.push({
          month: monthName,
          memberships: monthMemberships,
          revenue: payments
            .filter((p) => {
              const paymentDate = new Date(p.payment_date);
              return (
                p.status === "approved" &&
                paymentDate.getMonth() === date.getMonth() &&
                paymentDate.getFullYear() === date.getFullYear()
              );
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0),
        });
      }

      // Recent registrations (last 5)
      const recentRegistrations = users
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5)
        .map((user) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          created_at: user.created_at,
        }));

      setDashboardData({
        totalUsers,
        totalStudents,
        totalStaff,
        totalAdmins,
        activeMemberships,
        pendingMemberships,
        expiredMemberships,
        rejectedMemberships,
        totalEvents,
        upcomingEvents,
        completedEvents,
        totalPayments,
        pendingPayments,
        approvedPayments,
        rejectedPayments,
        totalRevenue,
        monthlyRevenue,
        recentRegistrations,
        membershipsByTier,
        monthlyGrowth,
        eventAttendance: [],
        paymentTrends: [],
        userRoleDistribution,
      });

      setLastUpdated(new Date());
      toast.success("Dashboard data updated successfully");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    const channels = [
      supabase
        .channel("profiles_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            fetchDashboardData();
          }
        )
        .subscribe(),

      supabase
        .channel("memberships_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "memberships" },
          () => {
            fetchDashboardData();
          }
        )
        .subscribe(),

      supabase
        .channel("payments_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "payments" },
          () => {
            fetchDashboardData();
          }
        )
        .subscribe(),

      supabase
        .channel("events_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "events" },
          () => {
            fetchDashboardData();
          }
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iteam-primary mx-auto mb-4"></div>
          <p>Loading real-time dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-iteam-primary">
            Real-Time Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()} | Auto-refresh: 30s
          </p>
        </div>
        <Button onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Now
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalUsers}</div>
            <p className="text-xs opacity-90">
              {dashboardData.totalStudents} Students, {dashboardData.totalStaff}{" "}
              Staff, {dashboardData.totalAdmins} Admins
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Members
            </CardTitle>
            <UserCheck className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.activeMemberships}
            </div>
            <p className="text-xs opacity-90">
              {dashboardData.pendingMemberships} pending approval
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {dashboardData.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs opacity-90">
              Rs. {dashboardData.monthlyRevenue.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalEvents}
            </div>
            <p className="text-xs opacity-90">
              {dashboardData.upcomingEvents} upcoming,{" "}
              {dashboardData.completedEvents} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Growth & Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="memberships"
                    stackId="1"
                    stroke="#001155"
                    fill="#001155"
                    fillOpacity={0.6}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stackId="2"
                    stroke="#4CAF50"
                    fill="#4CAF50"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Membership Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.membershipsByTier}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tier, count }) => `${tier}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {dashboardData.membershipsByTier.map((entry, index) => (
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

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-500" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Membership Approvals</span>
              <Badge variant="secondary">
                {dashboardData.pendingMemberships}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Payment Verifications</span>
              <Badge variant="secondary">{dashboardData.pendingPayments}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Approved Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Active Memberships</span>
              <Badge variant="default">{dashboardData.activeMemberships}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Verified Payments</span>
              <Badge variant="default">{dashboardData.approvedPayments}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Expired Memberships</span>
              <Badge variant="destructive">
                {dashboardData.expiredMemberships}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Rejected Payments</span>
              <Badge variant="destructive">
                {dashboardData.rejectedPayments}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Recent Registrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.recentRegistrations.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {user.role}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center">
              <UserPlus className="h-6 w-6 mb-2" />
              Add User
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <CalendarPlus className="h-6 w-6 mb-2" />
              Create Event
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <CreditCard className="h-6 w-6 mb-2" />
              View Payments
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Eye className="h-6 w-6 mb-2" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeAdminDashboard;
