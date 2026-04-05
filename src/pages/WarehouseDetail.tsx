import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Loader2,
  MapPin,
  Package,
  Search,
  Printer,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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

type InvRow = {
  _id: string;
  quantity: number;
  reserved: number;
  available: number;
  status: string;
  lastUpdated?: string;
  updatedAt?: string;
  product: { _id: string; name: string; sku: string; category?: string; price: number };
};

type OrderRow = {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  items: { name: string; sku: string; quantity: number; lineTotal: number }[];
};

type BillItem = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type Bill = {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  warehouseId: string;
  items: BillItem[];
  totalItems: number;
  totalAmount: number;
};

const statusStyles = {
  operational: "badge-success",
  maintenance: "badge-warning",
  offline: "badge-destructive",
};

const invStatusStyles: Record<string, string> = {
  optimal: "badge-success",
  low: "badge-warning",
  critical: "bg-orange-500/20 text-orange-400",
  out: "badge-destructive",
};

function downloadBlob(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

const WarehouseDetail = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    address: "",
  });

  const {
    data: warehouse,
    isLoading: whLoading,
    error: whError,
  } = useQuery({
    queryKey: ["warehouse", warehouseId],
    queryFn: async () => {
      const { data } = await api.get<WarehouseType>(`/warehouses/${warehouseId}`);
      return data;
    },
    enabled: !!warehouseId,
  });

  const { data: inventory = [], isLoading: invLoading } = useQuery({
    queryKey: ["inventory", warehouseId],
    queryFn: async () => {
      const { data } = await api.get<InvRow[]>(`/inventory`, {
        params: { warehouseId },
      });
      return data;
    },
    enabled: !!warehouseId,
  });

  const { data: orders = [], isLoading: ordLoading } = useQuery({
    queryKey: ["warehouse-orders", warehouseId],
    queryFn: async () => {
      const { data } = await api.get<OrderRow[]>(
        `/dashboard/warehouse/${warehouseId}/orders`
      );
      return data;
    },
    enabled: !!warehouseId,
  });

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["warehouse", warehouseId] });
    queryClient.invalidateQueries({ queryKey: ["inventory", warehouseId] });
    queryClient.invalidateQueries({ queryKey: ["warehouse-orders", warehouseId] });
    toast({ title: "Refreshed", description: "Latest data loaded." });
  }, [queryClient, warehouseId, toast]);

  const [orderOpen, setOrderOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderBill, setOrderBill] = useState<Bill | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [qtyByProductId, setQtyByProductId] = useState<Record<string, string>>({});
  const [orderSearchDraft, setOrderSearchDraft] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  const openOrderDialog = () => {
    setOrderBill(null);
    setSelectedProductIds([]);
    setQtyByProductId({});
    setOrderSearchDraft("");
    setOrderSearchQuery("");
    setOrderOpen(true);
  };

  const closeOrderDialog = () => {
    setOrderOpen(false);
    setOrderBill(null);
    setSelectedProductIds([]);
    setQtyByProductId({});
    setOrderSearchDraft("");
    setOrderSearchQuery("");
  };

  const selectedInvRows = useMemo(() => {
    const idSet = new Set(selectedProductIds);
    return inventory.filter((r) => idSet.has(r.product._id));
  }, [inventory, selectedProductIds]);

  const inventoryForOrderTable = useMemo(() => {
    const q = orderSearchQuery.trim();
    if (!q) return inventory;

    const tokens = q
      .split(",")
      .flatMap((part) => part.split(/\s+/g))
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (tokens.length === 0) return inventory;

    return inventory.filter((row) => {
      const sku = row.product?.sku?.toString().toLowerCase() || "";
      return tokens.some((t) => sku === t || sku.includes(t));
    });
  }, [inventory, orderSearchQuery]);

  const draft = useMemo(() => {
    const lines = selectedInvRows.map((row) => {
      const pid = row.product._id;
      const qtyRaw = qtyByProductId[pid];
      const qty = qtyRaw ? parseInt(qtyRaw, 10) : NaN;
      const unitPrice = row.product.price ?? 0;
      const lineTotal = Number.isFinite(qty) ? qty * unitPrice : 0;
      return { productId: pid, name: row.product.name, sku: row.product.sku, available: row.available, qty, unitPrice, lineTotal };
    });

    const totalItems = lines.reduce((s, l) => s + (Number.isFinite(l.qty) ? l.qty : 0), 0);
    const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);
    const hasInvalidQty = lines.some((l) => !Number.isFinite(l.qty) || l.qty < 1 || l.qty > l.available);

    return { lines, totalItems, totalAmount, hasInvalidQty };
  }, [selectedInvRows, qtyByProductId]);

  const toggleProduct = (productId: string, available: number) => {
    if (available < 1) return;
    setSelectedProductIds((prev) => {
      const alreadySelected = prev.includes(productId);
      if (alreadySelected) {
        const next = prev.filter((id) => id !== productId);
        setQtyByProductId((q) => {
          const { [productId]: _removed, ...rest } = q;
          return rest;
        });
        return next;
      }

      setQtyByProductId((q) => ({ ...q, [productId]: q[productId] ?? "1" }));
      return [...prev, productId];
    });
  };

  const submitOrder = async () => {
    if (!warehouseId) return;
    if (selectedProductIds.length < 1) return;
    if (draft.hasInvalidQty) {
      toast({
        title: "Invalid quantities",
        description: "Ensure each selected product has a valid quantity within available stock.",
        variant: "destructive",
      });
      return;
    }

    const lines = draft.lines
      .filter((l) => selectedProductIds.includes(l.productId))
      .map((l) => ({ productId: l.productId, quantity: l.qty }));

    setCreatingOrder(true);
    try {
      const { data } = await api.post("/inventory/create-order", {
        warehouseId,
        lines,
      });

      toast({ title: "Order created", description: `Order ${data?.bill?.orderNumber || data?.bill?.orderId}` });
      queryClient.invalidateQueries({ queryKey: ["inventory", warehouseId] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-orders", warehouseId] });
      setOrderBill(data.bill as Bill);
    } catch (error: any) {
      toast({
        title: "Could not create order",
        description: error?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  const exportExcel = async () => {
    if (!warehouseId) return;
    try {
      const res = await api.get(`/reports/warehouse/${warehouseId}/excel`, {
        responseType: "blob",
      });
      const name = `${warehouse?.name?.replace(/\s+/g, "_") || "warehouse"}_Report.xlsx`;
      downloadBlob(res.data, name);
      toast({ title: "Download started", description: "Excel report saved." });
    } catch (e: unknown) {
      toast({
        title: "Export failed",
        description: (e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Try again.",
        variant: "destructive",
      });
    }
  };

  const exportPdf = async () => {
    if (!warehouseId) return;
    try {
      const res = await api.get(`/reports/warehouse/${warehouseId}/pdf`, {
        responseType: "blob",
      });
      const name = `${warehouse?.name?.replace(/\s+/g, "_") || "warehouse"}_Report.pdf`;
      downloadBlob(res.data, name);
      toast({ title: "Download started", description: "PDF report saved." });
    } catch (e: unknown) {
      toast({
        title: "Export failed",
        description: (e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Try again.",
        variant: "destructive",
      });
    }
  };

  const openEdit = () => {
    if (!warehouse) return;
    setEditForm({
      name: warehouse.name,
      location: warehouse.location,
      address: warehouse.address,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!warehouseId) return;
    try {
      const { data } = await api.patch<WarehouseType>(`/warehouses/${warehouseId}`, editForm);
      queryClient.setQueryData(["warehouse", warehouseId], data);
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setEditOpen(false);
      toast({ title: "Saved", description: "Warehouse details updated." });
    } catch (e: unknown) {
      toast({
        title: "Update failed",
        description: (e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Try again.",
        variant: "destructive",
      });
    }
  };

  if (whLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        Loading warehouse…
      </div>
    );
  }

  if (whError || !warehouse) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2" onClick={() => navigate("/warehouses")}>
          <ArrowLeft className="w-4 h-4" />
          Back to warehouses
        </Button>
        <p className="text-destructive">Warehouse not found or failed to load.</p>
      </div>
    );
  }

  const capacityColor =
    warehouse.capacity > 80
      ? "text-destructive [&>div]:bg-destructive"
      : warehouse.capacity > 60
      ? "text-warning [&>div]:bg-warning"
      : "text-success [&>div]:bg-success";

  const totalQty = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalReserved = inventory.reduce((s, i) => s + i.reserved, 0);
  const totalAvail = inventory.reduce((s, i) => s + i.available, 0);

  return (
    <div className="space-y-6 print:space-y-4" id="warehouse-print-root">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="outline" className="gap-2 w-fit" onClick={() => navigate("/warehouses")}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{warehouse.name}</h1>
              <Badge
                className={cn(
                  "capitalize",
                  statusStyles[warehouse.status as keyof typeof statusStyles]
                )}
              >
                {warehouse.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-sm">{warehouse.location}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">{warehouse.address}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={refreshAll}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportExcel}>
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportPdf}>
            <FileText className="w-4 h-4" />
            PDF
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Print
          </Button>
          {isAdmin && (
            <Button variant="secondary" className="gap-2" onClick={openOrderDialog}>
              <Package className="w-4 h-4" />
              Create Order
            </Button>
          )}
          {isAdmin && (
            <Button variant="secondary" className="gap-2" onClick={openEdit}>
              <Settings className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Package className="w-4 h-4" />
            <span className="text-xs">Stock lines / units</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {inventory.length} lines · {totalQty.toLocaleString()} units
          </p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Staff</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">{warehouse.staff}</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Monthly throughput</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {(warehouse.monthlyThroughput / 1000).toFixed(1)}K
          </p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Capacity usage (recorded)</span>
          <span className={cn("font-medium font-mono", capacityColor.split(" ")[0])}>
            {warehouse.capacity}%
          </span>
        </div>
        <Progress value={warehouse.capacity} className={cn("h-3", capacityColor)} />
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory ({inventory.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-2">
          <div className="grid grid-cols-3 gap-3 max-w-md text-sm">
            <div>
              <span className="text-muted-foreground">Reserved</span>
              <p className="font-mono font-semibold text-warning">{totalReserved.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Available</span>
              <p className="font-mono font-semibold text-success">{totalAvail.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Recorded total items</span>
              <p className="font-mono font-semibold">{warehouse.totalItems?.toLocaleString() ?? "—"}</p>
            </div>
          </div>

          {invLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell className="font-medium">{row.product?.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {row.product?.sku}
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-warning">{row.reserved}</TableCell>
                      <TableCell className="text-right font-mono text-success">{row.available}</TableCell>
                      <TableCell>
                        <Badge className={invStatusStyles[row.status] || "badge-secondary"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {inventory.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No stock lines for this warehouse.</p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-2">
          {ordLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lines</TableHead>
                    <TableHead className="text-right">Total (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o._id}>
                      <TableCell className="font-mono">{o.orderNumber}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[280px]">
                        {o.items?.map((it) => `${it.name} ×${it.quantity}`).join(" · ") || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">₹{o.totalAmount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {orders.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No orders for this warehouse yet.</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle>Edit warehouse</DialogTitle>
            <DialogDescription>Update name, location, and address.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="wh-name">Name</Label>
              <Input
                id="wh-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wh-loc">Location</Label>
              <Input
                id="wh-loc"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wh-addr">Address</Label>
              <Input
                id="wh-addr"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-primary" onClick={saveEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={orderOpen} onOpenChange={(open) => (!open ? closeOrderDialog() : undefined)}>
        <DialogContent className="glass-card border-border max-w-5xl">
          {orderBill ? (
            <>
              <DialogHeader>
                <DialogTitle>Billing Receipt</DialogTitle>
                <DialogDescription>
                  Offline cashier bill generated for this warehouse.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="text-lg font-mono font-semibold">{orderBill.orderId}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(orderBill.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-3">
                    <p className="text-sm text-muted-foreground">Total items</p>
                    <p className="text-xl font-bold font-mono">{orderBill.totalItems}</p>
                  </div>
                </div>

                <div className="glass-card rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right">Line Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderBill.items.map((it) => (
                        <TableRow key={it.productId}>
                          <TableCell className="font-medium">{it.name}</TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">{it.sku}</TableCell>
                          <TableCell className="text-right font-mono">{it.quantity}</TableCell>
                          <TableCell className="text-right font-mono">₹{it.unitPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">₹{it.lineTotal.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-end gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Grand total</p>
                    <p className="text-2xl font-bold font-mono">₹{orderBill.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => window.print()} disabled={creatingOrder}>
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button className="btn-primary" onClick={closeOrderDialog}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Create Order / Billing</DialogTitle>
                <DialogDescription>
                  Select multiple products and quantities from this warehouse (admin only).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="glass-card rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Selected items</p>
                      <p className="text-lg font-bold font-mono">{draft.totalItems.toLocaleString()} units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total price</p>
                      <p className="text-lg font-bold font-mono">₹{draft.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedInvRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">No products selected yet.</p>
                  ) : (
                    <div className="mt-3 space-y-1">
                      {draft.lines
                        .filter((l) => selectedProductIds.includes(l.productId))
                        .map((l) => (
                          <div key={l.productId} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-foreground truncate">{l.name}</span>
                            <span className="font-mono text-muted-foreground">
                              {l.qty} × ₹{l.unitPrice.toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="glass-card rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <Label htmlFor="order-sku-search" className="text-sm text-muted-foreground">
                        Search by SKU (e.g. `300,289`)
                      </Label>
                      <Input
                        id="order-sku-search"
                        placeholder="Type SKU(s)…"
                        value={orderSearchDraft}
                        onChange={(e) => setOrderSearchDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setOrderSearchQuery(orderSearchDraft);
                        }}
                        className="input-field mt-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setOrderSearchQuery(orderSearchDraft)}
                      >
                        <Search className="w-4 h-4" />
                        Search
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setOrderSearchDraft("");
                          setOrderSearchQuery("");
                        }}
                        disabled={!orderSearchDraft.trim() && !orderSearchQuery.trim()}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[420px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Available</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Line Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryForOrderTable.map((row) => {
                          const pid = row.product._id;
                          const selected = selectedProductIds.includes(pid);
                          const qtyRaw = qtyByProductId[pid] ?? "";
                          const qty = qtyRaw ? parseInt(qtyRaw, 10) : NaN;
                          const unitPrice = row.product.price ?? 0;
                          const lineTotal = selected && Number.isFinite(qty) ? qty * unitPrice : 0;

                          return (
                            <TableRow key={row._id}>
                              <TableCell>
                                <Checkbox
                                  checked={selected}
                                  disabled={row.available < 1}
                                  onCheckedChange={(v) => {
                                    const nextChecked = Boolean(v);
                                    if (nextChecked !== selected) {
                                      toggleProduct(pid, row.available);
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{row.product.name}</TableCell>
                              <TableCell className="font-mono text-sm text-muted-foreground">{row.product.sku}</TableCell>
                              <TableCell className="text-right font-mono">{row.available}</TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min={1}
                                  max={row.available}
                                  disabled={!selected}
                                  value={qtyRaw}
                                  onChange={(e) =>
                                    setQtyByProductId((prev) => ({
                                      ...prev,
                                      [pid]: e.target.value,
                                    }))
                                  }
                                  className="w-[120px]"
                                />
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {selected ? `₹${lineTotal.toLocaleString()}` : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeOrderDialog} disabled={creatingOrder}>
                  Cancel
                </Button>
                <Button
                  className="btn-primary"
                  disabled={creatingOrder || selectedProductIds.length < 1 || draft.hasInvalidQty}
                  onClick={submitOrder}
                >
                  {creatingOrder ? "Creating…" : "Create Order & Bill"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehouseDetail;
