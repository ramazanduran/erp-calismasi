'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploaderProps {
  entityType?: string;
  entityId?: string;
  onUpload?: (file: { id: string; filename: string; size: number; mimeType: string }) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUploader({
  entityType,
  entityId,
  onUpload,
  accept = '*',
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır`);
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (entityType) formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/files/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}`,
          },
          body: formData,
        }
      );
      const data = await response.json() as Record<string, unknown>;
      if (data.success) {
        toast.success('Dosya yüklendi');
        onUpload?.(data.data as { id: string; filename: string; size: number; mimeType: string });
      } else {
        toast.error('Dosya yüklenemedi');
      }
    } catch {
      toast.error('Dosya yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) upload(f);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Dosyayı sürükle &amp; bırak veya tıkla</p>
          <p className="text-xs text-muted-foreground">Maks {maxSizeMB}MB</p>
        </div>
      )}
    </div>
  );
}
