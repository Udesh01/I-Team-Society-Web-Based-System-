import { supabase } from "@/integrations/supabase/client";

export interface DashboardData {
  profile: any;
  membership: any;
  events: any[];
  registrations: any[];
  notifications: any[];
  stats: any;
  roleSpecificData: any;
}

export class RoleBasedDataService {
  /**
   * Fetch all dashboard data based on user role
   */
  static async fetchDashboardData(
    userId: string,
    role: string
  ): Promise<DashboardData> {
    console.log(
      `🔍 Fetching dashboard data for user ${userId} with role ${role}`
    );

    try {
      // Base data that all roles need
      const baseData = await this.fetchBaseData(userId);

      // Role-specific data
      let roleSpecificData = {};
      switch (role) {
        case "admin":
          roleSpecificData = await this.fetchAdminData();
          break;
        case "staff":
          roleSpecificData = await this.fetchStaffData(userId);
          break;
        case "student":
          roleSpecificData = await this.fetchStudentData(userId);
          break;
        default:
          console.warn(`Unknown role: ${role}, using student data`);
          roleSpecificData = await this.fetchStudentData(userId);
      }

      return {
        ...baseData,
        roleSpecificData,
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  }

  /**
   * Fetch base data needed by all roles
   */
  private static async fetchBaseData(userId: string) {
    console.log("📊 Fetching base data...");

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    // Fetch membership
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (membershipError) {
      console.warn("Membership fetch error:", membershipError);
    }

    // Fetch events (public data)
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false })
      .limit(10);

    if (eventsError) {
      console.warn("Events fetch error:", eventsError);
    }

    // Fetch user's event registrations
    const { data: registrations, error: registrationsError } = await supabase
      .from("event_registrations")
      .select(
        `
        *,
        events(*)
      `
      )
      .eq("user_id", userId);

    if (registrationsError) {
      console.warn("Registrations fetch error:", registrationsError);
    }

    // Fetch notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (notificationsError) {
      console.warn("Notifications fetch error:", notificationsError);
    }

    // Calculate basic stats
    const stats = this.calculateBaseStats(
      profile,
      membership?.[0],
      events || [],
      registrations || [],
      notifications || []
    );

    return {
      profile,
      membership: membership?.[0] || null,
      events: events || [],
      registrations: registrations || [],
      notifications: notifications || [],
      stats,
    };
  }

  /**
   * Fetch admin-specific data
   */
  private static async fetchAdminData() {
    console.log("👑 Fetching admin data...");

    // Fetch all users
    const { data: allUsers, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch all memberships
    const { data: allMemberships, error: membershipsError } = await supabase
      .from("memberships")
      .select(
        `
        *,
        profiles(first_name, last_name, role)
      `
      )
      .order("created_at", { ascending: false });

    // Fetch all event registrations
    const { data: allRegistrations, error: registrationsError } = await supabase
      .from("event_registrations")
      .select(
        `
        *,
        profiles(first_name, last_name),
        events(name, event_date)
      `
      )
      .order("created_at", { ascending: false });

    return {
      allUsers: allUsers || [],
      allMemberships: allMemberships || [],
      allRegistrations: allRegistrations || [],
      adminStats: this.calculateAdminStats(
        allUsers,
        allMemberships,
        allRegistrations
      ),
    };
  }

  /**
   * Fetch staff-specific data
   */
  private static async fetchStaffData(userId: string) {
    console.log("👨‍💼 Fetching staff data...");

    // Fetch events created by this staff member
    const { data: createdEvents, error: createdEventsError } = await supabase
      .from("events")
      .select(
        `
        *,
        event_registrations(count)
      `
      )
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    // Fetch registrations for events they manage
    const { data: managedRegistrations, error: managedRegistrationsError } =
      await supabase
        .from("event_registrations")
        .select(
          `
        *,
        profiles(first_name, last_name),
        events!inner(*)
      `
        )
        .eq("events.created_by", userId);

    return {
      createdEvents: createdEvents || [],
      managedRegistrations: managedRegistrations || [],
      staffStats: this.calculateStaffStats(createdEvents, managedRegistrations),
    };
  }

  /**
   * Fetch student-specific data
   */
  private static async fetchStudentData(userId: string) {
    console.log("🎓 Fetching student data...");

    // Fetch student details if exists
    const { data: studentDetails, error: studentDetailsError } = await supabase
      .from("student_details")
      .select("*")
      .eq("id", userId)
      .single();

    // Fetch achievements (if table exists)
    const { data: achievements, error: achievementsError } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    return {
      studentDetails: studentDetails || null,
      achievements: achievements || [],
      studentStats: this.calculateStudentStats(achievements),
    };
  }

  /**
   * Calculate base statistics
   */
  private static calculateBaseStats(
    profile: any,
    membership: any,
    events: any[],
    registrations: any[],
    notifications: any[]
  ) {
    const now = new Date();
    const eventsRegistered = registrations.length;
    const eventsAttended = registrations.filter((r) => r.attended).length;
    const attendanceRate =
      eventsRegistered > 0
        ? Math.round((eventsAttended / eventsRegistered) * 100)
        : 0;
    const upcomingEvents = registrations.filter(
      (r) => r.events && new Date(r.events.event_date) > now
    ).length;
    const unreadNotifications = notifications.filter(
      (n) => !n.read && !n.is_read
    ).length;

    return {
      eventsRegistered,
      eventsAttended,
      attendanceRate,
      upcomingEvents,
      unreadNotifications,
      membershipStatus: membership?.status || "none",
      membershipTier: membership?.tier || "none",
    };
  }

  /**
   * Calculate admin statistics
   */
  private static calculateAdminStats(
    users: any[],
    memberships: any[],
    registrations: any[]
  ) {
    const totalUsers = users?.length || 0;
    const totalStudents =
      users?.filter((u) => u.role === "student").length || 0;
    const totalStaff = users?.filter((u) => u.role === "staff").length || 0;
    const totalAdmins = users?.filter((u) => u.role === "admin").length || 0;
    const activeMemberships =
      memberships?.filter((m) => m.status === "active").length || 0;
    const totalRegistrations = registrations?.length || 0;

    return {
      totalUsers,
      totalStudents,
      totalStaff,
      totalAdmins,
      activeMemberships,
      totalRegistrations,
    };
  }

  /**
   * Calculate staff statistics
   */
  private static calculateStaffStats(
    createdEvents: any[],
    managedRegistrations: any[]
  ) {
    const eventsCreated = createdEvents?.length || 0;
    const totalRegistrations = managedRegistrations?.length || 0;
    const attendedRegistrations =
      managedRegistrations?.filter((r) => r.attended).length || 0;

    return {
      eventsCreated,
      totalRegistrations,
      attendedRegistrations,
    };
  }

  /**
   * Calculate student statistics
   */
  private static calculateStudentStats(achievements: any[]) {
    const totalAchievements = achievements?.length || 0;
    const recentAchievements =
      achievements?.filter((a) => {
        const earnedDate = new Date(a.earned_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return earnedDate > thirtyDaysAgo;
      }).length || 0;

    return {
      totalAchievements,
      recentAchievements,
    };
  }
}
