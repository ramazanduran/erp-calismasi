'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, Factory, Package, Cog, Play, CheckCircle2, BarChart3, FileDown, Search, Wrench, X } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { cn } from '@/lib/utils';

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:       { label: 'Taslak',     color: 'text-gray-600',   bg: 'bg-gray-100' },
  confirmed:   { label: 'Onaylandı',  color: 'text-blue-600',   bg: 'bg-blue-100' },
  in_progress: { label: 'Üretimde',   color: 'text-yellow-600', bg: 'bg-yellow-100' },
  completed:   { label: 'Tamamlandı', color: 'text-green-600',  bg: 'bg-green-100' },
  cancelled:   { label: 'İptal',      color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Düşük',  color: 'text-gray-500' },
  normal: { label: 'Normal', color: 'text-blue-600' },
  high:   { label: 'Yüksek', color: 'text-orange-600' },
  urgent: { label: 'Acil',   color: 'text-red-600' },
};

interface BOMItem {
  id: string;
  componentName: string;
  componentCode: string;
  quantity: number;
  unit: string;
}

interface Operation {
  id: string;
  name: string;
  workCenter: string;
  plannedHours: number;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ProductionOrder {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  quantity: number;
  producedQty: number;
  scrapQty: number;
  unit: string;
  scheduledStart: string;
  scheduledEnd: string;
  productName: string;
  productCode: string;
  bomVersion?: string;
  operations: Operation[];
}

interface BOM {
  id: string;
  version: string;
  status: 'active' | 'draft' | 'obsolete';
  quantity: number;
  unit: string;
  productName: string;
  productCode: string;
  items: BOMItem[];
  orderCount: number;
}

interface WorkCenter {
  id: string;
  code: string;
  name: string;
  type: 'machine' | 'assembly' | 'quality' | 'packaging';
  capacity: number;
  currentLoad: number;
  status: 'active' | 'maintenance' | 'idle';
  hourlyRate: number;
}

const MOCK_ORDERS: ProductionOrder[] = [
  {
    id: 'o1', orderNumber: 'ÜRE-2026-0056', status: 'in_progress', priority: 'urgent',
    quantity: 500, producedQty: 280, scrapQty: 5, unit: 'adet',
    scheduledStart: '2026-05-20', scheduledEnd: '2026-05-30',
    productName: 'Hidrolik Valf Gövdesi', productCode: 'HID-VLF-001', bomVersion: '2.1',
    operations: [
      { id: 'op1', name: 'CNC Tornalama', workCenter: 'CNC Tezgahı #1', plannedHours: 40, status: 'completed' },
      { id: 'op2', name: 'Freze', workCenter: 'CNC Tezgahı #3', plannedHours: 20, status: 'in_progress' },
      { id: 'op3', name: 'Kalite Kontrol', workCenter: 'QC İstasyonu', plannedHours: 8, status: 'pending' },
    ],
  },
  {
    id: 'o2', orderNumber: 'ÜRE-2026-0057', status: 'confirmed', priority: 'high',
    quantity: 1000, producedQty: 0, scrapQty: 0, unit: 'adet',
    scheduledStart: '2026-05-28', scheduledEnd: '2026-06-10',
    productName: 'Alüminyum Muhafaza Kasası', productCode: 'ALU-KAS-033', bomVersion: '1.0',
    operations: [
      { id: 'op4', name: 'Lazer Kesim', workCenter: 'Lazer #2', plannedHours: 30, status: 'pending' },
      { id: 'op5', name: 'Bükme', workCenter: 'Pres Fren #1', plannedHours: 15, status: 'pending' },
      { id: 'op6', name: 'Montaj', workCenter: 'Montaj Hattı A', plannedHours: 25, status: 'pending' },
    ],
  },
  {
    id: 'o3', orderNumber: 'ÜRE-2026-0055', status: 'completed', priority: 'normal',
    quantity: 200, producedQty: 200, scrapQty: 3, unit: 'adet',
    scheduledStart: '2026-05-10', scheduledEnd: '2026-05-22',
    productName: 'Elektronik Kontrol Paneli', productCode: 'ELK-PNL-007', bomVersion: '3.2',
    operations: [
      { id: 'op7', name: 'PCB Montaj', workCenter: 'SMT Hattı', plannedHours: 20, status: 'completed' },
      { id: 'op8', name: 'Test', workCenter: 'Test İstasyonu', plannedHours: 10, status: 'completed' },
    ],
  },
  {
    id: 'o4', orderNumber: 'ÜRE-2026-0058', status: 'draft', priority: 'low',
    quantity: 150, producedQty: 0, scrapQty: 0, unit: 'adet',
    scheduledStart: '2026-06-01', scheduledEnd: '2026-06-15',
    productName: 'Dişli Kutusu Kapağı', productCode: 'DIS-KAP-044', bomVersion: '1.0',
    operations: [],
  },
  {
    id: 'o5', orderNumber: 'ÜRE-2026-0059', status: 'in_progress', priority: 'high',
    quantity: 300, producedQty: 120, scrapQty: 8, unit: 'adet',
    scheduledStart: '2026-05-22', scheduledEnd: '2026-06-02',
    productName: 'Pnömatik Silindir Piston', productCode: 'PNO-PST-019',
    operations: [
      { id: 'op9', name: 'Döküm', workCenter: 'Döküm Fırını', plannedHours: 16, status: 'completed' },
      { id: 'op10', name: 'Taşlama', workCenter: 'Taşlama Tezgahı', plannedHours: 24, status: 'in_progress' },
    ],
  },
  {
    id: 'o6', orderNumber: 'ÜRE-2026-0060', status: 'confirmed', priority: 'urgent',
    quantity: 50, producedQty: 0, scrapQty: 0, unit: 'takım',
    scheduledStart: '2026-05-27', scheduledEnd: '2026-05-31',
    productName: 'Özel Flanş Seti', productCode: 'FLN-SET-088', bomVersion: '1.5',
    operations: [
      { id: 'op11', name: 'CNC Tornalama', workCenter: 'CNC Tezgahı #2', plannedHours: 12, status: 'pending' },
      { id: 'op12', name: 'Yüzey İşlem', workCenter: 'Yüzey Hattı', plannedHours: 6, status: 'pending' },
    ],
  },
];

const MOCK_BOMS: BOM[] = [
  {
    id: 'b1', version: '2.1', status: 'active', quantity: 1, unit: 'adet',
    productName: 'Hidrolik Valf Gövdesi', productCode: 'HID-VLF-001', orderCount: 8,
    items: [
      { id: 'bi1', componentName: 'Çelik Blok 80x80x120', componentCode: 'CEL-BLK-001', quantity: 1, unit: 'adet' },
      { id: 'bi2', componentName: 'O-Ring 25mm', componentCode: 'ORG-025', quantity: 4, unit: 'adet' },
      { id: 'bi3', componentName: 'Vida M8x30', componentCode: 'VD-M8-30', quantity: 8, unit: 'adet' },
    ],
  },
  {
    id: 'b2', version: '1.0', status: 'active', quantity: 1, unit: 'adet',
    productName: 'Alüminyum Muhafaza Kasası', productCode: 'ALU-KAS-033', orderCount: 3,
    items: [
      { id: 'bi4', componentName: 'Alüminyum Levha 2mm', componentCode: 'ALU-2MM', quantity: 0.5, unit: 'kg' },
      { id: 'bi5', componentName: 'Perçin 4mm', componentCode: 'PRC-4MM', quantity: 20, unit: 'adet' },
      { id: 'bi6', componentName: 'Köşe Bağlantı', componentCode: 'KSE-BGL', quantity: 4, unit: 'adet' },
    ],
  },
  {
    id: 'b3', version: '3.2', status: 'active', quantity: 1, unit: 'adet',
    productName: 'Elektronik Kontrol Paneli', productCode: 'ELK-PNL-007', orderCount: 12,
    items: [
      { id: 'bi7', componentName: 'PCB Kartı ELK-007', componentCode: 'PCB-ELK-007', quantity: 1, unit: 'adet' },
      { id: 'bi8', componentName: 'Güç Kaynağı 24V', componentCode: 'GUC-24V', quantity: 1, unit: 'adet' },
      { id: 'bi9', componentName: 'Terminaller', componentCode: 'TRM-SET', quantity: 1, unit: 'takım' },
    ],
  },
  {
    id: 'b4', version: '1.5', status: 'draft', quantity: 1, unit: 'adet',
    productName: 'Dişli Kutusu Kapağı', productCode: 'DIS-KAP-044', orderCount: 0,
    items: [
      { id: 'bi10', componentName: 'Döküm Parça DK-044', componentCode: 'DK-044', quantity: 1, unit: 'adet' },
      { id: 'bi11', componentName: 'Keçe 60x80', componentCode: 'KCE-6080', quantity: 1, unit: 'adet' },
    ],
  },
];

const MOCK_WORK_CENTERS: WorkCenter[] = [
  { id: 'wc1', code: 'CNC-01', name: 'CNC Tezgahı #1', type: 'machine', capacity: 8, currentLoad: 7.2, status: 'active', hourlyRate: 450 },
  { id: 'wc2', code: 'CNC-02', name: 'CNC Tezgahı #2', type: 'machine', capacity: 8, currentLoad: 5.0, status: 'active', hourlyRate: 450 },
  { id: 'wc3', code: 'CNC-03', name: 'CNC Tezgahı #3', type: 'machine', capacity: 8, currentLoad: 8.0, status: 'active', hourlyRate: 450 },
  { id: 'wc4', code: 'LZR-01', name: 'Lazer Kesim #1', type: 'machine', capacity: 8, currentLoad: 4.5, status: 'active', hourlyRate: 600 },
  { id: 'wc5', code: 'LZR-02', name: 'Lazer Kesim #2', type: 'machine', capacity: 8, currentLoad: 2.0, status: 'idle', hourlyRate: 600 },
  { id: 'wc6', code: 'MON-A', name: 'Montaj Hattı A', type: 'assembly', capacity: 16, currentLoad: 10, status: 'active', hourlyRate: 200 },
  { id: 'wc7', code: 'MON-B', name: 'Montaj Hattı B', type: 'assembly', capacity: 16, currentLoad: 0, status: 'maintenance', hourlyRate: 200 },
  { id: 'wc8', code: 'QC-01', name: 'QC İstasyonu', type: 'quality', capacity: 8, currentLoad: 3.5, status: 'active', hourlyRate: 300 },
  { id: 'wc9', code: 'SMT-01', name: 'SMT Hattı', type: 'machine', capacity: 8, currentLoad: 6.0, status: 'active', hourlyRate: 550 },
  { id: 'wc10', code: 'PKG-01', name: 'Paketleme Hattı', type: 'packaging', capacity: 8, currentLoad: 4.0, status: 'active', hourlyRate: 150 },
];

const WC_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  machine:  { label: 'Makine',   color: 'text-blue-600' },
  assembly: { label: 'Montaj',   color: 'text-green-600' },
  quality:  { label: 'Kalite',   color: 'text-purple-600' },
  packaging:{ label: 'Paketleme',color: 'text-orange-600' },
};

