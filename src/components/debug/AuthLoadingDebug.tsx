import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AuthLoadingDebug: React.FC = () => {
  const { user, session, role, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkSupabaseState = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setDebugInfo({
          supabaseSession: !!currentSession,
          supabaseUser: !!currentUser,
          sessionUserId: currentSession?.user?.id,
          userUserId: currentUser?.id,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        setDebugInfo({
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    };

    checkSupabaseState();
    const interval = setInterval(checkSupabaseState, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleForceRefresh = () => {
    window.location.reload();
  };

  const handleClearAuth = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
    return (
      // <div className="fixed bottom-4 right-4 z-50">
      //   <Card className="w-80 max-h-96 overflow-auto">
      //     <CardHeader>
      //       <CardTitle className="text-sm">Auth Debug Info</CardTitle>
      //     </CardHeader>
      //     <CardContent className="space-y-2 text-xs">
      //       <div className="flex justify-between">
      //         <span>Time Elapsed:</span>
      //         <Badge variant="outline">{timeElapsed}s</Badge>
      //       </div>

      //       <div className="flex justify-between">
      //         <span>Loading:</span>
      //         <Badge variant={loading ? "destructive" : "default"}>
      //           {loading ? "YES" : "NO"}
      //         </Badge>
      //       </div>

      //       <div className="flex justify-between">
      //         <span>Has User:</span>
      //         <Badge variant={user ? "default" : "secondary"}>
      //           {user ? "YES" : "NO"}
      //         </Badge>
      //       </div>

      //       <div className="flex justify-between">
      //         <span>Has Session:</span>
      //         <Badge variant={session ? "default" : "secondary"}>
      //           {session ? "YES" : "NO"}
      //         </Badge>
      //       </div>

      //       <div className="flex justify-between">
      //         <span>Role:</span>
      //         <Badge variant="outline">
      //           {role || "NULL"}
      //         </Badge>
      //       </div>

      //       <div className="border-t pt-2 mt-2">
      //         <div className="text-xs text-gray-500">Supabase State:</div>
      //         <div className="flex justify-between">
      //           <span>Session:</span>
      //           <Badge variant={debugInfo.supabaseSession ? "default" : "secondary"}>
      //             {debugInfo.supabaseSession ? "YES" : "NO"}
      //           </Badge>
      //         </div>
      //         <div className="flex justify-between">
      //           <span>User:</span>
      //           <Badge variant={debugInfo.supabaseUser ? "default" : "secondary"}>
      //             {debugInfo.supabaseUser ? "YES" : "NO"}
      //           </Badge>
      //         </div>
      //       </div>

      //       {debugInfo.error && (
      //         <div className="text-red-500 text-xs mt-2">
      //           Error: {debugInfo.error}
      //         </div>
      //       )}

      //       <div className="space-y-1 pt-2">
      //         <Button size="sm" onClick={handleForceRefresh} className="w-full">
      //           Force Refresh
      //         </Button>
      //         <Button
      //           size="sm"
      //           variant="outline"
      //           onClick={handleClearAuth}
      //           className="w-full"
      //         >
      //           Clear Auth & Redirect
      //         </Button>
      //       </div>
      //     </CardContent>
      //   </Card>
      // </div>
      <></>
    );
  }

  return null;
};

export default AuthLoadingDebug;
