import { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Database,
  Mail,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    role: user?.role === "admin" ? "Administrator" : "User",
  });

  const [notifications, setNotifications] = useState({
    lowStock: true,
    orderUpdates: true,
    reports: false,
    marketing: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [systemSettings, setSystemSettings] = useState({
    lowStockThreshold: 20,
    currency: "USD",
    timeZone: "EST",
  });

  const handleSaveProfile = () => {
    // TODO: Implement API call to update profile
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handleSaveNotifications = () => {
    // TODO: Implement API call to save notification preferences
    toast({
      title: "Settings Saved",
      description: "Your notification preferences have been updated successfully.",
    });
  };

  const handleSaveSecurity = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement API call to update password
    toast({
      title: "Password Updated",
      description: "Your password has been updated successfully.",
    });
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleSaveSystem = () => {
    // TODO: Implement API call to save system settings
    toast({
      title: "Settings Saved",
      description: "Your system settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="animate-slide-in-up">
        <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Database className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="glass-card rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Profile Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="input-field"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="input-field"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    className="input-field"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Role is assigned by administrators
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Profile Picture</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a new avatar image (Coming soon)
                </p>
              </div>
              <Button variant="outline" disabled>
                Upload Image
              </Button>
            </div>

            <div className="flex justify-end">
              <Button className="btn-primary gap-2" onClick={handleSaveProfile}>
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <div className="glass-card rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              Notification Preferences
            </h3>

            <div className="space-y-4">
              {[
                {
                  id: "lowStock",
                  title: "Low Stock Alerts",
                  description: "Get notified when products fall below threshold",
                  icon: Bell,
                },
                {
                  id: "orderUpdates",
                  title: "Order Updates",
                  description: "Receive updates on order status changes",
                  icon: Mail,
                },
                {
                  id: "reports",
                  title: "Weekly Reports",
                  description: "Get weekly inventory and sales reports",
                  icon: Database,
                },
                {
                  id: "marketing",
                  title: "Marketing Emails",
                  description: "Receive product updates and newsletters",
                  icon: Mail,
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={
                      notifications[item.id as keyof typeof notifications]
                    }
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, [item.id]: checked })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button className="btn-primary gap-2" onClick={handleSaveNotifications}>
                <Save className="w-4 h-4" />
                Save Preferences
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <div className="glass-card rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              Security Settings
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium text-foreground">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account (Coming soon)
                </p>
              </div>
              <Button variant="outline" disabled>
                Enable 2FA
              </Button>
            </div>

            <div className="flex justify-end">
              <Button className="btn-primary gap-2" onClick={handleSaveSecurity}>
                <Save className="w-4 h-4" />
                Update Security
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="mt-6">
          <div className="glass-card rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              System Preferences
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <p className="font-medium text-foreground">Low Stock Threshold</p>
                  <p className="text-sm text-muted-foreground">
                    Default minimum stock level before alerts
                  </p>
                </div>
                <Input
                  type="number"
                  value={systemSettings.lowStockThreshold}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      lowStockThreshold: parseInt(e.target.value) || 20,
                    })
                  }
                  className="w-24 input-field"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <p className="font-medium text-foreground">Currency</p>
                  <p className="text-sm text-muted-foreground">
                    Default currency for pricing
                  </p>
                </div>
                <select
                  value={systemSettings.currency}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      currency: e.target.value,
                    })
                  }
                  className="w-32 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm input-field"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <p className="font-medium text-foreground">Time Zone</p>
                  <p className="text-sm text-muted-foreground">
                    System time zone for reports
                  </p>
                </div>
                <select
                  value={systemSettings.timeZone}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      timeZone: e.target.value,
                    })
                  }
                  className="w-40 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm input-field"
                >
                  <option value="EST">Eastern (EST)</option>
                  <option value="PST">Pacific (PST)</option>
                  <option value="CST">Central (CST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="btn-primary gap-2" onClick={handleSaveSystem}>
                <Save className="w-4 h-4" />
                Save System Settings
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
