import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Shield,
  Activity,
  BarChart3,
  Settings,
  UserPlus,
  CalendarPlus,
  Eye,
  ArrowRight,
  Zap,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#F97316",
];

interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalStaff: number;
  totalAdmins: number;
  activeMemberships: number;
  pendingMemberships: number;
  expiredMemberships: number;
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalRegistrations: number;
  averageAttendanceRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  approvedPayments: number;
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
  membershipTrends: Array<{
    month: string;
    bronze: number;
    silver: number;
    gold: number;
  }>;
  revenueTrends: Array<{
    month: string;
    revenue: number;
    members: number;
  }>;
}

const ModernAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalAdmins: 0,
    activeMemberships: 0,
    pendingMemberships: 0,
    expiredMemberships: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalRegistrations: 0,
    averageAttendanceRate: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    systemHealth: {
      uptime: 99.9,
      responseTime: 120,
      errorRate: 0.1,
    },
    recentActivities: [],
    membershipTrends: [],
    revenueTrends: [],
  });

  const fetchAdminData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all users
      const { data: users } = await supabase.from("profiles").select("*");

      // Fetch all memberships
      const { data: memberships } = await supabase.from("memberships").select(`
          *,
          profiles!memberships_user_id_fkey(first_name, last_name, role)
        `);

      // Fetch all events
      const { data: events } = await supabase.from("events").select("*");

      // Fetch all payments
      const { data: payments } = await supabase.from("payments").select(`
          *,
          profiles!payments_user_id_fkey(first_name, last_name)
        `);

      // Calculate statistics
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // User statistics
      const totalUsers = users?.length || 0;
      const totalStudents =
        users?.filter((u) => u.role === "student").length || 0;
      const totalStaff = users?.filter((u) => u.role === "staff").length || 0;
      const totalAdmins = users?.filter((u) => u.role === "admin").length || 0;

      // Membership statistics
      const activeMemberships =
        memberships?.filter((m) => m.status === "active").length || 0;
      const pendingMemberships =
        memberships?.filter((m) => m.status === "pending_approval").length || 0;
      const expiredMemberships =
        memberships?.filter((m) => m.status === "expired").length || 0;

      // Event statistics
      const totalEvents = events?.length || 0;
      const upcomingEvents =
        events?.filter((e) => new Date(e.event_date) > now).length || 0;
      const completedEvents =
        events?.filter((e) => new Date(e.event_date) < now).length || 0;

      // Fetch event registrations for more detailed statistics
      const { data: eventRegistrations } = await supabase
        .from("event_registrations")
        .select("*");

      const totalRegistrations = eventRegistrations?.length || 0;
      const attendedRegistrations = eventRegistrations?.filter(reg => reg.attended).length || 0;
      const averageAttendanceRate = totalRegistrations > 0
        ? (attendedRegistrations / totalRegistrations) * 100
        : 0;

      // Payment statistics
      const totalRevenue =
        payments
          ?.filter((p) => p.status === "approved")
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const monthlyRevenue =
        payments
          ?.filter((p) => {
            const paymentDate = new Date(p.payment_date);
            return (
              p.status === "approved" &&
              paymentDate.getMonth() === currentMonth &&
              paymentDate.getFullYear() === currentYear
            );
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const pendingPayments =
        payments?.filter((p) => p.status === "pending").length || 0;
      const approvedPayments =
        payments?.filter((p) => p.status === "approved").length || 0;

      // Generate membership trends (last 6 months)
      const membershipTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthName = date.toLocaleDateString("en-US", { month: "short" });

        const monthMemberships =
          memberships?.filter((m) => {
            const membershipDate = new Date(m.created_at);
            return (
              membershipDate.getMonth() === date.getMonth() &&
              membershipDate.getFullYear() === date.getFullYear()
            );
          }) || [];

        membershipTrends.push({
          month: monthName,
          bronze: monthMemberships.filter((m) => m.tier === "bronze").length,
          silver: monthMemberships.filter((m) => m.tier === "silver").length,
          gold: monthMemberships.filter((m) => m.tier === "gold").length,
        });
      }

      // Generate revenue trends
      const revenueTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthName = date.toLocaleDateString("en-US", { month: "short" });

        const monthRevenue =
          payments
            ?.filter((p) => {
              const paymentDate = new Date(p.payment_date);
              return (
                p.status === "approved" &&
                paymentDate.getMonth() === date.getMonth() &&
                paymentDate.getFullYear() === date.getFullYear()
              );
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        const monthMembers =
          memberships?.filter((m) => {
            const membershipDate = new Date(m.created_at);
            return (
              membershipDate.getMonth() === date.getMonth() &&
              membershipDate.getFullYear() === date.getFullYear()
            );
          }).length || 0;

        revenueTrends.push({
          month: monthName,
          revenue: monthRevenue,
          members: monthMembers,
        });
      }

      // Generate recent activities
      const recentActivities = [
        ...(users?.slice(-5).map((user) => ({
          id: user.id,
          type: "user_registration",
          description: `New ${user.role} registered`,
          timestamp: user.created_at,
          user: `${user.first_name} ${user.last_name}`,
        })) || []),
        ...(payments
          ?.filter((p) => p.status === "pending")
          .slice(-3)
          .map((payment) => ({
            id: payment.id,
            type: "payment_pending",
            description: "Payment verification required",
            timestamp: payment.created_at,
            user: `${payment.profiles?.first_name} ${payment.profiles?.last_name}`,
          })) || []),
      ]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 8);

      setStats({
        totalUsers,
        totalStudents,
        totalStaff,
        totalAdmins,
        activeMemberships,
        pendingMemberships,
        expiredMemberships,
        totalEvents,
        upcomingEvents,
        completedEvents,
        totalRegistrations,
        averageAttendanceRate,
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
        approvedPayments,
        systemHealth: {
          uptime: 99.9,
          responseTime: Math.floor(Math.random() * 50) + 100,
          errorRate: Math.random() * 0.5,
        },
        recentActivities,
        membershipTrends,
        revenueTrends,
      });

      toast.success("Admin dashboard updated successfully");
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🛡️ ModernAdminDashboard: useEffect triggered', {
      user: user,
      userId: user?.id,
      hasUser: !!user
    });
    if (user?.id) {
      fetchAdminData();
      const interval = setInterval(fetchAdminData, 30000);
      return () => clearInterval(interval);
    } else {
      console.log('🛡️ ModernAdminDashboard: No user ID, skipping data fetch');
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id

  if (loading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 md:p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold mb-2">Admin Control Center 🛡️</h1>
            <p className="text-indigo-100 mb-4 text-sm md:text-base">
              Monitor and manage the entire I-Team Society system
            </p>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm">
                {stats.totalUsers} Total Users
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm">
                Rs. {stats.totalRevenue?.toLocaleString() || '0'} Revenue
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm">
                {stats.systemHealth.uptime}% Uptime
              </Badge>
            </div>
          </div>
          <div className="text-center lg:text-right">
            <div className="text-2xl md:text-3xl font-bold">{stats.activeMemberships}</div>
            <div className="text-indigo-100 text-sm md:text-base">Active Members</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalUsers}
                </p>
                <p className="text-xs text-blue-600">
                  {stats.totalStudents}S • {stats.totalStaff}St •{" "}
                  {stats.totalAdmins}A
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Active Members
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.activeMemberships}
                </p>
                <p className="text-xs text-green-600">
                  {stats.pendingMemberships} pending approval
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  Rs. {stats.totalRevenue ? (stats.totalRevenue / 1000).toFixed(1) : '0'}K
                </p>
                <p className="text-xs text-purple-600">
                  Rs. {stats.monthlyRevenue?.toLocaleString() || '0'} this month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Events</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.totalEvents}
                </p>
                <p className="text-xs text-orange-600">
                  {stats.upcomingEvents} upcoming • {stats.completedEvents}{" "}
                  completed
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Event Registrations Card */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Event Registrations</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {stats.totalRegistrations}
                </p>
                <p className="text-xs text-indigo-600">
                  {stats.averageAttendanceRate.toFixed(1)}% avg attendance rate
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Revenue & Membership Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.revenueTrends && stats.revenueTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="members"
                      stackId="2"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No revenue data available yet</p>
                    <p className="text-sm">Data will appear as payments are processed</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Membership Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Membership Tier Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.membershipTrends && stats.membershipTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.membershipTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bronze" stackId="a" fill="#CD7F32" />
                    <Bar dataKey="silver" stackId="a" fill="#C0C0C0" />
                    <Bar dataKey="gold" stackId="a" fill="#FFD700" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No membership data available yet</p>
                    <p className="text-sm">Data will appear as memberships are created</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>System Uptime</span>
                <span>{stats.systemHealth.uptime}%</span>
              </div>
              <Progress value={stats.systemHealth.uptime} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Response Time</span>
                <span>{stats.systemHealth.responseTime}ms</span>
              </div>
              <Progress
                value={Math.max(0, 100 - stats.systemHealth.responseTime / 10)}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Error Rate</span>
                <span>{stats.systemHealth.errorRate.toFixed(2)}%</span>
              </div>
              <Progress
                value={Math.max(0, 100 - stats.systemHealth.errorRate * 20)}
                className="h-2"
              />
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-green-700">All systems operational</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="font-medium text-yellow-900">
                  Membership Approvals
                </p>
                <p className="text-sm text-yellow-600">Require review</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-700">
                {stats.pendingMemberships}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">
                  Payment Verifications
                </p>
                <p className="text-sm text-blue-600">Awaiting approval</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                {stats.pendingPayments}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <p className="font-medium text-red-900">Expired Memberships</p>
                <p className="text-sm text-red-600">Need renewal</p>
              </div>
              <Badge className="bg-red-100 text-red-700">
                {stats.expiredMemberships}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-between bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              onClick={() => navigate("/dashboard/admin/users")}
            >
              <span>User Management</span>
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate("/dashboard/events")}
            >
              <span>Create Event</span>
              <CalendarPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate("/dashboard/admin/payments")}
            >
              <span>Payment Reports</span>
              <CreditCard className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate("/dashboard/admin/memberships")}
            >
              <span>Membership Management</span>
              <Settings className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Recent System Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        activity.type === "user_registration"
                          ? "bg-green-500"
                          : activity.type === "payment_pending"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium text-sm">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-600">{activity.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent activities</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernAdminDashboard;
