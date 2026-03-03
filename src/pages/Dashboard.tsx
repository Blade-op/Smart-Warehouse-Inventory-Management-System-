import { useQuery } from "@tanstack/react-query";
import { Package, Warehouse, TrendingUp, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { InventoryChart } from "@/components/dashboard/InventoryChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { WarehouseOverview } from "@/components/dashboard/WarehouseOverview";
import api from "@/lib/api";

type DashboardMetrics = {
  totalProducts: number;
  totalStock: number;
  warehouses: number;
  lowStockAlerts: number;
};

const Dashboard = () => {
  const { data, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const res = await api.get("/dashboard/metrics");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your warehouse overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={isLoading ? "…" : data?.totalProducts.toLocaleString() || "0"}
          change="+12.5% from last month"
          changeType="positive"
          icon={Package}
          delay={0}
        />
        <StatCard
          title="Total Stock"
          value={isLoading ? "…" : data?.totalStock.toLocaleString() || "0"}
          change="+8.2% from last month"
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-success"
          delay={50}
        />
        <StatCard
          title="Warehouses"
          value={isLoading ? "…" : String(data?.warehouses ?? 0)}
          change="Active locations"
          changeType="neutral"
          icon={Warehouse}
          iconColor="text-primary"
          delay={100}
        />
        <StatCard
          title="Low Stock Alerts"
          value={isLoading ? "…" : String(data?.lowStockAlerts ?? 0)}
          change="Items needing attention"
          changeType="negative"
          icon={AlertTriangle}
          iconColor="text-warning"
          delay={150}
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InventoryChart />
        </div>
        <LowStockAlerts />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrders />
        <WarehouseOverview />
      </div>
    </div>
  );
};

export default Dashboard;
