'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, CheckSquare, XCircle, AlertTriangle, ClipboardList, Eye, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Beklemede',    color: 'text-gray-600',   bg: 'bg-gray-100' },
  in_progress: { label: 'Devam Ediyor', color: 'text-blue-600',   bg: 'bg-blue-100' },
  passed:      { label: 'Geçti',        color: 'text-green-600',  bg: 'bg-green-100' },
  failed:      { label: 'Başarısız',    color: 'text-red-600',    bg: 'bg-red-100' },
  conditional: { label: 'Koşullu',      color: 'text-yellow-600', bg: 'bg-yellow-100' },
};

const TYPE_LABELS: Record<string, string> = {
  incoming:   'Gelen Malzeme',
  in_process: 'Proses İçi',
  final:      'Final',
  supplier:   'Tedarikçi',
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: 'Kritik',    color: 'text-red-600' },
  major:    { label: 'Major',     color: 'text-orange-600' },
  minor:    { label: 'Minor',     color: 'text-yellow-600' },
  cosmetic: { label: 'Kozmetik',  color: 'text-gray-500' },
};

interface Inspection {
  id: string;
  inspectionNumber: string;
  type: string;
  status: string;
  passCount: number;
  failCount: number;
  scheduledAt?: string;
  completedAt?: string;
  product?: { name: string; code: string } | null;
  inspector?: { firstName: string; lastName: string } | null;
  _count?: { checkItems: number; defects: number };
}

interface Stats {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

interface InspectionDetail extends Inspection {
  checkItems: Array<{ id: string; criterion: string; checkType: string; result?: string; actualValue?: string; expectedValue?: string }>;
  defects: Array<{ id: string; title: string; severity: string; quantity: number; status: string; category?: string }>;
}

function NewInspectionModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({ type: 'incoming', status: 'pending', sampleSize: '', notes: '' });
  const [checkItems, setCheckItems] = useState([{ criterion: '', checkType: 'visual', expectedValue: '' }]);

