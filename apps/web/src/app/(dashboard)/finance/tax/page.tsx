'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Download, X, CheckCircle2, AlertCircle,
  Clock, FileText, Calculator, ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

type TaxType = 'kdv' | 'otv' | 'stopaj' | 'kurumlar' | 'gelir' | 'damga' | 'bsmt';
type DeclarationStatus = 'pending' | 'filed' | 'paid' | 'overdue' | 'cancelled';
type Tab = 'declarations' | 'rates' | 'summary';

interface TaxDeclaration {
  id: string;
  declarationNo: string;
  taxType: TaxType;
  period: string;
  dueDate: string;
  filedDate?: string;
  paidDate?: string;
  taxBase: number;
  taxAmount: number;
  penalty?: number;
  status: DeclarationStatus;
  notes?: string;
}

interface TaxRate {
  id: string;
  taxType: TaxType;
  description: string;
  rate: number;
  effectiveDate: string;
  category: string;
}

const TAX_LABELS: Record<TaxType, string> = {
  kdv: 'KDV',
  otv: 'ÖTV',
  stopaj: 'Stopaj',
  kurumlar: 'Kurumlar Vergisi',
  gelir: 'Gelir Vergisi',
  damga: 'Damga Vergisi',
  bsmt: 'BSMV',
};

const TAX_COLORS: Record<TaxType, string> = {
  kdv: 'bg-blue-100 text-blue-700',
  otv: 'bg-purple-100 text-purple-700',
  stopaj: 'bg-orange-100 text-orange-700',
  kurumlar: 'bg-indigo-100 text-indigo-700',
  gelir: 'bg-teal-100 text-teal-700',
  damga: 'bg-gray-100 text-gray-700',
  bsmt: 'bg-pink-100 text-pink-700',
};

