'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Download, X, Globe, FileText, Package,
  TrendingUp, TrendingDown, Truck, ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

type ShipmentType = 'import' | 'export';
type ShipmentStatus = 'planned' | 'in_transit' | 'customs' | 'cleared' | 'delivered' | 'cancelled';
type Incoterm = 'EXW' | 'FOB' | 'CIF' | 'DAP' | 'DDP' | 'FCA' | 'CPT';

interface ImportExportShipment {
  id: string;
  shipmentNo: string;
  type: ShipmentType;
  supplierOrCustomer: string;
  country: string;
  description: string;
  quantity: number;
  unit: string;
  totalValue: number;
  currency: string;
  incoterm: Incoterm;
  status: ShipmentStatus;
  etd?: string;
  eta?: string;
  customsDeclarationNo?: string;
  documents: string[];
  createdAt: string;
}

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  planned: 'Planlandı',
  in_transit: 'Taşımada',
  customs: 'Gümrükte',
  cleared: 'Gümrük Çıkışı',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  planned: 'bg-gray-100 text-gray-700',
  in_transit: 'bg-blue-100 text-blue-700',
  customs: 'bg-yellow-100 text-yellow-700',
  cleared: 'bg-teal-100 text-teal-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const MOCK_SHIPMENTS: ImportExportShipment[] = [
  { id: '1', shipmentNo: 'IMP-2026-001', type: 'import', supplierOrCustomer: 'Shenzhen Electronics Co.', country: 'Çin', description: 'Elektronik Bileşenler - PCB Kartları', quantity: 5000, unit: 'adet', totalValue: 125000, currency: 'USD', incoterm: 'FOB', status: 'customs', eta: '2026-06-05', customsDeclarationNo: '26010100012345', documents: ['Proforma Fatura', 'Konşimento', 'Menşei Şahadetnamesi'], createdAt: '2026-05-01' },
  { id: '2', shipmentNo: 'EXP-2026-015', type: 'export', supplierOrCustomer: 'Berlin Machinery GmbH', country: 'Almanya', description: 'Makine Parçaları - Aksesuar Set', quantity: 200, unit: 'set', totalValue: 48000, currency: 'EUR', incoterm: 'DAP', status: 'in_transit', etd: '2026-05-20', eta: '2026-06-10', customsDeclarationNo: '26010200008765', documents: ['Ticari Fatura', 'Ambalaj Listesi', 'A.TR Dolaşım Belgesi'], createdAt: '2026-05-15' },
  { id: '3', shipmentNo: 'IMP-2026-002', type: 'import', supplierOrCustomer: 'Mumbai Textiles Ltd.', country: 'Hindistan', description: 'Ham Kumaş - Pamuk %100', quantity: 15000, unit: 'kg', totalValue: 42000, currency: 'USD', incoterm: 'CIF', status: 'cleared', eta: '2026-05-28', customsDeclarationNo: '26010100015678', documents: ['Fatura', 'Konşimento', 'Fitosaniter Sertifika'], createdAt: '2026-04-20' },
  { id: '4', shipmentNo: 'EXP-2026-016', type: 'export', supplierOrCustomer: 'Dubai Trading LLC', country: 'BAE', description: 'Tekstil Ürünleri - Hazır Giyim', quantity: 3000, unit: 'adet', totalValue: 75000, currency: 'USD', incoterm: 'FOB', status: 'delivered', etd: '2026-05-10', customsDeclarationNo: '26010200009012', documents: ['Ticari Fatura', 'ATR', 'EUR.1'], createdAt: '2026-05-05' },
  { id: '5', shipmentNo: 'IMP-2026-003', type: 'import', supplierOrCustomer: 'Osaka Chemicals Corp.', country: 'Japonya', description: 'Kimyasal Hammadde - Reçine', quantity: 2000, unit: 'kg', totalValue: 38500, currency: 'JPY', incoterm: 'CIF', status: 'planned', eta: '2026-07-15', documents: [], createdAt: '2026-05-25' },
  { id: '6', shipmentNo: 'EXP-2026-017', type: 'export', supplierOrCustomer: 'London Imports Ltd.', country: 'İngiltere', description: 'Deri Aksesuar - Çanta Koleksiyonu', quantity: 500, unit: 'adet', totalValue: 62000, currency: 'GBP', incoterm: 'DDP', status: 'planned', etd: '2026-06-20', documents: [], createdAt: '2026-05-26' },
];

