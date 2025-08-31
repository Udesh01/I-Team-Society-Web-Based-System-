import React from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  Calendar,
  Users,
  Settings,
  LogOut,
  Bell,
  User,
  FileText,
  LayoutDashboard,
  CreditCard,
  UserCheck,
  Activity,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";

// Role Display Component with test ID
const UserRoleDisplay = () => {
  const { user, role } = useAuth();
  
  if (!user) {
    return (
      <div 
        className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium"
        data-testid="user-role"
        title="No User"
      >
        --
      </div>
    );
  }

  const roleColor = {
    admin: 'bg-red-600',
    staff: 'bg-blue-600', 
    student: 'bg-green-600'
  }[role || 'student'] || 'bg-gray-600';

  const roleInitial = (role || 'guest').charAt(0).toUpperCase();
  
  return (
    <div 
      className={`h-8 w-8 rounded-full ${roleColor} flex items-center justify-center text-white text-xs font-medium`}
      data-testid="user-role"
      title={`Role: ${role || 'None'}`}
    >
      {roleInitial}
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem = ({ icon, label, href, active }: SidebarItemProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { isAdmin } = useUser();
  const pathname = window.location.pathname;

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border shadow-sm">
        <div className="flex h-full flex-col overflow-y-auto">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="I-Team Logo"
                className="h-8 w-8"
              />
              <span className="text-lg font-semibold text-sidebar-primary">
                iteam Society
              </span>
            </Link>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {/* Regular User Menu Items */}
              <SidebarItem
                icon={<Home size={20} />}
                label="Dashboard"
                href="/dashboard"
                active={pathname === "/dashboard"}
              />
              <SidebarItem
                icon={<User size={20} />}
                label="My Profile"
                href="/dashboard/profile"
                active={pathname === "/dashboard/profile"}
              />
              <SidebarItem
                icon={<Calendar size={20} />}
                label="Events"
                href="/dashboard/events"
                active={pathname === "/dashboard/events"}
              />
              <SidebarItem
                icon={<FileText size={20} />}
                label="Membership"
                href="/dashboard/membership"
                active={pathname === "/dashboard/membership"}
              />
              <SidebarItem
                icon={<Bell size={20} />}
                label="Notifications"
                href="/dashboard/notifications"
                active={pathname === "/dashboard/notifications"}
              />

              {/* Real-Time Dashboards */}
              <div className="mt-6 mb-2 px-3">
                <h2 className="text-xs font-semibold text-sidebar-foreground/60">
                  Real-Time Dashboards
                </h2>
              </div>
              <SidebarItem
                icon={<Activity size={20} />}
                label="Student Dashboard"
                href="/dashboard/realtime-student"
                active={pathname === "/dashboard/realtime-student"}
              />
              <SidebarItem
                icon={<Zap size={20} />}
                label="Staff Dashboard"
                href="/dashboard/realtime-staff"
                active={pathname === "/dashboard/realtime-staff"}
              />

              {/* Admin Menu Items */}
              {isAdmin && (
                <>
                  <div className="mt-6 mb-2 px-3">
                    <h2 className="text-xs font-semibold text-sidebar-foreground/60">
                      Admin
                    </h2>
                  </div>
                  <SidebarItem
                    icon={<LayoutDashboard size={20} />}
                    label="Admin Dashboard"
                    href="/dashboard/admin"
                    active={pathname === "/dashboard/admin"}
                  />
                  <SidebarItem
                    icon={<Activity size={20} />}
                    label="Real-Time Admin"
                    href="/dashboard/admin/realtime"
                    active={pathname === "/dashboard/admin/realtime"}
                  />
                  <SidebarItem
                    icon={<Users size={20} />}
                    label="User Management"
                    href="/dashboard/admin/users"
                    active={pathname === "/dashboard/admin/users"}
                  />
                  <SidebarItem
                    icon={<UserCheck size={20} />}
                    label="Memberships"
                    href="/dashboard/admin/memberships"
                    active={pathname === "/dashboard/admin/memberships"}
                  />
                  <SidebarItem
                    icon={<CreditCard size={20} />}
                    label="Payments"
                    href="/dashboard/admin/payments"
                    active={pathname === "/dashboard/admin/payments"}
                  />
                </>
              )}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="ml-64 flex-1 overflow-y-auto">
        {/* Content Header */}
        <header className="sticky top-0 z-30 h-16 border-b bg-white shadow-sm">
          <div className="flex h-full items-center justify-between px-6">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <div 
                className="h-8 w-8 rounded-full bg-iteam-primary flex items-center justify-center text-white font-medium"
                data-testid="user-role"
                title="User Role"
              >
                US
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
