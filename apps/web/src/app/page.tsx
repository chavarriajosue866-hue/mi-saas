'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import FileUpload from '@/components/FileUpload';

interface Project {
  id: string;
  name: string;
  tenantId: string;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.tenantId) {
      async function fetchProjects() {
        try {
          const res = await fetch('http://localhost:3001/projects', {
            headers: { 'x-tenant-id': session.user.tenantId! },
          });
          const data = await res.json();
          setProjects(data.data || []);
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      }
      fetchProjects();
    }
  }, [status, session]);

  if (status === 'loading') return <p style={{ padding: '2rem' }}>Cargando sesión...</p>;
  
  if (status === 'unauthenticated') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <p>No estás autenticado.</p>
        <button onClick={() => signIn()} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Iniciar Sesión
        </button>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
              🏢 Dashboard de <span style={{ color: '#2563eb' }}>{session?.user?.name || 'Usuario'}</span>
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Tenant ID: {session?.user?.tenantId}</p>
          </div>
          <button onClick={() => signOut()} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Cerrar Sesión
          </button>
        </div>
        
        {/* Avatar Upload Section */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1.5rem', 
          backgroundColor: '#f9fafb', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
            📷 Tu Avatar
          </h3>
          <FileUpload
            endpoint="http://localhost:3001/users/avatar"
            tenantId={session?.user?.tenantId || ''}
            userEmail={session?.user?.email || ''}
            onUploadComplete={(url) => {
              console.log('Avatar actualizado:', url);
              alert('✅ Avatar actualizado correctamente');
            }}
            label="Cambiar avatar"
          />
        </div>

        {/* Panel de Admin (Solo para admins) */}
        {session?.user?.role === 'admin' && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            backgroundColor: '#eff6ff', 
            border: '1px solid #bfdbfe', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>🛡️ Panel de Administrador (RBAC)</h3>
            <p style={{ fontSize: '0.875rem', color: '#1e3a8a', marginBottom: '1rem' }}>
              Tienes permisos de administrador. Puedes gestionar facturación y miembros del equipo.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <Link href="/admin/users" style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#4f46e5', 
                color: 'white', 
                textDecoration: 'none',
                borderRadius: '6px', 
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                👥 Ver Usuarios
              </Link>
            </div>
          </div>
        )}

        {/* Lista de Proyectos */}
        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Tus Proyectos</h2>
          
          {loading ? (
            <p style={{ color: '#6b7280' }}>Cargando proyectos...</p>
          ) : projects.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No tienes proyectos aún.</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0, margin: 0 }}>
              {projects.map((project) => (
                <li key={project.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div>
                    <h3 style={{ fontWeight: '600', color: '#1f2937' }}>{project.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace', marginTop: '0.25rem' }}>{project.id}</p>
                  </div>
                  <span style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: '500', color: '#047857', backgroundColor: '#d1fae5', borderRadius: '9999px' }}>Activo</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </main>
  );
}
