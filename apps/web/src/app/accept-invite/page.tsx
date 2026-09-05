'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationData, setInvitationData] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Token de invitación no válido');
      return;
    }

    async function checkInvitation() {
      try {
        const res = await fetch(`http://localhost:3001/invitations/${token}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        setInvitationData(data);
        setEmail(data.email);
        setStatus('accepting');
      } catch (err: any) {
        setStatus('error');
        setError(err.message);
      }
    }

    checkInvitation();
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('http://localhost:3001/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Auto-login
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.ok) {
        setStatus('success');
        router.push('/');
      } else {
        throw new Error('Error al iniciar sesión');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    }
  };

  if (status === 'loading') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Verificando invitación...</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
          <h2 style={{ color: 'red' }}>Error</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
          <h2 style={{ color: 'green' }}>¡Bienvenido!</h2>
          <p>Te has unido exitosamente al tenant.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
      <form onSubmit={handleAccept} style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>
          🎉 ¡Te han invitado!
        </h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem' }}>
          Únete a <strong>{invitationData?.tenantName}</strong> como <strong>{invitationData?.role}</strong>
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }} 
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Crea una contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }} 
          />
        </div>

        <button 
          type="submit" 
          style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
        >
          Aceptar invitación
        </button>
      </form>
    </main>
  );
}