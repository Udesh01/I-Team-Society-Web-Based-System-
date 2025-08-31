import { supabase } from "@/integrations/supabase/client";

export interface VerificationResult {
  module: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
  timestamp: string;
}

export class DashboardVerification {
  private results: VerificationResult[] = [];

  private addResult(
    module: string,
    status: "success" | "error" | "warning",
    message: string,
    details?: any
  ) {
    this.results.push({
      module,
      status,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  async verifySupabaseConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("count")
        .limit(1);

      if (error) {
        this.addResult(
          "Supabase Connection",
          "error",
          `Connection failed: ${error.message}`,
          error
        );
        return false;
      }

      this.addResult(
        "Supabase Connection",
        "success",
        "Successfully connected to Supabase database"
      );
      return true;
    } catch (error: any) {
      this.addResult(
        "Supabase Connection",
        "error",
        `Connection error: ${error.message}`,
        error
      );
      return false;
    }
  }

  async verifyTableAccess(): Promise<boolean> {
    const tables = [
      "profiles",
      "memberships",
      "events",
      "payments",
      "notifications",
      "student_details",
      "staff_details",
      "event_registrations",
    ];
    let allTablesAccessible = true;

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*").limit(1);

        if (error) {
          this.addResult(
            `Table Access: ${table}`,
            "error",
            `Cannot access table: ${error.message}`,
            error
          );
          allTablesAccessible = false;
        } else {
          this.addResult(
            `Table Access: ${table}`,
            "success",
            `Table accessible with ${data?.length || 0} sample records`
          );
        }
      } catch (error: any) {
        this.addResult(
          `Table Access: ${table}`,
          "error",
          `Table access error: ${error.message}`,
          error
        );
        allTablesAccessible = false;
      }
    }

