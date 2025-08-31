import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { Eye, Check, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EIDService } from "@/services/supabase/eid.service";

interface PendingMembership {
  id: string;
  user_id: string;
  amount: number;
  tier: string;
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    role: string;
    photo_url?: string;
    student_details?: {
      student_id: string;
      level: number;
      degree: string;
    };
    staff_details?: {
      staff_id: string;
      position: string;
    };
  };
  payments: {
    id: string;
    bank_slip_url: string;
    payment_date: string;
    amount: number;
    status: string;
  }[];
}

const MembershipApproval: React.FC = () => {
  const [pendingMemberships, setPendingMemberships] = useState<
    PendingMembership[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentSlip, setSelectedPaymentSlip] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchPendingMemberships();
  }, []);

  const fetchPendingMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from("memberships")
        .select(
          `
          *,
          profiles!memberships_user_id_fkey(
            first_name,
            last_name,
            role,
            photo_url,
            student_details(*),
            staff_details(*)
          ),
          payments(*)
        `
        )
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingMemberships(data || []);
    } catch (error) {
      console.error("Error fetching pending memberships:", error);
      toast.error("Failed to load pending memberships");
    } finally {
      setLoading(false);
    }
  };

  const approveMembership = async (membershipId: string, userId: string) => {
    try {
      // Check if membership is already approved to prevent duplicate operations
      const { data: existingMembership } = await supabase
        .from("memberships")
        .select("status")
        .eq("id", membershipId)
        .maybeSingle(); // Use maybeSingle() to handle missing memberships gracefully

      if (existingMembership?.status === "active") {
        toast.info("Membership is already approved");
        return;
      }

      // Generate E-ID
      const eid = await EIDService.generateEID(userId, "student");

      // Update membership status and add E-ID
      const { error: membershipError } = await supabase
        .from("memberships")
        .update({
          status: "active",
          eid: eid,
          start_date: new Date().toISOString(),
          end_date: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(), // 1 year from now
        })
        .eq("id", membershipId)
        .eq("status", "pending_approval"); // Only update if still pending

      if (membershipError) {
        if (membershipError.code === "23505") {
          throw new Error("This user already has an active membership");
        }
        throw membershipError;
      }

      // Update payment status
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("membership_id", membershipId);

      if (paymentError) throw paymentError;

      // Create notification for user
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title: "Membership Approved!",
          message: `Congratulations! Your membership has been approved. Your E-ID is: ${eid}. You now have full access to all features.`,
        });

      if (notificationError)
        console.error("Error creating notification:", notificationError);

      toast.success("Membership approved successfully!");
      fetchPendingMemberships(); // Refresh the list
    } catch (error) {
      console.error("Error approving membership:", error);
      toast.error("Failed to approve membership");
    }
  };

  const rejectMembership = async (membershipId: string, userId: string) => {
    try {
      // Check if membership is already processed
      const { data: existingMembership } = await supabase
        .from("memberships")
        .select("status")
        .eq("id", membershipId)
        .maybeSingle(); // Use maybeSingle() to handle missing memberships gracefully

      if (existingMembership?.status !== "pending_approval") {
        toast.info("Membership has already been processed");
        return;
      }

      // Update membership status
      const { error: membershipError } = await supabase
        .from("memberships")
        .update({ status: "rejected" })
        .eq("id", membershipId)
        .eq("status", "pending_approval"); // Only update if still pending

      if (membershipError) throw membershipError;

      // Update payment status
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "rejected",
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("membership_id", membershipId);

      if (paymentError) throw paymentError;

      // Create notification for user
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title: "Membership Application Rejected",
          message:
            "Your membership application has been rejected. Please contact support for more information or resubmit with correct payment details.",
        });

      if (notificationError)
        console.error("Error creating notification:", notificationError);

      toast.success("Membership rejected");
      fetchPendingMemberships(); // Refresh the list
    } catch (error) {
      console.error("Error rejecting membership:", error);
      toast.error("Failed to reject membership");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        Loading pending memberships...
      </div>
    );
  }

  if (pendingMemberships.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No pending membership approvals</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-iteam-primary">
        Pending Membership Approvals
      </h2>

      {pendingMemberships.map((membership) => (
        <Card key={membership.id} className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={membership.profiles.photo_url} />
                  <AvatarFallback>
                    {membership.profiles.first_name[0]}
                    {membership.profiles.last_name[0]}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="font-semibold">
                    {membership.profiles.first_name}{" "}
                    {membership.profiles.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {membership.profiles.role}
                    {membership.profiles.student_details &&
                      ` - Level ${membership.profiles.student_details.level}`}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="capitalize">
                      {membership.tier}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Rs. {membership.amount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {membership.payments.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Payment Slip</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Payment Date:</strong>{" "}
                            {membership.payments[0].payment_date}
                          </div>
                          <div>
                            <strong>Amount:</strong> Rs.{" "}
                            {membership.payments[0].amount}
                          </div>
                        </div>
                        <div className="border rounded-lg p-4">
                          <img
                            src={membership.payments[0].bank_slip_url}
                            alt="Payment Slip"
                            className="max-w-full h-auto"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button asChild variant="outline">
                            <a
                              href={membership.payments[0].bank_slip_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <Button
                  onClick={() =>
                    approveMembership(membership.id, membership.user_id)
                  }
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>

                <Button
                  onClick={() =>
                    rejectMembership(membership.id, membership.user_id)
                  }
                  variant="destructive"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MembershipApproval;
