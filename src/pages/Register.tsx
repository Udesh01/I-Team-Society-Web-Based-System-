import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Users, Shield } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <MainLayout>
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-iteam-primary mb-4">
              Join I-Team Society
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose your registration type to become a member of The Open
              University of Sri Lanka premier Computer Science student society.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-iteam-primary">
                  Student Registration
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Register as a student member of I-Team Society
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">
                    What you get:
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Access to all events and workshops</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Networking opportunities</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Academic support and resources</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>E-ID card with QR verification</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Tiered membership based on academic level</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-3 border">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Membership Fee:
                  </h4>
                  <p className="text-sm text-gray-600">
                    Level 1: Rs. 500 | Level 2: Rs. 1000 | Level 3+: Rs. 1500
                  </p>
                </div>

                <Button
                  asChild
                  className="w-full bg-blue-500 hover:opacity-90 text-white"
                >
                  <Link to="/register-student">Register as student</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-iteam-primary">
                  Staff Registration
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Register as a staff member of I-Team Society
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">
                    What you get:
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Event management capabilities</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Access to all member events</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Professional networking</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>E-ID card with QR verification</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Flexible membership options</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-3 border">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Membership Fee:
                  </h4>
                  <p className="text-sm text-gray-600">
                    1 Year: Rs. 500 | 2 Year: Rs. 1000 | Lifetime: Rs. 1500
                  </p>
                </div>

                <Button
                  asChild
                  className="w-full bg-green-500 hover:opacity-90 text-white"
                >
                  <Link to="/register-staff">Register as staff</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-iteam-primary">
                  Admin Registration
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Register as an administrator (Authorized personnel only)
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">
                    What you get:
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Full system administration access</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>User and membership management</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Event oversight and approval</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Payment verification</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>System configuration</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-3 border">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Membership Fee:
                  </h4>
                  <p className="text-sm text-gray-600">
                    Free administrative access
                  </p>
                </div>

                <Button
                  asChild
                  className="w-full bg-red-500 hover:opacity-90 text-white"
                >
                  <Link to="/register-admin">Register as Administrator</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-iteam-primary hover:underline font-semibold"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
