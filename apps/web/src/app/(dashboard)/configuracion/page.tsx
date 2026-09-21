"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadButton } from "@/lib/uploadthing";
import { Loader2, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ConfiguracionPage() {
  const sessionHook = useSession();
  const session = sessionHook?.data ?? null;
  const status = sessionHook?.status ?? "loading";
  
  const router = useRouter();
  const hasLoadedRef = useRef(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    currency: "USD",
    image: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Cargar datos del perfil con timeout de seguridad
  useEffect(() => {
    if (status !== "authenticated" || hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;

    const timeout = setTimeout(() => {
      console.warn("️ Profile load timeout - showing form with empty data");
      toast.error("Could not load profile. Please refresh.");
    }, 8000);

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
        if (data?.user) {
          setFormData({
            name: data.user.name ?? "",
            email: data.user.email ?? "",
            businessName: data.user.businessName ?? "",
            currency: data.user.currency ?? "USD",
            image: data.user.image ?? "",
          });
        }
      })
      .catch((error) => {
        console.error("❌ Error loading profile:", error);
        toast.error("Failed to load profile data");
      })
      .finally(() => {
        clearTimeout(timeout);
      });
  }, [status, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          businessName: formData.businessName,
          currency: formData.currency,
        }),
      });

      if (res.ok) {
        toast.success("Changes saved successfully!");
      } else {
        const error = await res.json();
        throw new Error(error.message || "Failed to save");
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Error saving changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (res: any) => {
    if (res?.[0]?.url) {
      const imageUrl = res[0].url;
      setFormData((prev) => ({ ...prev, image: imageUrl }));
      
      try {
        const response = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageUrl }),
        });

        if (response.ok) {
          toast.success("Profile photo updated!");
        } else {
          throw new Error("Failed to save photo");
        }
      } catch (error) {
        console.error("Photo save error:", error);
        toast.error("Error saving photo to database");
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      setIsChangingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsChangingPassword(false);
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
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const error = await res.json();
        throw new Error(error.message || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(error.message || "Error changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ✅ Solo loading si la sesión está cargando (NO isLoadingData)
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // ✅ Si no está autenticado
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Not authenticated</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  // ✅ Mostrar SIEMPRE el formulario (incluso si los datos no cargaron)
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and business settings</p>
      </div>

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Update your profile picture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {formData.image ? (
                <AvatarImage src={formData.image} alt={formData.name} />
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
                    return ready ? "Change photo" : "Uploading...";
                  },
                  allowedContent: () => null,
                }}
                className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground mt-1">Image (2MB max)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="My Business"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="USD"
              />
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password securely</CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button type="submit" disabled={isChangingPassword} variant="secondary">
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}