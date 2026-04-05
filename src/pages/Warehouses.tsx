import { useEffect, useState } from "react";
import {
  MapPin,
  Package,
  Users,
  TrendingUp,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const statusStyles = {
  operational: "badge-success",
  maintenance: "badge-warning",
  offline: "badge-destructive",
};

type WarehouseType = {
  _id: string;
  name: string;
  location: string;
  address: string;
  capacity: number;
  totalItems: number;
  staff: number;
  status: "operational" | "maintenance" | "offline";
  monthlyThroughput: number;
};

const Warehouses = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    name: "",
    location: "",
    address: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<WarehouseType[]>("/warehouses");
        setWarehouses(res.data);
      } catch (error: any) {
        toast({
          title: "Failed to load warehouses",
          description: error?.response?.data?.message || "Please try again.",
          variant: "destructive",
        });
      }
    };
    load();
  }, [toast]);

  const handleAddWarehouse = async () => {
    const warehousePayload = {
      name: newWarehouse.name,
      location: newWarehouse.location,
      address: newWarehouse.address,
      capacity: 0,
      totalItems: 0,
      staff: 0,
      status: "operational",
      monthlyThroughput: 0,
    };

    try {
      const res = await api.post<WarehouseType>("/warehouses", warehousePayload);
      setWarehouses([res.data, ...warehouses]);
    } catch (error: any) {
      toast({
        title: "Warehouse create failed",
        description: error?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
      return;
    }
    setNewWarehouse({ name: "", location: "", address: "" });
    setIsAddDialogOpen(false);
    toast({
      title: "Warehouse Added",
      description: `${warehousePayload.name} has been added successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warehouses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your warehouse locations and capacity
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary gap-2">
                <Plus className="w-4 h-4" />
                Add Warehouse
              </Button>
            </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
              <DialogDescription>
                Enter the warehouse details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Warehouse Name</Label>
                <Input
                  id="name"
                  value={newWarehouse.name}
                  onChange={(e) =>
                    setNewWarehouse({ ...newWarehouse, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="Warehouse E"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newWarehouse.location}
                  onChange={(e) =>
                    setNewWarehouse({ ...newWarehouse, location: e.target.value })
                  }
                  className="input-field"
                  placeholder="Seattle, WA"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Full Address</Label>
                <Input
                  id="address"
                  value={newWarehouse.address}
                  onChange={(e) =>
                    setNewWarehouse({ ...newWarehouse, address: e.target.value })
                  }
                  className="input-field"
                  placeholder="123 Industrial Ave, Seattle, WA 98101"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button className="btn-primary" onClick={handleAddWarehouse}>
                Add Warehouse
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Warehouse Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {warehouses.map((warehouse, index) => {
          const capacityColor =
            warehouse.capacity > 80
              ? "text-destructive [&>div]:bg-destructive"
              : warehouse.capacity > 60
              ? "text-warning [&>div]:bg-warning"
              : "text-success [&>div]:bg-success";

          return (
            <div
              key={warehouse._id}
              className="glass-card-hover rounded-xl p-6 animate-slide-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-foreground">
                      {warehouse.name}
                    </h3>
                    <Badge
                      className={cn(
                        "capitalize",
                        statusStyles[warehouse.status as keyof typeof statusStyles]
                      )}
                    >
                      {warehouse.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{warehouse.location}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {warehouse.address}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label="Open warehouse"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/warehouses/${warehouse._id}`);
                  }}
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Package className="w-4 h-4" />
                    <span className="text-xs">Items</span>
                  </div>
                  <p className="text-xl font-bold text-foreground font-mono">
                    {warehouse.totalItems.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">Staff</span>
                  </div>
                  <p className="text-xl font-bold text-foreground font-mono">
                    {warehouse.staff}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">Monthly</span>
                  </div>
                  <p className="text-xl font-bold text-foreground font-mono">
                    {(warehouse.monthlyThroughput / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity Usage</span>
                  <span className={cn("font-medium font-mono", capacityColor.split(" ")[0])}>
                    {warehouse.capacity}%
                  </span>
                </div>
                <Progress value={warehouse.capacity} className={cn("h-3", capacityColor)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Warehouses;
