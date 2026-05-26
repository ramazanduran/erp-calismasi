'use client';

import { useState } from 'react';
import { PlusCircle, FileText, AlertTriangle, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatCurrency, cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: 'Taslak',     color: 'text-gray-600',   bg: 'bg-gray-100' },
  review:     { label: 'İncelemede', color: 'text-blue-600',   bg: 'bg-blue-100' },
  active:     { label: 'Aktif',      color: 'text-green-600',  bg: 'bg-green-100' },
  expired:    { label: 'Süresi Doldu', color: 'text-red-600', bg: 'bg-red-100' },
  terminated: { label: 'Feshedildi', color: 'text-orange-600', bg: 'bg-orange-100' },
  cancelled:  { label: 'İptal',      color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const TYPE_LABELS: Record<string, string> = {
  sales:       'Satış',
  purchase:    'Satın Alma',
  employment:  'İstihdam',
  nda:         'Gizlilik',
  lease:       'Kira',
  service:     'Hizmet',
  partnership: 'Ortaklık',
};

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  type: string;
  status: string;
  partyName: string;
  startDate?: string;
  endDate?: string;
  value?: number;
  currency: string;
  autoRenew: boolean;
  customer?: { name: string } | null;
  supplier?: { name: string } | null;
  owner?: { firstName: string; lastName: string } | null;
  _count?: { amendments: number };
}

interface Stats {
  total: number;
  active: number;
  totalActiveValue: number;
  byStatus: Record<string, number>;
  byType: Record<string, { count: number; value: number }>;
}

function NewContractModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    title: '', type: 'service', partyName: '', partyEmail: '',
    startDate: '', endDate: '', value: '', currency: 'TRY',
    autoRenew: false, paymentTerms: '', description: '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Yeni Kontrat</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, value: form.value ? +form.value : undefined }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Başlık *</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Kontrat Tipi</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Para Birimi</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Karşı Taraf *</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.partyName} onChange={(e) => setForm({ ...form, partyName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Karşı Taraf E-posta</label>
            <input type="email" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.partyEmail} onChange={(e) => setForm({ ...form, partyEmail: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Başlangıç Tarihi</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Bitiş Tarihi</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Kontrat Değeri</label>
            <input type="number" step="0.01" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Ödeme Koşulları</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} placeholder="ör. 30 günlük net ödeme" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.autoRenew} onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })} />
            Otomatik Yenileme
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: statsData } = useQuery({
    queryKey: ['contracts', 'stats'],
    queryFn: () => api.get('/api/v1/contracts/stats'),
  });

  const { data: expiringData = [] } = useQuery({
    queryKey: ['contracts', 'expiring'],
    queryFn: () => api.get('/api/v1/contracts/expiring', { days: '30' }),
  });

  const { data: contractsData = [], isLoading } = useQuery({
    queryKey: ['contracts', 'list', statusFilter, typeFilter, searchText],
    queryFn: () => api.get('/api/v1/contracts', {
      ...(statusFilter && { status: statusFilter }),
      ...(typeFilter && { type: typeFilter }),
      ...(searchText && { search: searchText }),
    }),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/contracts', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); setShowForm(false); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/api/v1/contracts/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const deleteContract = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/contracts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const stats = statsData as Stats | undefined;
  const contracts = contractsData as Contract[];
  const expiring = expiringData as Contract[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kontrat Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Müşteri, tedarikçi ve çalışan sözleşmeleri</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
          <PlusCircle className="h-4 w-4" />Yeni Kontrat
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Toplam', value: stats.total, icon: FileText },
            { label: 'Aktif', value: stats.active, icon: CheckCircle2 },
            { label: 'Yakında Sona Erecek', value: expiring.length, icon: AlertTriangle },
            { label: 'Aktif Kontrat Değeri', value: formatCurrency(stats.totalActiveValue), icon: DollarSign },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold mt-0.5">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Expiring Alerts */}
      {expiring.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">30 Gün İçinde Sona Erecek Kontratlar</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {expiring.map((c) => (
              <span key={c.id} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                {c.title} — {c.endDate ? new Date(c.endDate).toLocaleDateString('tr-TR') : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="rounded border border-border bg-background px-3 py-1.5 text-sm w-64"
          placeholder="Kontrat ara..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <div className="flex gap-1">
          {[{ v: '', l: 'Tüm Durumlar' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm', statusFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
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
      ) : contracts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Kontrat bulunamadı</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Numara', 'Başlık', 'Tip', 'Durum', 'Karşı Taraf', 'Başlangıç', 'Bitiş', 'Değer', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contracts.map((c) => {
                const sc = STATUS_CONFIG[c.status];
                const daysLeft = c.endDate ? Math.floor((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{c.contractNumber}</td>
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{TYPE_LABELS[c.type] ?? c.type}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sc?.bg, sc?.color)}>{sc?.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{c.partyName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.startDate ? new Date(c.startDate).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.endDate ? (
                        <span className={cn(daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 ? 'text-yellow-600 font-medium' : 'text-muted-foreground')}>
                          {new Date(c.endDate).toLocaleDateString('tr-TR')}
                          {daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 && <span className="ml-1">({daysLeft}g)</span>}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {c.value ? formatCurrency(c.value) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {c.status === 'draft' && (
                          <button onClick={() => updateStatus.mutate({ id: c.id, status: 'active' })}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                            Aktifleştir
                          </button>
                        )}
                        <button onClick={() => { if (confirm('Silmek istediğinizden emin misiniz?')) deleteContract.mutate(c.id); }}
                          className="text-xs px-2 py-1 text-muted-foreground hover:text-destructive">
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <NewContractModal onClose={() => setShowForm(false)} onSave={(d) => create.mutate(d)} />}
    </div>
  );
}
