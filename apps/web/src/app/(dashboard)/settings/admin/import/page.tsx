'use client';
import { useState, useRef } from 'react';
import { Upload, Download, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const TEMPLATES = {
  customers: { name: 'Müşteriler', headers: 'code,name,email,phone,type,taxNumber', sample: 'MUS-001,Örnek A.Ş.,ornek@test.com,05001234567,corporate,1234567890' },
  products: { name: 'Ürünler', headers: 'code,name,unit,purchasePrice,salePrice,vatRate', sample: 'PRD-001,Örnek Ürün,adet,100,150,18' },
  employees: { name: 'Çalışanlar', headers: 'employeeNumber,firstName,lastName,email,phone,position', sample: 'EMP-001,Ahmet,Yılmaz,ahmet@test.com,05001234567,Müdür' },
};

type TemplateKey = keyof typeof TEMPLATES;

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<TemplateKey>('customers');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ total: number; created: number; updated: number; errors: { row: number; message: string }[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (key: TemplateKey) => {
    const t = TEMPLATES[key];
    const csv = `${t.headers}\n${t.sample}`;
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${key}-sablonu.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (file: File) => {
    setUploading(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/import/${activeTab}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: formData,
      });
      const data = await res.json();
      setResult(data.data);
      toast.success(`İçe aktarma tamamlandı`);
    } catch { toast.error('İçe aktarma başarısız'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Veri İçe Aktarma</h1><p className="text-muted-foreground text-sm mt-1">CSV dosyası ile toplu veri yükleyin</p></div>

      <div className="flex gap-2 border-b border-border">
        {(Object.keys(TEMPLATES) as TemplateKey[]).map(key => (
          <button key={key} onClick={() => { setActiveTab(key); setResult(null); }} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {TEMPLATES[key].name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-medium mb-3">1. Şablonu İndir</h3>
          <button onClick={() => downloadTemplate(activeTab)} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4" /> {TEMPLATES[activeTab].name} Şablonunu İndir (.csv)
          </button>
          <p className="mt-2 text-xs text-muted-foreground">Şablonu doldurun, ardından aşağıdan yükleyin.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-medium mb-3">2. Dosyayı Yükle</h3>
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
            {uploading ? <p className="text-sm text-muted-foreground">Yükleniyor...</p> : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">CSV dosyasını seç veya sürükle</p>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-medium">Sonuç</h3>
            <div className="grid grid-cols-3 gap-3">
              {[{ label: 'Toplam', value: result.total, color: 'text-foreground' }, { label: 'Oluşturuldu', value: result.created, color: 'text-green-600' }, { label: 'Güncellendi', value: result.updated, color: 'text-blue-600' }].map(s => (
                <div key={s.label} className="rounded-lg border border-border p-3 text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
            {result.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-destructive mb-2">{result.errors.length} hata</p>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 divide-y divide-border max-h-40 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Satır {e.row}:</span>
                      <span>{e.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