interface NewShipmentModalProps {
  onClose: () => void;
  onSave: (data: Partial<ImportExportShipment>) => void;
}

function NewShipmentModal({ onClose, onSave }: NewShipmentModalProps) {
  const [form, setForm] = useState({
    type: 'import' as ShipmentType,
    supplierOrCustomer: '',
    country: '',
    description: '',
    quantity: '',
    unit: 'adet',
    totalValue: '',
    currency: 'USD',
    incoterm: 'FOB' as Incoterm,
    eta: '',
    etd: '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Yeni İthalat/İhracat Sevkiyatı</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            {(['import', 'export'] as ShipmentType[]).map((t) => (
              <button key={t} onClick={() => setForm({ ...form, type: t })}
                className={cn('flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                  form.type === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                {t === 'import' ? '📦 İthalat' : '🚢 İhracat'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{form.type === 'import' ? 'Tedarikçi' : 'Müşteri'}</label>
              <input type="text" value={form.supplierOrCustomer} onChange={(e) => setForm({ ...form, supplierOrCustomer: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ülke</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ürün/Hizmet Tanımı</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Miktar</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Birim</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {['adet', 'kg', 'ton', 'lt', 'm²', 'set', 'kutu'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Incoterm</label>
              <select value={form.incoterm} onChange={(e) => setForm({ ...form, incoterm: e.target.value as Incoterm })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {(['EXW', 'FOB', 'CIF', 'DAP', 'DDP', 'FCA', 'CPT'] as Incoterm[]).map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Toplam Değer</label>
              <input type="number" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Döviz</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CNY', 'TRY'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {form.type === 'export' && (
              <div>
                <label className="block text-sm font-medium mb-1">Çıkış Tarihi (ETD)</label>
                <input type="date" value={form.etd} onChange={(e) => setForm({ ...form, etd: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Tahmini Varış (ETA)</label>
              <input type="date" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">İptal</button>
          <button onClick={() => { onSave(form); onClose(); }}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Kaydet</button>
        </div>
      </div>
    </div>
  );
}

export default function ImportExportPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ShipmentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  const { data: shipments = MOCK_SHIPMENTS } = useQuery<ImportExportShipment[]>({
    queryKey: ['import-export'],
    queryFn: async () => {
      const res = await fetch('/api/v1/purchasing/import-export');
      if (!res.ok) return MOCK_SHIPMENTS;
      return res.json();
    },
    initialData: MOCK_SHIPMENTS,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<ImportExportShipment>) => {
      const res = await fetch('/api/v1/purchasing/import-export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['import-export'] }),
  });

  const filtered = useMemo(() => {
    let list = shipments;
    if (typeFilter !== 'all') list = list.filter((s) => s.type === typeFilter);
    if (statusFilter !== 'all') list = list.filter((s) => s.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.shipmentNo.toLowerCase().includes(q) ||
        s.supplierOrCustomer.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [shipments, typeFilter, statusFilter, search]);

  const stats = useMemo(() => ({
    imports: shipments.filter((s) => s.type === 'import').length,
    exports: shipments.filter((s) => s.type === 'export').length,
    inTransit: shipments.filter((s) => s.status === 'in_transit' || s.status === 'customs').length,
    totalValueUsd: shipments.filter((s) => s.currency === 'USD').reduce((s, i) => s + i.totalValue, 0),
  }), [shipments]);

  const toggleExpand = (id: string) => setExpanded((prev) =>
    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleExport = () => {
    const rows = filtered.map((s) => ({
      'Sevkiyat No': s.shipmentNo,
      'Tür': s.type === 'import' ? 'İthalat' : 'İhracat',
      'Tedarikçi/Müşteri': s.supplierOrCustomer,
      'Ülke': s.country,
      'Açıklama': s.description,
      'Miktar': s.quantity,
      'Birim': s.unit,
      'Değer': s.totalValue,
      'Döviz': s.currency,
      'Incoterm': s.incoterm,
      'Durum': STATUS_LABELS[s.status],
      'ETA': s.eta ?? '',
    }));
    exportToExcel(rows, 'ithalat-ihracat', 'Sevkiyatlar');
  };

  const statuses = Object.keys(STATUS_LABELS) as ShipmentStatus[];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İthalat & İhracat</h1>
          <p className="text-muted-foreground">Uluslararası ticaret sevkiyatları, gümrük ve belge yönetimi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Yeni Sevkiyat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-blue-500" />
            <p className="text-sm text-muted-foreground">İthalat</p>
          </div>
          <p className="text-2xl font-bold">{stats.imports}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <p className="text-sm text-muted-foreground">İhracat</p>
          </div>
          <p className="text-2xl font-bold">{stats.exports}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-muted-foreground">Taşıma/Gümrükte</p>
          </div>
          <p className="text-2xl font-bold">{stats.inTransit}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam USD Değer</p>
          <p className="text-2xl font-bold">${stats.totalValueUsd.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Sevkiyat ara..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
        </div>
        <div className="flex gap-1">
          {(['all', 'import', 'export'] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn('rounded-full px-3 py-1 text-sm font-medium transition-colors',
                typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
              {t === 'all' ? 'Tümü' : t === 'import' ? 'İthalat' : 'İhracat'}
            </button>
          ))}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | 'all')}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">Tüm Durumlar</option>
          {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="w-8 p-3" />
              <th className="px-4 py-3 text-left font-medium">Sevkiyat No</th>
              <th className="px-4 py-3 text-left font-medium">Tür</th>
              <th className="px-4 py-3 text-left font-medium">Tedarikçi/Müşteri</th>
              <th className="px-4 py-3 text-left font-medium">Ülke</th>
              <th className="px-4 py-3 text-left font-medium">Açıklama</th>
              <th className="px-4 py-3 text-left font-medium">Değer</th>
              <th className="px-4 py-3 text-left font-medium">Incoterm</th>
              <th className="px-4 py-3 text-left font-medium">ETA</th>
              <th className="px-4 py-3 text-left font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((shipment) => (
              <>
                <tr key={shipment.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleExpand(shipment.id)}>
                  <td className="p-3 text-center text-muted-foreground">
                    {expanded.includes(shipment.id)
                      ? <ChevronDown className="h-4 w-4 mx-auto" />
                      : <ChevronRight className="h-4 w-4 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{shipment.shipmentNo}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                      shipment.type === 'import' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}>
                      {shipment.type === 'import' ? '↓ İthalat' : '↑ İhracat'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium max-w-[150px] truncate">{shipment.supplierOrCustomer}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      {shipment.country}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate">{shipment.description}</td>
                  <td className="px-4 py-3 font-medium">{shipment.totalValue.toLocaleString()} {shipment.currency}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono font-medium">{shipment.incoterm}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {shipment.eta ? new Date(shipment.eta).toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[shipment.status])}>
                      {STATUS_LABELS[shipment.status]}
                    </span>
                  </td>
                </tr>
                {expanded.includes(shipment.id) && (
                  <tr key={`${shipment.id}-exp`}>
                    <td colSpan={10} className="px-8 py-4 bg-muted/20">
                      <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                          <p className="font-medium mb-2">Sevkiyat Detayları</p>
                          <div className="space-y-1 text-muted-foreground">
                            <p>Miktar: <span className="text-foreground">{shipment.quantity} {shipment.unit}</span></p>
                            {shipment.customsDeclarationNo && <p>Gümrük Beyanname No: <span className="text-foreground font-mono">{shipment.customsDeclarationNo}</span></p>}
                            {shipment.etd && <p>ETD: <span className="text-foreground">{new Date(shipment.etd).toLocaleDateString('tr-TR')}</span></p>}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium mb-2">Belgeler</p>
                          {shipment.documents.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {shipment.documents.map((doc) => (
                                <span key={doc} className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1 text-xs">
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                  {doc}
                                </span>
                              ))}
                            </div>
                          ) : <p className="text-muted-foreground text-xs">Henüz belge eklenmemiş</p>}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && <NewShipmentModal onClose={() => setShowNew(false)} onSave={(d) => createMutation.mutate(d)} />}
    </div>
  );
}
