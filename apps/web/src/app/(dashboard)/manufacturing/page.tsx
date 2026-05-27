'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, Factory, Package, Cog, Play, CheckCircle2, BarChart3, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:       { label: 'Taslak',        color: 'text-gray-600',   bg: 'bg-gray-100' },
  confirmed:   { label: 'Onaylandı',     color: 'text-blue-600',   bg: 'bg-blue-100' },
  in_progress: { label: 'Üretimde',      color: 'text-yellow-600', bg: 'bg-yellow-100' },
  completed:   { label: 'Tamamlandı',    color: 'text-green-600',  bg: 'bg-green-100' },
  cancelled:   { label: 'İptal',         color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Düşük',   color: 'text-gray-500' },
  normal: { label: 'Normal',  color: 'text-blue-600' },
  high:   { label: 'Yüksek',  color: 'text-orange-600' },
  urgent: { label: 'Acil',    color: 'text-red-600' },
};

interface ProductionOrder {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  quantity: number;
  producedQty: number;
  scrapQty: number;
  unit: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  product: { name: string; code: string };
  bom?: { version: string } | null;
  _count?: { operations: number };
}

interface BOM {
  id: string;
  version: string;
  status: string;
  quantity: number;
  unit: string;
  product: { name: string; code: string };
  _count?: { items: number; productionOrders: number };
}

interface Stats {
  total: number;
  inProgress: number;
  completed: number;
  totalProduced: number;
  scrapRate: number;
  byStatus: Record<string, number>;
}

function NewOrderModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    quantity: '1', unit: 'adet', priority: 'normal', status: 'confirmed',
    scheduledStart: '', scheduledEnd: '', notes: '', productId: '', bomId: '',
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => api.get('/api/v1/inventory/products'),
  });

  const { data: boms = [] } = useQuery({
    queryKey: ['boms-list'],
    queryFn: () => api.get('/api/v1/manufacturing/boms', { status: 'active' }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni Üretim Emri</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, quantity: +form.quantity, bomId: form.bomId || undefined }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Ürün *</label>
            <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Ürün seçin...</option>
              {(products as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Ürün Reçetesi (BOM)</label>
            <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.bomId} onChange={(e) => setForm({ ...form, bomId: e.target.value })}>
              <option value="">Reçetesiz</option>
              {(boms as BOM[]).map((b) => <option key={b.id} value={b.id}>{b.product.name} v{b.version}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Miktar *</label>
              <input type="number" step="0.001" min="0.001" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Birim</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Öncelik</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Planlanan Başlangıç</label>
              <input type="datetime-local" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.scheduledStart} onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })} />
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

function OrderDetail({ order, onClose }: { order: ProductionOrder; onClose: () => void }) {
  const qc = useQueryClient();
  const [producedQty, setProducedQty] = useState('');
  const [scrapQty, setScrapQty] = useState('0');

  const { data } = useQuery({
    queryKey: ['manufacturing', 'order', order.id],
    queryFn: () => api.get(`/api/v1/manufacturing/orders/${order.id}`),
  });

  const recordProduction = useMutation({
    mutationFn: (d: any) => api.post(`/api/v1/manufacturing/orders/${order.id}/record-production`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manufacturing'] }); setProducedQty(''); },
  });

  const updateOpStatus = useMutation({
    mutationFn: ({ opId, status }: any) => api.put(`/api/v1/manufacturing/orders/${order.id}/operations/${opId}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manufacturing', 'order', order.id] }),
  });

  const detail = data as any;
  const progress = order.quantity > 0 ? Math.min(100, Math.round((Number(order.producedQty) / Number(order.quantity)) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-muted-foreground">{order.orderNumber}</p>
            <h2 className="text-lg font-semibold">{order.product.name}</h2>
          </div>
          <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded-lg">Kapat</button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Üretim İlerlemesi</span>
            <span className="font-medium">{Number(order.producedQty)} / {Number(order.quantity)} {order.unit}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{progress}% tamamlandı • Hurda: {Number(order.scrapQty)} {order.unit}</p>
        </div>

        {/* Record Production */}
        {['confirmed', 'in_progress'].includes(order.status) && (
          <div className="flex gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <input type="number" step="0.001" className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Üretilen miktar" value={producedQty} onChange={(e) => setProducedQty(e.target.value)} />
            <input type="number" step="0.001" className="w-24 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Hurda" value={scrapQty} onChange={(e) => setScrapQty(e.target.value)} />
            <button onClick={() => producedQty && recordProduction.mutate({ producedQty: +producedQty, scrapQty: +scrapQty })}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm">
              <Play className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* BOM */}
        {detail?.bom?.items?.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Malzeme Listesi (v{detail.bom.version})</p>
            <div className="space-y-1">
              {detail.bom.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm px-3 py-1.5 bg-muted/30 rounded">
                  <span>{item.component.name} ({item.component.code})</span>
                  <span className="text-muted-foreground">{Number(item.quantity)} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operations */}
        {detail?.operations?.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">İş Operasyonları</p>
            <div className="space-y-2">
              {detail.operations.map((op: any, i: number) => (
                <div key={op.id} className="flex items-center gap-3 p-2 rounded border border-border">
                  <span className="text-xs font-mono w-6 text-muted-foreground">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{op.name}</p>
                    <p className="text-xs text-muted-foreground">{op.workCenter.name} • {op.plannedHours}h planlı</p>
                  </div>
                  {op.status === 'pending' && (
                    <button onClick={() => updateOpStatus.mutate({ opId: op.id, status: 'in_progress' })}
                      className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Başlat</button>
                  )}
                  {op.status === 'in_progress' && (
                    <button onClick={() => updateOpStatus.mutate({ opId: op.id, status: 'completed' })}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Tamamla</button>
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

export default function ManufacturingPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'boms' | 'work-centers'>('orders');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detailOrder, setDetailOrder] = useState<ProductionOrder | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ['manufacturing', 'stats'],
    queryFn: () => api.get('/api/v1/manufacturing/stats'),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['manufacturing', 'orders', statusFilter],
    queryFn: () => api.get('/api/v1/manufacturing/orders', statusFilter ? { status: statusFilter } : undefined),
    enabled: activeTab === 'orders',
  });

  const { data: bomsData = [], isLoading: bomsLoading } = useQuery({
    queryKey: ['manufacturing', 'boms'],
    queryFn: () => api.get('/api/v1/manufacturing/boms'),
    enabled: activeTab === 'boms',
  });

  const { data: workCentersData = [] } = useQuery({
    queryKey: ['manufacturing', 'work-centers'],
    queryFn: () => api.get('/api/v1/manufacturing/work-centers'),
    enabled: activeTab === 'work-centers',
  });

  const createOrder = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/manufacturing/orders', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manufacturing'] }); setShowForm(false); },
  });

  const stats = statsData as Stats | undefined;
  const orders = ((ordersData as any)?.items ?? []) as ProductionOrder[];
  const boms = bomsData as BOM[];
  const workCenters = workCentersData as any[];

  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) =>
      o.orderNumber?.toLowerCase().includes(q) ||
      o.product?.name?.toLowerCase().includes(q) ||
      o.product?.code?.toLowerCase().includes(q)
    );
  }, [orders, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Üretim Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Üretim emirleri, BOM ve iş merkezleri</p>
        </div>
        {activeTab === 'orders' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToExcel(
                filteredOrders.map((o) => ({
                  orderNumber: o.orderNumber,
                  productCode: o.product.code,
                  productName: o.product.name,
                  status: ORDER_STATUS[o.status]?.label ?? o.status,
                  priority: o.priority,
                  quantity: o.quantity,
                  producedQty: o.producedQty,
                  scrapQty: o.scrapQty,
                  unit: o.unit,
                  scheduledStart: o.scheduledStart ? new Date(o.scheduledStart).toLocaleDateString('tr-TR') : '',
                  scheduledEnd: o.scheduledEnd ? new Date(o.scheduledEnd).toLocaleDateString('tr-TR') : '',
                })),
                [
                  { key: 'orderNumber', header: 'Emir No', width: 14 },
                  { key: 'productCode', header: 'Ürün Kodu', width: 12 },
                  { key: 'productName', header: 'Ürün Adı', width: 26 },
                  { key: 'status', header: 'Durum', width: 14 },
                  { key: 'priority', header: 'Öncelik', width: 10 },
                  { key: 'quantity', header: 'Miktar', width: 10 },
                  { key: 'producedQty', header: 'Üretilen', width: 10 },
                  { key: 'scrapQty', header: 'Hurda', width: 10 },
                  { key: 'unit', header: 'Birim', width: 8 },
                  { key: 'scheduledStart', header: 'Başlangıç', width: 12 },
                  { key: 'scheduledEnd', header: 'Bitiş', width: 12 },
                ],
                'uretim-emirleri',
                'Üretim Emirleri'
              )}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <FileDown className="h-4 w-4" /> Excel
            </button>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
              <PlusCircle className="h-4 w-4" />Yeni Üretim Emri
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Toplam', value: stats.total, icon: Factory },
            { label: 'Üretimde', value: stats.inProgress, icon: Cog },
            { label: 'Tamamlandı', value: stats.completed, icon: CheckCircle2 },
            { label: 'Toplam Üretilen', value: Number(stats.totalProduced).toFixed(0), icon: Package },
            { label: 'Hurda Oranı', value: `%${stats.scrapRate}`, icon: BarChart3 },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-xl font-bold mt-0.5">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([['orders', 'Üretim Emirleri'], ['boms', 'Ürün Reçeteleri (BOM)'], ['work-centers', 'İş Merkezleri']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Emir no, ürün adı veya kodu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-56"
              />
            </div>
            {[{ v: '', l: 'Tümü' }, ...Object.entries(ORDER_STATUS).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
              <button key={f.v} onClick={() => setStatusFilter(f.v)}
                className={cn('px-3 py-1.5 rounded-lg text-sm', statusFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
                {f.l}
              </button>
            ))}
          </div>

          {ordersLoading ? (
            <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <Factory className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Üretim emri bulunamadı</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>{['Numara', 'Ürün', 'Durum', 'Öncelik', 'Miktar', 'Üretilen', 'İlerleme', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => {
                    const sc = ORDER_STATUS[order.status];
                    const pc = PRIORITY_CONFIG[order.priority];
                    const pct = order.quantity > 0 ? Math.min(100, Math.round((Number(order.producedQty) / Number(order.quantity)) * 100)) : 0;
                    return (
                      <tr key={order.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{order.product.name}</p>
                          <p className="text-xs text-muted-foreground">{order.product.code}</p>
                        </td>
                        <td className="px-4 py-3"><span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sc?.bg, sc?.color)}>{sc?.label}</span></td>
                        <td className="px-4 py-3 text-xs"><span className={pc?.color}>{pc?.label}</span></td>
                        <td className="px-4 py-3 text-xs">{Number(order.quantity)} {order.unit}</td>
                        <td className="px-4 py-3 text-xs">{Number(order.producedQty)} {order.unit}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                          </div>
                        </td>
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

      {/* BOMs Tab */}
      {activeTab === 'boms' && (
        <div>
          {bomsLoading ? (
            <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
          ) : boms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Ürün reçetesi bulunamadı</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boms.map((bom) => (
                <div key={bom.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', bom.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>{bom.status}</span>
                    <span className="text-xs text-muted-foreground">v{bom.version}</span>
                  </div>
                  <h3 className="font-semibold">{bom.product.name}</h3>
                  <p className="text-xs text-muted-foreground">{bom.product.code}</p>
                  <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                    <span>{bom._count?.items ?? 0} malzeme</span>
                    <span>{bom._count?.productionOrders ?? 0} üretim emri</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Work Centers Tab */}
      {activeTab === 'work-centers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workCenters.map((wc: any) => (
            <div key={wc.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Cog className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">{wc.code}</span>
              </div>
              <h3 className="font-semibold">{wc.name}</h3>
              <p className="text-xs text-muted-foreground">{wc.type}</p>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span>{wc.capacity}h/gün kapasite</span>
                <span>{wc._count?.operations ?? 0} operasyon</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <NewOrderModal onClose={() => setShowForm(false)} onSave={(d) => createOrder.mutate(d)} />}
      {detailOrder && <OrderDetail order={detailOrder} onClose={() => setDetailOrder(null)} />}
    </div>
  );
}
