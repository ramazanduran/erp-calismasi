'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, FileText, AlertTriangle, CheckCircle2, Clock, DollarSign, FileDown } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
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

const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'c1',
    contractNumber: 'KNT-2026-001',
    title: 'Yazılım Lisans ve Destek Hizmetleri Sözleşmesi',
    type: 'service',
    status: 'active',
    partyName: 'TechSoft A.Ş.',
    startDate: '2026-01-01',
    endDate: '2026-06-05',
    value: 450000,
    currency: 'TRY',
    autoRenew: true,
    _count: { amendments: 1 },
  },
  {
    id: 'c2',
    contractNumber: 'KNT-2026-002',
    title: 'Hammadde Tedarik Çerçeve Sözleşmesi',
    type: 'purchase',
    status: 'active',
    partyName: 'Demir Çelik San. Ltd.',
    startDate: '2026-01-15',
    endDate: '2026-12-31',
    value: 2800000,
    currency: 'TRY',
    autoRenew: false,
    _count: { amendments: 0 },
  },
  {
    id: 'c3',
    contractNumber: 'KNT-2026-003',
    title: 'Kurumsal Yazılım Satış Sözleşmesi — Müşteri A',
    type: 'sales',
    status: 'active',
    partyName: 'Anadolu Holding',
    startDate: '2026-02-01',
    endDate: '2027-01-31',
    value: 1200000,
    currency: 'TRY',
    autoRenew: true,
    _count: { amendments: 2 },
  },
  {
    id: 'c4',
    contractNumber: 'KNT-2026-004',
    title: 'Lojistik ve Taşımacılık Hizmet Sözleşmesi',
    type: 'service',
    status: 'review',
    partyName: 'Hızlı Kargo A.Ş.',
    startDate: '2026-06-01',
    endDate: '2027-05-31',
    value: 360000,
    currency: 'TRY',
    autoRenew: false,
    _count: { amendments: 0 },
  },
  {
    id: 'c5',
    contractNumber: 'KNT-2026-005',
    title: 'Ofis Kira Sözleşmesi — Merkez Bina',
    type: 'lease',
    status: 'active',
    partyName: 'Metropol GYO',
    startDate: '2025-07-01',
    endDate: '2026-06-10',
    value: 85000,
    currency: 'TRY',
    autoRenew: true,
    _count: { amendments: 0 },
  },
  {
    id: 'c6',
    contractNumber: 'KNT-2026-006',
    title: 'Kıdemli Yazılım Geliştirici İstihdam Sözleşmesi',
    type: 'employment',
    status: 'active',
    partyName: 'Ahmet Kaya',
    startDate: '2025-09-01',
    endDate: '2026-08-31',
    value: 720000,
    currency: 'TRY',
    autoRenew: true,
    _count: { amendments: 0 },
  },
  {
    id: 'c7',
    contractNumber: 'KNT-2026-007',
    title: 'Gizlilik ve Fikri Mülkiyet Sözleşmesi',
    type: 'nda',
    status: 'active',
    partyName: 'İnovasyon Labs',
    startDate: '2026-01-01',
    endDate: '2028-12-31',
    currency: 'TRY',
    autoRenew: false,
    _count: { amendments: 0 },
  },
  {
    id: 'c8',
    contractNumber: 'KNT-2025-045',
    title: 'Eski Bulut Altyapı Hizmet Sözleşmesi',
    type: 'service',
    status: 'expired',
    partyName: 'CloudTech Ltd.',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    value: 540000,
    currency: 'TRY',
    autoRenew: false,
    _count: { amendments: 3 },
  },
  {
    id: 'c9',
    contractNumber: 'KNT-2026-008',
    title: 'Stratejik İş Ortaklığı Çerçeve Anlaşması',
    type: 'partnership',
    status: 'draft',
    partyName: 'Ortak Teknoloji A.Ş.',
    startDate: '2026-07-01',
    endDate: '2028-06-30',
    value: 5000000,
    currency: 'USD',
    autoRenew: true,
    _count: { amendments: 0 },
  },
  {
    id: 'c10',
    contractNumber: 'KNT-2026-009',
    title: 'ERP Sistemleri Satış Sözleşmesi — Müşteri B',
    type: 'sales',
    status: 'active',
    partyName: 'Güney Sanayi A.Ş.',
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    value: 890000,
    currency: 'TRY',
    autoRenew: false,
    _count: { amendments: 1 },
  },
];

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
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showForm, setShowForm] = useState(false);

  const today = new Date('2026-05-27');

  const stats = useMemo(() => {
    const active = contracts.filter((c) => c.status === 'active');
    const byStatus: Record<string, number> = {};
    const byType: Record<string, { count: number; value: number }> = {};
    for (const c of contracts) {
      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
      if (!byType[c.type]) byType[c.type] = { count: 0, value: 0 };
      byType[c.type].count += 1;
      if (c.value && c.currency === 'TRY') byType[c.type].value += c.value;
    }
    const totalActiveValue = active.reduce((s, c) => s + (c.value && c.currency === 'TRY' ? c.value : 0), 0);
    return { total: contracts.length, active: active.length, totalActiveValue, byStatus, byType };
  }, [contracts]);

  const expiring = useMemo(() =>
    contracts.filter((c) => {
      if (c.status !== 'active' || !c.endDate) return false;
      const days = Math.floor((new Date(c.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 30;
    }),
    [contracts]
  );

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase();
    return contracts.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (typeFilter && c.type !== typeFilter) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.partyName.toLowerCase().includes(q) && !c.contractNumber.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [contracts, statusFilter, typeFilter, searchText]);

  function handleCreate(d: any) {
    const num = `KNT-2026-${String(contracts.length + 1).padStart(3, '0')}`;
    const newContract: Contract = {
      id: `c${Date.now()}`,
      contractNumber: num,
      title: d.title,
      type: d.type,
      status: 'draft',
      partyName: d.partyName,
      startDate: d.startDate || undefined,
      endDate: d.endDate || undefined,
      value: d.value,
      currency: d.currency,
      autoRenew: d.autoRenew,
      _count: { amendments: 0 },
    };
    setContracts((prev) => [newContract, ...prev]);
    setShowForm(false);
  }

  function handleActivate(id: string) {
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: 'active' } : c));
  }

  function handleDelete(id: string) {
    if (confirm('Silmek istediğinizden emin misiniz?')) {
      setContracts((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kontrat Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Müşteri, tedarikçi ve çalışan sözleşmeleri</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filtered.map((c) => ({
                contractNumber: c.contractNumber,
                title: c.title,
                type: TYPE_LABELS[c.type] ?? c.type,
                status: STATUS_CONFIG[c.status]?.label ?? c.status,
                partyName: c.partyName,
                value: c.value ?? '',
                currency: c.currency,
                startDate: c.startDate ? new Date(c.startDate).toLocaleDateString('tr-TR') : '',
                endDate: c.endDate ? new Date(c.endDate).toLocaleDateString('tr-TR') : '',
                autoRenew: c.autoRenew ? 'Evet' : 'Hayır',
              })),
              [
                { key: 'contractNumber', header: 'Kontrat No', width: 14 },
                { key: 'title', header: 'Başlık', width: 28 },
                { key: 'type', header: 'Tip', width: 14 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'partyName', header: 'Taraf', width: 22 },
                { key: 'value', header: 'Değer', width: 14 },
                { key: 'currency', header: 'Para Birimi', width: 12 },
                { key: 'startDate', header: 'Başlangıç', width: 12 },
                { key: 'endDate', header: 'Bitiş', width: 12 },
                { key: 'autoRenew', header: 'Otomatik Yenileme', width: 18 },
              ],
              'kontratlar',
              'Kontratlar'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Yeni Kontrat
          </button>
        </div>
      </div>

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

      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="rounded border border-border bg-background px-3 py-1.5 text-sm w-64"
          placeholder="Kontrat ara..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {[{ v: '', l: 'Tüm Durumlar' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm', statusFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
              {f.l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {[{ v: '', l: 'Tüm Tipler' }, ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ v, l }))].map((f) => (
            <button key={f.v} onClick={() => setTypeFilter(f.v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm', typeFilter === f.v ? 'bg-secondary text-secondary-foreground' : 'border border-border hover:bg-muted')}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
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
              {filtered.map((c) => {
                const sc = STATUS_CONFIG[c.status];
                const daysLeft = c.endDate ? Math.floor((new Date(c.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
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
                          <button onClick={() => handleActivate(c.id)}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                            Aktifleştir
                          </button>
                        )}
                        <button onClick={() => handleDelete(c.id)}
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

      {showForm && <NewContractModal onClose={() => setShowForm(false)} onSave={handleCreate} />}
    </div>
  );
}
