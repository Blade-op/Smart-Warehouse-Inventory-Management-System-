import { useQuery } from "@tanstack/react-query";
import { Warehouse } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const WarehouseOverview = () => {
  const navigate = useNavigate();
  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data } = await api.get("/warehouses");
      return data;
    },
  });

  const { data: inventoryStats = [] } = useQuery({
    queryKey: ["warehouse-stats"],
    queryFn: async () => {
      const { data } = await api.get("/inventory");
      // Group by warehouse and calculate stats
      const stats: any = {};
      data.forEach((item: any) => {
        const warehouseId = item.warehouse?._id || item.warehouse;
        if (!stats[warehouseId]) {
          stats[warehouseId] = {
            items: 0,
            quantity: 0,
          };
        }
        stats[warehouseId].items += 1;
        stats[warehouseId].quantity += item.quantity || 0;
      });
      return stats;
    },
    enabled: warehouses.length > 0,
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "400ms" }}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Calculate capacity based on total items
  const warehousesWithStats = warehouses.map((warehouse: any) => {
    const stats = inventoryStats[warehouse._id] || { items: 0, quantity: 0 };
    // Assume capacity is based on quantity (10000 = 100%)
    const capacity = Math.min((stats.quantity / 100) * 100, 100);
    return {
      ...warehouse,
      items: stats.quantity,
      capacity: Math.round(capacity),
    };
  });

  return (
    <div className="glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/20">
          <Warehouse className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Warehouse Overview</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehousesWithStats.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            No warehouses yet
          </div>
        ) : (
          warehousesWithStats.slice(0, 4).map((warehouse: any) => {
            const capacityColor =
              warehouse.capacity > 80
                ? "text-destructive [&>div]:bg-destructive"
                : warehouse.capacity > 60
                ? "text-warning [&>div]:bg-warning"
                : "text-success [&>div]:bg-success";

            return (
              <div
                key={warehouse._id}
                className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 cursor-pointer"
                onClick={() => navigate("/warehouses")}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">{warehouse.name}</p>
                    <p className="text-sm text-muted-foreground">{warehouse.location || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-foreground">
                      {warehouse.items?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">items</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className={cn("font-medium", capacityColor.split(" ")[0])}>
                      {warehouse.capacity}%
                    </span>
                  </div>
                  <Progress value={warehouse.capacity} className={cn("h-2", capacityColor)} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
