'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, Download, XCircle, CheckCircle2, AlertCircle,
  FileText, Users, Package, Building2, Truck, ClipboardList,
  Info, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportTemplate {
  name: string;
  icon: React.ElementType;
  color: string;
  endpoint: string;
  description: string;
  headers: string[];
  sample: Record<string, string>;
  notes: string[];
}

const TEMPLATES: Record<string, ImportTemplate> = {
  customers: {
    name: 'Müşteriler',
    icon: Building2,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    endpoint: 'customers',
    description: 'Müşteri firmalarını toplu olarak içe aktarın',
    headers: ['code', 'name', 'email', 'phone', 'type', 'taxNumber', 'taxOffice', 'address'],
    sample: { code: 'MUS-001', name: 'Örnek A.Ş.', email: 'ornek@test.com', phone: '05001234567', type: 'corporate', taxNumber: '1234567890', taxOffice: 'Kadıköy', address: 'İstanbul' },
    notes: ['type: individual veya corporate', 'code benzersiz olmalıdır', 'email opsiyoneldir'],
  },
  products: {
    name: 'Ürünler',
    icon: Package,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    endpoint: 'products',
    description: 'Ürün kataloğunu CSV ile yükleyin',
    headers: ['code', 'name', 'unit', 'purchasePrice', 'salePrice', 'vatRate', 'barcode', 'minStock'],
    sample: { code: 'PRD-001', name: 'Örnek Ürün', unit: 'adet', purchasePrice: '100', salePrice: '150', vatRate: '18', barcode: '8680000000001', minStock: '10' },
    notes: ['unit: adet, kg, lt, m, m2, m3', 'vatRate: 0, 1, 8, 18, 20', 'purchasePrice ve salePrice sayısal olmalıdır'],
  },
  employees: {
    name: 'Çalışanlar',
    icon: Users,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    endpoint: 'employees',
    description: 'Personel listesini içe aktarın',
    headers: ['employeeNumber', 'firstName', 'lastName', 'email', 'phone', 'position', 'department', 'hireDate', 'baseSalary'],
    sample: { employeeNumber: 'EMP-001', firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@test.com', phone: '05001234567', position: 'Müdür', department: 'Satış', hireDate: '2024-01-15', baseSalary: '30000' },
    notes: ['hireDate: YYYY-MM-DD formatında', 'department: sistemdeki departman adıyla eşleşmeli', 'baseSalary sayısal olmalıdır'],
  },
  suppliers: {
    name: 'Tedarikçiler',
    icon: Truck,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    endpoint: 'suppliers',
    description: 'Tedarikçi listesini toplu yükleyin',
    headers: ['code', 'name', 'email', 'phone', 'taxNumber', 'paymentTerms', 'address'],
    sample: { code: 'TED-001', name: 'Tedarikçi A.Ş.', email: 'ted@test.com', phone: '02121234567', taxNumber: '9876543210', paymentTerms: '30', address: 'Ankara' },
    notes: ['paymentTerms: gün sayısı (ör: 30, 60, 90)', 'code benzersiz olmalıdır'],
  },
  inventory: {
    name: 'Stok Girişi',
    icon: ClipboardList,
    color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30',
    endpoint: 'inventory',
    description: 'Başlangıç stok miktarlarını yükleyin',
    headers: ['productCode', 'warehouseCode', 'quantity', 'unitCost'],
    sample: { productCode: 'PRD-001', warehouseCode: 'DEP-ANA', quantity: '100', unitCost: '50' },
    notes: ['productCode ve warehouseCode sistemde mevcut olmalıdır', 'quantity ve unitCost sayısal olmalıdır'],
  },
};

type TemplateKey = keyof typeof TEMPLATES;

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; field?: string; message: string }[];
}

