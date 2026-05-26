'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calculator, X, TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  parentId?: string;
  currency: string;
  isActive: boolean;
  _count?: { journalLines: number };
}

const TYPE_LABELS: Record<string, string> = {
  asset: 'Varlık',
  liability: 'Borç',
  equity: 'Özkaynaklar',
  revenue: 'Gelir',
  expense: 'Gider',
};

const TYPE_CLASSES: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  liability: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  equity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  revenue: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const FILTER_TABS = [
  { key: 'all', label: 'Tümü' },
  { key: 'asset', label: 'Varlık' },
  { key: 'liability', label: 'Borç' },
  { key: 'equity', label: 'Özkaynaklar' },
  { key: 'revenue', label: 'Gelir' },
  { key: 'expense', label: 'Gider' },
];

function formatAmount(amount: number) {
  return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

interface NewAccountModalProps {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
}

function NewAccountModal({ open, onClose, accounts }: NewAccountModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'asset' as Account['type'],
    parentId: '',
    currency: 'TRY',
    description: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/api/v1/accounting/accounts', {
        ...data,
        parentId: data.parentId || undefined,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting', 'accounts'] });
      toast.success('Hesap başarıyla oluşturuldu');
      onClose();
      setForm({ code: '', name: '', type: 'asset', parentId: '', currency: 'TRY', description: '' });
    },
    onError: () => {
      toast.error('Hesap oluşturulurken hata oluştu');
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">Yeni Hesap Oluştur</h2>
            <p className="text-sm text-muted-foreground">Hesap planına yeni hesap ekleyin</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Hesap Kodu *</label>
              <input
                type="text"
                placeholder="örn. 100"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Para Birimi *</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="TRY">TRY - Türk Lirası</option>
                <option value="USD">USD - Amerikan Doları</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Hesap Adı *</label>
            <input
              type="text"
              placeholder="örn. Kasa"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Hesap Tipi *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Account['type'] }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="asset">Varlık</option>
              <option value="liability">Borç</option>
              <option value="equity">Özkaynaklar</option>
              <option value="revenue">Gelir</option>
              <option value="expense">Gider</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Ana Hesap (opsiyonel)</label>
            <select
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">— Ana hesap seçin —</option>
              {accounts
                .filter((a) => a.type === form.type)
                .sort((a, b) => a.code.localeCompare(b.code))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Açıklama (opsiyonel)</label>
            <textarea
              rows={2}
              placeholder="Hesap açıklaması..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => createMutation.mutate(form)}
            disabled={!form.code || !form.name || createMutation.isPending}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: rawAccounts, isLoading } = useQuery<Account[]>({
    queryKey: ['accounting', 'accounts'],
    queryFn: () => api.get<Account[]>('/api/v1/accounting/accounts'),
  });

  const accounts: Account[] = Array.isArray(rawAccounts) ? rawAccounts : [];

  const totalByType = (type: string) =>
    accounts
      .filter((a) => a.type === type)
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const stats = [
    { key: 'asset', label: 'Varlıklar', value: totalByType('asset'), icon: Wallet, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { key: 'liability', label: 'Borçlar', value: totalByType('liability'), icon: TrendingDown, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    { key: 'equity', label: 'Özkaynaklar', value: totalByType('equity'), icon: BarChart3, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { key: 'revenue', label: 'Gelirler', value: totalByType('revenue'), icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { key: 'expense', label: 'Giderler', value: totalByType('expense'), icon: DollarSign, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  const filtered = accounts
    .filter((acc) => {
      if (activeFilter !== 'all' && acc.type !== activeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return acc.code.toLowerCase().includes(q) || acc.name.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hesap Planı</h1>
            <p className="text-muted-foreground text-sm">
              {accounts.length} hesap kayıtlı
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Yeni Hesap
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-base font-bold ${stat.color} leading-tight`}>
              {formatAmount(stat.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({accounts.filter((a) => a.type === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Hesap kodu veya adı ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <p className="text-muted-foreground text-sm">Hesaplar yükleniyor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Calculator className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search || activeFilter !== 'all' ? 'Arama kriterlerine uygun hesap bulunamadı' : 'Henüz hesap eklenmemiş'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Kod</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hesap Adı</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tip</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Bakiye</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Para Birimi</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((acc) => {
                const balance = Number(acc.balance) || 0;
                return (
                  <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold font-mono text-foreground">{acc.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{acc.name}</p>
                        {acc._count && acc._count.journalLines > 0 && (
                          <p className="text-xs text-muted-foreground">{acc._count.journalLines} yevmiye kalemi</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_CLASSES[acc.type] || 'bg-gray-100 text-gray-800'}`}>
                        {TYPE_LABELS[acc.type] || acc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${balance > 0 ? 'text-green-600 dark:text-green-400' : balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                        {formatAmount(balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {acc.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${acc.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                        <span className={`mr-1 h-1.5 w-1.5 rounded-full ${acc.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {acc.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-border bg-muted/30">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-muted-foreground">
                  {filtered.length} hesap gösteriliyor
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold">
                    {formatAmount(filtered.reduce((sum, a) => sum + (Number(a.balance) || 0), 0))}
                  </span>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <NewAccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        accounts={accounts}
      />
    </div>
  );
}
