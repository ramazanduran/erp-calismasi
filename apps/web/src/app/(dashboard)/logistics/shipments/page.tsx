'use client';

import { useState } from 'react';
import { PlusCircle, Truck, Package, MapPin, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatCurrency, cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Beklemede', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  picked_up: { label: 'Teslim Alındı', color: 'text-blue-600', bg: 'bg-blue-100', icon: Package },
  in_transit: { label: 'Taşımada', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Truck },
  out_for_delivery: { label: 'Dağıtımda', color: 'text-orange-600', bg: 'bg-orange-100', icon: MapPin },
  delivered: { label: 'Teslim Edildi', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  returned: { label: 'İade', color: 'text-purple-600', bg: 'bg-purple-100', icon: Package },
  failed: { label: 'Başarısız', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
};

interface Shipment {
  id: string; trackingNumber: string; carrier?: string; status: string;
  shippingCost: number | string; estimatedDelivery?: string; actualDelivery?: string;
  origin: Record<string, string>; destination: Record<string, string>;
  customer?: { name: string } | null;
  order?: { orderNumber: string } | null;
  events?: Array<{ status: string; location?: string; occurredAt: string }>;
  _count?: { items: number; events: number };
}

interface ShipmentStats { total: number; byStatus: Record<string, number>; totalCost: number; inTransit: number; pending: number }

function NewShipmentModal({ onClose, onSave }: { onClose: () => void; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    carrier: '', weight: '', shippingCost: '0', estimatedDelivery: '',
    origin: { address: '', city: 'İstanbul', country: 'Türkiye', postalCode: '' },
    destination: { address: '', city: '', country: 'Türkiye', postalCode: '' },
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Yeni Sevkiyat</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, weight: form.weight ? Number(form.weight) : undefined, shippingCost: Number(form.shippingCost) }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Kargo Şirketi</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="Aras, MNG, PTT..." />
            </div>
            <div>
              <label className="text-sm font-medium">Tahmini Teslimat</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.estimatedDelivery} onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })} />
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium mb-2">Gönderen Adres</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="col-span-2 rounded border border-border bg-background px-3 py-1.5 text-sm" placeholder="Adres" value={form.origin.address} onChange={(e) => setForm({ ...form, origin: { ...form.origin, address: e.target.value } })} required />
              <input className="rounded border border-border bg-background px-3 py-1.5 text-sm" placeholder="Şehir" value={form.origin.city} onChange={(e) => setForm({ ...form, origin: { ...form.origin, city: e.target.value } })} />
              <input className="rounded border border-border bg-background px-3 py-1.5 text-sm" placeholder="Posta Kodu" value={form.origin.postalCode} onChange={(e) => setForm({ ...form, origin: { ...form.origin, postalCode: e.target.value } })} />
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium mb-2">Alıcı Adres</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="col-span-2 rounded border border-border bg-background px-3 py-1.5 text-sm" placeholder="Adres" value={form.destination.address} onChange={(e) => setForm({ ...form, destination: { ...form.destination, address: e.target.value } })} required />
              <input className="rounded border border-border bg-background px-3 py-1.5 text-sm" placeholder="Şehir" value={form.destination.city} onChange={(e) => setForm({ ...form, destination: { ...form.destination, city: e.target.value } })} required />
              <input className="rounded border border-border bg-background px-3 py-1.5 text-sm" placeholder="Posta Kodu" value={form.destination.postalCode} onChange={(e) => setForm({ ...form, destination: { ...form.destination, postalCode: e.target.value } })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Ağırlık (kg)</label>
              <input type="number" step="0.001" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Kargo Ücreti</label>
              <input type="number" step="0.01" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.shippingCost} onChange={(e) => setForm({ ...form, shippingCost: e.target.value })} />
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

export default function ShipmentsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments', statusFilter],
    queryFn: () => api.get('/api/v1/logistics/shipments', statusFilter ? { status: statusFilter } : undefined),
  });

  const { data: stats } = useQuery({
    queryKey: ['shipments', 'stats'],
    queryFn: () => api.get('/api/v1/logistics/shipments/stats'),
  });

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/v1/logistics/shipments', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipments'] }); setShowForm(false); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/api/v1/logistics/shipments/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shipments'] }),
  });

  const s = stats as ShipmentStats | undefined;
  const NEXT_STATUS: Record<string, string> = { pending: 'picked_up', picked_up: 'in_transit', in_transit: 'out_for_delivery', out_for_delivery: 'delivered' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sevkiyat Takibi</h1>
          <p className="text-muted-foreground mt-1">Lojistik süreçlerini yönetin</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
          <PlusCircle className="h-4 w-4" />Yeni Sevkiyat
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam', value: s?.total ?? 0, icon: Package },
          { label: 'Taşımada', value: s?.inTransit ?? 0, icon: Truck },
          { label: 'Beklemede', value: s?.pending ?? 0, icon: Clock },
          { label: 'Toplam Maliyet', value: formatCurrency(s?.totalCost ?? 0), icon: Package },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-xl font-bold mt-0.5">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'Tümü' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map((f) => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Shipment Cards */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : (shipments as Shipment[]).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Truck className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Sevkiyat bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(shipments as Shipment[]).map((sh) => {
            const config = STATUS_CONFIG[sh.status];
            const Icon = config?.icon ?? Package;
            const nextStatus = NEXT_STATUS[sh.status];
            const isUpdating = updatingId === sh.id;
            return (
              <div key={sh.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold">{sh.trackingNumber}</span>
                      <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', config?.bg, config?.color)}>
                        <Icon className="h-3 w-3" />{config?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {(sh.origin as Record<string, string>).city} → {(sh.destination as Record<string, string>).city}
                      </span>
                      {sh.carrier && <span>{sh.carrier}</span>}
                      {sh.customer && <span>{sh.customer.name}</span>}
                    </div>
                    {sh.estimatedDelivery && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tahmini: {new Date(sh.estimatedDelivery).toLocaleDateString('tr-TR')}
                        {sh.actualDelivery && ` • Teslim: ${new Date(sh.actualDelivery).toLocaleDateString('tr-TR')}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatCurrency(Number(sh.shippingCost))}</span>
                    {nextStatus && (
                      <button
                        onClick={() => { setUpdatingId(sh.id); updateStatus.mutate({ id: sh.id, status: nextStatus }, { onSettled: () => setUpdatingId(null) }); }}
                        disabled={isUpdating}
                        className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                      >
                        {STATUS_CONFIG[nextStatus]?.label ?? nextStatus} →
                      </button>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                {sh.events && sh.events.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {sh.events.slice(-4).map((ev, i) => {
                        const evConfig = STATUS_CONFIG[ev.status];
                        const EvIcon = evConfig?.icon ?? Clock;
                        return (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                            {i > 0 && <span>→</span>}
                            <EvIcon className={cn('h-3 w-3', evConfig?.color)} />
                            <span>{evConfig?.label ?? ev.status}</span>
                            {ev.location && <span className="text-muted-foreground/60">({ev.location})</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && <NewShipmentModal onClose={() => setShowForm(false)} onSave={(d) => create.mutate(d)} />}
    </div>
  );
}
