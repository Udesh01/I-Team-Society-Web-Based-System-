import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MainLayout from "@/components/layout/MainLayout";
import FileUpload from "@/components/ui/file-upload";
import FAQ from "@/components/ui/faq";
import { supabase } from "@/integrations/supabase/client";
import { StorageService } from "@/services/supabase/storage.service";
import { useAuth } from "@/context/AuthContext";

const RegisterStaff = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");

  // Staff specific fields
  const [staffId, setStaffId] = useState("");
  const [position, setPosition] = useState("");
  const [membershipType, setMembershipType] = useState("");
  const [regionalCentre, setRegionalCentre] = useState("");

  // File uploads
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  // Agreement checkbox
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // FAQ data
  const faqItems = [
    {
      question: "What documents do I need to register as staff?",
      answer:
        "You need your staff ID and optionally a profile photo. No payment slip is required for staff registration.",
    },
    {
      question: "What are the staff membership options?",
      answer:
        "1st Year: Rs. 500 (Bronze), 2nd Year: Rs. 1000 (Silver), Lifetime: Rs. 1500 (Gold)",
    },
    {
      question: "Do I need to pay immediately?",
      answer:
        "No, staff members can complete payment after registration through their dashboard.",
    },
    {
      question: "What permissions do staff members have?",
      answer:
        "Staff can manage events, mark attendance, view registrations, and join events after membership activation.",
    },
  ];

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (activeTab === "basic") {
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        setError("Please fill in all required fields");
        return false;
      }
    } else {
      if (
        !staffId ||
        !position ||
        !membershipType ||
        !address ||
        !regionalCentre
      ) {
        setError("Please fill in all required fields");
        return false;
      }

      if (!agreedToTerms) {
        setError(
          "Please agree that all details provided are accurate and true"
        );
        return false;
      }
    }

    return true;
  };

  const handleNextTab = () => {
    if (validateForm()) {
      setError(null);
      setActiveTab("details");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            user_type: "staff",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        let profilePhotoUrl = null;

        // Upload profile photo if provided
        if (profilePhoto) {
          try {
            profilePhotoUrl = await StorageService.uploadProfilePhoto(
              authData.user.id,
              profilePhoto
            );
          } catch (uploadError) {
            console.error("Error uploading profile photo:", uploadError);
          }
        }

        // First, ensure profile exists before creating staff_details
        // Wait a moment for the trigger to complete, then upsert profile data
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create or update profile with complete information FIRST
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            role: "staff",
            phone_number: phone,
            address: address,
            photo_url: profilePhotoUrl,
          },
          {
            onConflict: "id",
          }
        );

        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw new Error(
            `Failed to create staff profile: ${profileError.message}`
          );
        }

        // Now insert staff details - use upsert to handle duplicates
        const { error: staffError } = await supabase
          .from("staff_details")
          .upsert(
            {
              id: authData.user.id,
              staff_id: staffId,
              department: "Department of Computer Science",
              position: position,
              regional_centre: regionalCentre,
            },
            {
              onConflict: "id",
            }
          );

        if (staffError) {
          console.error("Staff details creation error:", staffError);
          // Handle specific constraint errors
          if (staffError.message?.includes("regional_centre")) {
            throw new Error(
              "Invalid regional centre selected. Please choose a valid option."
            );
          } else if (staffError.message?.includes("staff_id")) {
            throw new Error(
              "Staff ID already exists. Please use a different staff ID."
            );
          } else {
            throw new Error(
              `Failed to save staff details: ${staffError.message}`
            );
          }
        }

        // Create membership record
        const membershipAmount =
          membershipType === "1year"
            ? 500
            : membershipType === "2year"
              ? 1000
              : 1500;
        const membershipTier =
          membershipType === "1year"
            ? "bronze"
            : membershipType === "2year"
              ? "silver"
              : "gold";

        const { error: membershipError } = await supabase
          .from("memberships")
          .insert({
            user_id: authData.user.id,
            amount: membershipAmount,
            tier: membershipTier,
            status: "pending_payment",
          });

        if (membershipError) throw membershipError;

        toast.success(
          "Staff registration successful! Please check your email to verify your account. Complete your membership payment from your dashboard."
        );
        navigate("/login");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Staff registration error:", error);

      // Handle specific error cases
      if (
        errorMessage.includes("Database error saving new user") ||
        errorMessage.includes("Internal Server Error")
      ) {
        setError(
          "Registration failed due to a server error. This is usually a temporary issue. Please try again in a moment. If the problem persists, contact support."
        );
      } else if (
        errorMessage.includes("User already registered") ||
        errorMessage.includes("already been registered")
      ) {
        setError(
          "This email is already registered. Please use a different email or try logging in instead."
        );
      } else if (errorMessage.includes("Email not confirmed")) {
        setError(
          "Your account was created but email confirmation is required. Please check your email and click the confirmation link, then try logging in."
        );
      } else if (errorMessage.includes("Invalid email")) {
        setError("Please enter a valid email address.");
      } else if (errorMessage.includes("Password")) {
        setError("Password must be at least 6 characters long.");
      } else if (errorMessage.includes("Failed to create staff profile")) {
        setError(
          "Database error creating staff profile. Please try again or contact support."
        );
      } else if (errorMessage.includes("staff_details")) {
        setError(
          "Error saving staff details. Please check your staff ID and try again."
        );
      } else if (errorMessage.includes("foreign key constraint")) {
        setError(
          "Database constraint error. Please try registering again or contact support."
        );
      } else if (errorMessage.includes("Key is not present in table")) {
        setError(
          "Profile creation failed. Please try registering again or contact support."
        );
      } else if (errorMessage.includes("membership")) {
        setError(
          "Error creating membership record. Your account was created but membership setup failed."
        );
      } else {
        setError(
          errorMessage ||
            "Registration failed. Please check your details and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-4xl px-4">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-iteam-primary">
                Staff Registration
              </CardTitle>
              <CardDescription>
                Join I-Team Society as a Staff Member
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs value={activeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="details" disabled={activeTab === "basic"}>
                    Staff Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number (any format)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Enter in any format (e.g., +94712345678, 071-234-5678)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm Password *
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleNextTab}
                      className="bg-iteam-primary hover:bg-iteam-primary/90"
                    >
                      Next: Staff Details
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6 pt-6">
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="staffId">Staff ID *</Label>
                        <Input
                          id="staffId"
                          placeholder="Enter your staff ID"
                          value={staffId}
                          onChange={(e) => setStaffId(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Position *</Label>
                        <Input
                          id="position"
                          placeholder="e.g., Lecturer, Assistant Lecturer"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="membershipType">Membership Type *</Label>
                      <Select
                        value={membershipType}
                        onValueChange={setMembershipType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select membership type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1year">
                            1 Year (Rs. 500 - Bronze)
                          </SelectItem>
                          <SelectItem value="2year">
                            2 Year (Rs. 1000 - Silver)
                          </SelectItem>
                          <SelectItem value="lifetime">
                            Lifetime (Rs. 1500 - Gold)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regionalCentre">Regional Centre *</Label>
                      <Select
                        value={regionalCentre}
                        onValueChange={setRegionalCentre}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your regional centre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRC">CRC</SelectItem>
                          <SelectItem value="BRC">BRC</SelectItem>
                          <SelectItem value="KRC">KRC</SelectItem>
                          <SelectItem value="Jaffna">Jaffna</SelectItem>
                          <SelectItem value="Matara">Matara</SelectItem>
                          <SelectItem value="Anuradhapura">
                            Anuradhapura
                          </SelectItem>
                          <SelectItem value="Hatton">Hatton</SelectItem>
                          <SelectItem value="Galle">Galle</SelectItem>
                          <SelectItem value="Puttalam">Puttalam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        placeholder="Enter your address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>

                    {/* File Upload */}
                    <FileUpload
                      label="Profile Photo (Optional)"
                      accept="image/*"
                      maxSize={2}
                      onFileSelect={setProfilePhoto}
                      preview={true}
                    />

                    {/* Agreement Checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) =>
                          setAgreedToTerms(checked === true)
                        }
                      />
                      <Label htmlFor="terms" className="text-sm">
                        All the details provided are accurate and true *
                      </Label>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("basic")}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-iteam-primary hover:bg-iteam-primary/90"
                      >
                        {loading
                          ? "Creating Account..."
                          : "Create Staff Account"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center mb-8">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-iteam-primary hover:underline">
                Login here
              </Link>
            </p>
            <p className="text-gray-600 mt-2">
              Want to register as student?{" "}
              <Link
                to="/register-student"
                className="text-iteam-primary hover:underline"
              >
                Student Registration
              </Link>
            </p>
          </div>

          <FAQ items={faqItems} className="mt-8" />
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterStaff;
