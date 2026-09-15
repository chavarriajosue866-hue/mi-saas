"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Lock, Mail, Save, Loader2, Building2 } from "lucide-react";
import { UploadButton } from "@uploadthing/react";

type Tab = "profile" | "business" | "security";

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("member");
  
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [businessData, setBusinessData] = useState({
    businessName: "",
    taxId: "",
    currency: "USD",
    timezone: "America/Costa_Rica",
  });
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        
        if (session?.user) {
          setUserData((prev) => ({
            ...prev,
            name: session.user.name || "",
            email: session.user.email || "",
          }));
          setAvatarUrl(session.user.image || null);
          setUserRole(session.user.role || "member");
        }

        const businessRes = await fetch("/api/user/profile");
        if (businessRes.ok) {
          const business = await businessRes.json();
          if (business.user) {
            setBusinessData({
              businessName: business.user.businessName || "",
              taxId: business.user.taxId || "",
              currency: business.user.currency || "USD",
              timezone: business.user.timezone || "America/Costa_Rica",
            });
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userData.name, email: userData.email, image: avatarUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Profile updated successfully");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.error || "Error updating profile");
      }
    } catch (error: any) {
      toast.error("Connection error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Business settings updated");
      } else {
        toast.error(data.error || "Error updating");
      }
    } catch (error: any) {
      toast.error("Connection error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userData.newPassword !== userData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (userData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: userData.currentPassword, newPassword: userData.newPassword }),
      });
      if (res.ok) {
        toast.success("Password changed successfully");
        setUserData((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      } else {
        const error = await res.json();
        toast.error(error.error || "Error changing password");
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile" as Tab, label: "Profile", icon: User },
    { id: "business" as Tab, label: "Business", icon: Building2, adminOnly: true },
    { id: "security" as Tab, label: "Security", icon: Lock },
  ];

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || userRole === "admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, business, and account preferences</p>
      </div>

      <div className="flex gap-2 border-b">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.adminOnly && (
              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Admin</span>
            )}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {activeTab === "profile" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Personal Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl || `https://ui-avatars.com/api/?name=${userData.name}&background=0D8ABC&color=fff`} />
                    <AvatarFallback className="text-2xl">{userData.name ? userData.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <p className="font-medium">Profile photo</p>
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) {
                          setAvatarUrl(res[0].url);
                          toast.success("Image uploaded. Click 'Save changes' to save.");
                        }
                      }}
                      onUploadError={(error: Error) => toast.error("Error uploading image")}
                      content={{
                        button({ ready }) { return ready ? "Upload new photo" : "Loading..."; },
                        allowedContent({ isUploading }) { return null; }
                      }}
                      className="ut-button:bg-primary ut-button:text-white ut-button:h-8 ut-button:text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={userData.email} onChange={(e) => setUserData({ ...userData, email: e.target.value })} className="pl-10" />
                  </div>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save changes</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "business" && userRole === "admin" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Business Settings</CardTitle>
                  <CardDescription>Business information and preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateBusiness} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input id="businessName" value={businessData.businessName} onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })} placeholder="My Company Inc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / Business Registration</Label>
                  <Input id="taxId" value={businessData.taxId} onChange={(e) => setBusinessData({ ...businessData, taxId: e.target.value })} placeholder="12-3456789-0" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={businessData.currency}
                      onChange={(e) => setBusinessData({ ...businessData, currency: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="CRC">CRC - Costa Rican Colón</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="MXN">MXN - Mexican Peso</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={businessData.timezone}
                      onChange={(e) => setBusinessData({ ...businessData, timezone: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="America/Costa_Rica">Costa Rica (GMT-6)</option>
                      <option value="America/Mexico_City">Mexico (GMT-6)</option>
                      <option value="America/Bogota">Colombia (GMT-5)</option>
                      <option value="America/Lima">Peru (GMT-5)</option>
                      <option value="America/Santiago">Chile (GMT-4)</option>
                      <option value="Europe/Madrid">Spain (GMT+1)</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save settings</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "security" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Change your password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input id="currentPassword" type="password" value={userData.currentPassword} onChange={(e) => setUserData({ ...userData, currentPassword: e.target.value })} />
                </div>
                
                {/* Reemplazo seguro de Separator */}
                <div className="my-4 border-t" />
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" type="password" value={userData.newPassword} onChange={(e) => setUserData({ ...userData, newPassword: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input id="confirmPassword" type="password" value={userData.confirmPassword} onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })} />
                </div>
                <Button type="submit" disabled={loading || !userData.currentPassword || !userData.newPassword}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing...</> : <><Lock className="mr-2 h-4 w-4" /> Change password</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}