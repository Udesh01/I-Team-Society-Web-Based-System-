
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="bg-iteam-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                 className="h-8 w-8"
                src="/team.png"
                alt="I-Team Logo"
              />
              <span className="ml-2 text-xl font-bold text-iteam-primary">
                iteam Society
              </span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/contact">Contact</NavLink>
            
            {user ? (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <Button 
                  variant="outline" 
                  className="text-iteam-primary border-iteam-primary"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="text-iteam-primary border-iteam-primary">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild className="bg-iteam-primary hover:bg-iteam-primary/90 text-white">
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-iteam-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-iteam-primary"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn("md:hidden", isMenuOpen ? "block" : "hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <MobileNavLink href="/">Home</MobileNavLink>
          <MobileNavLink href="/about">About</MobileNavLink>
          <MobileNavLink href="/contact">Contact</MobileNavLink>
          
          {user ? (
            <>
              <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 text-iteam-primary hover:bg-gray-100 rounded-md font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <MobileNavLink href="/login">Login</MobileNavLink>
              <MobileNavLink href="/register">Register</MobileNavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <Link
      to={href}
      className="px-3 py-2 text-iteam-primary hover:bg-gray-100 rounded-md font-medium"
    >
      {children}
    </Link>
  );
};

const MobileNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <Link
      to={href}
      className="block px-3 py-2 text-iteam-primary hover:bg-gray-100 rounded-md font-medium"
    >
      {children}
    </Link>
  );
};

export default Navbar;
