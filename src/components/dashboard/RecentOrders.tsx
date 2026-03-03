import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusStyles = {
  completed: "badge-success",
  processing: "bg-primary/20 text-primary",
  pending: "badge-warning",
  shipped: "bg-blue-500/20 text-blue-400",
  cancelled: "bg-destructive/20 text-destructive",
};

export const RecentOrders = () => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/orders");
      return data;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
        <Badge variant="secondary" className="font-mono">
          Last 10
        </Badge>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No orders yet
          </div>
        ) : (
          orders.slice(0, 5).map((order: any, index: number) => (
            <div
              key={order.id || index}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 cursor-pointer"
              onClick={() => navigate("/inventory")}
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-mono text-primary font-semibold">
                    {order.quantity}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{order.product}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.warehouse} • {order.id}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  className={cn(
                    "capitalize",
                    statusStyles[order.status as keyof typeof statusStyles] ||
                      "badge-secondary"
                  )}
                >
                  {order.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(order.date)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
