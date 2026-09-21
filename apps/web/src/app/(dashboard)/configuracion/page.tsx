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
  const session = sessionHook?.data ?? null;
  const status = sessionHook?.status ?? "loading";
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    currency: "USD",
    image: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((res) => {
          if (res.status === 401) {
            router.push("/login");
            throw new Error("Unauthorized");
          }
          return res.json();
        })
        .then((data) => {
          setFormData({
            name: data.user?.name || "",
            email: data.user?.email || "",
            businessName: data.user?.businessName || "",
            currency: data.user?.currency || "USD",
            image: data.user?.image || "",
          });
        })
        .catch((error) => {
          console.error("Error loading profile:", error);
          toast.error("Failed to load profile");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
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
        toast.success("Changes saved!");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (res: any) => {
    if (res?.[0]?.url) {
      const imageUrl = res[0].url;
      setFormData((prev) => ({ ...prev, image: imageUrl }));
      
      try {
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageUrl }),
        });
        toast.success("Photo updated!");
      } catch (error) {
        toast.error("Error saving photo");
      }
    }
  };

  // Loading state
  if (status === "loading" || isLoading) {
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
        <p className="text-muted-foreground">Manage your account and business settings</p>
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
                onUploadError={(error) => {
  toast.error(`Error: ${error.message}`);
}}
                content={{
                  button({ ready }) {
                    return ready ? "Change photo" : "Uploading...";
                  },
                  allowedContent: () => null,
                }}
                className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground mt-1">Image (2MB)</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <Input id="email" type="email" value={formData.email} disabled className="bg-muted" />
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
    </div>
  );
}