const WC_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'Aktif',    color: 'text-green-700',  bg: 'bg-green-100' },
  maintenance: { label: 'Bakımda',  color: 'text-yellow-700', bg: 'bg-yellow-100' },
  idle:        { label: 'Boşta',    color: 'text-gray-600',   bg: 'bg-gray-100' },
};

function OrderDetail({ order, onClose, onUpdate }: { order: ProductionOrder; onClose: () => void; onUpdate: (o: ProductionOrder) => void }) {
  const [local, setLocal] = useState(order);
  const [producedQty, setProducedQty] = useState('');
  const progress = local.quantity > 0 ? Math.min(100, Math.round((local.producedQty / local.quantity) * 100)) : 0;

  const recordProduction = () => {
    if (!producedQty) return;
    const updated = { ...local, producedQty: local.producedQty + +producedQty, status: local.producedQty + +producedQty >= local.quantity ? 'completed' : 'in_progress' };
    setLocal(updated);
    onUpdate(updated);
    setProducedQty('');
  };

  const setOpStatus = (opId: string, status: Operation['status']) => {
    const updated = { ...local, operations: local.operations.map((op) => op.id === opId ? { ...op, status } : op) };
    setLocal(updated);
    onUpdate(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-muted-foreground">{local.orderNumber}</p>
            <h2 className="text-lg font-semibold">{local.productName}</h2>
            <p className="text-sm text-muted-foreground">{local.productCode}{local.bomVersion && ` · BOM v${local.bomVersion}`}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Üretim İlerlemesi</span>
            <span className="font-medium">{local.producedQty} / {local.quantity} {local.unit}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{progress}% tamamlandı · Hurda: {local.scrapQty} {local.unit}</p>
        </div>

        {['confirmed', 'in_progress'].includes(local.status) && (
          <div className="flex gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <input
              type="number" min="1" className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-sm"
              placeholder="Üretilen miktar" value={producedQty} onChange={(e) => setProducedQty(e.target.value)}
            />
            <button onClick={recordProduction} className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm flex items-center gap-1">
              <Play className="h-3.5 w-3.5" /> Kaydet
            </button>
          </div>
        )}

        {local.operations.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">İş Operasyonları</p>
            <div className="space-y-2">
              {local.operations.map((op, i) => (
                <div key={op.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                  <span className="text-xs font-mono w-5 text-muted-foreground">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{op.name}</p>
                    <p className="text-xs text-muted-foreground">{op.workCenter} · {op.plannedHours}h planlı</p>
                  </div>
                  {op.status === 'pending' && (
                    <button onClick={() => setOpStatus(op.id, 'in_progress')} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Başlat</button>
                  )}
                  {op.status === 'in_progress' && (
                    <button onClick={() => setOpStatus(op.id, 'completed')} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Tamamla</button>
                  )}
                  {op.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NewOrderModal({ onClose, onSave }: { onClose: () => void; onSave: (o: ProductionOrder) => void }) {
  const [form, setForm] = useState({ productName: '', productCode: '', quantity: '100', unit: 'adet', priority: 'normal', scheduledStart: '', scheduledEnd: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `o${Date.now()}`,
      orderNumber: `ÜRE-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      status: 'confirmed', priority: form.priority,
      quantity: +form.quantity, producedQty: 0, scrapQty: 0, unit: form.unit,
      scheduledStart: form.scheduledStart, scheduledEnd: form.scheduledEnd,
      productName: form.productName, productCode: form.productCode, operations: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni Üretim Emri</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Ürün Adı *</label>
              <input required className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Ürün Kodu</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Miktar *</label>
              <input type="number" min="1" required className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Birim</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Öncelik</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Planlanan Başlangıç</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.scheduledStart} onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Planlanan Bitiş</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.scheduledEnd} onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

type TabType = 'orders' | 'boms' | 'work-centers';

export default function ManufacturingPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>(MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'bom') return 'boms';
      if (tab === 'workcenters') return 'work-centers';
    }
    return 'orders';
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detailOrder, setDetailOrder] = useState<ProductionOrder | null>(null);

  const stats = useMemo(() => ({
    total: orders.length,
    inProgress: orders.filter((o) => o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    totalProduced: orders.reduce((s, o) => s + o.producedQty, 0),
    scrapRate: (() => {
      const totalProd = orders.reduce((s, o) => s + o.producedQty, 0);
      const totalScrap = orders.reduce((s, o) => s + o.scrapQty, 0);
      return totalProd > 0 ? Math.round((totalScrap / totalProd) * 100 * 10) / 10 : 0;
    })(),
  }), [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!o.orderNumber.toLowerCase().includes(q) && !o.productName.toLowerCase().includes(q) && !o.productCode.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Üretim Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Üretim emirleri, ürün reçeteleri ve iş merkezleri</p>
        </div>
        {activeTab === 'orders' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToExcel(
                filteredOrders.map((o) => ({
                  no: o.orderNumber, urun: o.productName, kod: o.productCode,
                  durum: ORDER_STATUS[o.status]?.label, oncelik: PRIORITY_CONFIG[o.priority]?.label,
                  miktar: o.quantity, uretilen: o.producedQty, hurda: o.scrapQty, birim: o.unit,
                  baslangic: o.scheduledStart, bitis: o.scheduledEnd,
                })),
                [
                  { key: 'no', header: 'Emir No', width: 14 },
                  { key: 'urun', header: 'Ürün', width: 28 },
                  { key: 'kod', header: 'Kod', width: 14 },
                  { key: 'durum', header: 'Durum', width: 14 },
                  { key: 'oncelik', header: 'Öncelik', width: 10 },
                  { key: 'miktar', header: 'Miktar', width: 10 },
                  { key: 'uretilen', header: 'Üretilen', width: 10 },
                  { key: 'hurda', header: 'Hurda', width: 10 },
                  { key: 'birim', header: 'Birim', width: 8 },
                  { key: 'baslangic', header: 'Başlangıç', width: 12 },
                  { key: 'bitis', header: 'Bitiş', width: 12 },
                ],
                'uretim-emirleri', 'Üretim Emirleri'
              )}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <FileDown className="h-4 w-4" /> Excel
            </button>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
              <PlusCircle className="h-4 w-4" /> Yeni Üretim Emri
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Toplam Emir', value: stats.total, icon: Factory, color: 'text-foreground' },
          { label: 'Üretimde', value: stats.inProgress, icon: Cog, color: 'text-yellow-600' },
          { label: 'Tamamlandı', value: stats.completed, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Toplam Üretilen', value: stats.totalProduced, icon: Package, color: 'text-blue-600' },
          { label: 'Hurda Oranı', value: `%${stats.scrapRate}`, icon: BarChart3, color: stats.scrapRate < 3 ? 'text-green-600' : 'text-orange-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={cn('h-4 w-4', card.color)} />
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
            <p className={cn('text-xl font-bold', card.color)}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {([['orders', 'Üretim Emirleri'], ['boms', 'Ürün Reçeteleri (BOM)'], ['work-centers', 'İş Merkezleri']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Emir no veya ürün..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-56" />
            </div>
            {[{ v: '', l: 'Tümü' }, ...Object.entries(ORDER_STATUS).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
              <button key={f.v} onClick={() => setStatusFilter(f.v)}
                className={cn('px-3 py-1.5 rounded-lg text-sm', statusFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
                {f.l}
              </button>
            ))}
          </div>
          {filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <Factory className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Üretim emri bulunamadı</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>{['Numara', 'Ürün', 'Durum', 'Öncelik', 'Miktar', 'Üretilen', 'İlerleme', 'Tarih', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => {
                    const sc = ORDER_STATUS[order.status];
                    const pc = PRIORITY_CONFIG[order.priority];
                    const pct = order.quantity > 0 ? Math.min(100, Math.round((order.producedQty / order.quantity) * 100)) : 0;
                    return (
                      <tr key={order.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{order.productName}</p>
                          <p className="text-xs text-muted-foreground">{order.productCode}</p>
                        </td>
                        <td className="px-4 py-3"><span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sc?.bg, sc?.color)}>{sc?.label}</span></td>
                        <td className="px-4 py-3 text-xs"><span className={pc?.color}>{pc?.label}</span></td>
                        <td className="px-4 py-3 text-xs">{order.quantity} {order.unit}</td>
                        <td className="px-4 py-3 text-xs">{order.producedQty}</td>
                        <td className="px-4 py-3 w-32">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{order.scheduledEnd}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setDetailOrder(order)} className="text-xs text-primary hover:underline">Detay</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'boms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_BOMS.map((bom) => {
            const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700', draft: 'bg-gray-100 text-gray-600', obsolete: 'bg-red-100 text-red-700' };
            return (
              <div key={bom.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{bom.productName}</p>
                    <p className="text-xs text-muted-foreground">{bom.productCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColors[bom.status] ?? 'bg-gray-100 text-gray-600')}>
                      {bom.status === 'active' ? 'Aktif' : bom.status === 'draft' ? 'Taslak' : 'Eski'}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">v{bom.version}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {bom.quantity} {bom.unit} başına · {bom.items.length} bileşen · {bom.orderCount} üretim emri
                </p>
                <div className="space-y-1.5">
                  {bom.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm bg-muted/40 rounded px-2.5 py-1.5">
                      <span className="text-xs">{item.componentName}</span>
                      <span className="text-xs text-muted-foreground">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'work-centers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_WORK_CENTERS.map((wc) => {
            const loadPct = wc.capacity > 0 ? Math.round((wc.currentLoad / wc.capacity) * 100) : 0;
            const sc = WC_STATUS_CONFIG[wc.status];
            const tc = WC_TYPE_CONFIG[wc.type];
            return (
              <div key={wc.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      {wc.type === 'machine' ? <Cog className="h-5 w-5 text-muted-foreground" /> :
                       wc.type === 'assembly' ? <Wrench className="h-5 w-5 text-muted-foreground" /> :
                       wc.type === 'quality' ? <CheckCircle2 className="h-5 w-5 text-muted-foreground" /> :
                       <Package className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{wc.name}</p>
                      <p className="text-xs text-muted-foreground">{wc.code}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sc.bg, sc.color)}>{sc.label}</span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                  <span className={tc.color}>{tc.label}</span>
                  <span>Kapasite: {wc.capacity}h/gün</span>
                  <span>₺{wc.hourlyRate}/h</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Yük</span>
                    <span className="font-medium">{loadPct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', loadPct >= 90 ? 'bg-red-500' : loadPct >= 70 ? 'bg-yellow-500' : 'bg-green-500')} style={{ width: `${loadPct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{wc.currentLoad}h / {wc.capacity}h</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <NewOrderModal onClose={() => setShowForm(false)} onSave={(o) => { setOrders((prev) => [o, ...prev]); setShowForm(false); }} />}
      {detailOrder && (
        <OrderDetail
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onUpdate={(updated) => { setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o)); setDetailOrder(updated); }}
        />
      )}
    </div>
  );
}
