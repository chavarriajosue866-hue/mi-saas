"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role?: string;
}

export default function AdminUsersPage() {
  // 1. PATRÓN DEFENSIVO: No desestructurar. Usar optional chaining (?.) y nullish coalescing (??)
  const sessionHook = useSession();
  const status = sessionHook?.status ?? "loading";
  const session = sessionHook?.data ?? null;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Si status es 'loading' (o si sessionHook fue undefined), mostramos carga
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  // 3. Si no está autenticado o no hay sesión, mostramos acceso denegado
  if (status === "unauthenticated" || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>Debes iniciar sesión como administrador para ver esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // 4. A partir de aquí, 'session' está 100% garantizado que existe
  useEffect(() => {
    async function fetchUsers() {
      try {
        // NOTA: Asegúrate de que esta ruta '/api/users' sea la correcta en tu proyecto
        const res = await fetch("/api/users", {
          headers: {
            "x-tenant-id": (session as any)?.user?.tenantId || "",
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || data.users || []);
        } else {
          console.error("Error al obtener usuarios");
        }
      } catch (error) {
        console.error("Error de conexión:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Administra los usuarios de tu plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Email</th>
                  <th className="p-3 text-left font-medium">Nombre</th>
                  <th className="p-3 text-left font-medium">Rol</th>
                  <th className="p-3 text-left font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-900 font-medium">{user.email}</td>
                      <td className="p-3 text-gray-600">{user.name || "-"}</td>
                      <td className="p-3 text-gray-600">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {user.role || "Usuario"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Button variant="outline" size="sm">Editar</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}