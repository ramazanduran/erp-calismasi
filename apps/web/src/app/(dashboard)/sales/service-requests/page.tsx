'use client';

import { useState, useMemo } from 'react';
import {
  PlusCircle,
  Headphones,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileDown,
  Search,
  X,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn, formatDate } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  garanti:        'Garanti',
  teknik_destek:  'Teknik Destek',
  ariza:          'Arıza',
  kurulum:        'Kurulum',
  diger:          'Diğer',
};

const PRIORITY_LABELS: Record<string, string> = {
  dusuk:   'Düşük',
  orta:    'Orta',
  yuksek:  'Yüksek',
  kritik:  'Kritik',
};

const PRIORITY_COLORS: Record<string, string> = {
  dusuk:   'bg-gray-100 text-gray-600',
  orta:    'bg-blue-100 text-blue-700',
  yuksek:  'bg-orange-100 text-orange-700',
  kritik:  'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  acik:       'Açık',
  islemde:    'İşlemde',
  beklemede:  'Beklemede',
  cozumlendi: 'Çözümlendi',
  kapatildi:  'Kapatıldı',
};

const STATUS_COLORS: Record<string, string> = {
  acik:       'bg-blue-100 text-blue-700',
  islemde:    'bg-yellow-100 text-yellow-700',
  beklemede:  'bg-purple-100 text-purple-700',
  cozumlendi: 'bg-green-100 text-green-700',
  kapatildi:  'bg-gray-100 text-gray-600',
};

const TAB_FILTERS = [
  { v: '',           l: 'Tümü'       },
  { v: 'acik',       l: 'Açık'       },
  { v: 'islemde',    l: 'İşlemde'    },
  { v: 'beklemede',  l: 'Beklemede'  },
  { v: 'cozumlendi', l: 'Çözümlendi' },
  { v: 'kapatildi',  l: 'Kapatıldı'  },
];

interface ServiceRequest {
  id: string;
  requestNo: string;
  customerName: string;
  productSerialNo?: string;
  category?: string;
  priority?: string;
  status: string;
  createdAt: string;
  assignedTo?: string;
  description?: string;
}

interface ServiceStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

function NewRequestModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    customerName: '',
    productSerialNo: '',
    category: 'teknik_destek',
    priority: 'orta',
    description: '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Yeni Servis Talebi</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium">Müşteri Adı *</label>
            <input
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
              required
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="Müşteri adı veya şirket"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Ürün / Seri No</label>
            <input
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
              value={form.productSerialNo}
              onChange={(e) => setForm({ ...form, productSerialNo: e.target.value })}
              placeholder="Ürün adı veya seri numarası"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <select
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Öncelik</label>
              <select
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <textarea
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm resize-none"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Sorun veya talep hakkında ayrıntılı bilgi girin..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg"
            >
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const MOCK_SERVICE_REQUESTS: ServiceRequest[] = [
  { id: 'sr1', requestNo: 'SRV-2026-0001', customerName: 'ABC Ticaret A.Ş.', productSerialNo: 'SN-A100-001', category: 'ariza', priority: 'yuksek', status: 'islemde', createdAt: '2026-05-15T10:00:00Z', assignedTo: 'Emre Şahin', description: 'Cihaz açılmıyor, güç kaynağı arızası.' },
  { id: 'sr2', requestNo: 'SRV-2026-0002', customerName: 'XYZ Lojistik Ltd.', productSerialNo: 'SN-B200-005', category: 'garanti', priority: 'orta', status: 'acik', createdAt: '2026-05-18T14:00:00Z', description: 'Motor sesi yüksek, garanti kapsamında.' },
  { id: 'sr3', requestNo: 'SRV-2026-0003', customerName: 'Güneş Yapı A.Ş.', productSerialNo: 'SN-C300-012', category: 'teknik_destek', priority: 'dusuk', status: 'cozumlendi', createdAt: '2026-05-10T09:00:00Z', assignedTo: 'Ali Özcan', description: 'Yazılım güncelleme talep edildi.' },
  { id: 'sr4', requestNo: 'SRV-2026-0004', customerName: 'Demir Makine Ltd.', productSerialNo: 'SN-D400-003', category: 'kurulum', priority: 'kritik', status: 'beklemede', createdAt: '2026-05-20T11:30:00Z', description: 'Fabrika kurulumu için teknik ekip bekleniyor.' },
  { id: 'sr5', requestNo: 'SRV-2026-0005', customerName: 'Yıldız Tekstil A.Ş.', productSerialNo: undefined, category: 'diger', priority: 'orta', status: 'kapatildi', createdAt: '2026-05-05T08:00:00Z', assignedTo: 'Emre Şahin', description: 'Fatura konusunda bilgi talebi.' },
  { id: 'sr6', requestNo: 'SRV-2026-0006', customerName: 'Aksu Elektronik', productSerialNo: 'SN-E500-007', category: 'ariza', priority: 'yuksek', status: 'acik', createdAt: '2026-05-25T15:00:00Z', description: 'Ekran donuyor, yazılım kaynaklı olabilir.' },
];

const MOCK_SERVICE_STATS: ServiceStats = { total: 6, open: 2, inProgress: 1, resolved: 1 };

