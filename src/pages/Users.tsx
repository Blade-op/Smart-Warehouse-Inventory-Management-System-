import { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  UserPlus,
  Trash2,
  Edit,
  Shield,
  User as UserIcon,
  Mail,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
}

const Users = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.name || !formData.email || !formData.password) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      await api.post("/users", formData);
      toast({
        title: "Success",
        description: `User ${formData.email} has been created successfully as ${formData.role}.`,
      });
      setIsDialogOpen(false);
      setFormData({ name: "", email: "", password: "", role: "user" });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "admin" | "user") => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast({
        title: "Success",
        description: `User role updated to ${newRole}.`,
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`);
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
      setDeleteDialogOpen(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Only show if current user is admin
  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You need administrator privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users and their roles in the system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary gap-2">
              <UserPlus className="w-4 h-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. You can assign them admin or user role.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "user") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role" className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.role === "admin"
                    ? "Administrators have full access including user management"
                    : "Users have standard access to inventory features"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="btn-primary" onClick={handleCreateUser}>
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-xl p-6 animate-slide-in-up">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading users...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value: "admin" | "user") =>
                        handleUpdateRole(user.id, value)
                      }
                      disabled={user.id === currentUser?.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <Badge variant="secondary">User</Badge>
                        </SelectItem>
                        <SelectItem value="admin">
                          <Badge variant="default">Admin</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.id !== currentUser?.id && (
                      <Dialog
                        open={deleteDialogOpen === user.id}
                        onOpenChange={(open) =>
                          setDeleteDialogOpen(open ? user.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card">
                          <DialogHeader>
                            <DialogTitle>Delete User</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete {user.name}? This action
                              cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeleteDialogOpen(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    {user.id === currentUser?.id && (
                      <span className="text-xs text-muted-foreground">Current User</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Users;