  const addItem = () => setCheckItems([...checkItems, { criterion: '', checkType: 'visual', expectedValue: '' }]);
  const removeItem = (i: number) => setCheckItems(checkItems.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Yeni Kalite Muayenesi</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, sampleSize: form.sampleSize ? +form.sampleSize : undefined, checkItems }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Muayene Tipi</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Numune Boyutu</label>
              <input type="number" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.sampleSize} onChange={(e) => setForm({ ...form, sampleSize: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notlar</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Kontrol Kriterleri</label>
              <button type="button" onClick={addItem} className="text-xs text-primary hover:underline">+ Ekle</button>
            </div>
            <div className="space-y-2">
              {checkItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <input className="col-span-5 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Kriter" value={item.criterion} onChange={(e) => setCheckItems(checkItems.map((c, idx) => idx === i ? { ...c, criterion: e.target.value } : c))} required />
                  <select className="col-span-3 rounded border border-border bg-background px-2 py-1.5 text-sm" value={item.checkType} onChange={(e) => setCheckItems(checkItems.map((c, idx) => idx === i ? { ...c, checkType: e.target.value } : c))}>
                    <option value="visual">Görsel</option>
                    <option value="measurement">Ölçüm</option>
                    <option value="functional">Fonksiyonel</option>
                    <option value="document">Doküman</option>
                  </select>
                  <input className="col-span-3 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Beklenen değer" value={item.expectedValue} onChange={(e) => setCheckItems(checkItems.map((c, idx) => idx === i ? { ...c, expectedValue: e.target.value } : c))} />
                  <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-muted-foreground hover:text-destructive text-xs">✕</button>
                </div>
              ))}
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

function InspectionDetailModal({ inspection, onClose, onUpdate }: { inspection: InspectionDetail; onClose: () => void; onUpdate: () => void }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'checks' | 'defects'>('checks');
  const [defectForm, setDefectForm] = useState({ title: '', severity: 'minor', quantity: '1', category: '' });

  const updateItem = useMutation({
    mutationFn: ({ itemId, result, actualValue }: any) =>
      api.put(`/api/v1/quality-control/${inspection.id}/check-items/${itemId}`, { result, actualValue }),
    onSuccess: onUpdate,
  });

  const addDefect = useMutation({
    mutationFn: (data: any) => api.post(`/api/v1/quality-control/${inspection.id}/defects`, data),
    onSuccess: () => { onUpdate(); setDefectForm({ title: '', severity: 'minor', quantity: '1', category: '' }); },
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.put(`/api/v1/quality-control/${inspection.id}`, { status }),
    onSuccess: () => { onUpdate(); qc.invalidateQueries({ queryKey: ['quality-control'] }); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{inspection.inspectionNumber}</h2>
            <p className="text-sm text-muted-foreground">{TYPE_LABELS[inspection.type]}</p>
          </div>
          <div className="flex items-center gap-2">
            {(['passed', 'failed', 'conditional'] as const).map((s) => (
              <button key={s} onClick={() => updateStatus.mutate(s)}
                className={cn('text-xs px-3 py-1.5 rounded-lg border', inspection.status === s ? STATUS_CONFIG[s].bg + ' border-transparent ' + STATUS_CONFIG[s].color : 'border-border hover:bg-muted')}>
                {STATUS_CONFIG[s].label}
              </button>
            ))}
            <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded-lg">Kapat</button>
          </div>
        </div>

        <div className="flex gap-4 mb-4 border-b border-border">
          {([['checks', 'Kontroller'], ['defects', 'Hatalar']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('pb-2 text-sm font-medium', activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>
              {label} ({tab === 'checks' ? inspection.checkItems.length : inspection.defects.length})
            </button>
          ))}
        </div>

        {activeTab === 'checks' && (
          <div className="space-y-2">
            {inspection.checkItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.criterion}</p>
                  <p className="text-xs text-muted-foreground">{item.checkType} {item.expectedValue && `• Beklenen: ${item.expectedValue}`}</p>
                </div>
                <input className="w-28 rounded border border-border bg-background px-2 py-1 text-xs" placeholder="Gerçek değer" defaultValue={item.actualValue ?? ''} onBlur={(e) => { if (e.target.value !== item.actualValue) updateItem.mutate({ itemId: item.id, actualValue: e.target.value, result: item.result }); }} />
                <div className="flex gap-1">
                  {(['pass', 'fail', 'na'] as const).map((r) => (
                    <button key={r} onClick={() => updateItem.mutate({ itemId: item.id, result: r, actualValue: item.actualValue })}
                      className={cn('text-xs px-2 py-1 rounded', item.result === r ? (r === 'pass' ? 'bg-green-100 text-green-700' : r === 'fail' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600') : 'border border-border hover:bg-muted')}>
                      {r === 'pass' ? '✓' : r === 'fail' ? '✗' : 'N/A'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'defects' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <input className="col-span-2 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Hata başlığı" value={defectForm.title} onChange={(e) => setDefectForm({ ...defectForm, title: e.target.value })} />
              <select className="rounded border border-border bg-background px-2 py-1.5 text-sm" value={defectForm.severity} onChange={(e) => setDefectForm({ ...defectForm, severity: e.target.value })}>
                {Object.entries(SEVERITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
              <button onClick={() => defectForm.title && addDefect.mutate({ ...defectForm, quantity: +defectForm.quantity })}
                className="text-xs px-3 rounded bg-primary text-primary-foreground hover:bg-primary/90">Ekle</button>
            </div>
            {inspection.defects.map((d) => {
              const sev = SEVERITY_CONFIG[d.severity];
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <span className={cn('text-xs font-medium', sev?.color)}>[{sev?.label}]</span>
                  <div className="flex-1">
                    <p className="text-sm">{d.title}</p>
                    {d.category && <p className="text-xs text-muted-foreground">{d.category}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">x{d.quantity}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', d.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{d.status === 'resolved' ? 'Çözüldü' : 'Açık'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QualityControlPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ['quality-control', 'stats'],
    queryFn: () => api.get('/api/v1/quality-control/stats'),
  });

  const { data: inspectionsData, isLoading } = useQuery({
    queryKey: ['quality-control', 'list', statusFilter, typeFilter],
    queryFn: () => api.get('/api/v1/quality-control', {
      ...(statusFilter && { status: statusFilter }),
      ...(typeFilter && { type: typeFilter }),
    }),
  });

  const { data: detailData } = useQuery({
    queryKey: ['quality-control', 'detail', detailId],
    queryFn: () => api.get(`/api/v1/quality-control/${detailId}`),
    enabled: !!detailId,
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/quality-control', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quality-control'] }); setShowForm(false); },
  });

  const deleteInspection = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/quality-control/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quality-control'] }),
  });

  const stats = statsData as Stats | undefined;
  const inspections = ((inspectionsData as any)?.items ?? []) as Inspection[];
  const total = (inspectionsData as any)?.total ?? 0;

  const filteredInspections = useMemo(() => {
    if (!search) return inspections;
    const q = search.toLowerCase();
    return inspections.filter((i) =>
      i.inspectionNumber?.toLowerCase().includes(q) ||
      i.product?.name?.toLowerCase().includes(q) ||
      i.product?.code?.toLowerCase().includes(q) ||
      i.inspector?.toLowerCase().includes(q)
    );
  }, [inspections, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kalite Kontrol</h1>
          <p className="text-muted-foreground mt-1">Ürün ve süreç kalite muayeneleri</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filteredInspections.map((i) => ({
                inspectionNumber: i.inspectionNumber,
                type: TYPE_LABELS[i.type] ?? i.type,
                status: STATUS_CONFIG[i.status]?.label ?? i.status,
                productCode: i.product?.code ?? '',
                productName: i.product?.name ?? '',
                inspector: i.inspector ? `${i.inspector.firstName} ${i.inspector.lastName}` : '',
                passCount: i.passCount,
                failCount: i.failCount,
                checkItems: i._count?.checkItems ?? 0,
                defects: i._count?.defects ?? 0,
                scheduledAt: i.scheduledAt ? new Date(i.scheduledAt).toLocaleDateString('tr-TR') : '',
                completedAt: i.completedAt ? new Date(i.completedAt).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'inspectionNumber', header: 'Muayene No', width: 14 },
                { key: 'type', header: 'Tip', width: 16 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'productCode', header: 'Ürün Kodu', width: 12 },
                { key: 'productName', header: 'Ürün Adı', width: 26 },
                { key: 'inspector', header: 'Muayene Eden', width: 20 },
                { key: 'passCount', header: 'Geçen', width: 10 },
                { key: 'failCount', header: 'Başarısız', width: 10 },
                { key: 'checkItems', header: 'Kontrol', width: 10 },
                { key: 'defects', header: 'Hata', width: 10 },
                { key: 'scheduledAt', header: 'Planlanan', width: 12 },
                { key: 'completedAt', header: 'Tamamlanan', width: 12 },
              ],
              'kalite-kontrol',
              'Kalite Kontrol'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Yeni Muayene
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Muayene', value: stats.total, icon: ClipboardList, color: 'text-blue-600' },
            { label: 'Geçti', value: stats.passed, icon: CheckSquare, color: 'text-green-600' },
            { label: 'Başarısız', value: stats.failed, icon: XCircle, color: 'text-red-600' },
            { label: 'Geçiş Oranı', value: `%${stats.passRate}`, icon: AlertTriangle, color: stats.passRate >= 90 ? 'text-green-600' : 'text-yellow-600' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <card.icon className={cn('h-4 w-4', card.color)} />
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
              <p className={cn('text-2xl font-bold', card.color)}>{card.value}</p>
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
            placeholder="Muayene no, ürün veya denetçi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-60"
          />
        </div>
        <div className="flex gap-1">
          {[{ v: '', l: 'Tüm Durumlar' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', statusFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
              {f.l}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[{ v: '', l: 'Tüm Tipler' }, ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ v, l }))].map((f) => (
            <button key={f.v} onClick={() => setTypeFilter(f.v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm', typeFilter === f.v ? 'bg-secondary text-secondary-foreground' : 'border border-border hover:bg-muted')}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : filteredInspections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Muayene bulunamadı</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-medium">Muayeneler ({filteredInspections.length})</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Numara', 'Tip', 'Durum', 'Ürün', 'Muayeneci', 'Geçen/Kalan', 'Hata', 'Tarih', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInspections.map((ins) => {
                const sc = STATUS_CONFIG[ins.status];
                return (
                  <tr key={ins.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{ins.inspectionNumber}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{TYPE_LABELS[ins.type]}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sc?.bg, sc?.color)}>{sc?.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{ins.product?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {ins.inspector ? `${ins.inspector.firstName} ${ins.inspector.lastName}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-green-600">{ins.passCount}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-red-600">{ins.failCount}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{ins._count?.defects ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {ins.scheduledAt ? new Date(ins.scheduledAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailId(ins.id)} className="p-1 text-muted-foreground hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <NewInspectionModal onClose={() => setShowForm(false)} onSave={(d) => create.mutate(d)} />}
      {detailId && detailData && (
        <InspectionDetailModal
          inspection={detailData as InspectionDetail}
          onClose={() => setDetailId(null)}
          onUpdate={() => qc.invalidateQueries({ queryKey: ['quality-control', 'detail', detailId] })}
        />
      )}
    </div>
  );
}
