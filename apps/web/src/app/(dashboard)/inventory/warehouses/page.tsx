'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import {
  Warehouse, Plus, MapPin, Package, Users, ChevronRight, X,
  Building2, BarChart3, Layers, PlusCircle, Edit, FileDown, Search,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';

const MOCK_WAREHOUSES = [
  { id: 'wh1', code: 'DEP-001', name: 'Merkez Ana Depo', type: 'main', city: 'İstanbul', address: 'Dudullu OSB, Ümraniye', phone: '0216 555 01 01', isActive: true, _count: { locations: 24, stockEntries: 142 } },
  { id: 'wh2', code: 'DEP-002', name: 'Ankara Depo', type: 'satellite', city: 'Ankara', address: 'Ostim OSB, Yenimahalle', phone: '0312 555 02 02', isActive: true, _count: { locations: 12, stockEntries: 68 } },
  { id: 'wh3', code: 'DEP-003', name: 'İzmir Depo', type: 'satellite', city: 'İzmir', address: 'Atatürk OSB, Çiğli', phone: '0232 555 03 03', isActive: true, _count: { locations: 8, stockEntries: 45 } },
  { id: 'wh4', code: 'DEP-004', name: 'Hazırlık Deposu', type: 'transit', city: 'İstanbul', address: 'Hadımköy Lojistik Merkezi', phone: '0212 555 04 04', isActive: true, _count: { locations: 6, stockEntries: 22 } },
  { id: 'wh5', code: 'DEP-005', name: 'e-Ticaret Sanal Depo', type: 'virtual', city: '', address: '', phone: '', isActive: true, _count: { locations: 0, stockEntries: 38 } },
  { id: 'wh6', code: 'DEP-006', name: 'Bursa Depo', type: 'satellite', city: 'Bursa', address: 'Nilüfer OSB, Bursa', phone: '0224 555 06 06', isActive: false, _count: { locations: 5, stockEntries: 0 } },
];

const MOCK_WH_STATS = {
  total: 6,
  byType: [
    { type: 'main', _count: 1 },
    { type: 'satellite', _count: 3 },
    { type: 'virtual', _count: 1 },
    { type: 'transit', _count: 1 },
  ],
  totalStockItems: 315,
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  main:      { label: 'Ana Depo',       color: 'text-blue-700',   bg: 'bg-blue-100' },
  satellite: { label: 'Yardımcı Depo', color: 'text-purple-700', bg: 'bg-purple-100' },
  virtual:   { label: 'Sanal Depo',    color: 'text-gray-600',   bg: 'bg-gray-100' },
  transit:   { label: 'Transit Depo',  color: 'text-orange-700', bg: 'bg-orange-100' },
};

