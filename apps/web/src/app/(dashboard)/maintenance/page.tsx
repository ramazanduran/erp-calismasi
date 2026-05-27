'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, Wrench, AlertTriangle, Clock, CheckCircle2, MessageSquare, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: 'Düşük',   color: 'text-gray-600',   bg: 'bg-gray-100' },
  medium:   { label: 'Orta',    color: 'text-blue-600',   bg: 'bg-blue-100' },
  high:     { label: 'Yüksek',  color: 'text-orange-600', bg: 'bg-orange-100' },
  critical: { label: 'Kritik',  color: 'text-red-600',    bg: 'bg-red-100' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Açık',        color: 'text-blue-600',   bg: 'bg-blue-100' },
  assigned:    { label: 'Atandı',      color: 'text-purple-600', bg: 'bg-purple-100' },
  in_progress: { label: 'Devam Ediyor', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  on_hold:     { label: 'Beklemede',   color: 'text-gray-600',   bg: 'bg-gray-100' },
  completed:   { label: 'Tamamlandı',  color: 'text-green-600',  bg: 'bg-green-100' },
  cancelled:   { label: 'İptal',       color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const CATEGORY_LABELS: Record<string, string> = {
  electrical: 'Elektrik', plumbing: 'Tesisat', hvac: 'HVAC', it: 'BT',
  furniture: 'Mobilya', vehicle: 'Araç', equipment: 'Ekipman', general: 'Genel',
};

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  location?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  requestedBy?: { firstName: string; lastName: string } | null;
  assignedTo?: { firstName: string; lastName: string } | null;
  asset?: { name: string; code: string } | null;
  _count?: { comments: number };
}

interface Stats {
  total: number;
  open: number;
  critical: number;
  avgResolutionHours: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

function NewRequestModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    title: '', category: 'general', priority: 'medium',
    location: '', description: '', estimatedCost: '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni Bakım İsteği</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, estimatedCost: form.estimatedCost ? +form.estimatedCost : undefined }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Başlık *</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Öncelik</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Lokasyon</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="ör. 3. Kat, Toplantı Odası B" />
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Tahmini Maliyet (₺)</label>
            <input type="number" step="0.01" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} />
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

function RequestDetailModal({ request, onClose }: { request: MaintenanceRequest; onClose: () => void }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState('');

  const { data } = useQuery({
    queryKey: ['maintenance', 'detail', request.id],
    queryFn: () => api.get(`/api/v1/maintenance/${request.id}`),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.put(`/api/v1/maintenance/${request.id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); },
  });

  const addComment = useMutation({
    mutationFn: (content: string) => api.post(`/api/v1/maintenance/${request.id}/comments`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance', 'detail', request.id] }); setComment(''); },
  });

  const detail = data as any;
  const NEXT_STATUS: Record<string, string> = { open: 'in_progress', in_progress: 'completed' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-mono">{request.requestNumber}</p>
            <h2 className="text-lg font-semibold">{request.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {NEXT_STATUS[request.status] && (
              <button onClick={() => updateStatus.mutate(NEXT_STATUS[request.status])}
                className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg">
                {STATUS_CONFIG[NEXT_STATUS[request.status]]?.label}
              </button>
            )}
            <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded-lg">Kapat</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Kategori</p>
            <p className="font-medium">{CATEGORY_LABELS[request.category] ?? request.category}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lokasyon</p>
            <p className="font-medium">{request.location ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Talep Eden</p>
            <p className="font-medium">{request.requestedBy ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}` : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Atanan</p>
            <p className="font-medium">{request.assignedTo ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}` : 'Atanmadı'}</p>
          </div>
        </div>

        {/* Comments */}
        <div>
          <p className="text-sm font-medium mb-2">Yorumlar ({detail?.comments?.length ?? 0})</p>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {(detail?.comments ?? []).map((c: any) => (
              <div key={c.id} className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-xs font-medium">{c.author.firstName} {c.author.lastName}</p>
                <p className="text-sm">{c.content}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.createdAt).toLocaleString('tr-TR')}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm" placeholder="Yorum ekle..." value={comment} onChange={(e) => setComment(e.target.value)} />
            <button onClick={() => comment && addComment.mutate(comment)} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Gönder</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_REQUESTS: MaintenanceRequest[] = [
  { id: 'm1', requestNumber: 'BAK-2026-0041', title: 'CNC Tezgahı #3 Periyodik Bakım', category: 'equipment', priority: 'high', status: 'in_progress', location: 'Üretim Hattı - Zona 2', estimatedCost: 3500, scheduledDate: '2026-05-27', requestedBy: { firstName: 'Burak', lastName: 'Yıldız' }, assignedTo: { firstName: 'Murat', lastName: 'Şahin' }, asset: { name: 'CNC Tezgahı #3', code: 'CNC-03' }, _count: { comments: 2 } },
  { id: 'm2', requestNumber: 'BAK-2026-0042', title: 'Klima Sistemi Filtre Değişimi', category: 'hvac', priority: 'medium', status: 'open', location: 'Ofis Katı - 2. Kat', estimatedCost: 800, scheduledDate: '2026-05-30', requestedBy: { firstName: 'Selin', lastName: 'Arslan' }, assignedTo: null, asset: null, _count: { comments: 0 } },
  { id: 'm3', requestNumber: 'BAK-2026-0043', title: 'Kompresör Yağ Sızıntısı', category: 'equipment', priority: 'critical', status: 'assigned', location: 'Makine Dairesi', estimatedCost: 2200, requestedBy: { firstName: 'Emre', lastName: 'Güler' }, assignedTo: { firstName: 'Burak', lastName: 'Yıldız' }, asset: { name: 'Hava Kompresörü', code: 'KMP-001' }, _count: { comments: 3 } },
  { id: 'm4', requestNumber: 'BAK-2026-0044', title: 'Elektrik Panosu Gözden Geçirme', category: 'electrical', priority: 'high', status: 'open', location: 'Elektrik Odası - A Blok', estimatedCost: 1500, requestedBy: { firstName: 'Cem', lastName: 'Kaya' }, assignedTo: null, asset: null, _count: { comments: 1 } },
  { id: 'm5', requestNumber: 'BAK-2026-0039', title: 'Forklift #2 Bakım', category: 'vehicle', priority: 'medium', status: 'completed', location: 'Depo', estimatedCost: 4500, actualCost: 4200, scheduledDate: '2026-05-20', completedAt: '2026-05-22', requestedBy: { firstName: 'Nil', lastName: 'Şen' }, assignedTo: { firstName: 'Murat', lastName: 'Şahin' }, asset: { name: 'Forklift #2', code: 'FLT-02' }, _count: { comments: 4 } },
  { id: 'm6', requestNumber: 'BAK-2026-0045', title: 'Tuvalet Sızıntı Tamiri', category: 'plumbing', priority: 'low', status: 'open', location: 'Personel Tuvaleti - Zemin Kat', estimatedCost: 350, requestedBy: { firstName: 'Kemal', lastName: 'Acar' }, assignedTo: null, asset: null, _count: { comments: 0 } },
  { id: 'm7', requestNumber: 'BAK-2026-0040', title: 'Server Odası UPS Değişimi', category: 'it', priority: 'critical', status: 'completed', location: 'Server Odası', estimatedCost: 8500, actualCost: 8800, completedAt: '2026-05-15', requestedBy: { firstName: 'Dilek', lastName: 'Yılmaz' }, assignedTo: { firstName: 'Burak', lastName: 'Yıldız' }, asset: { name: 'UPS Sistemi', code: 'UPS-001' }, _count: { comments: 5 } },
];

const MOCK_STATS: Stats = {
  total: MOCK_REQUESTS.length,
  open: MOCK_REQUESTS.filter((r) => r.status === 'open' || r.status === 'assigned').length,
  critical: MOCK_REQUESTS.filter((r) => r.priority === 'critical').length,
  avgResolutionHours: 48,
  byStatus: MOCK_REQUESTS.reduce<Record<string, number>>((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {}),
  byPriority: MOCK_REQUESTS.reduce<Record<string, number>>((acc, r) => { acc[r.priority] = (acc[r.priority] ?? 0) + 1; return acc; }, {}),
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>(MOCK_REQUESTS);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detailRequest, setDetailRequest] = useState<MaintenanceRequest | null>(null);

  const isLoading = false;

  const stats: Stats = useMemo(() => ({
    total: requests.length,
    open: requests.filter((r) => r.status === 'open' || r.status === 'assigned').length,
    critical: requests.filter((r) => r.priority === 'critical').length,
    avgResolutionHours: 48,
    byStatus: requests.reduce<Record<string, number>>((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {}),
    byPriority: requests.reduce<Record<string, number>>((acc, r) => { acc[r.priority] = (acc[r.priority] ?? 0) + 1; return acc; }, {}),
  }), [requests]);

  const filteredRequests = useMemo(() => {
    if (!search) return requests;
    const q = search.toLowerCase();
    return requests.filter((r) =>
      r.requestNumber?.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.asset?.name?.toLowerCase().includes(q)
    );
  }, [requests, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bakım İstekleri</h1>
          <p className="text-muted-foreground mt-1">Tesis ve ekipman bakım yönetimi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filteredRequests.map((r) => ({
                requestNumber: r.requestNumber,
                title: r.title,
                category: CATEGORY_LABELS[r.category] ?? r.category,
                priority: PRIORITY_CONFIG[r.priority]?.label ?? r.priority,
                status: STATUS_CONFIG[r.status]?.label ?? r.status,
                location: r.location ?? '',
                asset: r.asset ? `${r.asset.code} - ${r.asset.name}` : '',
                requestedBy: r.requestedBy ? `${r.requestedBy.firstName} ${r.requestedBy.lastName}` : '',
                assignedTo: r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : '',
                estimatedCost: r.estimatedCost ?? '',
                actualCost: r.actualCost ?? '',
                scheduledDate: r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString('tr-TR') : '',
                completedAt: r.completedAt ? new Date(r.completedAt).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'requestNumber', header: 'İstek No', width: 12 },
                { key: 'title', header: 'Başlık', width: 28 },
                { key: 'category', header: 'Kategori', width: 14 },
                { key: 'priority', header: 'Öncelik', width: 10 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'location', header: 'Konum', width: 16 },
                { key: 'asset', header: 'Varlık', width: 20 },
                { key: 'requestedBy', header: 'İsteyen', width: 18 },
                { key: 'assignedTo', header: 'Sorumlu', width: 18 },
                { key: 'estimatedCost', header: 'Tahmini Maliyet', width: 16 },
                { key: 'actualCost', header: 'Gerçek Maliyet', width: 14 },
                { key: 'scheduledDate', header: 'Planlanan Tarih', width: 14 },
                { key: 'completedAt', header: 'Tamamlanma', width: 14 },
              ],
              'bakim-istekleri',
              'Bakım İstekleri'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Yeni İstek
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Toplam', value: stats.total, icon: Wrench },
            { label: 'Açık', value: stats.open, icon: Clock },
            { label: 'Kritik', value: stats.critical, icon: AlertTriangle },
            { label: 'Ort. Çözüm Süresi', value: `${stats.avgResolutionHours} saat`, icon: CheckCircle2 },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold mt-0.5">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="İstek no, başlık veya konum ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-60"
          />
        </div>
        <div className="flex gap-1">
          {[{ v: '', l: 'Tüm Durumlar' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm', statusFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
              {f.l}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[{ v: '', l: 'Tüm Öncelikler' }, ...Object.entries(PRIORITY_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
            <button key={f.v} onClick={() => setPriorityFilter(f.v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm', priorityFilter === f.v ? 'bg-secondary text-secondary-foreground' : 'border border-border hover:bg-muted')}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Requests */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Wrench className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Bakım isteği bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const pc = PRIORITY_CONFIG[req.priority];
            const sc = STATUS_CONFIG[req.status];
            return (
              <div key={req.id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailRequest(req)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{req.requestNumber}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', pc?.bg, pc?.color)}>{pc?.label}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', sc?.bg, sc?.color)}>{sc?.label}</span>
                    </div>
                    <p className="font-medium">{req.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{CATEGORY_LABELS[req.category] ?? req.category}</span>
                      {req.location && <span>📍 {req.location}</span>}
                      {req.requestedBy && <span>👤 {req.requestedBy.firstName} {req.requestedBy.lastName}</span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {req.assignedTo ? (
                      <p>{req.assignedTo.firstName} {req.assignedTo.lastName}</p>
                    ) : (
                      <p className="text-yellow-600">Atanmadı</p>
                    )}
                    {req._count?.comments ? (
                      <p className="flex items-center justify-end gap-1 mt-1">
                        <MessageSquare className="h-3 w-3" />{req._count.comments}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <NewRequestModal onClose={() => setShowForm(false)} onSave={(d) => { const newReq: MaintenanceRequest = { id: `m${Date.now()}`, requestNumber: `BAK-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`, ...d, status: 'open', _count: { comments: 0 } }; setRequests((prev) => [newReq, ...prev]); setShowForm(false); }} />}
      {detailRequest && <RequestDetailModal request={detailRequest} onClose={() => setDetailRequest(null)} />}
    </div>
  );
}
