import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Box,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/products", label: "Products", icon: Package },
  { path: "/warehouses", label: "Warehouses", icon: Warehouse },
  { path: "/inventory", label: "Inventory", icon: ClipboardList },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/users", label: "Users", icon: Users, adminOnly: true },
  { path: "/settings", label: "Settings", icon: Settings },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter((item) => {
    if (item.adminOnly && user?.role !== "admin") {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse-glow">
          <Box className="w-6 h-6 text-primary" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-foreground">WareFlow</h1>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
        {filteredNavigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-item",
                isActive && "active",
                collapsed && "justify-center px-3"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => {
            logout();
            navigate("/auth");
          }}
          className={cn(
            "w-full sidebar-item text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-3"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-all duration-200"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
};
