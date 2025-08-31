import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import FileUpload from "@/components/ui/file-upload";
import { StorageService } from "@/services/supabase/storage.service";
import ImageCropper from "@/components/ui/image-cropper";
import { createPreviewUrl } from "@/utils/imageUtils";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Download,
  Edit,
  Save,
  X,
  CreditCard,
  GraduationCap,
  Briefcase,
  Camera,
} from "lucide-react";
import QRCode from "qrcode";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number?: string;
  address?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

interface StudentDetails {
  student_id: string;
  faculty: string;
  department: string;
  degree: string;
  level: number;
}

interface StaffDetails {
  staff_id: string;
  department: string;
  position: string;
}

interface Membership {
  id: string;
  tier: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
  eid: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(
    null
  );
  const [staffDetails, setStaffDetails] = useState<StaffDetails | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        // Don't sign out immediately - show error and allow retry
        toast.error("Failed to load profile. Please try refreshing the page.");
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.error("No profile found for user");
        toast.error("Profile not found. Please contact support.");
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // Fetch role-specific details
      if (profileData.role === "student") {
        const { data: studentData } = await supabase
          .from("student_details")
          .select("*")
          .eq("id", user?.id)
          .maybeSingle(); // Use maybeSingle() to handle missing details gracefully
        setStudentDetails(studentData);
      } else if (profileData.role === "staff") {
        const { data: staffData } = await supabase
          .from("staff_details")
          .select("*")
          .eq("id", user?.id)
          .maybeSingle(); // Use maybeSingle() to handle missing details gracefully
        setStaffDetails(staffData);
      }

      // Fetch membership
      const { data: membershipData } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() to handle missing memberships gracefully

