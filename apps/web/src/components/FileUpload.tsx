'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  endpoint: string;
  tenantId: string;
  userEmail?: string;
  onUploadComplete: (url: string) => void;
  currentImage?: string;
  label?: string;
}

export default function FileUpload({ 
  endpoint, 
  tenantId, 
  userEmail,
  onUploadComplete, 
  currentImage,
  label = 'Subir archivo'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantId,
          'x-user-email': userEmail || '',
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al subir archivo');
      }

      setPreview(data.url || data.avatar);
      onUploadComplete(data.url || data.avatar);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      {preview && (
        <img 
          src={preview} 
          alt="Preview" 
          style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            objectFit: 'cover',
            border: '3px solid #e5e7eb'
          }} 
        />
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: uploading ? '#9ca3af' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}
      >
        {uploading ? 'Subiendo...' : label}
      </button>
    </div>
  );
}