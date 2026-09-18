'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const sessionData = useSession();
  const { data: session, status } = useSession();

   // 1. Manejar el estado de carga (evita el error de prerenderizado)
   if (status === "loading") {
     return <div className="flex items-center justify-center h-screen">Cargando...</div>;
   }

   // 2. Manejar el caso de no autenticado
   if (!session) {
     return <div className="flex items-center justify-center h-screen">No autorizado</div>;
   }

   // 3. A partir de aquí, 'session' está 100% garantizado que existe
  const userName = session.user?.name || "Usuario";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.tenantId) {
      async function fetchUsers() {
        try {
          const res = await fetch('http://localhost:3001/users', {
            headers: { 
              'x-tenant-id': (session as any)?.user?.tenantId || '',
              'Content-Type': 'application/json'
            },
          });
          const data = await res.json();
          setUsers(data.data || []);
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      }
      fetchUsers();
    }
  }, [status, session]);

  if (status === 'loading') return <p style={{ padding: '2rem' }}>Loading...</p>;
  
  if (status === 'unauthenticated') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Debes iniciar sesión</p>
      </main>
    );
  }

  // Verificar si es admin
  if (session?.user?.role !== 'admin') {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: 'red' }}>Acceso Denegado</h1>
        <p>No tienes permisos para ver esta página.</p>
        <Link href="/" style={{ color: '#2563eb' }}>Volver al Dashboard</Link>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>
              👥 Gestión de Usuarios
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
              Tenant: <span style={{ fontWeight: '600', color: '#2563eb' }}>{session?.user?.tenantId}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/" style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#6b7280', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}>
              ← Dashboard
            </Link>
            <button onClick={() => signOut()} style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <p style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>Total Usuarios</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>{users.length}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '500' }}>Admins</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#14532d' }}>
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <p style={{ fontSize: '0.875rem', color: '#854d0e', fontWeight: '500' }}>Members</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#713f12' }}>
              {users.filter(u => u.role === 'member').length}
            </p>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>No hay usuarios registrados</p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              El primer usuario en registrarse es automáticamente admin
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Role</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date de Registro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td style={{ padding: '0.75rem', color: '#111827', fontWeight: '500' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>{user.name || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        fontSize: '0.75rem', 
                        fontWeight: '500',
                        backgroundColor: user.role === 'admin' ? '#dbeafe' : '#d1fae5',
                        color: user.role === 'admin' ? '#1e40af' : '#047857',
                        borderRadius: '9999px'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {new Date(user.createdAt).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}