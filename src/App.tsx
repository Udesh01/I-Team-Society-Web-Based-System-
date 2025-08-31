import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ModernDashboardLayout from "./components/layout/ModernDashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import ModernStudentDashboard from "./pages/dashboard/ModernStudentDashboard";
import ModernStaffDashboard from "./pages/dashboard/ModernStaffDashboard";
import ModernAdminDashboard from "./pages/dashboard/ModernAdminDashboard";
import Profile from "./pages/dashboard/Profile";
import Events from "./pages/dashboard/Events";
import Membership from "./pages/dashboard/Membership";
import Notifications from "./pages/dashboard/Notifications";
import Achievements from "./pages/dashboard/Achievements";
import AdminDashboard from "./pages/dashboard/admin/AdminDashboard";
import UserManagement from "./pages/dashboard/admin/UserManagement";
import EventManagement from "./pages/dashboard/admin/EventManagement";
import MembershipManagement from "./pages/dashboard/admin/MembershipManagement";
import PaymentManagement from "./pages/dashboard/admin/PaymentManagement";
import RealTimeAdminDashboard from "./pages/dashboard/admin/RealTimeAdminDashboard";
import RealTimeStudentDashboard from "./pages/dashboard/RealTimeStudentDashboard";
import RealTimeStaffDashboard from "./pages/dashboard/RealTimeStaffDashboard";
import MemberProfile from "./pages/MemberProfile";
import RegisterStudent from "./pages/RegisterStudent";
import RegisterStaff from "./pages/RegisterStaff";
import RegisterAdmin from "./pages/RegisterAdmin";
import EmailConfirmation from "./pages/EmailConfirmation";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SearchResults from "./pages/dashboard/SearchResults";
import { AuthCleanup } from "./utils/authCleanup";
import AuthLoadingDebug from "./components/debug/AuthLoadingDebug";
import "./utils/env-test";

const queryClient = new QueryClient();

// Register the QueryClient with AuthCleanup for proper cache management
AuthCleanup.setQueryClient(queryClient);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* <AuthLoadingDebug /> */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-student" element={<RegisterStudent />} />
            <Route path="/register-staff" element={<RegisterStaff />} />
            <Route path="/register-admin" element={<RegisterAdmin />} />
            <Route path="/member/:eid" element={<MemberProfile />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<EmailConfirmation />} />

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ModernDashboardLayout />}>
                {/* Redirect root dashboard to role-specific dashboard */}
                <Route index element={<Dashboard />} />

                {/* Common dashboard pages */}
                <Route path="profile" element={<Profile />} />
                <Route path="events" element={<Events />} />
                <Route path="membership" element={<Membership />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="achievements" element={<Achievements />} />
                <Route path="search" element={<SearchResults />} />

                {/* Role-specific Modern Dashboards - Primary */}
                <Route
                  path="modern-student"
                  element={<ModernStudentDashboard />}
                />
                <Route path="modern-staff" element={<ModernStaffDashboard />} />

                {/* Real-time Dashboards - Legacy support only */}
                <Route
                  path="realtime-student"
                  element={<RealTimeStudentDashboard />}
                />
                <Route
                  path="realtime-staff"
                  element={<RealTimeStaffDashboard />}
                />

                {/* Admin Routes */}
                <Route path="admin">
                  <Route index element={<AdminDashboard />} />
                  {/* Modern Admin Dashboard - Primary */}
                  <Route path="modern" element={<ModernAdminDashboard />} />
                  {/* Real-time Admin Dashboard - Legacy support only */}
                  <Route path="realtime" element={<RealTimeAdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="events" element={<EventManagement />} />
                  <Route
                    path="memberships"
                    element={<MembershipManagement />}
                  />
                  <Route path="payments" element={<PaymentManagement />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
