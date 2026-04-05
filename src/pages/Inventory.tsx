import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowUpDown,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InventoryItemType = {
  _id: string;
  product: {
    name: string;
    sku: string;
  };
  warehouse: {
    name: string;
  };
  quantity: number;
  reserved: number;
  available: number;
  lastUpdated: string;
  status: "optimal" | "low" | "critical" | "out";
};

const statusStyles = {
  optimal: "badge-success",
  low: "badge-warning",
  critical: "bg-orange-500/20 text-orange-400",
  out: "badge-destructive",
};

const statusLabels = {
  optimal: "Optimal",
  low: "Low Stock",
  critical: "Critical",
  out: "Out of Stock",
};

const Inventory = () => {
  const [items, setItems] = useState<InventoryItemType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [offlineItemId, setOfflineItemId] = useState("");
  const [offlineQty, setOfflineQty] = useState("1");
  const [savingOffline, setSavingOffline] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const loadInventory = useCallback(async () => {
    try {
      const res = await api.get<InventoryItemType[]>("/inventory");
      setItems(res.data);
    } catch (error: any) {
      toast({
        title: "Failed to load inventory",
        description: error?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const openOfflineSale = (itemId?: string) => {
    setOfflineItemId(itemId || "");
    setOfflineQty("1");
    setOfflineOpen(true);
  };

  const submitOfflineSale = async () => {
    const qty = parseInt(offlineQty, 10);
    if (!offlineItemId || !Number.isFinite(qty) || qty < 1) {
      toast({
        title: "Invalid input",
        description: "Choose a stock line and enter quantity (1 or more).",
        variant: "destructive",
      });
      return;
    }
    setSavingOffline(true);
    try {
      await api.post("/inventory/offline-sale", {
        inventoryItemId: offlineItemId,
        quantity: qty,
      });
      toast({
        title: "Offline sale recorded",
        description: "Units removed from available stock.",
      });
      setOfflineOpen(false);
      await loadInventory();
    } catch (error: any) {
      toast({
        title: "Could not record sale",
        description: error?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingOffline(false);
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "Product Name",
      "SKU",
      "Warehouse",
      "Quantity",
      "Reserved",
      "Available",
      "Status",
      "Last Updated"
    ];
    
    const csvContent = [
      headers.join(","),
      ...filteredInventory.map(item => [
        `"${item.product.name}"`,
        item.product.sku,
        `"${item.warehouse.name}"`,
        item.quantity,
        item.reserved,
        item.available,
        statusLabels[item.status],
        new Date(item.lastUpdated).toLocaleDateString()
      ].join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export completed",
      description: "Inventory data has been exported to CSV.",
    });
  };

  const warehouseNames = useMemo(
    () => [...new Set(items.map((i) => i.warehouse.name))].sort(),
    [items]
  );

  const filteredInventory = items.filter((item) => {
    const matchesSearch =
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse =
      selectedWarehouse === "all" || item.warehouse.name === selectedWarehouse;
    const matchesStatus =
      selectedStatus === "all" || item.status === selectedStatus;
    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Real-time stock tracking across all warehouses
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && (
            <Button className="btn-primary gap-2" onClick={() => openOfflineSale()}>
              <Store className="w-4 h-4" />
              Record offline sale
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => loadInventory()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 animate-slide-in-up">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by product or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger className="w-[180px] input-field">
            <SelectValue placeholder="Warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouseNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px] input-field">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="optimal">Optimal</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-in-up" style={{ animationDelay: "50ms" }}>
        <div className="glass-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {items
                .reduce((sum, item) => sum + item.quantity, 0)
                .toLocaleString()}
            </p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Reserved</p>
            <p className="text-2xl font-bold text-warning font-mono">
              {items
                .reduce((sum, item) => sum + item.reserved, 0)
                .toLocaleString()}
            </p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-success font-mono">
              {items
                .reduce((sum, item) => sum + item.available, 0)
                .toLocaleString()}
            </p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Low Stock Items</p>
            <p className="text-2xl font-bold text-destructive font-mono">
              {items.filter(
                (item) =>
                  item.status === "low" ||
                  item.status === "critical" ||
                  item.status === "out"
              ).length}
            </p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card rounded-xl overflow-hidden animate-slide-in-up" style={{ animationDelay: "100ms" }}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">
                <div className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                  Product
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground">SKU</TableHead>
              <TableHead className="text-muted-foreground">Warehouse</TableHead>
              <TableHead className="text-muted-foreground text-right">Quantity</TableHead>
              <TableHead className="text-muted-foreground text-right">Reserved</TableHead>
              <TableHead className="text-muted-foreground text-right">Available</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Last Updated</TableHead>
              {isAdmin && (
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow key={item._id} className="table-row">
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item._id}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {item.product.sku}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.warehouse.name}</Badge>
                </TableCell>
                <TableCell className="font-mono text-right text-foreground">
                  {item.quantity}
                </TableCell>
                <TableCell className="font-mono text-right text-warning">
                  {item.reserved}
                </TableCell>
                <TableCell className="font-mono text-right text-success">
                  {item.available}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      statusStyles[item.status as keyof typeof statusStyles]
                    )}
                  >
                    {statusLabels[item.status as keyof typeof statusLabels]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.lastUpdated
                    ? new Date(item.lastUpdated).toLocaleString()
                    : "—"}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      disabled={item.available < 1}
                      onClick={() => openOfflineSale(item._id)}
                    >
                      Sell offline
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={offlineOpen} onOpenChange={setOfflineOpen}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Record offline sale</DialogTitle>
            <DialogDescription>
              Use this when a customer buys at a walk-in counter or cash counter. Only{" "}
              <strong>available</strong> units (not reserved for online orders) can be sold.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Stock line</Label>
              <Select value={offlineItemId} onValueChange={setOfflineItemId}>
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select product + warehouse" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {items
                    .filter((i) => i.available > 0)
                    .map((i) => (
                      <SelectItem key={i._id} value={i._id}>
                        {i.product.sku} · {i.warehouse.name} · avail {i.available}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offline-qty">Quantity sold</Label>
              <Input
                id="offline-qty"
                type="number"
                min={1}
                className="input-field"
                value={offlineQty}
                onChange={(e) => setOfflineQty(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfflineOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-primary" disabled={savingOffline} onClick={submitOfflineSale}>
              {savingOffline ? "Saving…" : "Confirm sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