      if (membershipData) {
        setMembership(membershipData);
        // Generate QR code for E-ID
        generateQRCode(membershipData.eid, profileData);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (eid: string, profileData: UserProfile) => {
    try {
      const qrData = JSON.stringify({
        eid: eid,
        name: `${profileData.first_name} ${profileData.last_name}`,
        role: profileData.role,
        tier: membership?.tier,
        valid_until: membership?.end_date,
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  // Test function to check storage service
  const testStorageService = async () => {
    try {
      console.log("Testing storage service...");

      // Create a simple test file
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(0, 0, 100, 100);
      }

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
      });

      const testFile = new File([blob], "test.jpg", { type: "image/jpeg" });
      console.log("Test file created:", testFile);

      if (user?.id) {
        const result = await StorageService.uploadProfilePhoto(
          user.id,
          testFile
        );
        console.log("Storage test successful:", result);
        toast.success("Storage test successful!");
      }
    } catch (error) {
      console.error("Storage test failed:", error);
      toast.error("Storage test failed: " + (error as Error).message);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      console.log("handleFileSelect: File selected:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      setOriginalFile(file);
      const previewUrl = await createPreviewUrl(file);
      console.log(
        "handleFileSelect: Preview URL created:",
        previewUrl.substring(0, 50) + "..."
      );

      setImagePreviewUrl(previewUrl);
      setShowCropper(true);
      console.log("handleFileSelect: Cropper opened");
    } catch (error) {
      console.error("Error creating preview:", error);
      toast.error("Failed to process image");
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    try {
      console.log("Crop completed, file details:", {
        name: croppedFile.name,
        size: croppedFile.size,
        type: croppedFile.type,
      });

      // Validate the cropped file
      if (!croppedFile || croppedFile.size === 0) {
        throw new Error("Invalid cropped file");
      }

      setShowCropper(false);

      // Automatically upload the cropped photo
      if (!user?.id) {
        toast.error("User not authenticated");
        return;
      }

      setUploadingPhoto(true);
      toast.info("Uploading profile photo...");

      try {
        // Upload photo to storage
        const photoUrl = await StorageService.uploadProfilePhoto(
          user.id,
          croppedFile
        );
        console.log("Photo uploaded successfully, URL:", photoUrl);

        // Update profile in database
        console.log("Updating profile in database with photo URL:", photoUrl);
        const { data: updateData, error } = await supabase
          .from("profiles")
          .update({ photo_url: photoUrl })
          .eq("id", user.id)
          .select();

        if (error) {
          console.error("Database update error:", error);

          // Check if it's a column missing error
          if (
            error.message.includes("column") &&
            error.message.includes("photo_url")
          ) {
            throw new Error(
              "Database schema error: photo_url column missing from profiles table"
            );
          } else {
            throw new Error(`Database update failed: ${error.message}`);
          }
        }

        console.log("Database update successful:", updateData);

        console.log("Profile updated successfully in database");

        // Update local state immediately for instant UI update
        // Add cache busting parameter to force image reload
        const cacheBustedUrl = `${photoUrl}?t=${Date.now()}`;
        setProfile((prev) =>
          prev ? { ...prev, photo_url: cacheBustedUrl } : null
        );

        toast.success("Profile photo updated successfully!");
      } catch (uploadError) {
        console.error("Error uploading photo:", uploadError);

        // Provide specific error messages
        if (uploadError instanceof Error) {
          if (uploadError.message.includes("storage")) {
            toast.error("Failed to upload photo to storage. Please try again.");
          } else if (uploadError.message.includes("profiles")) {
            toast.error("Failed to update profile. Please try again.");
          } else {
            toast.error(`Upload failed: ${uploadError.message}`);
          }
        } else {
          toast.error("Failed to upload profile photo. Please try again.");
        }
      } finally {
        setUploadingPhoto(false);
      }
    } catch (error) {
      console.error("Error processing cropped image:", error);
      toast.error("Failed to process cropped image");
      setShowCropper(false);
    }
  };

  const validateProfile = (profile: UserProfile) => {
    const errors: string[] = [];

    // Required field validation
    if (!profile.first_name?.trim()) {
      errors.push("First name is required");
    }
    if (!profile.last_name?.trim()) {
      errors.push("Last name is required");
    }

    // Name format validation
    if (
      profile.first_name &&
      !/^[a-zA-Z\s'-]+$/.test(profile.first_name.trim())
    ) {
      errors.push(
        "First name can only contain letters, spaces, hyphens, and apostrophes"
      );
    }
    if (
      profile.last_name &&
      !/^[a-zA-Z\s'-]+$/.test(profile.last_name.trim())
    ) {
      errors.push(
        "Last name can only contain letters, spaces, hyphens, and apostrophes"
      );
    }

    // Address validation (if provided)
    if (profile.address && profile.address.trim().length < 5) {
      errors.push("Address must be at least 5 characters long");
    }

    return errors;
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      // Validate profile data
      const validationErrors = validateProfile(profile);
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]); // Show first error
        setSaving(false);
        return;
      }

      // Trim whitespace from string fields
      const cleanedProfile = {
        first_name: profile.first_name?.trim(),
        last_name: profile.last_name?.trim(),
        phone_number: profile.phone_number?.trim() || null,
        address: profile.address?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(cleanedProfile)
        .eq("id", user?.id);

      if (error) throw error;

      // Update local state with cleaned data
      setProfile((prev) => (prev ? { ...prev, ...cleanedProfile } : null));

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const downloadEID = () => {
    if (!membership || !qrCodeUrl || !profile) {
      toast.error("E-ID not available");
      return;
    }

    // Create a canvas to generate the E-ID card
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 380;

    // Background
    ctx.fillStyle = "#1e40af";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("I-TEAM SOCIETY", canvas.width / 2, 40);
    ctx.font = "16px Arial";
    ctx.fillText("The Open University of Sri Lanka", canvas.width / 2, 65);

    // Member info
    ctx.textAlign = "left";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`${profile.first_name} ${profile.last_name}`, 30, 120);

    ctx.font = "14px Arial";
    ctx.fillText(`E-ID: ${membership.eid}`, 30, 150);
    ctx.fillText(`Role: ${profile.role?.toUpperCase()}`, 30, 175);
    ctx.fillText(`Tier: ${membership.tier?.toUpperCase()}`, 30, 200);
    ctx.fillText(
      `Valid Until: ${new Date(membership.end_date).toLocaleDateString()}`,
      30,
      225
    );

    // Add QR code
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, canvas.width - 180, 100, 150, 150);

      // Download the image with member's name
      const link = document.createElement("a");
      const memberName =
        `${profile.first_name || "Member"}_${profile.last_name || "Name"}`.replace(
          /\s+/g,
          "_"
        );
      link.download = `I-Team-EID-${memberName}-${membership.eid}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success("E-ID downloaded successfully");
    };
    qrImg.src = qrCodeUrl;
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
        return "bg-green-500";
      case "pending_approval":
        return "bg-yellow-500";
      case "expired":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">Profile Not Found</h2>
        <p className="text-gray-600">
          Unable to load your profile information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-white/20">
                <AvatarImage
                  src={profile.photo_url || ""}
                  key={profile.photo_url} // Force re-render when URL changes
                />
                <AvatarFallback className="bg-white/20 text-white text-xl">
                  {profile.first_name?.[0]}
                  {profile.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute -bottom-1 -right-1 bg-iteam-primary rounded-full p-1.5 border-2 border-white">
                  <Camera className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-blue-100 capitalize">{profile.role}</p>
              {membership && (
                <Badge
                  className={`${getTierColor(membership.tier)} text-white mt-1`}
                >
                  {membership.tier?.toUpperCase()} Member
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Photo Upload Section */}
              {isEditing && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={profile.photo_url || ""}
                        key={profile.photo_url} // Force re-render when URL changes
                      />
                      <AvatarFallback className="text-lg">
                        {profile.first_name?.[0]}
                        {profile.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Profile Photo
                      </h4>
                      <FileUpload
                        label="Upload New Photo"
                        accept="image/*"
                        maxSize={10}
                        onFileSelect={handleFileSelect}
                        preview={true}
                        currentFile={profile.photo_url || undefined}
                      />
                      {uploadingPhoto && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-700">
                            📤 Uploading profile photo...
                          </p>
                        </div>
                      )}

                      {/* Debug: Test Storage Button */}
                      <div className="mt-2">
                        <Button
                          onClick={testStorageService}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          🧪 Test Storage
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="first_name"
                      value={profile.first_name}
                      onChange={(e) =>
                        setProfile({ ...profile, first_name: e.target.value })
                      }
                      required
                      pattern="[a-zA-Z\s'-]+"
                      title="First name can only contain letters, spaces, hyphens, and apostrophes"
                      maxLength={50}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.first_name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="last_name"
                      value={profile.last_name}
                      onChange={(e) =>
                        setProfile({ ...profile, last_name: e.target.value })
                      }
                      required
                      pattern="[a-zA-Z\s'-]+"
                      title="Last name can only contain letters, spaces, hyphens, and apostrophes"
                      maxLength={50}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.last_name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone_number || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, phone_number: e.target.value })
                    }
                    placeholder="Enter your phone number (e.g., +1234567890)"
                    maxLength={20}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {profile.phone_number || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={profile.address || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    placeholder="Enter your full address (minimum 5 characters)"
                    rows={3}
                    minLength={5}
                    maxLength={200}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {profile.address || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <Label>Member Since</Label>
                <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role-specific Details */}
          {(studentDetails || staffDetails) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {profile.role === "student" ? (
                    <GraduationCap className="h-5 w-5" />
                  ) : (
                    <Briefcase className="h-5 w-5" />
                  )}
                  {profile.role === "student"
                    ? "Academic Information"
                    : "Employment Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentDetails && (
                  <>
                    <div>
                      <Label>Student ID</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {studentDetails.student_id}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Faculty</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          {studentDetails.faculty}
                        </p>
                      </div>
                      <div>
                        <Label>Department</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          {studentDetails.department}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Degree Program</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          {studentDetails.degree}
                        </p>
                      </div>
                      <div>
                        <Label>Academic Level</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          Level {studentDetails.level}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {staffDetails && (
                  <>
                    <div>
                      <Label>Staff ID</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {staffDetails.staff_id}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Department</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staffDetails.department}
                        </p>
                      </div>
                      <div>
                        <Label>Position</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staffDetails.position}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Membership & E-ID */}
        <div className="space-y-6">
          {membership && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge
                    className={`${getTierColor(
                      membership.tier
                    )} text-white text-lg px-4 py-2`}
                  >
                    {membership.tier?.toUpperCase()}
                  </Badge>
                  <Badge
                    className={`${getStatusColor(
                      membership.status
                    )} text-white ml-2`}
                  >
                    {membership.status?.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div>
                    <Label>E-ID Number</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {membership.eid}
                    </p>
                  </div>
                  <div>
                    <Label>Membership Fee</Label>
                    <p className="text-sm">
                      Rs. {membership.amount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label>Valid Period</Label>
                    <p className="text-sm">
                      {new Date(membership.start_date).toLocaleDateString()} -{" "}
                      {new Date(membership.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator />

                {qrCodeUrl && (
                  <div className="text-center">
                    <Label>QR Code</Label>
                    <div className="mt-2 flex justify-center">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="border rounded"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={downloadEID}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  disabled={!qrCodeUrl}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download E-ID Card
                </Button>
              </CardContent>
            </Card>
          )}

          {!membership && (
            <Card>
              <CardHeader>
                <CardTitle>Membership Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-4">
                  No active membership found. Please apply for membership to
                  access all features.
                </p>
                <Button
                  className="w-full"
                  onClick={() =>
                    (window.location.href = "/dashboard/membership")
                  }
                >
                  Apply for Membership
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        imageSrc={imagePreviewUrl}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default Profile;