export default function ServiceRequestsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [localRequests, setLocalRequests] = useState<ServiceRequest[]>(MOCK_SERVICE_REQUESTS);

  const { data: statsData } = useQuery({
    queryKey: ['service-requests', 'stats'],
    queryFn: () => api.get('/api/v1/sales/service-requests/stats'),
  });

  const { data: rawRequests, isLoading: reqLoading } = useQuery({
    queryKey: ['service-requests'],
    queryFn: () => api.get('/api/v1/sales/service-requests'),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/sales/service-requests', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-requests'] });
      setShowForm(false);
    },
    onError: (_err, data) => {
      const newReq: ServiceRequest = {
        id: `local-${Date.now()}`,
        requestNo: `SRV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        customerName: data.customerName,
        productSerialNo: data.productSerialNo,
        category: data.category,
        priority: data.priority,
        status: 'acik',
        createdAt: new Date().toISOString(),
        description: data.description,
      };
      setLocalRequests((prev) => [newReq, ...prev]);
      setShowForm(false);
    },
  });

  const deleteRequest = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/sales/service-requests/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-requests'] });
    },
    onError: (_err, id) => {
      setLocalRequests((prev) => prev.filter((r) => r.id !== id));
    },
  });

  const apiRequests: ServiceRequest[] | null = rawRequests !== undefined ? (Array.isArray(rawRequests) ? (rawRequests as ServiceRequest[]) : []) : null;
  const isLoading = reqLoading && apiRequests === null;
  const stats = (statsData as ServiceStats | undefined) ?? MOCK_SERVICE_STATS;
  const allRequests = apiRequests ?? localRequests;

  const filtered = useMemo(() => {
    let list = allRequests;
    if (statusFilter) {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.requestNo?.toLowerCase().includes(q) ||
          r.customerName?.toLowerCase().includes(q) ||
          r.productSerialNo?.toLowerCase().includes(q) ||
          r.assignedTo?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allRequests, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Servis Talepleri</h1>
          <p className="text-muted-foreground mt-1">Satış sonrası servis ve destek taleplerinizi yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportToExcel(
                filtered.map((r) => ({
                  requestNo:      r.requestNo ?? '',
                  customerName:   r.customerName ?? '',
                  productSerialNo: r.productSerialNo ?? '',
                  category:       CATEGORY_LABELS[r.category ?? ''] ?? r.category ?? '',
                  priority:       PRIORITY_LABELS[r.priority ?? ''] ?? r.priority ?? '',
                  status:         STATUS_LABELS[r.status ?? ''] ?? r.status ?? '',
                  createdAt:      r.createdAt ? formatDate(r.createdAt) : '',
                  assignedTo:     r.assignedTo ?? '',
                })),
                [
                  { key: 'requestNo',       header: 'Talep No',        width: 14 },
                  { key: 'customerName',    header: 'Müşteri',          width: 24 },
                  { key: 'productSerialNo', header: 'Ürün / Seri No',   width: 22 },
                  { key: 'category',        header: 'Kategori',         width: 16 },
                  { key: 'priority',        header: 'Öncelik',          width: 12 },
                  { key: 'status',          header: 'Durum',            width: 14 },
                  { key: 'createdAt',       header: 'Oluşturma Tarihi', width: 16 },
                  { key: 'assignedTo',      header: 'Atanan',           width: 20 },
                ],
                'servis-talepleri',
                'Servis Talepleri'
              )
            }
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
          >
            <PlusCircle className="h-4 w-4" /> Yeni Talep
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Talep',  value: stats?.total ?? allRequests.length,                                             icon: Headphones    },
          { label: 'Açık Talepler', value: stats?.open ?? allRequests.filter((r) => r.status === 'acik').length,           icon: AlertTriangle },
          { label: 'İşlemdeki',     value: stats?.inProgress ?? allRequests.filter((r) => r.status === 'islemde').length,  icon: Clock         },
          { label: 'Çözümlendi',    value: stats?.resolved ?? allRequests.filter((r) => r.status === 'cozumlendi').length, icon: CheckCircle2  },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold mt-0.5">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Talep no, müşteri veya ürün ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
          />
        </div>
        {TAB_FILTERS.map((f) => (
          <button
            key={f.v}
            onClick={() => setStatusFilter(f.v)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              statusFilter === f.v
                ? 'bg-primary text-primary-foreground'
                : 'border border-border hover:bg-muted'
            )}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Headphones className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Servis talebi bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">
            Yeni bir talep oluşturmak için &quot;Yeni Talep&quot; butonunu kullanın.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Talep No</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Müşteri</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ürün / Seri No</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kategori</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Öncelik</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Oluşturma Tarihi</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atanan</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{req.requestNo}</td>
                    <td className="px-4 py-3">{req.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{req.productSerialNo ?? '-'}</td>
                    <td className="px-4 py-3">
                      {req.category ? (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                          {CATEGORY_LABELS[req.category] ?? req.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {req.priority ? (
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITY_COLORS[req.priority] ?? 'bg-gray-100 text-gray-600')}>
                          {PRIORITY_LABELS[req.priority] ?? req.priority}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-600')}>
                        {STATUS_LABELS[req.status] ?? req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {req.createdAt ? formatDate(req.createdAt) : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{req.assignedTo ?? '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteRequest.mutate(req.id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <NewRequestModal
          onClose={() => setShowForm(false)}
          onSave={(d) => create.mutate(d)}
        />
      )}
    </div>
  );
}
