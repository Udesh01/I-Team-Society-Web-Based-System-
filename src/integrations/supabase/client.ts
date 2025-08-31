import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}
// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Enhanced Supabase client with proper session management
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      // Enable automatic token refresh
      autoRefreshToken: true,
      // Persist session in localStorage
      persistSession: true,
      // Detect session in URL (for magic links, etc.)
      detectSessionInUrl: true,
      // Set custom storage for session persistence
      storage: {
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch {
            // Silently fail if localStorage is not available
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
          } catch {
            // Silently fail if localStorage is not available
          }
        },
      },
      // Configure token refresh settings
      storageKey: "supabase.auth.token",
      // Set a reasonable timeout for auth requests
      flowType: "pkce",
    },
    // Global configuration
    global: {
      headers: {
        "X-Client-Info": "iteam-society-hub",
      },
    },
    // Real-time configuration
    realtime: {
      // Enable automatic reconnection
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
