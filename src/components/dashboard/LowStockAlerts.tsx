import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LowStockAlerts = () => {
  const navigate = useNavigate();
  const { data: lowStockItems = [], isLoading } = useQuery({
    queryKey: ["low-stock-items"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/low-stock");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-warning/20">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Low Stock Alerts</h3>
      </div>

      <div className="space-y-4">
        {lowStockItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            All items are well stocked
          </div>
        ) : (
          lowStockItems.slice(0, 4).map((item: any, index: number) => {
            const percentage = (item.current / item.threshold) * 100;
            const isVeryLow = percentage < 30 || item.status === "critical";

            return (
              <div
                key={index}
                className="p-4 rounded-lg bg-secondary/30 space-y-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => navigate("/inventory")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.warehouse}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-mono font-semibold ${
                        isVeryLow ? "text-destructive" : "text-warning"
                      }`}
                    >
                      {item.current}
                    </p>
                    <p className="text-xs text-muted-foreground">of {item.threshold} min</p>
                  </div>
                </div>
                <Progress
                  value={Math.min(percentage, 100)}
                  className={`h-2 ${
                    isVeryLow
                      ? "[&>div]:bg-destructive"
                      : "[&>div]:bg-warning"
                  }`}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
