"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Define un tipo básico para el usuario (ajústalo según tu modelo de Prisma)
interface User {
  id: string;
  email: string;
  name: string | null;
  role?: string;
}

export default function AdminUsersPage() {
  // 1. No desestructures. Guarda el resultado completo en una variable.
  const sessionData = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Verifica el estado de carga usando la propiedad del objeto
  if (sessionData.status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  // 3. Verifica si no está autenticado o si no hay datos de sesión
  if (sessionData.status === "unauthenticated" || !sessionData.data) {
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

  // 4. A partir de aquí, TypeScript sabe que 'sessionData.data' existe y es válido
  const session = sessionData.data;

  useEffect(() => {
    async function fetchUsers() {
      try {
        // NOTA: Cambia esta URL a tu endpoint real de API (ej: '/api/users') 
        // en lugar de 'http://localhost:3001/users' para que funcione en Vercel.
        const res = await fetch("/api/users", {
          headers: {
            // Acceso seguro a tenantId usando 'as any' para evitar errores de tipado de NextAuth
            "x-tenant-id": (session.user as any)?.tenantId || "",
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || data.users || []); // Ajusta según la respuesta de tu API
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
          <CardDescription>
            Administra los usuarios de tu plataforma.
          </CardDescription>
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
                    // Usamos className en lugar de style para el hover (corrección anterior)
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-900 font-medium">{user.email}</td>
                      <td className="p-3 text-gray-600">{user.name || "-"}</td>
                      <td className="p-3 text-gray-600">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {user.role || "Usuario"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
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