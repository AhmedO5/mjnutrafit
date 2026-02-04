import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Users, 
  LogOut,
  Menu,
  X,
  User
} from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { isAuthenticated, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => {
    if (path === "/dashboard" || path === "/coach-dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/coach-dashboard";
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!isAuthenticated) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            MJNutraFit
          </Link>
          <div className="flex gap-4 items-center">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const isCoach = userRole === "coach";

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to={isCoach ? "/coach-dashboard" : "/dashboard"} className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent flex items-center gap-2">
            <Home className="w-6 h-6" />
            MJNutraFit
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to={isCoach ? "/coach-dashboard" : "/dashboard"}>
              <Button 
                variant={isActive(isCoach ? "/coach-dashboard" : "/dashboard") ? "default" : "ghost"} 
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/plans">
              <Button 
                variant={isActive("/plans") ? "default" : "ghost"} 
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Plans
              </Button>
            </Link>
            <Link to="/progress">
              <Button 
                variant={isActive("/progress") ? "default" : "ghost"} 
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                {isCoach ? "Review Progress" : "My Progress"}
              </Button>
            </Link>
            {isCoach && (
              <Link to="/coach-dashboard">
                <Button 
                  variant={isActive("/coach-dashboard") ? "default" : "ghost"} 
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  My Clients
                </Button>
              </Link>
            )}
            <Link to="/profile">
              <Button 
                variant={isActive("/profile") ? "default" : "ghost"} 
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4 space-y-2">
            <Link to={isCoach ? "/coach-dashboard" : "/dashboard"} onClick={() => setMobileMenuOpen(false)}>
              <Button 
                variant={isActive(isCoach ? "/coach-dashboard" : "/dashboard") ? "default" : "ghost"} 
                className="w-full justify-start flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/plans" onClick={() => setMobileMenuOpen(false)}>
              <Button 
                variant={isActive("/plans") ? "default" : "ghost"} 
                className="w-full justify-start flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Plans
              </Button>
            </Link>
            <Link to="/progress" onClick={() => setMobileMenuOpen(false)}>
              <Button 
                variant={isActive("/progress") ? "default" : "ghost"} 
                className="w-full justify-start flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                {isCoach ? "Review Progress" : "My Progress"}
              </Button>
            </Link>
            {isCoach && (
              <Link to="/coach-dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={isActive("/coach-dashboard") ? "default" : "ghost"} 
                  className="w-full justify-start flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  My Clients
                </Button>
              </Link>
            )}
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
              <Button 
                variant={isActive("/profile") ? "default" : "ghost"} 
                className="w-full justify-start flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
