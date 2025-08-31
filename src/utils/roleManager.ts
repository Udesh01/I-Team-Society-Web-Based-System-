import { supabase } from "@/integrations/supabase/client";
import { DatabaseTester } from "./dbTest";

export interface UserRoleResult {
  role: string | null;
  source: "database" | "localStorage" | "default" | "error";
  fromCache: boolean;
}

export class RoleManager {
  private static roleCache = new Map<
    string,
    { role: string | null; timestamp: number; attempts: number }
  >();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_ATTEMPTS = 3;
  private static readonly DEFAULT_ROLE = "student"; // Default fallback role

  /**
   * Get user role with multiple fallback mechanisms
   */
  static async getUserRole(userId: string): Promise<UserRoleResult> {
    try {
      // 1. Check cache first
      const cached = this.roleCache.get(userId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log("📋 RoleManager: Using cached role:", cached.role);
        return {
          role: cached.role,
          source: "database",
          fromCache: true,
        };
      }

      // 2. Try to fetch from database with timeout
      try {
        console.log("🔍 RoleManager: Fetching role from database for:", userId);

        const { data, error } = await Promise.race([
          supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .maybeSingle(), // Use maybeSingle() instead of single() to handle missing records
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Database timeout")), 3000)
          ),
        ]);

        if (error) {
          console.warn("⚠️ RoleManager: Database error:", error.message);

          if (error.code === "PGRST116") {
            // User not found - this is a legitimate null result
            this.roleCache.set(userId, {
              role: null,
              timestamp: Date.now(),
              attempts: 1,
            });
            return {
              role: null,
              source: "database",
              fromCache: false,
            };
          }

          throw error;
        }

        const role = data?.role || null;
        console.log("✅ RoleManager: Role fetched from database:", role);

        // Cache the successful result
        this.roleCache.set(userId, {
          role,
          timestamp: Date.now(),
          attempts: 1,
        });

        return {
          role,
          source: "database",
          fromCache: false,
        };
      } catch (dbError: any) {
        console.error(
          "❌ RoleManager: Database fetch failed:",
          dbError.message
        );

        // 3. Try localStorage fallback
        const localRole = this.getRoleFromLocalStorage(userId);
        if (localRole) {
          console.log(
            "📱 RoleManager: Using localStorage fallback:",
            localRole
          );
          return {
            role: localRole,
            source: "localStorage",
            fromCache: false,
          };
        }

        // 4. Use default role as last resort
        console.log(
          "🔄 RoleManager: Using default role fallback:",
          this.DEFAULT_ROLE
        );

        // Cache the default role with higher attempt count
        const existingCache = this.roleCache.get(userId);
        const attempts = (existingCache?.attempts || 0) + 1;

        // Only cache if we haven't exceeded max attempts
        if (attempts <= this.MAX_CACHE_ATTEMPTS) {
          this.roleCache.set(userId, {
            role: this.DEFAULT_ROLE,
            timestamp: Date.now(),
            attempts,
          });
        }

        return {
          role: this.DEFAULT_ROLE,
          source: "default",
          fromCache: false,
        };
      }
    } catch (error: any) {
      console.error("❌ RoleManager: Unexpected error:", error);

      return {
        role: this.DEFAULT_ROLE,
        source: "error",
        fromCache: false,
      };
    }
  }

  /**
   * Store role in localStorage for offline access
   */
  static storeRoleInLocalStorage(userId: string, role: string | null): void {
    try {
      const roleData = {
        role,
        timestamp: Date.now(),
        userId,
      };
      localStorage.setItem(`user_role_${userId}`, JSON.stringify(roleData));
    } catch (error) {
      console.warn(
        "⚠️ RoleManager: Failed to store role in localStorage:",
        error
      );
    }
  }

  /**
   * Get role from localStorage
   */
  private static getRoleFromLocalStorage(userId: string): string | null {
    try {
      const stored = localStorage.getItem(`user_role_${userId}`);
      if (!stored) return null;

      const roleData = JSON.parse(stored);

      // Check if the stored data is not too old (1 hour)
      if (Date.now() - roleData.timestamp > 60 * 60 * 1000) {
        localStorage.removeItem(`user_role_${userId}`);
        return null;
      }

      return roleData.role;
    } catch (error) {
      console.warn(
        "⚠️ RoleManager: Failed to read role from localStorage:",
        error
      );
      return null;
    }
  }

  /**
   * Clear role cache for a specific user
   */
  static clearUserRoleCache(userId: string): void {
    this.roleCache.delete(userId);
    try {
      localStorage.removeItem(`user_role_${userId}`);
    } catch (error) {
      console.warn("⚠️ RoleManager: Failed to clear localStorage:", error);
    }
  }

  /**
   * Clear all role caches
   */
  static clearAllRoleCaches(): void {
    this.roleCache.clear();
    try {
      // Clear all user role items from localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("user_role_")) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ RoleManager: Failed to clear all localStorage items:",
        error
      );
    }
  }

  /**
   * Test database connectivity and user role
   */
  static async testUserConnection(userId: string): Promise<void> {
    console.log(
      "🧪 RoleManager: Testing database connection for user:",
      userId
    );

    const results = await DatabaseTester.runAllTests(userId);

    results.forEach((result) => {
      const status = result.success ? "✅" : "❌";
      console.log(
        `${status} ${result.test}: ${result.success ? "PASSED" : "FAILED"} (${result.duration}ms)`
      );

      if (!result.success && result.error) {
        console.error(`  Error: ${result.error}`);
      }

      if (result.data) {
        console.log(`  Data:`, result.data);
      }
    });
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    entries: Array<{
      userId: string;
      role: string | null;
      age: number;
      attempts: number;
    }>;
  } {
    const entries = Array.from(this.roleCache.entries()).map(
      ([userId, data]) => ({
        userId: userId.substring(0, 8) + "...",
        role: data.role,
        age: Date.now() - data.timestamp,
        attempts: data.attempts,
      })
    );

    return {
      size: this.roleCache.size,
      entries,
    };
  }
}
