'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Download, X, MapPin, Truck, Clock,
  CheckCircle2, AlertCircle, Package, Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

type RouteStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface DeliveryStop {
  order: number;
  address: string;
  customerName: string;
  estimatedTime: string;
  deliveryCount: number;
  status: 'pending' | 'delivered' | 'failed';
}

interface Route {
  id: string;
  routeCode: string;
  vehiclePlate: string;
  driverName: string;
  date: string;
  startTime: string;
  estimatedEndTime: string;
  actualEndTime?: string;
  status: RouteStatus;
  priority: Priority;
  totalStops: number;
  completedStops: number;
  totalDistance: number;
  totalWeight: number;
  stops: DeliveryStop[];
  notes?: string;
}

const STATUS_LABELS: Record<RouteStatus, string> = {
  planned: 'Planlandı',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<RouteStatus, string> = {
  planned: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Düşük', normal: 'Normal', high: 'Yüksek', urgent: 'Acil',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const MOCK_ROUTES: Route[] = [
  {
    id: '1', routeCode: 'RT-2026-042', vehiclePlate: '34 AKB 451', driverName: 'Hasan Öztürk',
    date: '2026-05-27', startTime: '08:00', estimatedEndTime: '17:00',
    status: 'in_progress', priority: 'normal', totalStops: 8, completedStops: 4,
    totalDistance: 185, totalWeight: 2400,
    stops: [
      { order: 1, address: 'Kadıköy, İstanbul', customerName: 'Akın Tekstil', estimatedTime: '09:00', deliveryCount: 3, status: 'delivered' },
      { order: 2, address: 'Ümraniye, İstanbul', customerName: 'Star Gıda', estimatedTime: '10:15', deliveryCount: 5, status: 'delivered' },
      { order: 3, address: 'Maltepe, İstanbul', customerName: 'Kaya Makina', estimatedTime: '11:30', deliveryCount: 2, status: 'delivered' },
      { order: 4, address: 'Kartal, İstanbul', customerName: 'Güven Lojistik', estimatedTime: '12:45', deliveryCount: 4, status: 'delivered' },
      { order: 5, address: 'Gebze, Kocaeli', customerName: 'Eksen Yazılım', estimatedTime: '14:00', deliveryCount: 1, status: 'pending' },
      { order: 6, address: 'Darıca, Kocaeli', customerName: 'Mavi Deniz', estimatedTime: '14:45', deliveryCount: 2, status: 'pending' },
      { order: 7, address: 'Izmit, Kocaeli', customerName: 'Türk Metal', estimatedTime: '15:30', deliveryCount: 3, status: 'pending' },
      { order: 8, address: 'Körfez, Kocaeli', customerName: 'Atlas Depo', estimatedTime: '16:30', deliveryCount: 6, status: 'pending' },
    ],
  },
  {
    id: '2', routeCode: 'RT-2026-041', vehiclePlate: '34 MSK 724', driverName: 'Murat Demir',
    date: '2026-05-27', startTime: '07:30', estimatedEndTime: '16:30', actualEndTime: '16:15',
    status: 'completed', priority: 'high', totalStops: 6, completedStops: 6,
    totalDistance: 142, totalWeight: 1850,
    stops: [
      { order: 1, address: 'Beylikdüzü, İstanbul', customerName: 'Akel Market', estimatedTime: '09:00', deliveryCount: 8, status: 'delivered' },
      { order: 2, address: 'Esenyurt, İstanbul', customerName: 'Mega Store', estimatedTime: '10:00', deliveryCount: 6, status: 'delivered' },
      { order: 3, address: 'Avcılar, İstanbul', customerName: 'Mini Pazar', estimatedTime: '11:00', deliveryCount: 4, status: 'delivered' },
      { order: 4, address: 'Küçükçekmece, İstanbul', customerName: 'Sefa Market', estimatedTime: '12:30', deliveryCount: 5, status: 'delivered' },
      { order: 5, address: 'Bağcılar, İstanbul', customerName: 'Uzun Market', estimatedTime: '13:30', deliveryCount: 3, status: 'delivered' },
      { order: 6, address: 'Güngören, İstanbul', customerName: 'Park Market', estimatedTime: '14:30', deliveryCount: 7, status: 'delivered' },
    ],
  },
  {
    id: '3', routeCode: 'RT-2026-043', vehiclePlate: '34 PRT 892', driverName: 'Elif Yıldız',
    date: '2026-05-28', startTime: '08:30', estimatedEndTime: '17:30',
    status: 'planned', priority: 'urgent', totalStops: 5, completedStops: 0,
    totalDistance: 210, totalWeight: 3100,
    stops: [
      { order: 1, address: 'Tuzla, İstanbul', customerName: 'Deniz Sanayi', estimatedTime: '09:30', deliveryCount: 10, status: 'pending' },
      { order: 2, address: 'Pendik, İstanbul', customerName: 'Yıldız Fabrika', estimatedTime: '11:00', deliveryCount: 8, status: 'pending' },
      { order: 3, address: 'Samandıra, İstanbul', customerName: 'Güç Makina', estimatedTime: '12:30', deliveryCount: 5, status: 'pending' },
      { order: 4, address: 'Sancaktepe, İstanbul', customerName: 'Atlas Üretim', estimatedTime: '14:00', deliveryCount: 4, status: 'pending' },
      { order: 5, address: 'Sultanbeyli, İstanbul', customerName: 'Zirve Ltd.', estimatedTime: '15:30', deliveryCount: 3, status: 'pending' },
    ],
  },
];

interface NewRouteModalProps {
  onClose: () => void;
  onSave: (d: Partial<Route>) => void;
}

function NewRouteModal({ onClose, onSave }: NewRouteModalProps) {
  const [form, setForm] = useState({
    vehiclePlate: '', driverName: '', date: '', startTime: '', priority: 'normal' as Priority, notes: '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Yeni Rota</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Araç Plakası</label>
              <input type="text" value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sürücü</label>
              <input type="text" value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tarih</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Başlangıç Saati</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Öncelik</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notlar</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">İptal</button>
          <button onClick={() => { onSave(form); onClose(); }}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Oluştur</button>
        </div>
      </div>
    </div>
  );
}

export default function RoutesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RouteStatus | 'all'>('all');
  const [showNew, setShowNew] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const { data: routes = MOCK_ROUTES } = useQuery<Route[]>({
    queryKey: ['logistics-routes'],
    queryFn: async () => {
      const res = await fetch('/api/v1/logistics/routes');
      if (!res.ok) return MOCK_ROUTES;
      return res.json();
    },
    initialData: MOCK_ROUTES,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Route>) => {
      const res = await fetch('/api/v1/logistics/routes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['logistics-routes'] }),
  });

  const filtered = useMemo(() => {
    let list = routes;
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.routeCode.toLowerCase().includes(q) || r.vehiclePlate.toLowerCase().includes(q) || r.driverName.toLowerCase().includes(q));
    }
    return list;
  }, [routes, statusFilter, search]);

  const stats = useMemo(() => ({
    active: routes.filter((r) => r.status === 'in_progress').length,
    planned: routes.filter((r) => r.status === 'planned').length,
    completed: routes.filter((r) => r.status === 'completed').length,
    totalDeliveries: routes.reduce((s, r) => s + r.totalStops, 0),
  }), [routes]);

  const handleExport = () => {
    const rows = filtered.map((r) => ({
      'Rota Kodu': r.routeCode,
      'Araç': r.vehiclePlate,
      'Sürücü': r.driverName,
      'Tarih': r.date,
      'Başlangıç': r.startTime,
      'Durum': STATUS_LABELS[r.status],
      'Toplam Durak': r.totalStops,
      'Tamamlanan': r.completedStops,
      'Mesafe (km)': r.totalDistance,
      'Ağırlık (kg)': r.totalWeight,
    }));
    exportToExcel(rows, 'rotalar', 'Rotalar');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rota Planlama</h1>
          <p className="text-muted-foreground">Araç rota atamaları, durak yönetimi ve teslimat takibi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Yeni Rota
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Navigation className="h-4 w-4 text-blue-600" /><p className="text-sm text-blue-700">Aktif Rota</p></div>
          <p className="text-2xl font-bold text-blue-700">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Planlanan</p>
          <p className="text-2xl font-bold">{stats.planned}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-sm text-green-700">Tamamlanan</p>
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Toplam Durak</p></div>
          <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Rota, araç, sürücü ara..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
        </div>
        <div className="flex gap-1">
          {(['all', ...Object.keys(STATUS_LABELS)] as Array<RouteStatus | 'all'>).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('rounded-full px-3 py-1 text-sm font-medium transition-colors',
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
              {s === 'all' ? 'Tümü' : STATUS_LABELS[s as RouteStatus]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((route) => {
          const progress = route.totalStops > 0 ? Math.round((route.completedStops / route.totalStops) * 100) : 0;
          const isExpanded = expandedRoute === route.id;
          return (
            <div key={route.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{route.routeCode}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[route.status])}>
                          {STATUS_LABELS[route.status]}
                        </span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_COLORS[route.priority])}>
                          {PRIORITY_LABELS[route.priority]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{route.vehiclePlate} · {route.driverName} · {new Date(route.date).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{route.totalStops} durak</span>
                    <span className="flex items-center gap-1"><Navigation className="h-4 w-4" />{route.totalDistance} km</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{route.startTime} – {route.estimatedEndTime}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className={cn('h-2 rounded-full transition-all',
                      progress === 100 ? 'bg-green-500' : 'bg-primary')} style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">{route.completedStops}/{route.totalStops} teslim (%{progress})</span>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-muted/20 p-4">
                  <p className="text-sm font-semibold mb-3">Durak Listesi</p>
                  <div className="space-y-2">
                    {route.stops.map((stop) => (
                      <div key={stop.order} className="flex items-center gap-3 text-sm">
                        <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0',
                          stop.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          stop.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground')}>
                          {stop.order}
                        </span>
                        {stop.status === 'delivered'
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          : stop.status === 'failed'
                          ? <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground shrink-0" />
                        }
                        <span className={cn('font-medium', stop.status === 'delivered' && 'text-muted-foreground line-through')}>
                          {stop.customerName}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />{stop.address}
                        </span>
                        <span className="text-muted-foreground ml-auto">{stop.estimatedTime}</span>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs">{stop.deliveryCount} koliye</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showNew && <NewRouteModal onClose={() => setShowNew(false)} onSave={(d) => createMutation.mutate(d)} />}
    </div>
  );
}