const STATUS_LABELS: Record<DeclarationStatus, string> = {
  pending: 'Bekliyor',
  filed: 'Beyan Edildi',
  paid: 'Ödendi',
  overdue: 'Vadesi Geçti',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<DeclarationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  filed: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const MOCK_DECLARATIONS: TaxDeclaration[] = [
  { id: '1', declarationNo: 'KDV-2026-05', taxType: 'kdv', period: 'Mayıs 2026', dueDate: '2026-06-26', taxBase: 1850000, taxAmount: 333000, status: 'pending' },
  { id: '2', declarationNo: 'KDV-2026-04', taxType: 'kdv', period: 'Nisan 2026', dueDate: '2026-05-26', filedDate: '2026-05-24', paidDate: '2026-05-24', taxBase: 1720000, taxAmount: 309600, status: 'paid' },
  { id: '3', declarationNo: 'MUH-2026-05', taxType: 'stopaj', period: 'Mayıs 2026', dueDate: '2026-06-26', taxBase: 520000, taxAmount: 52000, status: 'pending' },
  { id: '4', declarationNo: 'MUH-2026-04', taxType: 'stopaj', period: 'Nisan 2026', dueDate: '2026-05-26', filedDate: '2026-05-23', paidDate: '2026-05-23', taxBase: 480000, taxAmount: 48000, status: 'paid' },
  { id: '5', declarationNo: 'KV-2026-Q1', taxType: 'kurumlar', period: 'Q1 2026', dueDate: '2026-05-31', filedDate: '2026-05-28', taxBase: 4200000, taxAmount: 840000, status: 'filed' },
  { id: '6', declarationNo: 'OTV-2026-04', taxType: 'otv', period: 'Nisan 2026', dueDate: '2026-05-15', taxBase: 280000, taxAmount: 84000, penalty: 2520, status: 'overdue' },
  { id: '7', declarationNo: 'DV-2026-05', taxType: 'damga', period: 'Mayıs 2026', dueDate: '2026-06-23', taxBase: 950000, taxAmount: 7125, status: 'pending' },
  { id: '8', declarationNo: 'BSMV-2026-05', taxType: 'bsmt', period: 'Mayıs 2026', dueDate: '2026-06-15', taxBase: 125000, taxAmount: 6250, status: 'pending' },
];

const MOCK_RATES: TaxRate[] = [
  { id: '1', taxType: 'kdv', description: 'Genel KDV Oranı', rate: 20, effectiveDate: '2023-07-10', category: 'Genel' },
  { id: '2', taxType: 'kdv', description: 'İndirimli KDV - Gıda', rate: 1, effectiveDate: '2023-07-10', category: 'Gıda' },
  { id: '3', taxType: 'kdv', description: 'İndirimli KDV - Temel Gıda', rate: 10, effectiveDate: '2023-07-10', category: 'Gıda' },
  { id: '4', taxType: 'otv', description: 'ÖTV - Elektronik', rate: 25, effectiveDate: '2024-01-01', category: 'Elektronik' },
  { id: '5', taxType: 'otv', description: 'ÖTV - Alkollü İçecek', rate: 63, effectiveDate: '2024-01-01', category: 'Alkol' },
  { id: '6', taxType: 'stopaj', description: 'Maaş Stopaj - Dilim 1', rate: 15, effectiveDate: '2024-01-01', category: 'Ücret' },
  { id: '7', taxType: 'stopaj', description: 'Maaş Stopaj - Dilim 2', rate: 20, effectiveDate: '2024-01-01', category: 'Ücret' },
  { id: '8', taxType: 'kurumlar', description: 'Kurumlar Vergisi', rate: 25, effectiveDate: '2023-01-01', category: 'Şirket' },
  { id: '9', taxType: 'damga', description: 'Damga Vergisi - Sözleşme', rate: 0.759, effectiveDate: '2024-01-01', category: 'Sözleşme' },
  { id: '10', taxType: 'bsmt', description: 'BSMV - Banka İşlemleri', rate: 5, effectiveDate: '2024-01-01', category: 'Finans' },
];

interface NewDeclarationModalProps {
  onClose: () => void;
  onSave: (d: Partial<TaxDeclaration>) => void;
}

function NewDeclarationModal({ onClose, onSave }: NewDeclarationModalProps) {
  const [form, setForm] = useState({ taxType: 'kdv' as TaxType, period: '', dueDate: '', taxBase: '', taxAmount: '', notes: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Yeni Vergi Beyannamesi</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vergi Türü</label>
              <select value={form.taxType} onChange={(e) => setForm({ ...form, taxType: e.target.value as TaxType })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {(Object.keys(TAX_LABELS) as TaxType[]).map((t) => <option key={t} value={t}>{TAX_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dönem</label>
              <input type="text" placeholder="Mayıs 2026" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Son Ödeme Tarihi</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Matrah (₺)</label>
              <input type="number" value={form.taxBase} onChange={(e) => setForm({ ...form, taxBase: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vergi Tutarı (₺)</label>
              <input type="number" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
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
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Kaydet</button>
        </div>
      </div>
    </div>
  );
}

export default function TaxPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('declarations');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TaxType | 'all'>('all');
  const [showNew, setShowNew] = useState(false);

  const { data: declarations = MOCK_DECLARATIONS } = useQuery<TaxDeclaration[]>({
    queryKey: ['tax-declarations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/finance/tax/declarations');
      if (!res.ok) return MOCK_DECLARATIONS;
      return res.json();
    },
    initialData: MOCK_DECLARATIONS,
  });

  const { data: rates = MOCK_RATES } = useQuery<TaxRate[]>({
    queryKey: ['tax-rates'],
    queryFn: async () => {
      const res = await fetch('/api/v1/finance/tax/rates');
      if (!res.ok) return MOCK_RATES;
      return res.json();
    },
    initialData: MOCK_RATES,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<TaxDeclaration>) => {
      const res = await fetch('/api/v1/finance/tax/declarations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tax-declarations'] }),
  });

  const filtered = useMemo(() => {
    let list = declarations;
    if (typeFilter !== 'all') list = list.filter((d) => d.taxType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.declarationNo.toLowerCase().includes(q) || d.period.toLowerCase().includes(q));
    }
    return list;
  }, [declarations, typeFilter, search]);

  const stats = useMemo(() => ({
    pending: declarations.filter((d) => d.status === 'pending').length,
    overdue: declarations.filter((d) => d.status === 'overdue').length,
    totalTax: declarations.filter((d) => d.status !== 'cancelled').reduce((s, d) => s + d.taxAmount, 0),
    paid: declarations.filter((d) => d.status === 'paid').reduce((s, d) => s + d.taxAmount, 0),
  }), [declarations]);

  const handleExport = () => {
    const rows = filtered.map((d) => ({
      'Beyanname No': d.declarationNo,
      'Vergi Türü': TAX_LABELS[d.taxType],
      'Dönem': d.period,
      'Son Tarih': d.dueDate,
      'Matrah': d.taxBase,
      'Vergi Tutarı': d.taxAmount,
      'Durum': STATUS_LABELS[d.status],
    }));
    exportToExcel(rows, 'vergi-beyannnameleri', 'Beyannameler');
  };

  const summaryByType = useMemo(() => {
    const map: Partial<Record<TaxType, { count: number; total: number }>> = {};
    for (const d of declarations.filter((d) => d.status !== 'cancelled')) {
      if (!map[d.taxType]) map[d.taxType] = { count: 0, total: 0 };
      map[d.taxType]!.count += 1;
      map[d.taxType]!.total += d.taxAmount;
    }
    return map;
  }, [declarations]);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'declarations', label: 'Beyannameler' },
    { id: 'rates', label: 'Vergi Oranları' },
    { id: 'summary', label: 'Özet' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vergi Yönetimi</h1>
          <p className="text-muted-foreground">KDV, ÖTV, stopaj ve kurumlar vergisi beyanname takibi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Excel
          </button>
          {activeTab === 'declarations' && (
            <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Yeni Beyanname
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-yellow-500" /><p className="text-sm text-muted-foreground">Bekleyen</p></div>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4 text-red-500" /><p className="text-sm text-red-700">Vadesi Geçen</p></div>
          <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Calculator className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Toplam Vergi</p></div>
          <p className="text-2xl font-bold">₺{stats.totalTax.toLocaleString('tr-TR')}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="h-4 w-4 text-green-600" /><p className="text-sm text-green-700">Ödenen</p></div>
          <p className="text-2xl font-bold text-green-700">₺{stats.paid.toLocaleString('tr-TR')}</p>
        </div>
      </div>

      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'declarations' && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Beyanname ara..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-56" />
            </div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setTypeFilter('all')}
                className={cn('rounded-full px-3 py-1 text-sm font-medium', typeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
                Tümü
              </button>
              {(Object.keys(TAX_LABELS) as TaxType[]).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={cn('rounded-full px-3 py-1 text-sm font-medium', typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
                  {TAX_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Beyanname No</th>
                  <th className="px-4 py-3 text-left font-medium">Vergi Türü</th>
                  <th className="px-4 py-3 text-left font-medium">Dönem</th>
                  <th className="px-4 py-3 text-left font-medium">Son Tarih</th>
                  <th className="px-4 py-3 text-right font-medium">Matrah</th>
                  <th className="px-4 py-3 text-right font-medium">Vergi Tutarı</th>
                  <th className="px-4 py-3 text-left font-medium">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((d) => (
                  <tr key={d.id} className={cn('hover:bg-muted/30', d.status === 'overdue' && 'bg-red-50/50')}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{d.declarationNo}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', TAX_COLORS[d.taxType])}>
                        {TAX_LABELS[d.taxType]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{d.period}</td>
                    <td className={cn('px-4 py-3', d.status === 'overdue' && 'text-red-600 font-medium')}>
                      {new Date(d.dueDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right">₺{d.taxBase.toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₺{d.taxAmount.toLocaleString('tr-TR')}
                      {d.penalty && <span className="text-red-600 text-xs ml-1">(+₺{d.penalty.toLocaleString()} ceza)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[d.status])}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'rates' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Vergi Türü</th>
                <th className="px-4 py-3 text-left font-medium">Açıklama</th>
                <th className="px-4 py-3 text-left font-medium">Kategori</th>
                <th className="px-4 py-3 text-right font-medium">Oran (%)</th>
                <th className="px-4 py-3 text-left font-medium">Yürürlük Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', TAX_COLORS[r.taxType])}>
                      {TAX_LABELS[r.taxType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.description}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">%{r.rate}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.effectiveDate).toLocaleDateString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(summaryByType) as TaxType[]).map((taxType) => {
            const data = summaryByType[taxType]!;
            return (
              <div key={taxType} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', TAX_COLORS[taxType])}>
                    {TAX_LABELS[taxType]}
                  </span>
                  <span className="text-sm text-muted-foreground">{data.count} beyanname</span>
                </div>
                <p className="text-2xl font-bold">₺{data.total.toLocaleString('tr-TR')}</p>
                <p className="text-sm text-muted-foreground mt-1">Toplam vergi yükü</p>
              </div>
            );
          })}
        </div>
      )}

      {showNew && <NewDeclarationModal onClose={() => setShowNew(false)} onSave={(d) => createMutation.mutate(d)} />}
    </div>
  );
}
