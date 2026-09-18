"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    async function processInvite() {
      if (!token) {
        setStatus("error");
        setMessage("Token de invitación no válido o faltante.");
        return;
      }

      try {
        // Ajusta esta ruta a tu endpoint real que procesa la invitación
        const res = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("¡Invitación aceptada con éxito! Redirigiendo...");
          
          // Si tu API requiere hacer login automático después, descomenta la siguiente línea:
          // await signIn("credentials", { redirect: false });
          
          setTimeout(() => {
            router.push("/");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Error al procesar la invitación.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Ocurrió un error de conexión al procesar la invitación.");
      }
    }

    processInvite();
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Procesando invitación</CardTitle>
            <CardDescription>Por favor espera un momento...</CardDescription>
          </CardHeader>
          <CardContent>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>Volver al inicio de sesión</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-600">¡Éxito!</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Cargando...</CardTitle>
          </CardHeader>
          <CardContent>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}