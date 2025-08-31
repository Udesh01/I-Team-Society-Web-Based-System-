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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import {
  Users,
  Edit,
  Shield,
  GraduationCap,
  Briefcase,
  Eye,
  EyeOff,
  Calendar,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({
    first_name: "",
    last_name: "",
    role: "",
    phone_number: "",
    address: "",
  });

  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        console.log("🔍 UserManagement: Fetching users with related data...");

        // First, try the complex query with all joins
        const { data: usersWithDetails, error: joinError } = await supabase
          .from("profiles")
          .select(
            `
            *,
            student_details(level, student_id),
            staff_details(position, department, staff_id),
            memberships(tier, status, eid)
          `
          )
          .order("created_at", { ascending: false });

        if (!joinError && usersWithDetails) {
          console.log(
            "✅ UserManagement: Successfully fetched users with joins",
            {
              total_users: usersWithDetails.length,
              with_student_details: usersWithDetails.filter(
                (u) => u.student_details?.length > 0
              ).length,
              with_staff_details: usersWithDetails.filter(
                (u) => u.staff_details?.length > 0
              ).length,
              with_memberships: usersWithDetails.filter(
                (u) => u.memberships?.length > 0
              ).length,
              role_distribution: {
                admin: usersWithDetails.filter((u) => u.role === "admin")
                  .length,
                staff: usersWithDetails.filter((u) => u.role === "staff")
                  .length,
                student: usersWithDetails.filter((u) => u.role === "student")
                  .length,
              },
            }
          );
          return usersWithDetails;
        }

        console.warn(
          "⚠️ UserManagement: Complex join failed, trying simplified approach",
          joinError
        );

        // Fallback: Try without student_details and staff_details
        const { data: usersWithMemberships, error: membershipError } =
          await supabase
            .from("profiles")
            .select(
              `
            *,
            memberships(tier, status, eid)
          `
            )
            .order("created_at", { ascending: false });

        if (!membershipError && usersWithMemberships) {
          console.log(
            "✅ UserManagement: Successfully fetched users with memberships only",
            { total_users: usersWithMemberships.length }
          );
          return usersWithMemberships;
        }

        console.warn(
          "⚠️ UserManagement: Membership join failed, using basic profile query",
          membershipError
        );

        // Final fallback: Basic profiles query only
        const { data: basicUsers, error: basicError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (basicError) {
          console.error(
            "❌ UserManagement: Even basic query failed:",
            basicError
          );
          throw basicError;
        }

        console.log("✅ UserManagement: Using basic profile data", {
          total_users: basicUsers?.length || 0,
        });

        // Add empty arrays for missing relationships to maintain component compatibility
        return (basicUsers || []).map((user) => ({
          ...user,
          student_details: [],
          staff_details: [],
          memberships: [],
        }));
      } catch (error) {
        console.error("❌ UserManagement: Error fetching users:", error);
        throw error;
      }
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .maybeSingle(); // Use maybeSingle() to handle edge cases gracefully

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error("Failed to update user: " + error.message);
    },
  });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role || "",
      phone_number: user.phone_number || "",
      address: user.address || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    updateUserMutation.mutate({
      id: selectedUser.id,
      updates: editUserData,
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-red-600" />;
      case "staff":
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case "student":
        return <GraduationCap className="h-4 w-4 text-green-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "staff":
        return "bg-blue-100 text-blue-800";
      case "student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
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
            Failed to Load Users
          </h3>
          <p className="text-gray-600 mb-4">
            There was an error fetching user data.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-red-600">Error: {error.message}</p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>This could be caused by:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Missing database tables (student_details, staff_details)
                </li>
                <li>Incorrect foreign key relationships</li>
                <li>RLS policy restrictions</li>
                <li>Database connection issues</li>
              </ul>
            </div>
            <div className="flex gap-2 justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["users"] });
                }}
              >
                Retry Query
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add warning if no users found
  if (users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Users Found
          </h3>
          <p className="text-gray-600 mb-4">
            There are currently no users in the system.
          </p>
          <Button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["users"] });
            }}
          >
            Refresh Data
          </Button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    staff: users.filter((u) => u.role === "staff").length,
    students: users.filter((u) => u.role === "student").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage all system users and their roles
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
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
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.admins}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Staff</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.staff}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.students}
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id?.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          {user.role?.toUpperCase()}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.phone_number && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {user.phone_number}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          {user.address || "No address"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {/* Handle student_details - could be array or object */}
                        {user.student_details &&
                          (Array.isArray(user.student_details)
                            ? user.student_details.length > 0
                            : user.student_details) && (
                            <div>
                              {Array.isArray(user.student_details) ? (
                                user.student_details.length > 0 && (
                                  <div>
                                    Level {user.student_details[0].level} •{" "}
                                    {user.student_details[0].student_id}
                                  </div>
                                )
                              ) : (
                                <div>
                                  Level {user.student_details.level} •{" "}
                                  {user.student_details.student_id}
                                </div>
                              )}
                            </div>
                          )}
                        {/* Handle staff_details - could be array or object */}
                        {user.staff_details &&
                          (Array.isArray(user.staff_details)
                            ? user.staff_details.length > 0
                            : user.staff_details) && (
                            <div>
                              {Array.isArray(user.staff_details) ? (
                                user.staff_details.length > 0 && (
                                  <div>
                                    {user.staff_details[0].position} •{" "}
                                    {user.staff_details[0].staff_id}
                                  </div>
                                )
                              ) : (
                                <div>
                                  {user.staff_details.position} •{" "}
                                  {user.staff_details.staff_id}
                                </div>
                              )}
                            </div>
                          )}
                        {/* Show fallback if no details */}
                        {(!user.student_details ||
                          (Array.isArray(user.student_details) &&
                            user.student_details.length === 0)) &&
                          (!user.staff_details ||
                            (Array.isArray(user.staff_details) &&
                              user.staff_details.length === 0)) && (
                            <div className="text-gray-500">
                              No details available
                            </div>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.memberships && user.memberships.length > 0 ? (
                        <div>
                          <Badge
                            className={
                              user.memberships[0].tier === "gold"
                                ? "bg-yellow-100 text-yellow-800"
                                : user.memberships[0].tier === "silver"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-orange-100 text-orange-800"
                            }
                          >
                            {user.memberships[0].tier?.toUpperCase()}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {user.memberships[0].eid}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          No membership
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.first_name}{" "}
              {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editFirstName" className="text-right">
                First Name
              </Label>
              <Input
                id="editFirstName"
                value={editUserData.first_name}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    first_name: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editLastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="editLastName"
                value={editUserData.last_name}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    last_name: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editRole" className="text-right">
                Role
              </Label>
              <Select
                value={editUserData.role}
                onValueChange={(value) =>
                  setEditUserData({ ...editUserData, role: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editPhone" className="text-right">
                Phone
              </Label>
              <Input
                id="editPhone"
                value={editUserData.phone_number}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    phone_number: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editAddress" className="text-right">
                Address
              </Label>
              <Input
                id="editAddress"
                value={editUserData.address}
                onChange={(e) =>
                  setEditUserData({ ...editUserData, address: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
