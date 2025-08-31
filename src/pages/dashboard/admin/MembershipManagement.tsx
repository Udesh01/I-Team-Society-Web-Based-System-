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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MembershipService } from "@/services/supabase/membership.service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Edit,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  ChevronDown,
} from "lucide-react";

interface MembershipUpdate {
  status?:
    | "pending_payment"
    | "pending_approval"
    | "active"
    | "expired"
    | "rejected";
  tier?: "bronze" | "silver" | "gold";
  end_date?: string;
  eid?: string;
}

interface ExportFilters {
  status: string;
  tier: string;
  role: string;
  dateRange: string;
}

const MembershipManagement = () => {
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newTier, setNewTier] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    status: "all",
    tier: "all",
    role: "all",
    dateRange: "all",
  });
  const [isExporting, setIsExporting] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: memberships = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["memberships"],
    queryFn: async () => {
      try {
        console.log(
          "🔍 MembershipManagement: Fetching ALL memberships with profiles..."
        );

        // Enhanced query to fetch ALL memberships with better error handling
        const { data: membershipsWithProfiles, error: joinError } =
          await supabase
            .from("memberships")
            .select(
              `
            *,
            profiles!memberships_user_id_fkey(
              id,
              first_name,
              last_name,
              role
            )
          `
            )
            .order("created_at", { ascending: false });

        if (!joinError && membershipsWithProfiles) {
          console.log(
            "✅ MembershipManagement: Successfully fetched memberships with joins",
            {
              total_count: membershipsWithProfiles.length,
              with_profiles: membershipsWithProfiles.filter((m) => m.profiles)
                .length,
              without_profiles: membershipsWithProfiles.filter(
                (m) => !m.profiles
              ).length,
              roles_found: [
                ...new Set(
                  membershipsWithProfiles
                    .filter((m) => m.profiles?.role)
                    .map((m) => m.profiles.role)
                ),
              ],
              sample_data: membershipsWithProfiles.slice(0, 3).map((m) => ({
                id: m.id,
                user_id: m.user_id,
                name: m.profiles
                  ? `${m.profiles.first_name} ${m.profiles.last_name}`
                  : "No Profile",
                role: m.profiles?.role || "No Role",
              })),
            }
          );

          // Log specific missing profiles for debugging
          const missingProfiles = membershipsWithProfiles.filter(
            (m) => !m.profiles
          );
          if (missingProfiles.length > 0) {
            console.warn(
              "⚠️ Memberships without profiles:",
              missingProfiles.map((m) => ({
                membership_id: m.id,
                user_id: m.user_id,
                tier: m.tier,
                status: m.status,
              }))
            );
          }

          return membershipsWithProfiles;
        }

        console.warn(
          "⚠️ MembershipManagement: Join query failed, falling back to manual fetch",
          joinError
        );

        // Fallback to manual fetching with enhanced error handling
        const { data, error } = await supabase
          .from("memberships")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Failed to fetch memberships:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.warn("⚠️ No memberships found in database");
          return [];
        }

        console.log(
          "🔄 MembershipManagement: Manually fetching profile data for",
          data.length,
          "memberships"
        );

        // Manually fetch related data with better error handling
        const enrichedMemberships = await Promise.all(
          data.map(async (membership) => {
            console.log(
              "🔍 Processing membership:",
              membership.id,
              "for user:",
              membership.user_id
            );

            // Fetch user profile with enhanced error handling
            let profiles = null;
            if (membership.user_id) {
              try {
                const { data: profileData, error: profileError } =
                  await supabase
                    .from("profiles")
                    .select("id, first_name, last_name, role")
                    .eq("id", membership.user_id)
                    .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

                if (profileError) {
                  console.error(
                    "❌ Profile fetch error for user",
                    membership.user_id,
                    ":",
                    profileError
                  );
                } else if (!profileData) {
                  console.warn(
                    "⚠️ No profile found for user:",
                    membership.user_id,
                    "- This user needs profile creation"
                  );
                } else {
                  console.log(
                    "✅ Profile found for user:",
                    membership.user_id,
                    "Name:",
                    `${profileData.first_name} ${profileData.last_name}`,
                    "Role:",
                    profileData.role
                  );
                }

                profiles = profileData;
              } catch (e) {
                console.error(
                  "❌ Exception fetching profile for user",
                  membership.user_id,
                  ":",
                  e
                );
              }
            } else {
              console.warn(
                "⚠️ Membership has no user_id:",
                membership.id,
                "- This membership needs user assignment"
              );
            }

            const result = {
              ...membership,
              profiles,
            };

            console.log("📦 Final membership object:", {
              id: membership.id,
              user_id: membership.user_id,
              has_profile: !!profiles,
              profile_name: profiles
                ? `${profiles.first_name} ${profiles.last_name}`
                : "Missing Profile",
              role: profiles?.role || "Missing Role",
            });

            return result;
          })
        );

        const summary = {
          total: enrichedMemberships.length,
          with_profiles: enrichedMemberships.filter((m) => m.profiles).length,
          without_profiles: enrichedMemberships.filter((m) => !m.profiles)
            .length,
          roles_distribution: enrichedMemberships.reduce((acc, m) => {
            const role = m.profiles?.role || "missing";
            acc[role] = (acc[role] || 0) + 1;
            return acc;
          }, {}),
        };

        console.log("✅ MembershipManagement: Manual fetch completed", summary);

        if (summary.without_profiles > 0) {
          console.warn(
            `⚠️ Found ${summary.without_profiles} memberships without profiles. Run the FIX_MEMBERSHIP_ROLES_ISSUE.sql script to resolve this.`
          );
        }

        return enrichedMemberships;
      } catch (error) {
        console.error("❌ Error fetching memberships:", error);
        // Return empty array on error to prevent crashes
        return [];
      }
    },
    // Add retry and refetch options for better reliability
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMembershipMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: MembershipUpdate;
    }) => {
      // If updating to active status and no E-ID exists, generate one
      if (updates.status === "active") {
        const membership = memberships.find((m) => m.id === id);
        if (membership && !membership.eid) {
          // Generate unique E-ID
          const currentYear = new Date().getFullYear();
          const rolePrefix =
            membership.profiles?.role === "student"
              ? "STU"
              : membership.profiles?.role === "staff"
                ? "STF"
                : "ADM";

          // Get next available number for this role and year
          const { data: existingEids } = await supabase
            .from("memberships")
            .select("eid")
            .like("eid", `ITS/${currentYear}/${rolePrefix}/%`);

          const existingNumbers =
            existingEids
              ?.map((item) => {
                const parts = item.eid?.split("/");
                return parts && parts.length === 4 ? parseInt(parts[3]) : 0;
              })
              .filter((num) => !isNaN(num)) || [];

          const nextNumber =
            existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          const eid = `ITS/${currentYear}/${rolePrefix}/${nextNumber
            .toString()
            .padStart(4, "0")}`;

          updates.eid = eid;
        }
      }

      const { data, error } = await supabase
        .from("memberships")
        .update(updates)
        .eq("id", id)
        .select()
        .maybeSingle(); // Use maybeSingle() to handle edge cases gracefully

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Membership updated successfully");
      setEditDialogOpen(false);
      setSelectedMembership(null);
    },
    onError: (error) => {
      toast.error("Failed to update membership: " + error.message);
    },
  });

  const handleEditMembership = (membership) => {
    setSelectedMembership(membership);
    setNewStatus(membership.status);
    setNewTier(membership.tier);
    setNewEndDate(membership.end_date?.split("T")[0] || "");
    setEditDialogOpen(true);
  };

  const handleUpdateMembership = () => {
    if (!selectedMembership) return;

    const updates: MembershipUpdate = {
      status: newStatus as
        | "pending_payment"
        | "pending_approval"
        | "active"
        | "expired"
        | "rejected",
      tier: newTier as "bronze" | "silver" | "gold",
      end_date: newEndDate,
    };

    updateMembershipMutation.mutate({
      id: selectedMembership.id,
      updates,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800";
      case "pending_payment":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "gold":
        return "bg-yellow-100 text-yellow-800";
      case "silver":
        return "bg-gray-100 text-gray-800";
      case "bronze":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Export functionality
  const getFilteredMemberships = () => {
    return memberships.filter((membership) => {
      // Status filter
      if (
        exportFilters.status !== "all" &&
        membership.status !== exportFilters.status
      ) {
        return false;
      }
      // Tier filter
      if (
        exportFilters.tier !== "all" &&
        membership.tier !== exportFilters.tier
      ) {
        return false;
      }
      // Role filter
      if (
        exportFilters.role !== "all" &&
        membership.profiles?.role !== exportFilters.role
      ) {
        return false;
      }
      // Date range filter
      if (exportFilters.dateRange !== "all") {
        const membershipDate = new Date(membership.created_at);
        const now = new Date();
        const daysDiff = Math.floor(
          (now.getTime() - membershipDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        switch (exportFilters.dateRange) {
          case "last_30_days":
            return daysDiff <= 30;
          case "last_90_days":
            return daysDiff <= 90;
          case "this_year":
            return membershipDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      }
      return true;
    });
  };

  const exportToCSV = () => {
    const filteredData = getFilteredMemberships();

    if (filteredData.length === 0) {
      toast.error("No data to export with current filters");
      return;
    }

    setIsExporting(true);

    try {
      // CSV headers
      const headers = [
        "Member Name",
        "Role",
        "E-ID",
        "Membership Tier",
        "Status",
        "Start Date",
        "End Date",
        "Amount",
        "Created Date",
      ];

      // Convert data to CSV format
      const csvData = filteredData.map((membership) => [
        `${membership.profiles?.first_name || ""} ${membership.profiles?.last_name || ""}`.trim(),
        membership.profiles?.role || "N/A",
        membership.eid || "Not Generated",
        membership.tier?.toUpperCase() || "N/A",
        membership.status?.replace("_", " ").toUpperCase() || "N/A",
        membership.start_date
          ? new Date(membership.start_date).toLocaleDateString()
          : "N/A",
        membership.end_date
          ? new Date(membership.end_date).toLocaleDateString()
          : "N/A",
        membership.amount ? `Rs. ${membership.amount.toLocaleString()}` : "N/A",
        new Date(membership.created_at).toLocaleDateString(),
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `memberships_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        `Successfully exported ${filteredData.length} membership records to CSV`
      );
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast.error("Failed to export CSV file");
    } finally {
      setIsExporting(false);
      setExportDialogOpen(false);
    }
  };

  const exportToJSON = () => {
    const filteredData = getFilteredMemberships();

    if (filteredData.length === 0) {
      toast.error("No data to export with current filters");
      return;
    }

    setIsExporting(true);

    try {
      // Format data for JSON export
      const jsonData = {
        export_info: {
          generated_at: new Date().toISOString(),
          total_records: filteredData.length,
          filters_applied: exportFilters,
        },
        memberships: filteredData.map((membership) => ({
          id: membership.id,
          member_name:
            `${membership.profiles?.first_name || ""} ${membership.profiles?.last_name || ""}`.trim(),
          member_role: membership.profiles?.role,
          eid: membership.eid,
          tier: membership.tier,
          status: membership.status,
          start_date: membership.start_date,
          end_date: membership.end_date,
          amount: membership.amount,
          created_at: membership.created_at,
          updated_at: membership.updated_at,
        })),
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `memberships_export_${new Date().toISOString().split("T")[0]}.json`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        `Successfully exported ${filteredData.length} membership records to JSON`
      );
    } catch (error) {
      console.error("Error exporting to JSON:", error);
      toast.error("Failed to export JSON file");
    } finally {
      setIsExporting(false);
      setExportDialogOpen(false);
    }
  };

  const exportToPDF = () => {
    const filteredData = getFilteredMemberships();

    if (filteredData.length === 0) {
      toast.error("No data to export with current filters");
      return;
    }

    setIsExporting(true);

    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Membership Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .stat-box { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .status-active { background-color: #d4edda; color: #155724; }
            .status-pending { background-color: #fff3cd; color: #856404; }
            .status-expired { background-color: #f8d7da; color: #721c24; }
            .tier-gold { background-color: #fff3cd; color: #856404; }
            .tier-silver { background-color: #e2e3e5; color: #383d41; }
            .tier-bronze { background-color: #f8d7da; color: #721c24; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>I-Team Society Membership Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <h3>${filteredData.length}</h3>
              <p>Total Members</p>
            </div>
            <div class="stat-box">
              <h3>${filteredData.filter((m) => m.status === "active").length}</h3>
              <p>Active Members</p>
            </div>
            <div class="stat-box">
              <h3>${filteredData.filter((m) => m.tier === "gold").length}</h3>
              <p>Gold Members</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Role</th>
                <th>E-ID</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData
                .map(
                  (membership) => `
                <tr>
                  <td>${membership.profiles?.first_name || ""} ${membership.profiles?.last_name || ""}</td>
                  <td>${membership.profiles?.role || "N/A"}</td>
                  <td>${membership.eid || "Not Generated"}</td>
                  <td class="tier-${membership.tier}">${membership.tier?.toUpperCase() || "N/A"}</td>
                  <td class="status-${membership.status?.includes("active") ? "active" : membership.status?.includes("pending") ? "pending" : "expired"}">${membership.status?.replace("_", " ").toUpperCase() || "N/A"}</td>
                  <td>${membership.start_date ? new Date(membership.start_date).toLocaleDateString() : "N/A"}</td>
                  <td>${membership.end_date ? new Date(membership.end_date).toLocaleDateString() : "N/A"}</td>
                  <td>${membership.amount ? "Rs. " + membership.amount.toLocaleString() : "N/A"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="footer">
            <p>© I-Team Society Management System | Total Records: ${filteredData.length}</p>
          </div>
        </body>
        </html>
      `;

      // Create and download HTML file (user can print as PDF)
      const blob = new Blob([htmlContent], { type: "text/html" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `memberships_report_${new Date().toISOString().split("T")[0]}.html`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        `Successfully exported ${filteredData.length} membership records. Open the HTML file and print as PDF for best results.`
      );
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("Failed to export PDF file");
    } finally {
      setIsExporting(false);
      setExportDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading memberships...</p>
        </div>
      </div>
    );
  }

  // Add error state display
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to Load Memberships
          </h3>
          <p className="text-gray-600 mb-4">
            There was an error fetching membership data.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-red-600">Error: {error.message}</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["memberships"] });
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add warning if no memberships found
  if (memberships.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Memberships Found
          </h3>
          <p className="text-gray-600 mb-4">
            There are currently no memberships in the system.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">This could mean:</p>
            <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
              <li>No users have created memberships yet</li>
              <li>Database connection issues</li>
              <li>RLS policies are blocking access</li>
            </ul>
            <Button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["memberships"] });
              }}
              className="mt-4"
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    total: memberships.length,
    active: memberships.filter((m) => m.status === "active").length,
    pending: memberships.filter(
      (m) => m.status === "pending_approval" || m.status === "pending_payment"
    ).length,
    expired: memberships.filter((m) => m.status === "expired").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Membership Management
          </h1>
          <p className="text-gray-600">
            Manage and monitor all member subscriptions
          </p>
        </div>
        <div className="flex gap-3">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setExportDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Export with Filters
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setExportFilters({
                    status: "all",
                    tier: "all",
                    role: "all",
                    dateRange: "all",
                  });
                  exportToCSV();
                }}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Quick Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setExportFilters({
                    status: "all",
                    tier: "all",
                    role: "all",
                    dateRange: "all",
                  });
                  exportToJSON();
                }}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Quick Export JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.active}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.expired}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memberships Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Memberships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>E-ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {membership.profiles?.first_name &&
                          membership.profiles?.last_name
                            ? `${membership.profiles.first_name} ${membership.profiles.last_name}`
                            : "Unknown Member"}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {membership.user_id?.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {membership.profiles?.role || "Unknown Role"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(membership.tier)}>
                        {membership.tier?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(membership.status)}>
                        {membership.status?.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {membership.start_date
                        ? new Date(membership.start_date).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {membership.end_date
                        ? new Date(membership.end_date).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {membership.eid || "Not Generated"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMembership(membership)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Membership Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Membership</DialogTitle>
            <DialogDescription>
              Update membership details for{" "}
              {selectedMembership?.profiles?.first_name &&
              selectedMembership?.profiles?.last_name
                ? `${selectedMembership.profiles.first_name} ${selectedMembership.profiles.last_name}`
                : "Unknown Member"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_approval">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="pending_payment">
                    Pending Payment
                  </SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tier" className="text-right">
                Tier
              </Label>
              <Select value={newTier} onValueChange={setNewTier}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMembership}
              disabled={updateMembershipMutation.isPending}
            >
              {updateMembershipMutation.isPending
                ? "Updating..."
                : "Update Membership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Membership Data
            </DialogTitle>
            <DialogDescription>
              Choose export format and apply filters to customize your export.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Export Filters */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Filter Options</Label>

              <div className="grid grid-cols-2 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="status-filter" className="text-sm">
                    Status
                  </Label>
                  <Select
                    value={exportFilters.status}
                    onValueChange={(value) =>
                      setExportFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending_approval">
                        Pending Approval
                      </SelectItem>
                      <SelectItem value="pending_payment">
                        Pending Payment
                      </SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tier Filter */}
                <div className="space-y-2">
                  <Label htmlFor="tier-filter" className="text-sm">
                    Membership Tier
                  </Label>
                  <Select
                    value={exportFilters.tier}
                    onValueChange={(value) =>
                      setExportFilters((prev) => ({ ...prev, tier: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Filter */}
                <div className="space-y-2">
                  <Label htmlFor="role-filter" className="text-sm">
                    User Role
                  </Label>
                  <Select
                    value={exportFilters.role}
                    onValueChange={(value) =>
                      setExportFilters((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label htmlFor="date-filter" className="text-sm">
                    Date Range
                  </Label>
                  <Select
                    value={exportFilters.dateRange}
                    onValueChange={(value) =>
                      setExportFilters((prev) => ({
                        ...prev,
                        dateRange: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview Stats */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Preview:</strong> {getFilteredMemberships().length} of{" "}
                  {memberships.length} memberships will be exported
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={exportToCSV}
                disabled={isExporting}
                className="flex items-center gap-1"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
              <Button
                onClick={exportToJSON}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export JSON"}
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export PDF"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembershipManagement;
