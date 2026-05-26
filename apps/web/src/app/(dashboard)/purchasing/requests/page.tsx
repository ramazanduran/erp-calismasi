'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import {
  PlusCircle, ClipboardList, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, X, AlertTriangle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: 'Taslak',           color: 'text-gray-600',   bg: 'bg-gray-100',   border: 'border-gray-200' },
  pending:   { label: 'Bekliyor',         color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  approved:  { label: 'Onaylandı',        color: 'text-green-700',  bg: 'bg-green-100',  border: 'border-green-300' },
  rejected:  { label: 'Reddedildi',       color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-300' },
  ordered:   { label: 'Sipariş Verildi',  color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-300' },
  cancelled: { label: 'İptal',            color: 'text-gray-500',   bg: 'bg-gray-100',   border: 'border-gray-200' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Düşük',    color: 'text-gray-500' },
  normal: { label: 'Normal',   color: 'text-blue-600' },
  high:   { label: 'Yüksek',   color: 'text-orange-600' },
  urgent: { label: 'Acil',     color: 'text-red-600' },
};

function NewRequestModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({ priority: 'normal', neededBy: '', notes: '' });
  const [items, setItems] = useState([{ description: '', quantity: 1, unit: 'adet', estimatedPrice: '' }]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit: 'adet', estimatedPrice: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: string, val: any) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Yeni Satın Alma Talebi</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, items: items.map(i => ({ ...i, estimatedPrice: i.estimatedPrice ? +i.estimatedPrice : undefined })) }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Öncelik</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="urgent">Acil</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Gereklilik Tarihi</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.neededBy} onChange={(e) => setForm({ ...form, neededBy: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Notlar</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Kalemler</label>
              <button type="button" onClick={addItem} className="text-xs text-primary hover:underline flex items-center gap-1">
                <PlusCircle className="h-3 w-3" />Kalem Ekle
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input className="col-span-4 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Açıklama / Ürün*" required value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                  <input type="number" className="col-span-2 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Miktar" min="0.01" step="0.01" required value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', +e.target.value)} />
                  <input className="col-span-2 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Birim" value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} />
                  <input type="number" className="col-span-3 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Tahmini Fiyat" min="0" step="0.01" value={item.estimatedPrice} onChange={(e) => updateItem(idx, 'estimatedPrice', e.target.value)} />
                  <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="col-span-1 flex justify-center text-red-500 disabled:opacity-30"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RejectModal({ onClose, onReject }: { onClose: () => void; onReject: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Talebi Reddet</h2>
        <div>
          <label className="text-sm font-medium">Red Gerekçesi *</label>
          <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" rows={3} required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reddetme gerekçesini açıklayın..." />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">İptal</button>
          <button onClick={() => reason && onReject(reason)} disabled={!reason} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg disabled:opacity-50">Reddet</button>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseRequestsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ['purchase-requests', 'stats'],
    queryFn: () => api.get('/api/v1/purchase-requests/stats'),
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ['purchase-requests', 'list', statusFilter],
    queryFn: () => api.get('/api/v1/purchase-requests', { status: statusFilter || undefined, limit: 50 }),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/purchase-requests', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-requests'] }); setShowForm(false); },
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.put(`/api/v1/purchase-requests/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-requests'] }),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/api/v1/purchase-requests/${id}/reject`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-requests'] }); setRejectTarget(null); },
  });

  const stats = statsData as any;
  const requests = (listData as any)?.data ?? [];

  const getStatusCount = (status: string) => {
    const found = (stats?.byStatus ?? []).find((s: any) => s.status === status);
    return found?._count ?? 0;
  };

  const totalCount = (stats?.byStatus ?? []).reduce((s: number, x: any) => s + x._count, 0);
  const pendingCount = getStatusCount('pending');
  const approvedCount = getStatusCount('approved');
  const rejectedCount = getStatusCount('rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Satın Alma Talepleri</h1>
          <p className="text-muted-foreground mt-1">Satın alma taleplerini yönetin ve onaylayın</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
          <PlusCircle className="h-4 w-4" />Yeni Talep
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Toplam', value: totalCount, icon: ClipboardList, color: 'text-blue-600' },
          { label: 'Bekleyen', value: pendingCount, icon: Clock, color: 'text-yellow-600' },
          { label: 'Onaylanan', value: approvedCount, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Reddedilen', value: rejectedCount, icon: XCircle, color: 'text-red-600' },
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

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ v: '', l: 'Tümü' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
          <button key={f.v} onClick={() => setStatusFilter(f.v)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', statusFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Satın alma talebi bulunamadı</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Talep No', 'Talep Eden', 'Departman', 'Öncelik', 'Gereklilik', 'Durum', 'Kalem', 'İşlemler'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((req: any) => {
                const sc = STATUS_CONFIG[req.status] ?? STATUS_CONFIG['draft'];
                const pr = PRIORITY_CONFIG[req.priority] ?? PRIORITY_CONFIG['normal'];
                const isExpanded = expandedId === req.id;
                return (
                  <>
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-primary">{req.requestNumber}</td>
                      <td className="px-4 py-3">{req.requestedBy?.firstName} {req.requestedBy?.lastName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{req.department?.name ?? '—'}</td>
                      <td className={cn('px-4 py-3 font-medium', pr.color)}>{pr.label}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {req.neededBy ? new Date(req.neededBy).toLocaleDateString('tr-TR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border', sc.color, sc.bg, sc.border)}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{req.items?.length ?? 0} kalem</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setExpandedId(isExpanded ? null : req.id)} className="p-1 rounded hover:bg-muted" title="Detay">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          {req.status === 'pending' && (
                            <>
                              <button onClick={() => approve.mutate(req.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Onayla</button>
                              <button onClick={() => setRejectTarget(req.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Reddet</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && req.items?.length > 0 && (
                      <tr key={`${req.id}-items`}>
                        <td colSpan={8} className="px-4 py-3 bg-muted/20">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">KALEMLER</p>
                          <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                            <thead className="bg-muted/40">
                              <tr>
                                <th className="px-3 py-2 text-left">Açıklama / Ürün</th>
                                <th className="px-3 py-2 text-right">Miktar</th>
                                <th className="px-3 py-2 text-left">Birim</th>
                                <th className="px-3 py-2 text-right">Tahmini Fiyat</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                              {req.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2">{item.product?.name ?? item.description}</td>
                                  <td className="px-3 py-2 text-right">{Number(item.quantity).toLocaleString('tr-TR')}</td>
                                  <td className="px-3 py-2">{item.unit}</td>
                                  <td className="px-3 py-2 text-right">
                                    {item.estimatedPrice ? `${Number(item.estimatedPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {req.rejectedReason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span><strong>Red Gerekçesi:</strong> {req.rejectedReason}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <NewRequestModal onClose={() => setShowForm(false)} onSave={(d) => create.mutate(d)} />}
      {rejectTarget && (
        <RejectModal onClose={() => setRejectTarget(null)} onReject={(reason) => reject.mutate({ id: rejectTarget, reason })} />
      )}
    </div>
  );
}
