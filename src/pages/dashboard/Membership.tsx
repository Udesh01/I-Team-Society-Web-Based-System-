import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MembershipService } from "@/services/supabase/membership.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import MembershipRenewal from "@/components/membership/MembershipRenewal";
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  Download,
  FileText,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Upload,
  Users,
  XCircle,
} from "lucide-react";

interface Membership {
  id: string;
  tier: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
  eid: string;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  notes?: string;
  payment_date?: string;
  bank_slip_url?: string;
  status?: string;
  verified_by?: string;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  membership_id: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

const membershipTiers = [
  {
    name: "Bronze",
    price: 500,
    level: 1,
    color: "bg-orange-600",
    icon: Award,
    features: [
      "Basic membership benefits",
      "Access to general events",
      "Community forum access",
      "Monthly newsletter",
      "Basic networking opportunities",
    ],
    description: "Perfect for students starting their journey",
  },
  {
    name: "Silver",
    price: 1000,
    level: 2,
    color: "bg-gray-400",
    icon: Star,
    features: [
      "All Bronze benefits",
      "Priority event registration",
      "Access to workshops",
      "Mentorship program",
      "Career guidance sessions",
      "Exclusive webinars",
    ],
    description: "Ideal for active participants and professionals",
  },
  {
    name: "Gold",
    price: 1500,
    level: 3,
    color: "bg-yellow-500",
    icon: Crown,
    features: [
      "All Silver benefits",
      "VIP event access",
      "One-on-one mentoring",
      "Industry connections",
      "Leadership opportunities",
      "Premium resources",
      "Annual conference access",
    ],
    description: "Ultimate experience for serious professionals",
  },
];

const Membership = () => {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMembershipData();
    }
  }, [user]);

  const fetchMembershipData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

      if (profileError || !profileData) {
        console.error("Missing profile data", profileError);
        toast.error("Unable to load profile. Please try refreshing the page.");
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // Fetch current membership using service
      try {
        const membershipData = await MembershipService.getCurrentMembership(
          user?.id!
        );
        if (membershipData) {
          setMembership(membershipData);
        }
      } catch (error: any) {
        // Only log error if it's not a "no membership found" case
        if (!error.message.includes("No membership found")) {
          console.error("Error fetching membership:", error);
        }
      }

      // Fetch payment history
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (paymentsData) {
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error("Error fetching membership data:", error);
      toast.error("Failed to load membership data");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyMembership = async () => {
    if (!selectedTier || !paymentMethod) {
      toast.error("Please select a membership tier and payment method");
      return;
    }

    try {
      setApplying(true);

      const selectedPlan = membershipTiers.find(
        (tier) => tier.name.toLowerCase() === selectedTier
      );
      if (!selectedPlan) return;

      // Generate E-ID
      const currentYear = new Date().getFullYear();
      const rolePrefix =
        profile?.role === "student"
          ? "STU"
          : profile?.role === "staff"
            ? "STA"
            : "ADM";
      const memberCount = Math.floor(Math.random() * 999) + 1;
      const eid = `ITS/${currentYear}/${rolePrefix}/${memberCount
        .toString()
        .padStart(3, "0")}`;

      // Create membership record using service
      const membershipData = await MembershipService.createMembership({
        user_id: user?.id!,
        tier: selectedTier,
        status: "pending_approval",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        amount: selectedPlan.price,
        eid: eid,
      });

      // Create payment record using service
      await MembershipService.createPayment({
        user_id: user?.id!,
        membership_id: membershipData.id,
        amount: selectedPlan.price,
        notes: paymentMethod
          ? `Payment method: ${paymentMethod}${paymentNotes ? `. Notes: ${paymentNotes}` : ""}`
          : paymentNotes,
        payment_date: new Date().toISOString().split("T")[0], // Use date format, not full ISO string
        bank_slip_url: receiptFile
          ? `receipts/${user?.id}/${Date.now()}_${receiptFile.name}`
          : null,
        status: "pending",
      });

      toast.success("Membership application submitted successfully!");

      // Refresh data
      await fetchMembershipData();

      // Reset form
      setSelectedTier("");
      setPaymentMethod("");
      setReceiptFile(null);
      setPaymentNotes("");
    } catch (error: any) {
      console.error("Error applying for membership:", error);

      // Provide specific error messages
      if (error.message.includes("Permission denied")) {
        toast.error("Permission denied. Please try logging out and back in.");
      } else if (error.message.includes("already have a membership")) {
        toast.error("You already have a membership application pending.");
      } else if (error.message.includes("row-level security")) {
        toast.error(
          "Access denied. Please check your login status and try again."
        );
      } else {
        toast.error(error.message || "Failed to submit membership application");
      }
    } finally {
      setApplying(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "gold":
        return "bg-yellow-500";
      case "silver":
        return "bg-gray-400";
      case "bronze":
        return "bg-orange-600";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "text-green-600 bg-green-100";
      case "pending_approval":
        return "text-yellow-600 bg-yellow-100";
      case "expired":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return CheckCircle;
      case "pending_approval":
        return Clock;
      case "expired":
        return XCircle;
      default:
        return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Admin-specific view
  if (role === "admin") {
    return (
      <div className="space-y-6">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Access</h1>
              <p className="text-red-100">
                As an administrator, you have full system access without
                requiring membership
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-white/20 text-white text-lg px-4 py-2 border-white/30">
                ADMIN
              </Badge>
            </div>
          </div>
        </div>

        {/* Admin Features */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Administrative Privileges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Full system access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">User management capabilities</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Event creation and management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Payment verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Membership management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">System analytics and reports</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Admin Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Administrator Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> As an administrator, you do not need to
                purchase a membership. Your admin role provides you with full
                access to all system features and capabilities. You can manage
                other users' memberships through the admin panel.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">∞</div>
                <div className="text-sm text-gray-600">Access Level</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">All</div>
                <div className="text-sm text-gray-600">Features Available</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">Free</div>
                <div className="text-sm text-gray-600">No Payment Required</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Membership Management</h1>
            <p className="text-purple-100">
              {membership
                ? `Current Status: ${membership.tier?.toUpperCase()} Member`
                : "Join the I-Team Society and unlock exclusive benefits"}
            </p>
          </div>
          <div className="text-right">
            {membership && (
              <div className="space-y-2">
                <Badge
                  className={`${getTierColor(
                    membership.tier
                  )} text-white text-lg px-4 py-2`}
                >
                  {membership.tier?.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-2">
                  {React.createElement(getStatusIcon(membership.status), {
                    className: "h-4 w-4",
                  })}
                  <Badge className={getStatusColor(membership.status)}>
                    {membership.status?.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs
        defaultValue={membership ? "current" : "plans"}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans">Membership Plans</TabsTrigger>
          <TabsTrigger value="current" disabled={!membership}>
            Current Membership
          </TabsTrigger>
          <TabsTrigger value="payment">Payment History</TabsTrigger>
          <TabsTrigger value="apply">Apply/Upgrade</TabsTrigger>
        </TabsList>

        {/* Membership Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available Membership Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {membershipTiers.map((tier) => {
                  const IconComponent = tier.icon;
                  const isCurrentTier =
                    membership?.tier?.toLowerCase() === tier.name.toLowerCase();

                  return (
                    <Card
                      key={tier.name}
                      className={`relative ${
                        isCurrentTier ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <CardHeader className="text-center">
                        <div
                          className={`w-16 h-16 ${tier.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                        >
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">{tier.name}</CardTitle>
                        <div className="text-3xl font-bold text-blue-600">
                          Rs. {tier.price.toLocaleString()}
                          <span className="text-sm text-gray-500 font-normal">
                            /year
                          </span>
                        </div>
                        <p className="text-gray-600">{tier.description}</p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {tier.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {isCurrentTier && (
                          <Badge className="w-full mt-4 bg-blue-500 text-white justify-center">
                            Current Plan
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Current Membership Tab */}
        <TabsContent value="current" className="space-y-6">
          {membership ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Membership Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Membership Tier</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={`${getTierColor(
                            membership.tier
                          )} text-white`}
                        >
                          {membership.tier?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {React.createElement(getStatusIcon(membership.status), {
                          className: "h-4 w-4",
                        })}
                        <Badge className={getStatusColor(membership.status)}>
                          {membership.status?.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>E-ID Number</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                      {membership.eid}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <p className="text-sm mt-1">
                        {new Date(membership.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <p className="text-sm mt-1">
                        {new Date(membership.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>Annual Fee</Label>
                    <p className="text-lg font-semibold text-blue-600 mt-1">
                      Rs. {membership.amount?.toLocaleString()}
                    </p>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        (window.location.href = "/dashboard/profile")
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download E-ID
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowRenewalDialog(true)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Renew
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Membership Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const currentTier = membershipTiers.find(
                      (tier) =>
                        tier.name.toLowerCase() ===
                        membership.tier?.toLowerCase()
                    );
                    return currentTier ? (
                      <ul className="space-y-3">
                        {currentTier.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">
                        No benefits information available
                      </p>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No Active Membership
                </h3>
                <p className="text-gray-600 mb-4">
                  You don't have an active membership. Apply for one to access
                  exclusive benefits.
                </p>
                <Button
                  onClick={() =>
                    document.querySelector('[value="apply"]')?.click()
                  }
                >
                  Apply for Membership
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                payment.status === "approved"
                                  ? "bg-green-500"
                                  : payment.status === "pending"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }
                            >
                              {(payment.status || "unknown").toUpperCase()}
                            </Badge>
                            <span className="font-semibold">
                              Rs. {payment.amount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {payment.notes || "No payment method specified"} •{" "}
                            {payment.payment_date
                              ? new Date(
                                  payment.payment_date
                                ).toLocaleDateString()
                              : "Date not specified"}
                          </p>
                        </div>
                        <div className="text-right">
                          {payment.bank_slip_url && (
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Bank Slip
                            </Button>
                          )}
                        </div>
                      </div>
                      {payment.verification_date && (
                        <p className="text-xs text-gray-500 mt-2">
                          Verified on{" "}
                          {new Date(
                            payment.verification_date
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Payment History
                  </h3>
                  <p className="text-gray-600">
                    Your payment transactions will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apply/Upgrade Tab */}
        <TabsContent value="apply" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {membership ? "Upgrade Membership" : "Apply for Membership"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tier Selection */}
              <div>
                <Label className="text-base font-semibold">
                  Select Membership Tier
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {membershipTiers.map((tier) => {
                    const IconComponent = tier.icon;
                    const isCurrentTier =
                      membership?.tier?.toLowerCase() ===
                      tier.name.toLowerCase();
                    const isSelected = selectedTier === tier.name.toLowerCase();

                    return (
                      <Card
                        key={tier.name}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? "ring-2 ring-blue-500 bg-blue-50"
                            : isCurrentTier
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:shadow-md"
                        }`}
                        onClick={() =>
                          !isCurrentTier &&
                          setSelectedTier(tier.name.toLowerCase())
                        }
                      >
                        <CardContent className="p-4 text-center">
                          <div
                            className={`w-12 h-12 ${tier.color} rounded-full flex items-center justify-center mx-auto mb-3`}
                          >
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-semibold">{tier.name}</h3>
                          <p className="text-lg font-bold text-blue-600">
                            Rs. {tier.price.toLocaleString()}
                          </p>
                          {isCurrentTier && (
                            <Badge className="mt-2 bg-gray-500">Current</Badge>
                          )}
                          {isSelected && !isCurrentTier && (
                            <Badge className="mt-2 bg-blue-500">Selected</Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Payment Method */}
              <div>
                <Label className="text-base font-semibold">
                  Payment Method
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online_payment">
                      Online Payment
                    </SelectItem>
                    <SelectItem value="cash">Cash Payment</SelectItem>
                    {profile?.role === "staff" && (
                      <SelectItem value="salary_deduction">
                        Salary Deduction
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Instructions */}
              {paymentMethod && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Payment Instructions
                    </h4>
                    {paymentMethod === "bank_transfer" && (
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>
                          <strong>Bank:</strong> Bank of Ceylon
                        </p>
                        <p>
                          <strong>Account Name:</strong> I-Team Society - OUSL
                        </p>
                        <p>
                          <strong>Account Number:</strong> 12345678901
                        </p>
                        <p>
                          <strong>Branch:</strong> Nawala Branch
                        </p>
                        <p className="mt-2 font-medium">
                          Please upload your payment receipt below.
                        </p>
                      </div>
                    )}
                    {paymentMethod === "online_payment" && (
                      <div className="text-sm text-blue-700">
                        <p>
                          You will be redirected to our secure payment gateway
                          after submitting this form.
                        </p>
                      </div>
                    )}
                    {paymentMethod === "cash" && (
                      <div className="text-sm text-blue-700">
                        <p>
                          Please visit the I-Team Society office during office
                          hours (9 AM - 5 PM) to make your cash payment.
                        </p>
                      </div>
                    )}
                    {paymentMethod === "salary_deduction" && (
                      <div className="text-sm text-blue-700">
                        <p>
                          The membership fee will be deducted from your monthly
                          salary. HR approval required.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Receipt Upload */}
              {(paymentMethod === "bank_transfer" ||
                paymentMethod === "cash") && (
                <div>
                  <Label className="text-base font-semibold">
                    Upload Payment Receipt
                  </Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        setReceiptFile(e.target.files?.[0] || null)
                      }
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: JPG, PNG, PDF (Max 5MB)
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              <div>
                <Label className="text-base font-semibold">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Any additional information about your payment..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <Separator />

              {/* Summary */}
              {selectedTier && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Application Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Membership Tier:</span>
                        <span className="font-medium">
                          {selectedTier.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Fee:</span>
                        <span className="font-medium">
                          Rs.{" "}
                          {membershipTiers
                            .find((t) => t.name.toLowerCase() === selectedTier)
                            ?.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="font-medium">
                          {paymentMethod?.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium text-yellow-600">
                          Pending Approval
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleApplyMembership}
                disabled={!selectedTier || !paymentMethod || applying}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                size="lg"
              >
                {applying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {membership
                      ? "Submit Upgrade Request"
                      : "Submit Application"}
                  </>
                )}
              </Button>

              {/* Disclaimer */}
              <div className="text-xs text-gray-500 text-center">
                <p>
                  By submitting this application, you agree to the I-Team
                  Society terms and conditions. Your application will be
                  reviewed within 2-3 business days.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Membership Renewal Dialog */}
      <MembershipRenewal
        isOpen={showRenewalDialog}
        onClose={() => setShowRenewalDialog(false)}
        currentMembership={membership}
        onRenewalSuccess={() => {
          fetchMembershipData();
          toast.success("Membership renewal submitted successfully!");
        }}
      />
    </div>
  );
};

export default Membership;
