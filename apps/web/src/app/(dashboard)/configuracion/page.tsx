"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadButton } from "@/lib/uploadthing";
import { Loader2, User, Lock, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Componente Tabs simple
function Tabs({ tabs, activeTab, onTabChange }: { 
  tabs: { id: string; label: string; icon?: any }[]; 
  activeTab: string; 
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="border-b">
      <div className="flex space-x-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  const sessionHook = useSession();
  const session = sessionHook?.data ?? null;
  const status = sessionHook?.status ?? "loading";
  
  const router = useRouter();
  const hasLoadedRef = useRef(false);
  const [forcedLoad, setForcedLoad] = useState(false);
  
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    image: "",
  });
  
  const [businessData, setBusinessData] = useState({
    businessName: "",
    taxId: "",
    currency: "USD",
    timezone: "UTC",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ⏰ TIMEOUT DE EMERGENCIA
  useEffect(() => {
    if (status === "loading") {
      const timeout = setTimeout(() => {
        console.warn("️ Session loading timeout - forcing render");
        setForcedLoad(true);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [status]);

  // Cargar datos del perfil
  useEffect(() => {
    if ((status === "authenticated" || forcedLoad) && !hasLoadedRef.current) {
      hasLoadedRef.current = true;

      console.log("🔄 Loading profile data...");
      
      fetch("/api/user/profile")
        .then(async (res) => {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("📊 Profile data loaded:", data);
          if (data?.user) {
            setProfileData({
              name: data.user.name ?? "",
              email: data.user.email ?? "",
              image: data.user.image ?? "",
            });
            setBusinessData({
              businessName: data.user.businessName ?? "",
              taxId: data.user.taxId ?? "",
              currency: data.user.currency ?? "USD",
              timezone: data.user.timezone ?? "UTC",
            });
            setUserRole(data.user.role ?? "user"); // Guardar el rol del usuario
          }
        })
        .catch((error) => {
          console.error(" Error loading profile:", error);
          toast.error("Could not load profile data");
        });
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, forcedLoad, router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
        }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Error saving changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBusinessSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessData.businessName,
          currency: businessData.currency,
          timezone: businessData.timezone,
          taxId: businessData.taxId,
        }),
      });

      if (res.ok) {
        toast.success("Business settings updated!");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Error saving business settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (res: any) => {
    if (res?.[0]?.url) {
      const imageUrl = res[0].url;
      setProfileData((prev) => ({ ...prev, image: imageUrl }));
      
      try {
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageUrl }),
        });
        toast.success("Profile photo updated!");
      } catch (error) {
        toast.error("Error saving photo");
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        toast.success("Password changed successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        throw new Error("Failed to change password");
      }
    } catch (error: any) {
      toast.error(error.message || "Error changing password");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Solo mostrar loading si realmente está cargando Y no ha pasado el timeout
  if (status === "loading" && !forcedLoad) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // ✅ Si está unauthenticated después del timeout, redirigir
  if (status === "unauthenticated" && !forcedLoad) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Not authenticated</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  // Tabs - Filtrados según el rol
  const allTabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "business", label: "Business", icon: Building2 },
    { id: "security", label: "Security", icon: Lock },
  ];

  // Solo los admins ven la pestaña Business
  const visibleTabs = userRole === "admin" 
    ? allTabs 
    : allTabs.filter(tab => tab.id !== "business");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, business, and account preferences
        </p>
      </div>

      <Tabs tabs={visibleTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                {profileData.image ? (
                  <AvatarImage src={profileData.image} alt={profileData.name} />
                ) : (
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="text-sm font-medium">Profile photo</p>
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={handlePhotoUpload}
                  onUploadError={(error) => {
                    toast.error(`Upload failed: ${error.message}`);
                  }}
                  content={{
                    button({ ready }) {
                      return ready ? "Upload new photo" : "Uploading...";
                    },
                    allowedContent: () => null,
                  }}
                  className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground mt-1">Image (2MB)</p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* BUSINESS TAB - Solo visible para admins */}
      {activeTab === "business" && userRole === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Settings
            </CardTitle>
            <CardDescription>Business information and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBusinessSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessData.businessName}
                  onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                  placeholder="My Company Inc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / Business Registration</Label>
                <Input
                  id="taxId"
                  value={businessData.taxId}
                  onChange={(e) => setBusinessData({ ...businessData, taxId: e.target.value })}
                  placeholder="12-3456789-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={businessData.currency}
                    onChange={(e) => setBusinessData({ ...businessData, currency: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="MXN">MXN - Mexican Peso</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={businessData.timezone}
                    onChange={(e) => setBusinessData({ ...businessData, timezone: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">New York (EST)</option>
                    <option value="America/Los_Angeles">Los Angeles (PST)</option>
                    <option value="Europe/Madrid">Spain (GMT+1)</option>
                    <option value="America/Mexico_City">Mexico City (CST)</option>
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save settings"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SECURITY TAB */}
      {activeTab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Change password
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}