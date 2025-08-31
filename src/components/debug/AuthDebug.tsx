import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuthDebugInfo {
  user: any;
  session: any;
  profile: any;
  authStatus: string;
  permissions: {
    canReadProfiles: boolean;
    canReadEvents: boolean;
    canReadRegistrations: boolean;
    canReadMemberships: boolean;
  };
}

export const AuthDebug: React.FC = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const checkPermissions = async () => {
    try {
      const session = await supabase.auth.getSession();

      // Test various table access
      const profileTest = await supabase.from("profiles").select("id").limit(1);
      const eventsTest = await supabase.from("events").select("id").limit(1);
      const registrationsTest = await supabase
        .from("event_registrations")
        .select("id")
        .limit(1);
      const membershipsTest = await supabase
        .from("memberships")
        .select("id")
        .limit(1);

      // Get current user profile
      let profile = null;
      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully
        profile = data;
      }

      setDebugInfo({
        user: user,
        session: session.data.session,
        profile: profile,
        authStatus: session.data.session
          ? "Authenticated"
          : "Not Authenticated",
        permissions: {
          canReadProfiles: !profileTest.error,
          canReadEvents: !eventsTest.error,
          canReadRegistrations: !registrationsTest.error,
          canReadMemberships: !membershipsTest.error,
        },
      });
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      checkPermissions();
    }
  }, [isVisible, user]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
        >
          🐛 Debug Auth
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-yellow-50 border-yellow-300">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm text-yellow-800">
              Auth Debug Info
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          {debugInfo ? (
            <>
              <div>
                <strong>Auth Status:</strong>
                <span
                  className={
                    debugInfo.authStatus === "Authenticated"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {debugInfo.authStatus}
                </span>
              </div>

              <div>
                <strong>User ID:</strong> {debugInfo.user?.id || "None"}
              </div>

              <div>
                <strong>User Email:</strong> {debugInfo.user?.email || "None"}
              </div>

              <div>
                <strong>Profile Role:</strong>{" "}
                {debugInfo.profile?.role || "None"}
              </div>

              <div>
                <strong>Session Valid:</strong>
                <span
                  className={
                    debugInfo.session ? "text-green-600" : "text-red-600"
                  }
                >
                  {debugInfo.session ? "Yes" : "No"}
                </span>
              </div>

              <div className="border-t pt-2">
                <strong>Table Access:</strong>
                <div className="ml-2 space-y-1">
                  <div>
                    Profiles:{" "}
                    <span
                      className={
                        debugInfo.permissions.canReadProfiles
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {debugInfo.permissions.canReadProfiles ? "✓" : "✗"}
                    </span>
                  </div>
                  <div>
                    Events:{" "}
                    <span
                      className={
                        debugInfo.permissions.canReadEvents
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {debugInfo.permissions.canReadEvents ? "✓" : "✗"}
                    </span>
                  </div>
                  <div>
                    Registrations:{" "}
                    <span
                      className={
                        debugInfo.permissions.canReadRegistrations
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {debugInfo.permissions.canReadRegistrations ? "✓" : "✗"}
                    </span>
                  </div>
                  <div>
                    Memberships:{" "}
                    <span
                      className={
                        debugInfo.permissions.canReadMemberships
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {debugInfo.permissions.canReadMemberships ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkPermissions}
                  className="w-full text-xs"
                >
                  Refresh
                </Button>
              </div>
            </>
          ) : (
            <div>Loading debug info...</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebug;
