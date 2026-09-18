"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Enlace de restablecimiento no válido o expirado.");
      setStatus("error");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      // Ajusta esta ruta a tu endpoint real de reseteo de contraseña
      const res = await fetch("/api/user/password", {
        method: "PATCH", // o "POST", según cómo lo tengas configurado
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        toast.success("Contraseña restablecida con éxito");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Error al restablecer la contraseña.");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Ocurrió un error de conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">¡Contraseña actualizada!</CardTitle>
            <CardDescription>Ya puedes iniciar sesión con tu nueva contraseña.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push("/login")}>Ir al inicio de sesión</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Restablecer contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña a continuación.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {status === "error" && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2 border border-red-200">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Restablecer contraseña"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Cargando...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}