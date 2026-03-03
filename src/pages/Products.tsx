import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const statusStyles = {
  "in-stock": "badge-success",
  "low-stock": "badge-warning",
  "out-of-stock": "badge-destructive",
};

type Product = {
  _id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Product[]>("/products");
        setProducts(res.data);
      } catch (error: any) {
        toast({
          title: "Failed to load products",
          description: error?.response?.data?.message || "Please try again.",
          variant: "destructive",
        });
      }
    };
    load();
  }, [toast]);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async () => {
    const stockNum = parseInt(newProduct.stock);
    const status =
      stockNum === 0
        ? "out-of-stock"
        : stockNum < 20
        ? "low-stock"
        : "in-stock";

    const productPayload = {
      name: newProduct.name,
      sku: newProduct.sku,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      stock: stockNum,
      status,
    };

    try {
      const res = await api.post<Product>("/products", productPayload);
      setProducts([res.data, ...products]);
    } catch (error: any) {
      toast({
        title: "Product create failed",
        description: error?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
      return;
    }
    setNewProduct({ name: "", sku: "", category: "", price: "", stock: "" });
    setIsAddDialogOpen(false);
    toast({
      title: "Product Added",
      description: `${productPayload.name} has been added successfully.`,
    });
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
      toast({
        title: "Product Deleted",
        description: "The product has been removed.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product inventory
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary gap-2">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Enter the product details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="iPhone 15 Pro"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={newProduct.sku}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, sku: e.target.value })
                  }
                  className="input-field"
                  placeholder="APL-IP15P-256"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(value) =>
                    setNewProduct({ ...newProduct, category: value })
                  }
                >
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Audio">Audio</SelectItem>
                    <SelectItem value="Wearables">Wearables</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="input-field"
                    placeholder="999"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Initial Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value })
                    }
                    className="input-field"
                    placeholder="100"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button className="btn-primary" onClick={handleAddProduct}>
                Add Product
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 animate-slide-in-up">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Products Table */}
      <div className="glass-card rounded-xl overflow-hidden animate-slide-in-up" style={{ animationDelay: "100ms" }}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Product</TableHead>
              <TableHead className="text-muted-foreground">SKU</TableHead>
              <TableHead className="text-muted-foreground">Category</TableHead>
              <TableHead className="text-muted-foreground">Price</TableHead>
              <TableHead className="text-muted-foreground">Stock</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product._id} className="table-row">
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product._id}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {product.sku}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.category}</Badge>
                </TableCell>
                <TableCell className="font-mono text-foreground">
                  ${product.price.toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-foreground">
                  {product.stock}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      statusStyles[product.status as keyof typeof statusStyles]
                    }
                  >
                    {product.status.replace("-", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-destructive"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Products;