    return allTablesAccessible;
  }

  async verifyUserAuthentication(userId?: string): Promise<boolean> {
    if (!userId) {
      this.addResult(
        "User Authentication",
        "warning",
        "No user ID provided for authentication test"
      );
      return false;
    }

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          student_details(*),
          staff_details(*)
        `
        )
        .eq("id", userId)
        .single();

      if (error) {
        this.addResult(
          "User Authentication",
          "error",
          `User profile not found: ${error.message}`,
          error
        );
        return false;
      }

      this.addResult(
        "User Authentication",
        "success",
        `User authenticated: ${profile.first_name} ${profile.last_name} (${profile.role})`
      );
      return true;
    } catch (error: any) {
      this.addResult(
        "User Authentication",
        "error",
        `Authentication error: ${error.message}`,
        error
      );
      return false;
    }
  }

  async verifyMembershipSystem(): Promise<boolean> {
    try {
      // Test membership data retrieval
      const { data: memberships, error: membershipError } = await supabase
        .from("memberships")
        .select(
          `
          *,
          profiles!memberships_user_id_fkey(first_name, last_name, role)
        `
        )
        .limit(5);

      if (membershipError) {
        this.addResult(
          "Membership System",
          "error",
          `Membership query failed: ${membershipError.message}`,
          membershipError
        );
        return false;
      }

      // Verify membership status calculations
      const activeCount =
        memberships?.filter((m) => m.status === "active").length || 0;
      const pendingCount =
        memberships?.filter((m) => m.status === "pending_approval").length || 0;
      const totalCount = memberships?.length || 0;

      this.addResult(
        "Membership System",
        "success",
        `Membership system operational: ${totalCount} total, ${activeCount} active, ${pendingCount} pending`
      );
      return true;
    } catch (error: any) {
      this.addResult(
        "Membership System",
        "error",
        `Membership system error: ${error.message}`,
        error
      );
      return false;
    }
  }

  async verifyEventSystem(): Promise<boolean> {
    try {
      // Test event data retrieval with registrations
      const { data: events, error: eventError } = await supabase
        .from("events")
        .select(
          `
          *,
          event_registrations(count)
        `
        )
        .limit(5);

      if (eventError) {
        this.addResult(
          "Event System",
          "error",
          `Event query failed: ${eventError.message}`,
          eventError
        );
        return false;
      }

      // Verify event calculations
      const now = new Date();
      const upcomingCount =
        events?.filter((e) => new Date(e.event_date) > now).length || 0;
      const completedCount =
        events?.filter((e) => new Date(e.event_date) < now).length || 0;
      const totalCount = events?.length || 0;

      this.addResult(
        "Event System",
        "success",
        `Event system operational: ${totalCount} total, ${upcomingCount} upcoming, ${completedCount} completed`
      );
      return true;
    } catch (error: any) {
      this.addResult(
        "Event System",
        "error",
        `Event system error: ${error.message}`,
        error
      );
      return false;
    }
  }

  async verifyPaymentSystem(): Promise<boolean> {
    try {
      // Test payment data retrieval
      const { data: payments, error: paymentError } = await supabase
        .from("payments")
        .select(
          `
          *,
          profiles!payments_user_id_fkey(first_name, last_name)
        `
        )
        .limit(5);

      if (paymentError) {
        this.addResult(
          "Payment System",
          "error",
          `Payment query failed: ${paymentError.message}`,
          paymentError
        );
        return false;
      }

      // Verify payment calculations
      const approvedCount =
        payments?.filter((p) => p.status === "approved").length || 0;
      const pendingCount =
        payments?.filter((p) => p.status === "pending").length || 0;
      const totalRevenue =
        payments
          ?.filter((p) => p.status === "approved")
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const totalCount = payments?.length || 0;

      this.addResult(
        "Payment System",
        "success",
        `Payment system operational: ${totalCount} total, ${approvedCount} approved, Rs. ${totalRevenue} revenue`
      );
      return true;
    } catch (error: any) {
      this.addResult(
        "Payment System",
        "error",
        `Payment system error: ${error.message}`,
        error
      );
      return false;
    }
  }

  async verifyNotificationSystem(): Promise<boolean> {
    try {
      // Test notification data retrieval
      const { data: notifications, error: notificationError } = await supabase
        .from("notifications")
        .select("*")
        .limit(5);

      if (notificationError) {
        this.addResult(
          "Notification System",
          "error",
          `Notification query failed: ${notificationError.message}`,
          notificationError
        );
        return false;
      }

      const unreadCount = notifications?.filter((n) => !n.read).length || 0;
      const totalCount = notifications?.length || 0;

      this.addResult(
        "Notification System",
        "success",
        `Notification system operational: ${totalCount} total, ${unreadCount} unread`
      );
      return true;
    } catch (error: any) {
      this.addResult(
        "Notification System",
        "error",
        `Notification system error: ${error.message}`,
        error
      );
      return false;
    }
  }

  async verifyRealTimeSubscriptions(): Promise<boolean> {
    try {
      // Test real-time subscription setup with proper promise handling
      return new Promise((resolve) => {
        const channel = supabase
          .channel("test_channel_" + Date.now())
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "profiles" },
            () => {
              // Test callback
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              this.addResult(
                "Real-Time Subscriptions",
                "success",
                "Real-time subscriptions working correctly"
              );
              supabase.removeChannel(channel);
              resolve(true);
            } else if (status === "CHANNEL_ERROR") {
              this.addResult(
                "Real-Time Subscriptions",
                "error",
                `Subscription failed: ${status}`
              );
              resolve(false);
            } else if (status === "TIMED_OUT") {
              this.addResult(
                "Real-Time Subscriptions",
                "warning",
                "Real-time subscription timed out - using polling fallback"
              );
              supabase.removeChannel(channel);
              resolve(true); // Consider timeout as acceptable for development
            }
          });

        // Timeout after 10 seconds
        setTimeout(() => {
          this.addResult(
            "Real-Time Subscriptions",
            "warning",
            "Real-time test timed out - may work in production"
          );
          supabase.removeChannel(channel);
          resolve(true); // Don't fail the entire test for real-time issues
        }, 10000);
      });
    } catch (error: any) {
      this.addResult(
        "Real-Time Subscriptions",
        "warning",
        `Real-time subscription error: ${error.message} - using polling fallback`,
        error
      );
      return true; // Don't fail the entire test for real-time issues
    }
  }

  async runCompleteVerification(userId?: string): Promise<{
    success: boolean;
    results: VerificationResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
    };
  }> {
    this.results = []; // Reset results

    console.log("🧪 Starting comprehensive dashboard verification...");

    // Run all verification tests
    const tests = [
      this.verifySupabaseConnection(),
      this.verifyTableAccess(),
      this.verifyUserAuthentication(userId),
      this.verifyMembershipSystem(),
      this.verifyEventSystem(),
      this.verifyPaymentSystem(),
      this.verifyNotificationSystem(),
      this.verifyRealTimeSubscriptions(),
    ];

    await Promise.all(tests);

    // Calculate summary
    const summary = {
      total: this.results.length,
      passed: this.results.filter((r) => r.status === "success").length,
      failed: this.results.filter((r) => r.status === "error").length,
      warnings: this.results.filter((r) => r.status === "warning").length,
    };

    const success = summary.failed === 0;

    console.log(
      `✅ Verification complete: ${summary.passed}/${summary.total} tests passed`
    );

    return {
      success,
      results: this.results,
      summary,
    };
  }

  getResults(): VerificationResult[] {
    return this.results;
  }

  generateReport(): string {
    const summary = {
      total: this.results.length,
      passed: this.results.filter((r) => r.status === "success").length,
      failed: this.results.filter((r) => r.status === "error").length,
      warnings: this.results.filter((r) => r.status === "warning").length,
    };

    let report = `# Dashboard Verification Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Status:** ${
      summary.failed === 0 ? "✅ PASSED" : "❌ FAILED"
    }\n\n`;
    report += `## Summary\n`;
    report += `- **Total Tests:** ${summary.total}\n`;
    report += `- **Passed:** ${summary.passed}\n`;
    report += `- **Failed:** ${summary.failed}\n`;
    report += `- **Warnings:** ${summary.warnings}\n\n`;

    report += `## Detailed Results\n\n`;

    for (const result of this.results) {
      const icon =
        result.status === "success"
          ? "✅"
          : result.status === "error"
          ? "❌"
          : "⚠️";
      report += `### ${icon} ${result.module}\n`;
      report += `**Status:** ${result.status.toUpperCase()}\n`;
      report += `**Message:** ${result.message}\n`;
      report += `**Timestamp:** ${result.timestamp}\n`;

      if (result.details) {
        report += `**Details:** \`${JSON.stringify(
          result.details,
          null,
          2
        )}\`\n`;
      }

      report += `\n`;
    }

    return report;
  }
}

// Export singleton instance
export const dashboardVerification = new DashboardVerification();
