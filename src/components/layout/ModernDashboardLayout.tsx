import React, { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Menu,
  X,
  ChevronDown,
  Search,
  Plus,
  BarChart3,
  Shield,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  TestTube,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AuthDebug from "@/components/debug/AuthDebug";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";
import SearchBar from "@/components/search/SearchBar";
import DashboardDataDebug from "@/components/debug/DashboardDataDebug";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
  children?: MenuItem[];
  title?: string; // For mobile navigation
}

// Navigation items function that can be used by both desktop and mobile
const getNavigationItems = (
  userRole: string,
  notifications: number = 0
): MenuItem[] => {
  const baseItems: MenuItem[] = [
    {
      icon: <User size={20} />,
      label: "My Profile",
      title: "My Profile",
      href: "/dashboard/profile",
    },
    {
      icon: <Calendar size={20} />,
      label: "Events",
      title: "Events",
      href: "/dashboard/events",
      badge: "New",
    },
    {
      icon: <FileText size={20} />,
      label: "Membership",
      title: "Membership",
      href: "/dashboard/membership",
    },
    {
      icon: <Bell size={20} />,
      label: "Notifications",
      title: "Notifications",
      href: "/dashboard/notifications",
      badge: notifications > 0 ? notifications.toString() : undefined,
    },
  ];

  if (userRole === "student") {
    return [
      {
        icon: <Home size={20} />,
        label: "Dashboard",
        title: "Dashboard",
        href: "/dashboard/modern-student",
      },
      ...baseItems,
      {
        icon: <Award size={20} />,
        label: "My Achievements",
        title: "My Achievements",
        href: "/dashboard/achievements",
      },
    ];
  }

  if (userRole === "staff") {
    return [
      {
        icon: <Home size={20} />,
        label: "Dashboard",
        title: "Dashboard",
        href: "/dashboard/modern-staff",
      },
      ...baseItems,
      {
        icon: <Plus size={20} />,
        label: "Create Event",
        title: "Create Event",
        href: "/dashboard/events",
      },
      {
        icon: <BarChart3 size={20} />,
        label: "Event Analytics",
        title: "Event Analytics",
        href: "/dashboard/events",
      },
    ];
  }

  if (userRole === "admin") {
    return [
      {
        icon: <Home size={20} />,
        label: "Dashboard",
        title: "Dashboard",
        href: "/dashboard/admin/modern",
      },
      ...baseItems,
      {
        icon: <Shield size={20} />,
        label: "Admin Panel",
        title: "Admin Panel",
        href: "/dashboard/admin",
      },
      {
        icon: <Users size={20} />,
        label: "User Management",
        title: "User Management",
        href: "/dashboard/admin/users",
      },
      {
        icon: <Calendar size={20} />,
        label: "Event Management",
        title: "Event Management",
        href: "/dashboard/admin/events",
        badge: "New",
      },
      {
        icon: <CreditCard size={20} />,
        label: "Payment Management",
        title: "Payment Management",
        href: "/dashboard/admin/payments",
      },
      {
        icon: <UserCheck size={20} />,
        label: "Membership Management",
        title: "Membership Management",
        href: "/dashboard/admin/memberships",
      },
    ];
  }

  return [
    {
      icon: <Home size={20} />,
      label: "Dashboard",
      title: "Dashboard",
      href: "/dashboard",
    },
    ...baseItems,
  ];
};

interface ModernSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  userRole: string;
  userName: string;
  userAvatar?: string;
  notifications: number;
}

