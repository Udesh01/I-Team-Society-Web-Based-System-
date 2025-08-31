import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  FileText,
  Calendar,
  User,
  AlertCircle,
} from "lucide-react";

const PaymentManagement = () => {
  const { user } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");

  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      try {
        console.log("🔍 PaymentManagement: Fetching payments with profiles...");

        // First, let's try a direct join approach
        const { data: paymentsWithProfiles, error: joinError } = await supabase
          .from("payments")
          .select(
            `
            *,
            profiles:user_id (
              id,
              first_name,
              last_name,
              role
            ),
            memberships:membership_id (
              id,
              tier,
              eid
            ),
            verified_by_profile:verified_by (
              id,
              first_name,
              last_name
            )
          `
          )
          .order("created_at", { ascending: false });

        if (!joinError && paymentsWithProfiles) {
          console.log(
            "✅ PaymentManagement: Successfully fetched payments with joins",
            {
              count: paymentsWithProfiles.length,
              sample: paymentsWithProfiles[0],
            }
          );
          return paymentsWithProfiles;
        }

        console.warn(
          "⚠️ PaymentManagement: Join query failed, falling back to manual fetch",
          joinError
        );

        // Fallback to manual fetching
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        console.log(
          "🔄 PaymentManagement: Manually fetching related data for",
          data?.length,
          "payments"
        );

        // Manually fetch related data
        const paymentsWithRelations = await Promise.all(
          (data || []).map(async (payment) => {
            console.log(
              "🔍 Processing payment:",
              payment.id,
              "for user:",
              payment.user_id
            );

            // Fetch user profile
            let profiles = null;
            if (payment.user_id) {
              try {
                const { data: profileData, error: profileError } =
                  await supabase
                    .from("profiles")
                    .select("id, first_name, last_name, role")
                    .eq("id", payment.user_id)
                    .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

                if (profileError) {
                  console.error(
                    "❌ Profile fetch error for user",
                    payment.user_id,
                    ":",
                    profileError
                  );
                } else if (!profileData) {
                  console.warn(
                    "⚠️ No profile found for user:",
                    payment.user_id
                  );
                } else {
                  console.log(
                    "✅ Profile found for user:",
                    payment.user_id,
                    profileData
                  );
                }

                profiles = profileData;
              } catch (e) {
                console.error(
                  "❌ Exception fetching profile for user",
                  payment.user_id,
                  ":",
                  e
                );
              }
            } else {
              console.warn("⚠️ Payment has no user_id:", payment.id);
            }

            // Fetch verified_by profile if exists
            let verified_by_profile = null;
            if (payment.verified_by) {
              try {
                const { data: verifierData } = await supabase
                  .from("profiles")
                  .select("id, first_name, last_name")
                  .eq("id", payment.verified_by)
                  .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully
                verified_by_profile = verifierData;
              } catch (e) {
                console.warn("Could not fetch verifier profile:", e);
              }
            }

            // Fetch membership if exists
            let memberships = null;
            if (payment.membership_id) {
              try {
                const { data: membershipData } = await supabase
                  .from("memberships")
                  .select("id, tier, eid")
                  .eq("id", payment.membership_id)
                  .maybeSingle(); // Use maybeSingle() to handle missing memberships gracefully
                memberships = membershipData;
              } catch (e) {
                console.warn("Could not fetch membership:", e);
              }
            }

            const result = {
              ...payment,
              profiles,
              verified_by_profile,
              memberships,
            };

            console.log("📦 Final payment object:", {
              id: payment.id,
              user_id: payment.user_id,
              has_profile: !!profiles,
              profile_name: profiles
                ? `${profiles.first_name} ${profiles.last_name}`
                : null,
            });

            return result;
          })
        );

        console.log("✅ PaymentManagement: Manual fetch completed", {
          total: paymentsWithRelations.length,
          with_profiles: paymentsWithRelations.filter((p) => p.profiles).length,
          without_profiles: paymentsWithRelations.filter((p) => !p.profiles)
            .length,
        });

        return paymentsWithRelations;
      } catch (error) {
        console.error("❌ Error fetching payments:", error);
        // Return empty array on error to prevent crashes
        return [];
      }
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, status, notes }) => {
      // Ensure status is one of the valid values
      const validStatuses = ["pending", "verified", "rejected"];
      const normalizedStatus = status.toLowerCase();

      if (!validStatuses.includes(normalizedStatus)) {
        throw new Error(
          `Invalid status: ${status}. Must be one of: ${validStatuses.join(
            ", "
          )}`
        );
      }

      const updateData: any = { status: normalizedStatus };

      // Add optional columns
      if (user?.id) updateData.verified_by = user.id;
      if (notes) updateData.verification_notes = notes;
      updateData.verified_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", paymentId)
        .select()
        .maybeSingle(); // Use maybeSingle() to handle edge cases gracefully

      if (error) {
        console.error("Payment update error:", error);
        throw error;
      }

      // If payment is verified, update membership status
      if (normalizedStatus === "verified") {
        const payment = payments.find((p) => p.id === paymentId);
        if (payment?.membership_id) {
          const { error: membershipError } = await supabase
            .from("memberships")
            .update({ status: "active" })
            .eq("id", payment.membership_id);

          if (membershipError) {
            console.error("Membership update error:", membershipError);
            // Don't throw here, payment was already updated successfully
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Payment verification updated successfully");
      setVerifyDialogOpen(false);
      setSelectedPayment(null);
      setVerificationStatus("");
      setVerificationNotes("");
    },
    onError: (error) => {
      toast.error("Failed to update payment: " + error.message);
    },
  });

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  };

  const handleVerifyPayment = (payment) => {
    setSelectedPayment(payment);
    setVerificationStatus(payment.status);
    setVerificationNotes(payment.verification_notes || "");
    setVerifyDialogOpen(true);
  };

  const handleUpdateVerification = () => {
    if (!selectedPayment) return;

    verifyPaymentMutation.mutate({
      paymentId: selectedPayment.id,
      status: verificationStatus,
      notes: verificationNotes,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    total: payments.length,
    verified: payments.filter((p) => p.status === "verified").length,
    pending: payments.filter((p) => p.status === "pending").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
    totalAmount: payments
      .filter((p) => p.status === "verified")
      .reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Management
          </h1>
          <p className="text-gray-600">
            Monitor and verify membership payments
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Payments
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.verified}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  Rs. {stats.totalAmount.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Verified By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {payment.profiles?.first_name &&
                          payment.profiles?.last_name
                            ? `${payment.profiles.first_name} ${payment.profiles.last_name}`
                            : "Unknown Member"}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {payment.profiles?.role || "Unknown Role"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge
                          className={
                            payment.memberships?.tier === "gold"
                              ? "bg-yellow-100 text-yellow-800"
                              : payment.memberships?.tier === "silver"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-orange-100 text-orange-800"
                          }
                        >
                          {payment.memberships?.tier?.toUpperCase() || "N/A"}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {payment.memberships?.eid || "No E-ID"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        Rs. {payment.amount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.payment_method}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(payment.status)}
                          {payment.status?.toUpperCase()}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.verified_by_profile?.first_name &&
                        payment.verified_by_profile?.last_name
                          ? `${payment.verified_by_profile.first_name} ${payment.verified_by_profile.last_name}`
                          : "-"}
                      </div>
                      {payment.verified_at && (
                        <div className="text-xs text-gray-500">
                          {new Date(payment.verified_at).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPayment(payment)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        {payment.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyPayment(payment)}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Verify
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Payment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete payment information and verification status
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Member
                  </Label>
                  <p className="text-sm">
                    {selectedPayment.profiles?.first_name &&
                    selectedPayment.profiles?.last_name
                      ? `${selectedPayment.profiles.first_name} ${selectedPayment.profiles.last_name}`
                      : "Unknown Member"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Role
                  </Label>
                  <p className="text-sm capitalize">
                    {selectedPayment.profiles?.role || "Unknown Role"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Amount
                  </Label>
                  <p className="text-sm font-medium">
                    Rs. {selectedPayment.amount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Payment Method
                  </Label>
                  <p className="text-sm">
                    {selectedPayment.payment_method || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Payment Date
                  </Label>
                  <p className="text-sm">
                    {selectedPayment.payment_date
                      ? new Date(
                          selectedPayment.payment_date
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Status
                  </Label>
                  <Badge className={getStatusColor(selectedPayment.status)}>
                    {selectedPayment.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {selectedPayment.receipt_url && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Receipt
                  </Label>
                  <div className="mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(selectedPayment.receipt_url, "_blank")
                      }
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      View Receipt
                    </Button>
                  </div>
                </div>
              )}

              {selectedPayment.verification_notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Verification Notes
                  </Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">
                    {selectedPayment.verification_notes}
                  </p>
                </div>
              )}

              {selectedPayment.verified_by_profile && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Verified By
                  </Label>
                  <p className="text-sm">
                    {selectedPayment.verified_by_profile?.first_name &&
                    selectedPayment.verified_by_profile?.last_name
                      ? `${selectedPayment.verified_by_profile.first_name} ${selectedPayment.verified_by_profile.last_name}`
                      : "Not verified yet"}
                  </p>
                  {selectedPayment.verified_at && (
                    <p className="text-xs text-gray-500">
                      on{" "}
                      {new Date(
                        selectedPayment.verified_at
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Payment Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Update payment verification status for{" "}
              {selectedPayment?.profiles?.first_name}{" "}
              {selectedPayment?.profiles?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={verificationStatus}
                onValueChange={setVerificationStatus}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right mt-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add verification notes..."
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateVerification}
              disabled={verifyPaymentMutation.isPending}
            >
              {verifyPaymentMutation.isPending
                ? "Updating..."
                : "Update Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagement;
