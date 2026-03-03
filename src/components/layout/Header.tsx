import { useState, useEffect, useRef } from "react";
import { Bell, Search, User, Package, Warehouse, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/notifications");
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Search functionality
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length < 1) return { products: [], warehouses: [] };
      const { data } = await api.get("/dashboard/search", { params: { q: searchQuery.trim() } });
      return data;
    },
    enabled: searchQuery.trim().length >= 1 && searchOpen,
  });

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 1) {
      searchTimeoutRef.current = setTimeout(() => {
        setSearchOpen(true);
      }, 300);
    } else {
      setSearchOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchItemClick = (type: "product" | "warehouse", id: string) => {
    setSearchQuery("");
    setSearchOpen(false);
    if (type === "product") {
      navigate(`/products`);
    } else {
      navigate(`/warehouses`);
    }
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6">
      {/* Search */}
      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products, warehouses..."
              className="pl-10 input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 1 && setSearchOpen(true)}
            />
          </div>
        </PopoverTrigger>
        {searchQuery.trim().length >= 1 && (
          <PopoverContent className="w-96 glass-card p-0" align="start">
            {searchLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults?.products?.length === 0 && searchResults?.warehouses?.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {searchResults?.products?.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Products
                    </div>
                    {searchResults.products.map((product: any) => (
                      <button
                        key={product._id || product.id}
                        onClick={() => handleSearchItemClick("product", product._id || product.id)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left"
                      >
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {product.sku} • ${product.price?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults?.warehouses?.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Warehouses
                    </div>
                    {searchResults.warehouses.map((warehouse: any) => (
                      <button
                        key={warehouse._id || warehouse.id}
                        onClick={() => handleSearchItemClick("warehouse", warehouse._id || warehouse.id)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left"
                      >
                        <Warehouse className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{warehouse.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {warehouse.location}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </PopoverContent>
        )}
      </Popover>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] flex items-center justify-center text-destructive-foreground font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass-card">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificationsLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.slice(0, 10).map((notification: any) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 cursor-pointer"
                    onClick={() => {
                      if (notification.id.includes("order")) {
                        navigate("/inventory");
                      } else if (notification.id.includes("low-stock")) {
                        navigate("/inventory");
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span
                        className={cn(
                          "font-medium",
                          notification.type === "warning" && "text-warning",
                          notification.type === "success" && "text-success",
                          notification.type === "info" && "text-primary"
                        )}
                      >
                        {notification.title}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {notification.message}
                    </span>
                    {notification.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleDateString()}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  {user?.role && (
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {user.role === "admin" ? "Admin" : "User"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span>My Account</span>
                {user?.role && (
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="w-fit text-xs"
                  >
                    {user.role === "admin" ? "Administrator" : "User"}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                logout();
                navigate("/auth");
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
