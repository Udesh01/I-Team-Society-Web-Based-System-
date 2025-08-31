import React, { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MainLayout from "@/components/layout/MainLayout";

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token and type from URL parameters
        const token = searchParams.get("token");
        const type = searchParams.get("type");

        if (type === "signup" && token) {
          // Verify the email confirmation token
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "signup",
          });

          if (error) {
            console.error("Email confirmation error:", error);
            setStatus("error");
            setMessage(
              "Email confirmation failed. The link may be expired or invalid. Please try registering again."
            );
          } else if (data.user) {
            setStatus("success");
            setMessage(
              "Email confirmed successfully! You can now login to your account."
            );
          } else {
            setStatus("error");
            setMessage("Email confirmation failed. Please try again.");
          }
        } else {
          setStatus("error");
          setMessage(
            "Invalid confirmation link. Please check your email for the correct link."
          );
        }
      } catch (error) {
        console.error("Confirmation process error:", error);
        setStatus("error");
        setMessage(
          "An error occurred during email confirmation. Please try again."
        );
      }
    };

    // Only run if we have URL parameters
    if (searchParams.has("token") && searchParams.has("type")) {
      handleEmailConfirmation();
    } else {
      setStatus("error");
      setMessage("No confirmation parameters found in URL.");
    }
  }, [searchParams]);

  // If no confirmation needed, redirect to login
  if (!searchParams.has("token") && !searchParams.has("type")) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-iteam-primary">
                Email Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {status === "loading" && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-iteam-primary mx-auto mb-4"></div>
                  <p>Confirming your email...</p>
                </div>
              )}

              {status === "success" && (
                <>
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      ✅ {message}
                    </AlertDescription>
                  </Alert>
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Your email has been successfully verified. You can now
                      access your account.
                    </p>
                    <Button
                      onClick={() => (window.location.href = "/login")}
                      className="bg-iteam-primary hover:bg-iteam-primary/90 w-full"
                    >
                      Go to Login
                    </Button>
                  </div>
                </>
              )}

              {status === "error" && (
                <>
                  <Alert variant="destructive">
                    <AlertDescription>❌ {message}</AlertDescription>
                  </Alert>
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <Button
                        onClick={() =>
                          (window.location.href = "/register-student")
                        }
                        variant="outline"
                        className="w-full"
                      >
                        Try Registration Again
                      </Button>
                      <Button
                        onClick={() => (window.location.href = "/login")}
                        className="bg-iteam-primary hover:bg-iteam-primary/90 w-full"
                      >
                        Back to Login
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      If you continue having issues, please contact support.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default EmailConfirmation;
