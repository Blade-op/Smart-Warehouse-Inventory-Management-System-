import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export const InventoryChart = () => {
  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ["inventory-chart"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/chart-data");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="chart-container animate-slide-in-up" style={{ animationDelay: "100ms" }}>
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Inventory Flow
        </h3>
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container animate-slide-in-up" style={{ animationDelay: "100ms" }}>
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Inventory Flow
      </h3>
      <div className="h-[300px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 10%)",
                  border: "1px solid hsl(217, 33%, 17%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px hsl(222, 47%, 3% / 0.6)",
                }}
                labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                itemStyle={{ color: "hsl(215, 20%, 55%)" }}
              />
              <Area
                type="monotone"
                dataKey="inbound"
                stroke="hsl(173, 80%, 40%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInbound)"
                name="Inbound"
              />
              <Area
                type="monotone"
                dataKey="outbound"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOutbound)"
                name="Outbound"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
