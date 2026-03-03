import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const salesData = [
  { month: "Jan", sales: 42000, orders: 320 },
  { month: "Feb", sales: 38000, orders: 280 },
  { month: "Mar", sales: 55000, orders: 420 },
  { month: "Apr", sales: 48000, orders: 380 },
  { month: "May", sales: 62000, orders: 490 },
  { month: "Jun", sales: 58000, orders: 450 },
  { month: "Jul", sales: 71000, orders: 560 },
];

const categoryData = [
  { name: "Electronics", value: 45, color: "hsl(173, 80%, 40%)" },
  { name: "Audio", value: 25, color: "hsl(38, 92%, 50%)" },
  { name: "Wearables", value: 18, color: "hsl(142, 76%, 36%)" },
  { name: "Accessories", value: 12, color: "hsl(262, 83%, 58%)" },
];

const demandData = [
  { product: "iPhone 15 Pro", current: 245, predicted: 320 },
  { product: "MacBook Air", current: 128, predicted: 180 },
  { product: "AirPods Pro", current: 450, predicted: 520 },
  { product: "iPad Pro", current: 85, predicted: 110 },
  { product: "Apple Watch", current: 210, predicted: 280 },
];

const deadStockData = [
  { name: "Lightning Cable", days: 120, value: 850 },
  { name: "iPhone 12 Case", days: 95, value: 420 },
  { name: "Old Charger", days: 88, value: 380 },
  { name: "USB-A Hub", days: 75, value: 290 },
];

const Analytics = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Sales insights, demand forecasting, and inventory analytics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Revenue",
            value: "$374,000",
            change: "+12.5%",
            positive: true,
            icon: DollarSign,
          },
          {
            title: "Total Orders",
            value: "2,900",
            change: "+8.2%",
            positive: true,
            icon: Package,
          },
          {
            title: "Avg Order Value",
            value: "$129",
            change: "+4.1%",
            positive: true,
            icon: TrendingUp,
          },
          {
            title: "Dead Stock Value",
            value: "$1,940",
            change: "-15.3%",
            positive: false,
            icon: TrendingDown,
          },
        ].map((kpi, index) => (
          <div
            key={index}
            className="stat-card animate-slide-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{kpi.title}</p>
              <kpi.icon className={cn("w-5 h-5", kpi.positive ? "text-success" : "text-destructive")} />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className={cn("text-sm font-medium", kpi.positive ? "text-success" : "text-destructive")}>
              {kpi.change} from last month
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 chart-container animate-slide-in-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Sales Trend</h3>
            <Badge variant="secondary" className="font-mono">Last 7 months</Badge>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 10%)",
                    border: "1px solid hsl(217, 33%, 17%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Sales"]}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(173, 80%, 40%)" strokeWidth={2} fillOpacity={1} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="chart-container animate-slide-in-up" style={{ animationDelay: "150ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-6">Category Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 10%)",
                    border: "1px solid hsl(217, 33%, 17%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demand Forecast */}
        <div className="chart-container animate-slide-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Demand Forecast</h3>
            <Badge variant="secondary">Next 30 days</Badge>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                <YAxis type="category" dataKey="product" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 10%)",
                    border: "1px solid hsl(217, 33%, 17%)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="current" fill="hsl(217, 33%, 30%)" name="Current Stock" radius={[0, 4, 4, 0]} />
                <Bar dataKey="predicted" fill="hsl(173, 80%, 40%)" name="Predicted Demand" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dead Stock Analysis */}
        <div className="chart-container animate-slide-in-up" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Dead Stock Analysis</h3>
            <Badge variant="secondary" className="bg-destructive/20 text-destructive">
              Action Required
            </Badge>
          </div>
          <div className="space-y-4">
            {deadStockData.map((item, index) => (
              <div key={index} className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <span className="text-sm text-destructive font-mono">
                    {item.days} days
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stock Value</span>
                  <span className="font-mono text-warning">${item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
