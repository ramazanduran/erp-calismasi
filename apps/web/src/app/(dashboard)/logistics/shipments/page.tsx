'use client';

import { useState, useMemo } from 'react';
import {
  PlusCircle, Truck, Package, MapPin, CheckCircle2, Clock, XCircle,
  RotateCcw, ChevronDown, ChevronUp, Search, X, Loader2, TrendingUp,
  DollarSign, FileDown,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  pending: { label: 'Beklemede', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800', icon: Clock },
  picked_up: { label: 'Teslim Alındı', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Package },
  in_transit: { label: 'Taşımada', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Truck },
  out_for_delivery: { label: 'Dağıtımda', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: MapPin },
  delivered: { label: 'Teslim Edildi', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle2 },
  returned: { label: 'İade', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: RotateCcw },
  failed: { label: 'Başarısız', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
};

const STATUS_NEXT: Record<string, string | null> = {
  pending: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null,
  returned: null,
  failed: null,
};

const STATUS_NEXT_LABEL: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  pending: { label: 'Teslim Al', icon: Package, className: 'bg-blue-600 hover:bg-blue-700 text-white' },
  picked_up: { label: 'Yola Çıkar', icon: Truck, className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
  in_transit: { label: 'Dağıtıma Al', icon: MapPin, className: 'bg-orange-500 hover:bg-orange-600 text-white' },
  out_for_delivery: { label: 'Teslim Et', icon: CheckCircle2, className: 'bg-green-600 hover:bg-green-700 text-white' },
};

const CARRIERS = ['Aras', 'MNG', 'Yurtiçi', 'PTT', 'UPS', 'DHL', 'FedEx'];

const STATUS_TABS = [
  { value: '', label: 'Tümü' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'picked_up', label: 'Teslim Alındı' },
  { value: 'in_transit', label: 'Taşımada' },
  { value: 'out_for_delivery', label: 'Dağıtımda' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'returned', label: 'İade' },
  { value: 'failed', label: 'Başarısız' },
];

interface ShipmentEvent {
  status: string;
  location?: string;
  occurredAt: string;
  description?: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  carrier?: string;
  status: string;
  shippingCost: number | string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  origin: Record<string, string>;
  destination: Record<string, string>;
  customer?: { name: string } | null;
  order?: { orderNumber: string } | null;
  events?: ShipmentEvent[];
  _count?: { items: number; events: number };
}

interface ShipmentStats {
  total: number;
  byStatus: Record<string, number>;
  totalCost: number;
  inTransit: number;
  pending: number;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function TrackingTimeline({ shipmentId }: { shipmentId: string }) {
  const { data: detail, isLoading } = useQuery({
    queryKey: ['shipment-detail', shipmentId],
    queryFn: () => api.get(`/api/v1/logistics/shipments/${shipmentId}`),
  });

  const shipment = detail as Shipment | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const events: ShipmentEvent[] = shipment?.events ?? [];

  return (
    <div className="px-6 py-4 bg-muted/20 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Takip Geçmişi</p>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Henüz takip olayı yok</p>
      ) : (
        <div className="relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
          <div className="space-y-3">
            {[...events].reverse().map((ev, i) => {
              const cfg = STATUS_CONFIG[ev.status];
              const EvIcon = cfg?.icon ?? Clock;
              return (
                <div key={i} className="flex items-start gap-3 relative">
                  <div className={cn('flex-shrink-0 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center z-10', cfg?.bg ?? 'bg-gray-100')}>
                    <div className={cn('h-1.5 w-1.5 rounded-full', cfg?.color ? cfg.color.replace('text-', 'bg-') : 'bg-gray-400')} />
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2">
                      <EvIcon className={cn('h-3 w-3 flex-shrink-0', cfg?.color)} />
                      <span className={cn('text-xs font-medium', cfg?.color)}>{cfg?.label ?? ev.status}</span>
                      {ev.location && (
                        <span className="text-xs text-muted-foreground">— {ev.location}</span>
                      )}
                    </div>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {new Date(ev.occurredAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="flex items-start gap-3 relative">
              <div className="flex-shrink-0 h-4 w-4 rounded-full border-2 border-background bg-green-100 dark:bg-green-900/30 flex items-center justify-center z-10">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-green-600" />
                  <span className="text-xs font-medium text-green-600">Kaynak</span>
                  <span className="text-xs text-muted-foreground">— {shipment?.origin?.city}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center gap-6 text-xs text-muted-foreground">
        <span>
          <span className="font-medium">Çıkış:</span>{' '}
          {shipment?.origin?.city}, {shipment?.origin?.country}
        </span>
        <span>→</span>
        <span>
          <span className="font-medium">Varış:</span>{' '}
          {shipment?.destination?.city}, {shipment?.destination?.country}
        </span>
      </div>
    </div>
  );
}

function NewShipmentModal({ onClose, onSave, isSaving }: {
  onClose: () => void;
  onSave: (d: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    carrier: '',
    trackingNumber: '',
    autoTracking: true,
    weight: '',
    shippingCost: '0',
    estimatedDelivery: '',
    origin: { address: '', city: 'İstanbul', country: 'Türkiye', postalCode: '' },
    destination: { address: '', city: '', country: 'Türkiye', postalCode: '' },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      carrier: form.carrier || undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      shippingCost: Number(form.shippingCost),
      estimatedDelivery: form.estimatedDelivery || undefined,
      origin: form.origin,
      destination: form.destination,
    };
    if (!form.autoTracking && form.trackingNumber) {
      payload.trackingNumber = form.trackingNumber;
    }
    onSave(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Yeni Sevkiyat</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Kargo Şirketi</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={form.carrier}
                onChange={(e) => setForm({ ...form, carrier: e.target.value })}
              >
                <option value="">Seçiniz...</option>
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Tahmini Teslimat</label>
              <input
                type="date"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={form.estimatedDelivery}
                onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-medium">Takip Numarası</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, autoTracking: !form.autoTracking, trackingNumber: '' })}
                className="text-xs text-primary underline"
              >
                {form.autoTracking ? 'Manuel gir' : 'Otomatik oluştur'}
              </button>
            </div>
            {form.autoTracking ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Sistem tarafından otomatik oluşturulacak
              </div>
            ) : (
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                placeholder="TRK-XXXXXXXXXX"
                value={form.trackingNumber}
                onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
              />
            )}
          </div>

          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-sm font-medium">Gönderen Adres</p>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Adres"
              value={form.origin.address}
              onChange={(e) => setForm({ ...form, origin: { ...form.origin, address: e.target.value } })}
              required
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                className="col-span-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Şehir"
                value={form.origin.city}
                onChange={(e) => setForm({ ...form, origin: { ...form.origin, city: e.target.value } })}
              />
              <input
                className="col-span-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Posta Kodu"
                value={form.origin.postalCode}
                onChange={(e) => setForm({ ...form, origin: { ...form.origin, postalCode: e.target.value } })}
              />
              <input
                className="col-span-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ülke"
                value={form.origin.country}
                onChange={(e) => setForm({ ...form, origin: { ...form.origin, country: e.target.value } })}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-sm font-medium">Alıcı Adres</p>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Adres"
              value={form.destination.address}
              onChange={(e) => setForm({ ...form, destination: { ...form.destination, address: e.target.value } })}
              required
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                className="col-span-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Şehir"
                value={form.destination.city}
                onChange={(e) => setForm({ ...form, destination: { ...form.destination, city: e.target.value } })}
                required
              />
              <input
                className="col-span-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Posta Kodu"
                value={form.destination.postalCode}
                onChange={(e) => setForm({ ...form, destination: { ...form.destination, postalCode: e.target.value } })}
              />
              <input
                className="col-span-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ülke"
                value={form.destination.country}
                onChange={(e) => setForm({ ...form, destination: { ...form.destination, country: e.target.value } })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Ağırlık (kg)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="0.000"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Kargo Ücreti (₺)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="0.00"
                value={form.shippingCost}
                onChange={(e) => setForm({ ...form, shippingCost: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ShipmentsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const queryParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (statusFilter) p.status = statusFilter;
    if (carrierFilter) p.carrier = carrierFilter;
    if (search) p.search = search;
    return p;
  }, [statusFilter, carrierFilter, search]);

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments', queryParams],
    queryFn: () => api.get('/api/v1/logistics/shipments', Object.keys(queryParams).length ? queryParams : undefined),
  });

  const { data: stats } = useQuery({
    queryKey: ['shipments', 'stats'],
    queryFn: () => api.get('/api/v1/logistics/shipments/stats'),
  });

  const s = stats as ShipmentStats | undefined;
  const shipmentList = shipments as Shipment[];

  const totalVisibleCost = useMemo(
    () => shipmentList.reduce((sum, sh) => sum + Number(sh.shippingCost ?? 0), 0),
    [shipmentList],
  );

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    shipmentList.forEach((sh) => {
      counts[sh.status] = (counts[sh.status] ?? 0) + 1;
    });
    return counts;
  }, [shipmentList]);

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/v1/logistics/shipments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      setShowForm(false);
      toast.success('Sevkiyat başarıyla oluşturuldu');
    },
    onError: () => toast.error('Sevkiyat oluşturulamadı'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/v1/logistics/shipments/${id}/status`, { status }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['shipment-detail', vars.id] });
      const nextCfg = STATUS_CONFIG[vars.status];
      toast.success(`Durum güncellendi: ${nextCfg?.label ?? vars.status}`);
    },
    onError: () => toast.error('Durum güncellenemedi'),
    onSettled: (_d, _e, vars) => {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(vars.id);
        return next;
      });
    },
  });

  function handleStatusUpdate(id: string, nextStatus: string) {
    setUpdatingIds((prev) => new Set(prev).add(id));
    updateStatus.mutate({ id, status: nextStatus });
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sevkiyat Takibi</h1>
          <p className="text-muted-foreground mt-1 text-sm">Lojistik süreçlerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              (shipments as Shipment[]).map((sh) => ({
                trackingNumber: sh.trackingNumber,
                carrier: sh.carrier ?? '',
                status: STATUS_CONFIG[sh.status]?.label ?? sh.status,
                customer: sh.customer?.name ?? '',
                orderNumber: sh.order?.orderNumber ?? '',
                origin: [sh.origin?.city, sh.origin?.country].filter(Boolean).join(', '),
                destination: [sh.destination?.city, sh.destination?.country].filter(Boolean).join(', '),
                shippingCost: Number(sh.shippingCost),
                estimatedDelivery: sh.estimatedDelivery ? new Date(sh.estimatedDelivery).toLocaleDateString('tr-TR') : '',
                actualDelivery: sh.actualDelivery ? new Date(sh.actualDelivery).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'trackingNumber', header: 'Takip No', width: 16 },
                { key: 'carrier', header: 'Taşıyıcı', width: 14 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'customer', header: 'Müşteri', width: 22 },
                { key: 'orderNumber', header: 'Sipariş No', width: 14 },
                { key: 'origin', header: 'Çıkış', width: 18 },
                { key: 'destination', header: 'Varış', width: 18 },
                { key: 'shippingCost', header: 'Kargo Ücreti', width: 14 },
                { key: 'estimatedDelivery', header: 'Tahmini Teslimat', width: 16 },
                { key: 'actualDelivery', header: 'Fiili Teslimat', width: 14 },
              ],
              'sevkiyatlar',
              'Sevkiyatlar'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Yeni Sevkiyat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Toplam Sevkiyat</p>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{s?.total ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Tüm kayıtlar</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Taşımada</p>
            <div className="h-8 w-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Truck className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{s?.inTransit ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Aktif taşıma</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Teslim Bekleyen</p>
            <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">
            {(s?.pending ?? 0) + (s?.byStatus?.picked_up ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Beklemede + Teslim alındı</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Toplam Maliyet</p>
            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(s?.totalCost ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">Kümülatif tutar</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const count = tab.value === '' ? shipmentList.length : (byStatus[tab.value] ?? 0);
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === tab.value
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-muted',
                )}
              >
                {tab.label}
                {!isLoading && (
                  <span className={cn(
                    'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-xs',
                    statusFilter === tab.value
                      ? 'bg-white/20 text-white'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Tüm Kargolar</option>
            {CARRIERS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Takip no veya müşteri..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">İzleme No</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Müşteri</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sipariş</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kargo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Çıkış → Varış</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Tahmini Teslimat</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Maliyet</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : shipmentList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-muted-foreground">
                    <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Sevkiyat bulunamadı</p>
                    <p className="text-xs mt-1">Filtre kriterlerini değiştirmeyi deneyin</p>
                  </td>
                </tr>
              ) : (
                shipmentList.map((sh) => {
                  const config = STATUS_CONFIG[sh.status];
                  const Icon = config?.icon ?? Package;
                  const nextStatus = STATUS_NEXT[sh.status];
                  const nextAction = nextStatus ? STATUS_NEXT_LABEL[sh.status] : null;
                  const isUpdating = updatingIds.has(sh.id);
                  const isExpanded = expandedId === sh.id;

                  const now = new Date();
                  const estDate = sh.estimatedDelivery ? new Date(sh.estimatedDelivery) : null;
                  const isPastDue = estDate && estDate < now && sh.status !== 'delivered';

                  return (
                    <>
                      <tr
                        key={sh.id}
                        className={cn(
                          'border-b border-border transition-colors hover:bg-muted/30',
                          isExpanded && 'bg-muted/20',
                        )}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleExpand(sh.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-semibold">{sh.trackingNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          {sh.customer ? (
                            <span className="text-sm">{sh.customer.name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {sh.order ? (
                            <span className="text-xs font-mono text-muted-foreground">{sh.order.orderNumber}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {sh.carrier ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                              {sh.carrier}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-muted-foreground">{sh.origin?.city ?? '—'}</span>
                            <span className="text-muted-foreground/50">→</span>
                            <span className="font-medium">{sh.destination?.city ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {estDate ? (
                            <span className={cn('text-sm', isPastDue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                              {estDate.toLocaleDateString('tr-TR')}
                              {isPastDue && <span className="ml-1 text-xs">(gecikti)</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-semibold">{formatCurrency(Number(sh.shippingCost ?? 0))}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            config?.bg,
                            config?.color,
                          )}>
                            <Icon className="h-3 w-3" />
                            {config?.label ?? sh.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {nextAction && nextStatus ? (
                            <button
                              onClick={() => handleStatusUpdate(sh.id, nextStatus)}
                              disabled={isUpdating}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50',
                                nextAction.className,
                              )}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <nextAction.icon className="h-3.5 w-3.5" />
                              )}
                              {nextAction.label}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${sh.id}-expand`} className="border-b border-border">
                          <td colSpan={10} className="p-0">
                            <TrackingTimeline shipmentId={sh.id} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && shipmentList.length > 0 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{shipmentList.length}</span> sevkiyat gösteriliyor
            </span>
            <span>
              Görünen toplam kargo maliyeti:{' '}
              <span className="font-semibold text-foreground">{formatCurrency(totalVisibleCost)}</span>
            </span>
          </div>
        )}
      </div>

      {showForm && (
        <NewShipmentModal
          onClose={() => setShowForm(false)}
          onSave={(d) => create.mutate(d)}
          isSaving={create.isPending}
        />
      )}
    </div>
  );
}