function WarehouseFormModal({ warehouse, onClose, onSave }: {
  warehouse?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    code: warehouse?.code ?? '',
    name: warehouse?.name ?? '',
    type: warehouse?.type ?? 'main',
    address: warehouse?.address ?? '',
    city: warehouse?.city ?? '',
    phone: warehouse?.phone ?? '',
    notes: warehouse?.notes ?? '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{warehouse ? 'Depo Düzenle' : 'Yeni Depo'}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Depo Kodu *</label>
              <input required className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm font-mono uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DEP-001" />
            </div>
            <div>
              <label className="text-sm font-medium">Depo Adı *</label>
              <input required className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ana Depo" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tip</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Şehir</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="İstanbul" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Adres</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Telefon</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0212 xxx xx xx" />
            </div>
            <div>
              <label className="text-sm font-medium">Notlar</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
              {warehouse ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WarehouseDetailPanel({ warehouse, onClose }: { warehouse: any; onClose: () => void }) {
  const { data: detail } = useQuery({
    queryKey: ['warehouse', warehouse.id],
    queryFn: () => api.get(`/api/v1/warehouses/${warehouse.id}`),
  });

  const wh = detail as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{warehouse.name}</h2>
            <p className="text-xs text-muted-foreground">{warehouse.code} • {TYPE_CONFIG[warehouse.type]?.label}</p>
          </div>
          <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded-lg hover:bg-muted">Kapat</button>
        </div>

        {wh ? (
          <div className="space-y-4">
            {/* Info */}
            <div className="grid grid-cols-2 gap-3">
              {wh.address && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Adres</p>
                    <p className="text-sm">{wh.address}{wh.city && `, ${wh.city}`}</p>
                  </div>
                </div>
              )}
              {wh.manager && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Depo Sorumlusu</p>
                    <p className="text-sm">{wh.manager.firstName} {wh.manager.lastName}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Locations */}
            {wh.locations?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Layers className="h-4 w-4" />Lokasyonlar ({wh.locations.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {wh.locations.map((loc: any) => (
                    <div key={loc.id} className="p-2 border border-border rounded-lg text-xs">
                      <p className="font-medium font-mono">{loc.code}</p>
                      <p className="text-muted-foreground">{loc.name}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{loc.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            {wh.stockEntries?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Package className="h-4 w-4" />Stok ({wh.stockEntries.length} ürün)
                </h3>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Ürün</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kod</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Miktar</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Rezerve</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {wh.stockEntries.map((entry: any) => (
                        <tr key={entry.id}>
                          <td className="px-3 py-2">{entry.product.name}</td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{entry.product.code}</td>
                          <td className="px-3 py-2 text-right font-medium">{Number(entry.quantity).toLocaleString('tr-TR')} {entry.product.unit}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{Number(entry.reservedQty).toLocaleString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
        )}
      </div>
    </div>
  );
}

export default function WarehousesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<any>(null);
  const [detailWarehouse, setDetailWarehouse] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [localWarehouses, setLocalWarehouses] = useState<any[]>(MOCK_WAREHOUSES);

  const { data: statsData } = useQuery({
    queryKey: ['warehouses', 'stats'],
    queryFn: () => api.get('/api/v1/warehouses/stats'),
  });

  const { data: rawWarehousesData, isLoading: whLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/api/v1/warehouses'),
  });

  const apiWarehouses: any[] | null = rawWarehousesData !== undefined ? (Array.isArray(rawWarehousesData) ? rawWarehousesData : []) : null;
  const isLoading = whLoading && apiWarehouses === null;

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/warehouses', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setShowForm(false); },
    onError: (_err, data) => {
      const newWh = { id: `local-${Date.now()}`, ...data, isActive: true, _count: { locations: 0, stockEntries: 0 } };
      setLocalWarehouses((prev) => [...prev, newWh]);
      setShowForm(false);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/v1/warehouses/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setEditWarehouse(null); },
    onError: (_err, { id, data }) => {
      setLocalWarehouses((prev) => prev.map((w) => w.id === id ? { ...w, ...data } : w));
      setEditWarehouse(null);
    },
  });

  const stats = (statsData as any) ?? MOCK_WH_STATS;
  const warehouses = apiWarehouses ?? localWarehouses;

  const filteredWarehouses = useMemo(() => {
    if (!search) return warehouses;
    const q = search.toLowerCase();
    return warehouses.filter((w: any) =>
      w.code?.toLowerCase().includes(q) ||
      w.name?.toLowerCase().includes(q) ||
      w.city?.toLowerCase().includes(q)
    );
  }, [warehouses, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Depo Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Depo ve lokasyon yönetimi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filteredWarehouses.map((w) => ({
                code: w.code ?? '',
                name: w.name ?? '',
                type: TYPE_CONFIG[w.type]?.label ?? w.type ?? '',
                city: w.city ?? '',
                address: w.address ?? '',
                phone: w.phone ?? '',
                isActive: w.isActive ? 'Aktif' : 'Pasif',
                productCount: w._count?.locations ?? 0,
              })),
              [
                { key: 'code', header: 'Kod', width: 10 },
                { key: 'name', header: 'Depo Adı', width: 22 },
                { key: 'type', header: 'Tip', width: 14 },
                { key: 'city', header: 'Şehir', width: 14 },
                { key: 'address', header: 'Adres', width: 28 },
                { key: 'phone', header: 'Telefon', width: 14 },
                { key: 'isActive', header: 'Durum', width: 10 },
                { key: 'productCount', header: 'Lokasyon', width: 10 },
              ],
              'depolar',
              'Depolar'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Yeni Depo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Toplam Depo', value: stats?.total ?? 0, icon: Warehouse, color: 'text-blue-600' },
          { label: 'Ana Depo', value: stats?.byType?.find((t: any) => t.type === 'main')?._count ?? 0, icon: Building2, color: 'text-purple-600' },
          { label: 'Yardımcı Depo', value: stats?.byType?.find((t: any) => t.type === 'satellite')?._count ?? 0, icon: Layers, color: 'text-green-600' },
          { label: 'Toplam Stok Kalemi', value: Number(stats?.totalStockItems ?? 0).toLocaleString('tr-TR'), icon: Package, color: 'text-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border p-4 shadow-sm">
            <div className={cn('flex items-center gap-2', stat.color)}>
              <stat.icon className="h-4 w-4" />
              <p className="text-xs font-medium">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Kod, ad veya şehir..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
        />
      </div>

      {/* Warehouse Grid */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Warehouse className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Depo bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">{search ? 'Arama kriterlerinizi değiştirin' : 'İlk deponuzu oluşturun'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWarehouses.map((wh: any) => {
            const tc = TYPE_CONFIG[wh.type] ?? TYPE_CONFIG['main'];
            return (
              <div key={wh.id} className="rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="font-semibold">{wh.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{wh.code}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', tc.color, tc.bg)}>
                    {tc.label}
                  </span>
                </div>

                {(wh.city || wh.address) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{[wh.address, wh.city].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {wh._count?.locations ?? 0} lokasyon
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {wh._count?.stockEntries ?? 0} ürün
                  </span>
                  {wh.manager && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {wh.manager.firstName} {wh.manager.lastName}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => setDetailWarehouse(wh)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-primary hover:bg-primary/10 py-1.5 rounded-md transition-colors"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Detay
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setEditWarehouse(wh)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:bg-muted py-1.5 px-2 rounded-md transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Düzenle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <WarehouseFormModal
          onClose={() => setShowForm(false)}
          onSave={(data) => create.mutate(data)}
        />
      )}
      {editWarehouse && (
        <WarehouseFormModal
          warehouse={editWarehouse}
          onClose={() => setEditWarehouse(null)}
          onSave={(data) => update.mutate({ id: editWarehouse.id, data })}
        />
      )}
      {detailWarehouse && (
        <WarehouseDetailPanel warehouse={detailWarehouse} onClose={() => setDetailWarehouse(null)} />
      )}
    </div>
  );
}
