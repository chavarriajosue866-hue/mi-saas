"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadButton } from "@/lib/uploadthing";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ConfiguracionPage() {
  const sessionHook = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    currency: "USD",
    image: "",
  });

  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch("/api/user/profile");
        
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load profile");
        }

        const data = await res.json();
        
        setFormData({
          name: data.user?.name || "",
          email: data.user?.email || "",
          businessName: data.user?.businessName || "",
          currency: data.user?.currency || "USD",
          image: data.user?.image || "",
        });
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    // ✅ FIX: Usar optional chaining para evitar "Cannot read properties of undefined"
    const status = sessionHook?.status;
    
    if (status === "authenticated") {
      loadUserData();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
    // Si status es "loading" o undefined, esperamos al siguiente render
  }, [sessionHook?.status, router]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
        toast.error("Error saving changes");
      }
    } catch (error) {
      console.error(error);
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (res: any) => {
    if (res?.[0]?.url) {
      const imageUrl = res[0].url;
      setFormData({ ...formData, image: imageUrl });
      
      try {
        const response = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageUrl }),
        });

        if (response.ok) {
          toast.success("Profile photo updated!");
        } else {
          toast.error("Error saving photo");
        }
      } catch (error) {
        console.error("Failed to save image:", error);
        toast.error("Connection error");
      }
    }
  };

  // ✅ FIX: Usar optional chaining aquí también
  if (sessionHook?.status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and business settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Update your profile picture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.image || undefined} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Profile photo</p>
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={handlePhotoUpload}
                onUploadError={(error: Error) => {
                  toast.error(`Upload failed: ${error.message}`);
                }}
                content={{
                  button({ ready }) {
                    return ready ? "Change photo" : "Uploading...";
                  },
                  allowedContent({ isUploading }) {
                    return null;
                  },
                }}
                className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Image (2MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveChanges}>
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
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
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
            <Button type="submit" disabled={loading}>
              {loading ? (
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
    </div>
  );
}