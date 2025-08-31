import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface DataTest {
  name: string;
  status: "loading" | "success" | "error";
  data?: any;
  error?: string;
  count?: number;
}

const DashboardDataDebug: React.FC = () => {
  const { user, role } = useAuth();
  const [tests, setTests] = useState<DataTest[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [testing, setTesting] = useState(false);

  const runDataTests = async () => {
    if (!user) return;

    setTesting(true);
    const testResults: DataTest[] = [];

    // Test 1: Profile Data
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

      testResults.push({
        name: "Profile Data",
        status: error ? "error" : "success",
        data: profile,
        error: error?.message,
      });
    } catch (err: any) {
      testResults.push({
        name: "Profile Data",
        status: "error",
        error: err.message,
      });
    }

    // Test 2: Membership Data
    try {
      const { data: membership, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      testResults.push({
        name: "Membership Data",
        status: error ? "error" : "success",
        data: membership?.[0],
        error: error?.message,
        count: membership?.length || 0,
      });
    } catch (err: any) {
      testResults.push({
        name: "Membership Data",
        status: "error",
        error: err.message,
      });
    }

    // Test 3: Events Data
    try {
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      testResults.push({
        name: "Events Data",
        status: error ? "error" : "success",
        data: events,
        error: error?.message,
        count: events?.length || 0,
      });
    } catch (err: any) {
      testResults.push({
        name: "Events Data",
        status: "error",
        error: err.message,
      });
    }

    // Test 4: Event Registrations
    try {
      const { data: registrations, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("user_id", user.id);

      testResults.push({
        name: "Event Registrations",
        status: error ? "error" : "success",
        data: registrations,
        error: error?.message,
        count: registrations?.length || 0,
      });
    } catch (err: any) {
      testResults.push({
        name: "Event Registrations",
        status: "error",
        error: err.message,
      });
    }

    // Test 5: Notifications
    try {
      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      testResults.push({
        name: "Notifications",
        status: error ? "error" : "success",
        data: notifications,
        error: error?.message,
        count: notifications?.length || 0,
      });
    } catch (err: any) {
      testResults.push({
        name: "Notifications",
        status: "error",
        error: err.message,
      });
    }

    // Admin-only tests
    if (role === "admin") {
      // Test 6: All Users (Admin only)
      try {
        const { data: users, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, role, created_at")
          .limit(10);

        testResults.push({
          name: "All Users (Admin)",
          status: error ? "error" : "success",
          data: users,
          error: error?.message,
          count: users?.length || 0,
        });
      } catch (err: any) {
        testResults.push({
          name: "All Users (Admin)",
          status: "error",
          error: err.message,
        });
      }

      // Test 7: All Memberships (Admin only)
      try {
        const { data: memberships, error } = await supabase
          .from("memberships")
          .select("*")
          .limit(10);

        testResults.push({
          name: "All Memberships (Admin)",
          status: error ? "error" : "success",
          data: memberships,
          error: error?.message,
          count: memberships?.length || 0,
        });
      } catch (err: any) {
        testResults.push({
          name: "All Memberships (Admin)",
          status: "error",
          error: err.message,
        });
      }
    }

    setTests(testResults);
    setTesting(false);
  };

  useEffect(() => {
    if (user && isVisible) {
      runDataTests();
    }
  }, [user, isVisible]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "loading":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case "loading":
        return <Badge className="bg-blue-100 text-blue-800">Loading</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          🔍 Debug Data
        </Button>
      </div>
    );
  }

  return (
    // <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
    //   <Card className="shadow-xl">
    //     <CardHeader className="pb-3">
    //       <div className="flex items-center justify-between">
    //         <CardTitle className="text-sm">Dashboard Data Debug</CardTitle>
    //         <div className="flex gap-2">
    //           <Button
    //             onClick={runDataTests}
    //             disabled={testing}
    //             size="sm"
    //             variant="outline"
    //           >
    //             {testing ? (
    //               <RefreshCw className="h-3 w-3 animate-spin" />
    //             ) : (
    //               "Refresh"
    //             )}
    //           </Button>
    //           <Button
    //             onClick={() => setIsVisible(false)}
    //             size="sm"
    //             variant="ghost"
    //           >
    //             ×
    //           </Button>
    //         </div>
    //       </div>
    //       <div className="text-xs text-gray-600">
    //         User: {user?.id?.substring(0, 8)}... | Role: {role || "Loading..."}
    //       </div>
    //     </CardHeader>
    //     <CardContent className="space-y-3">
    //       {tests.length === 0 ? (
    //         <div className="text-center text-gray-500 py-4">
    //           <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
    //           <p className="text-sm">Click Refresh to test data fetching</p>
    //         </div>
    //       ) : (
    //         tests.map((test, index) => (
    //           <div key={index} className="border rounded-lg p-3 space-y-2">
    //             <div className="flex items-center justify-between">
    //               <div className="flex items-center gap-2">
    //                 {getStatusIcon(test.status)}
    //                 <span className="text-sm font-medium">{test.name}</span>
    //               </div>
    //               {getStatusBadge(test.status)}
    //             </div>

    //             {test.count !== undefined && (
    //               <div className="text-xs text-gray-600">
    //                 Records: {test.count}
    //               </div>
    //             )}

    //             {test.error && (
    //               <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
    //                 {test.error}
    //               </div>
    //             )}

    //             {test.status === "success" && test.data && (
    //               <div className="text-xs text-green-600">
    //                 ✅ Data loaded successfully
    //               </div>
    //             )}
    //           </div>
    //         ))
    //       )}
    //     </CardContent>
    //   </Card>
    // </div>
    <></>
  );
};

export default DashboardDataDebug;