const ModernSidebar = ({
  isCollapsed,
  onToggle,
  userRole,
  userName,
  userAvatar,
  notifications,
}: ModernSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  // notifications is passed as a prop, no need for local state

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logged out successfully" });
      navigate("/login");
    } catch (error) {
      toast({ variant: "destructive", title: "Error logging out" });
    }
  };

  // Use the shared navigation items function
  const getMenuItems = (): MenuItem[] => {
    return getNavigationItems(userRole, notifications);
  };

  const menuItems = getMenuItems();

  const SidebarItem = ({
    item,
    isActive,
  }: {
    item: MenuItem;
    isActive: boolean;
  }) => (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700",
        isActive
          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
          : "text-gray-600 hover:text-gray-900",
        isCollapsed && "justify-center px-2"
      )}
    >
      <div className={cn("flex-shrink-0", isActive && "text-white")}>
        {item.icon}
      </div>
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <Badge
              variant={isActive ? "secondary" : "default"}
              className={cn(
                "text-xs px-2 py-0.5",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-blue-100 text-blue-700"
              )}
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 shadow-xl transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
          {!isCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-white-500 to-indigo-600 flex items-center justify-center">
                <img
                src="/team.png"
                alt="I-Team Logo"
                className="h-8 w-8"
              />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  i-Team Society
                </h1>
                <p className="text-xs text-gray-500 capitalize">
                  {userRole} Portal
                </p>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 hover:bg-gray-100"
          >
            {isCollapsed ? <Menu size={16} /> : <X size={16} />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <div key={index}>
                  <SidebarItem item={item} isActive={isActive} />
                  {item.children && !isCollapsed && (
                    <div className="ml-6 mt-2 space-y-1 border-l border-gray-200 pl-4">
                      {item.children.map((child, childIndex) => {
                        const isChildActive = location.pathname === child.href;
                        return (
                          <SidebarItem
                            key={childIndex}
                            item={child}
                            isActive={isChildActive}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-100">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Quick Tip
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  Your modern dashboard provides comprehensive insights and
                  analytics!
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const ModernDashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState(0);
  const { user, role } = useAuth();
  const { userProfile } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize email notifications
  useEmailNotifications();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch notification count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      try {
        // First try with 'read' column
        let { data, error } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("read", false);

        // If 'read' column doesn't exist, try with 'is_read' column
        if (
          error &&
          error.message.includes("column notifications.read does not exist")
        ) {
          console.log("Trying with is_read column instead");
          const result = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_read", false);

          data = result.data;
          error = result.error;
        }

        if (error) {
          // If notifications table doesn't exist, just set to 0
          if (
            error.message.includes('relation "notifications" does not exist')
          ) {
            setNotifications(0);
            return;
          }
          throw error;
        }

        setNotifications(data?.length || 0);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications(0); // Fallback to 0 notifications
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const userRole = role || userProfile?.role || "student";
  const userName = userProfile
    ? `${userProfile.first_name} ${userProfile.last_name}`
    : "User";
  const userAvatar = userProfile?.photo_url;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/admin/modern")) return "Modern Admin Dashboard";
    if (path.includes("/admin/realtime")) return "Real-Time Admin Dashboard";
    if (path.includes("/modern-student")) return "Modern Student Dashboard";
    if (path.includes("/modern-staff")) return "Modern Staff Dashboard";
    if (path.includes("/realtime-student"))
      return "Student Real-Time Dashboard";
    if (path.includes("/realtime-staff")) return "Staff Real-Time Dashboard";
    if (path.includes("/admin")) return "Admin Panel";
    if (path.includes("/profile")) return "My Profile";
    if (path.includes("/events")) return "Events";
    if (path.includes("/membership")) return "Membership";
    if (path.includes("/notifications")) return "Notifications";
    return "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <ModernSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={userRole}
          userName={userName}
          userAvatar={userAvatar}
          notifications={notifications}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Sidebar */}
          <div className="fixed left-0 top-0 z-50 h-screen w-72 bg-white border-r border-gray-200 shadow-xl lg:hidden">
            <div className="flex h-full flex-col">
              {/* Mobile Header */}
              <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">IT</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">
                      I-Team Society
                    </h1>
                    <p className="text-xs text-gray-500 capitalize">
                      {userRole} Portal
                    </p>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 hover:bg-gray-100"
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-2">
                  {getNavigationItems(userRole, notifications).map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        location.pathname === item.href
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-xs px-2 py-0.5"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          // No margin on mobile, margin on large screens
          "ml-0 lg:ml-72",
          sidebarCollapsed && "lg:ml-16"
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex h-full items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">
                  {getPageTitle()}
                </h1>
                <p className="text-xs md:text-sm text-gray-500 hidden sm:block">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  •{" "}
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Search */}
              <div className="hidden lg:block">
                <SearchBar placeholder="Search events, users, notifications..." />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 md:h-10 md:w-10"
                >
                  <Bell className="h-4 w-4 md:h-5 md:w-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 md:h-4 md:w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {notifications > 9 ? "9+" : notifications}
                    </span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10"
                >
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                </Button>

                {(userRole === "staff" || userRole === "admin") && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hidden sm:flex"
                    onClick={() => navigate("/dashboard/events?create=true")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">Create Event</span>
                    <span className="md:hidden">Create</span>
                  </Button>
                )}

                {/* Mobile create button */}
                {(userRole === "staff" || userRole === "admin") && (
                  <Button
                    size="icon"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 sm:hidden h-8 w-8"
                    onClick={() => navigate("/dashboard/events?create=true")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* User Avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-blue-100">
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                        {userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = "/dashboard/profile")
                    }
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = "/dashboard/notifications")
                    }
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open("mailto:support@iteam.com", "_blank")
                    }
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-4 md:px-6 py-4">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <span className="text-center sm:text-left">
                © 2025 I-Team Society
              </span>
              <Separator
                orientation="vertical"
                className="h-4 hidden sm:block"
              />
              <span className="text-center sm:text-left text-xs sm:text-sm">
                The Open University of Sri Lanka
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm">
                Last updated: {currentTime.toLocaleTimeString()}
              </span>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs sm:text-sm">System Online</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Debug components - only show in development */}
      {process.env.NODE_ENV === "development" && (
        <>
          {/* <AuthDebug /> */}
          {/* <DashboardDataDebug /> */}
        </>
      )}
    </div>
  );
};

export default ModernDashboardLayout;