function FieldsPreview({ template }: { template: ImportTemplate }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {template.headers.map((h) => (
              <th key={h} className="px-2 py-1.5 text-left font-mono font-medium text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {template.headers.map((h) => (
              <td key={h} className="px-2 py-1.5 text-foreground whitespace-nowrap">{template.sample[h] ?? '—'}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function DropZone({ onFile, uploading, dragActive, onDragIn, onDragOut }: {
  onFile: (f: File) => void;
  uploading: boolean;
  dragActive: boolean;
  onDragIn: () => void;
  onDragOut: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOut();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) onFile(file);
    else toast.error('Lütfen bir CSV dosyası seçin');
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragIn(); }}
      onDragLeave={onDragOut}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
      className={cn(
        'relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
        dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30',
      )}
    >
      <input ref={ref} type="file" accept=".csv,text/csv" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Dosya işleniyor...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className={cn('h-14 w-14 rounded-full flex items-center justify-center', dragActive ? 'bg-primary/20' : 'bg-muted')}>
            <Upload className={cn('h-7 w-7', dragActive ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">CSV dosyasını sürükleyin veya tıklayın</p>
            <p className="text-xs text-muted-foreground mt-1">Maksimum 10 MB, UTF-8 kodlamalı</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultPanel({ result, onDismiss }: { result: ImportResult; onDismiss: () => void }) {
  const hasErrors = result.errors.length > 0;
  const success = result.created + result.updated;

  return (
    <div className={cn('rounded-xl border p-5 space-y-4', hasErrors ? 'border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/10' : 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasErrors
            ? <AlertCircle className="h-5 w-5 text-orange-600" />
            : <CheckCircle2 className="h-5 w-5 text-green-600" />
          }
          <h3 className="font-semibold text-foreground">
            {hasErrors ? 'İçe aktarma tamamlandı (hatalar mevcut)' : 'İçe aktarma başarıyla tamamlandı'}
          </h3>
        </div>
        <button onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground hover:underline">Temizle</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Toplam Satır', value: result.total, color: 'text-foreground' },
          { label: 'Oluşturuldu', value: result.created, color: 'text-green-600' },
          { label: 'Güncellendi', value: result.updated, color: 'text-blue-600' },
          { label: 'Hata', value: result.errors.length, color: result.errors.length > 0 ? 'text-red-600' : 'text-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
            <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {hasErrors && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-destructive">{result.errors.length} satırda hata</p>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 max-h-48 overflow-y-auto divide-y divide-border">
            {result.errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <span className="text-muted-foreground font-medium shrink-0">Satır {err.row}:</span>
                {err.field && <span className="font-mono text-muted-foreground shrink-0">[{err.field}]</span>}
                <span className="text-foreground">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {success > 0 && (
        <p className="text-sm text-muted-foreground">
          {success} kayıt başarıyla aktarıldı.{result.skipped > 0 && ` ${result.skipped} kayıt atlandı.`}
        </p>
      )}
    </div>
  );
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<TemplateKey>('customers');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showFields, setShowFields] = useState(false);

  const template = TEMPLATES[activeTab];

  const downloadTemplate = useCallback(() => {
    const t = TEMPLATES[activeTab];
    const headerRow = t.headers.join(',');
    const sampleRow = t.headers.map((h) => t.sample[h] ?? '').join(',');
    const csv = `${headerRow}\n${sampleRow}`;
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-sablonu.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Şablon indirildi');
  }, [activeTab]);

  const handleFile = async (file: File) => {
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/import/${template.endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setResult(data.data ?? data);
      toast.success('İçe aktarma tamamlandı');
    } catch {
      toast.error('İçe aktarma başarısız oldu');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Veri İçe Aktarma</h1>
        <p className="text-sm text-muted-foreground mt-1">CSV dosyası ile toplu veri yükleyin</p>
      </div>

      {/* Entity tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(TEMPLATES) as [TemplateKey, ImportTemplate][]).map(([key, tmpl]) => {
          const Icon = tmpl.icon;
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setResult(null); setShowFields(false); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <Icon className="h-4 w-4" />
              {tmpl.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: instructions */}
        <div className="space-y-4">
          {/* Entity info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', template.color)}>
                <template.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{template.name}</h2>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </div>
            </div>

            <button
              onClick={downloadTemplate}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-border px-4 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Şablonu İndir (.csv)
              </span>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Önemli Notlar</h3>
            </div>
            <ul className="space-y-1.5">
              {template.notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  {note}
                </li>
              ))}
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                İlk satır başlık satırı olmalıdır
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                Dosya UTF-8 kodlamalı olmalıdır
              </li>
            </ul>
          </div>

          {/* Field preview toggle */}
          <button
            onClick={() => setShowFields((v) => !v)}
            className="w-full text-left rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium">Alan Yapısını Görüntüle</span>
            <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', showFields && 'rotate-90')} />
          </button>
        </div>

        {/* Right: upload + result */}
        <div className="lg:col-span-2 space-y-4">
          {showFields && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Örnek CSV Yapısı — {template.name}</h3>
              <FieldsPreview template={template} />
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Dosya Yükle</h3>
            <DropZone
              onFile={handleFile}
              uploading={uploading}
              dragActive={dragActive}
              onDragIn={() => setDragActive(true)}
              onDragOut={() => setDragActive(false)}
            />
          </div>

          {result && <ResultPanel result={result} onDismiss={() => setResult(null)} />}
        </div>
      </div>
    </div>
  );
}
