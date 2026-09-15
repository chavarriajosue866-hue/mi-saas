"use client";

import { UploadButton } from "@uploadthing/react";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { toast } from "sonner";

interface Props {
  onUploadComplete: (url: string) => void;
  currentUrl?: string | null;
}

export function FileUploadButton({ onUploadComplete, currentUrl }: Props) {
  return (
    <div className="space-y-2">
      {currentUrl && (
        <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
          📎 Ver archivo adjunto actual
        </a>
      )}
      <UploadButton
        endpoint="invoiceAttachment"
        onClientUploadComplete={(res) => {
          if (res?.[0]?.url) {
            onUploadComplete(res[0].url);
            toast.success("Archivo subido correctamente");
          }
        }}
        onUploadError={(error: Error) => {
          toast.error("Error al subir archivo");
        }}
        className="ut-button:bg-primary ut-button:text-white ut-button:hover:bg-primary/90"
      />
    </div>
  );
}