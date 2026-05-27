'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Banknote,
  CreditCard,
  Landmark,
  X,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Eye,
  Pencil,
  Building2,
  Loader2,
  FileDown,
  Search,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccounts } from '@/lib/api/hooks';
import { api } from '@/lib/api/client';

type AccountType = 'bank' | 'cash' | 'credit';
type Currency = 'TRY' | 'USD' | 'EUR';

interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  isActive: boolean;
  transactionCount?: number;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
}

interface Transaction {
  id: string;
  createdAt: string;
  description?: string;
  type: 'credit' | 'debit';
  amount: number;
  balance?: number;
}

const TYPE_LABELS: Record<AccountType, string> = {
  bank: 'Banka Hesabı',
  cash: 'Kasa',
  credit: 'Kredi Kartı',
};

const TYPE_ICONS: Record<AccountType, React.FC<{ className?: string }>> = {
  bank: Landmark,
  cash: Banknote,
  credit: CreditCard,
};

const TYPE_BG: Record<AccountType, string> = {
  bank: 'bg-blue-100 dark:bg-blue-900/30',
  cash: 'bg-green-100 dark:bg-green-900/30',
  credit: 'bg-purple-100 dark:bg-purple-900/30',
};

const TYPE_ICON_COLOR: Record<AccountType, string> = {
  bank: 'text-blue-600 dark:text-blue-400',
  cash: 'text-green-600 dark:text-green-400',
  credit: 'text-purple-600 dark:text-purple-400',
};

const TYPE_BAR_COLOR: Record<AccountType, string> = {
  bank: 'bg-blue-500',
  cash: 'bg-green-500',
  credit: 'bg-purple-500',
};

const TAB_KEYS = ['', 'bank', 'cash', 'credit'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  '': 'Tümü',
  bank: 'Banka Hesabı',
  cash: 'Kasa',
  credit: 'Kredi Kartı',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
};

function fmtCurrency(amount: number, currency: string) {
  return amount.toLocaleString('tr-TR', { style: 'currency', currency: currency || 'TRY' });
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="animate-pulse bg-muted rounded-lg h-11 w-11" />
        <div className="animate-pulse bg-muted rounded-full h-5 w-10" />
      </div>
      <div className="space-y-2">
        <div className="animate-pulse bg-muted rounded h-4 w-3/4" />
        <div className="animate-pulse bg-muted rounded h-3 w-1/2" />
      </div>
      <div className="animate-pulse bg-muted rounded h-7 w-1/2" />
      <div className="flex justify-between">
        <div className="animate-pulse bg-muted rounded h-3 w-16" />
        <div className="animate-pulse bg-muted rounded h-3 w-12" />
      </div>
    </div>
  );
}

function TransactionPanel({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'list', { accountId: account.id, limit: 20 }],
    queryFn: () =>
      api.get('/api/v1/finance/transactions', {
        accountId: account.id,
        limit: 20,
      } as Record<string, unknown>),
    enabled: !!account.id,
  });

  const transactions: Transaction[] = Array.isArray(data) ? (data as Transaction[]) : [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center ${
              TYPE_BG[account.type]
            }`}
          >
            {(() => {
              const Icon = TYPE_ICONS[account.type] ?? Banknote;
              return <Icon className={`h-4 w-4 ${TYPE_ICON_COLOR[account.type]}`} />;
            })()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{account.name}</h3>
            <p className="text-xs text-muted-foreground">Son 20 işlem</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tarih</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Açıklama</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tür</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Tutar</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Bakiye</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="animate-pulse bg-muted rounded h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted-foreground text-sm">
                  Bu hesaba ait işlem bulunamadı.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleString('tr-TR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                    {tx.description ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        tx.type === 'credit'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {tx.type === 'credit' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {tx.type === 'credit' ? 'Alacak' : 'Borç'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    <span
                      className={
                        tx.type === 'credit'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {tx.type === 'credit' ? '+' : '-'}
                      {fmtCurrency(Math.abs(tx.amount), account.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {tx.balance != null ? fmtCurrency(tx.balance, account.currency) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface NewAccountForm {
  name: string;
  type: AccountType;
  currency: Currency;
  isActive: boolean;
  bankName: string;
  accountNumber: string;
  iban: string;
}

const DEFAULT_FORM: NewAccountForm = {
  name: '',
  type: 'bank',
  currency: 'TRY',
  isActive: true,
  bankName: '',
  accountNumber: '',
  iban: '',
};

function NewAccountModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<NewAccountForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof NewAccountForm, string>>>({});

  const mutation = useMutation({
    mutationFn: (data: NewAccountForm) => api.post('/api/v1/finance/accounts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      onClose();
    },
  });

  function set<K extends keyof NewAccountForm>(key: K, value: NewAccountForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof NewAccountForm, string>> = {};
    if (!form.name.trim()) errs.name = 'Hesap adı zorunludur.';
    if (form.type === 'bank' && !form.bankName.trim()) errs.bankName = 'Banka adı zorunludur.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Yeni Hesap</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Hesap Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Örn. Merkez Kasası"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.name ? 'border-red-500' : 'border-border'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Hesap Tipi <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as AccountType)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="bank">Banka Hesabı</option>
                <option value="cash">Kasa</option>
                <option value="credit">Kredi Kartı</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Para Birimi <span className="text-red-500">*</span>
              </label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value as Currency)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="TRY">TRY — Türk Lirası</option>
                <option value="USD">USD — Dolar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>

          {form.type === 'bank' && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Banka Bilgileri
              </p>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Banka Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn. Ziraat Bankası"
                  value={form.bankName}
                  onChange={(e) => set('bankName', e.target.value)}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.bankName ? 'border-red-500' : 'border-border'
                  }`}
                />
                {errors.bankName && <p className="text-xs text-red-500">{errors.bankName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Hesap Numarası</label>
                <input
                  type="text"
                  placeholder="Hesap numarası"
                  value={form.accountNumber}
                  onChange={(e) => set('accountNumber', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">IBAN</label>
                <input
                  type="text"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  value={form.iban}
                  onChange={(e) => set('iban', e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Aktif Hesap</p>
              <p className="text-xs text-muted-foreground">Pasif hesaplar işlemlerde görünmez.</p>
            </div>
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                form.isActive ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-500 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2">
              Hesap oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {mutation.isPending ? 'Kaydediliyor...' : 'Hesap Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const MOCK_FIN_ACCOUNTS: Account[] = [
  { id: 'fa1', name: 'Garanti Bankası - TRY Ana Hesap', type: 'bank', currency: 'TRY', balance: 1840000, isActive: true, bankName: 'Garanti BBVA', accountNumber: '8234567', iban: 'TR12 0006 2000 0000 0008 2345 67', transactionCount: 120 },
  { id: 'fa2', name: 'İş Bankası - USD Hesabı', type: 'bank', currency: 'USD', balance: 45000, isActive: true, bankName: 'İş Bankası', accountNumber: '1234567', iban: 'TR34 0006 4000 0000 0001 2345 67', transactionCount: 38 },
  { id: 'fa3', name: 'Merkez Kasa', type: 'cash', currency: 'TRY', balance: 125000, isActive: true, transactionCount: 48 },
  { id: 'fa4', name: 'Kurumsal Kredi Kartı', type: 'credit', currency: 'TRY', balance: -42000, isActive: true, bankName: 'Akbank', transactionCount: 67 },
  { id: 'fa5', name: 'Yapı Kredi - EUR Hesabı', type: 'bank', currency: 'EUR', balance: 18000, isActive: true, bankName: 'Yapı Kredi', accountNumber: '9876543', iban: 'TR56 0006 7000 0000 0009 8765 43', transactionCount: 22 },
  { id: 'fa6', name: 'Ankara Şube Kasası', type: 'cash', currency: 'TRY', balance: 28000, isActive: true, transactionCount: 15 },
];

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('');
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [localAccounts, setLocalAccounts] = useState<Account[]>(MOCK_FIN_ACCOUNTS);

  const { data: accounts, isLoading: accountsLoading } = useAccounts({
    type: activeTab || undefined,
    isActive: showInactive ? undefined : true,
  });

  const isLoading = accountsLoading && accounts === undefined;
  const allAccounts: Account[] = accounts !== undefined ? (Array.isArray(accounts) ? (accounts as Account[]) : []) : localAccounts;

  const filtered = useMemo(() => {
    return allAccounts.filter((a) => {
      if (activeTab && a.type !== activeTab) return false;
      if (!showInactive && !a.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.name?.toLowerCase().includes(q) && !a.bankName?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allAccounts, activeTab, showInactive, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { '': allAccounts.length };
    for (const a of allAccounts) {
      counts[a.type] = (counts[a.type] ?? 0) + 1;
    }
    return counts;
  }, [allAccounts]);

  const totalBalanceTRY = useMemo(() => {
    return allAccounts
      .filter((a) => a.isActive && a.currency === 'TRY')
      .reduce((sum, a) => sum + Number(a.balance ?? 0), 0);
  }, [allAccounts]);

  const breakdown = useMemo(() => {
    const byType: Record<AccountType, number> = { bank: 0, cash: 0, credit: 0 };
    for (const a of allAccounts) {
      if (a.isActive && a.currency === 'TRY') {
        byType[a.type] += Number(a.balance ?? 0);
      }
    }
    const total = Math.abs(byType.bank) + Math.abs(byType.cash) + Math.abs(byType.credit) || 1;
    return (['bank', 'cash', 'credit'] as AccountType[]).map((type) => ({
      type,
      amount: byType[type],
      pct: Math.abs(byType[type]) / total,
    }));
  }, [allAccounts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finansal Hesaplar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Banka hesapları, kasalar ve kredi kartlarını yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              allAccounts.map((a) => ({
                name: a.name,
                type: TYPE_LABELS[a.type] ?? a.type,
                currency: a.currency,
                balance: Number(a.balance),
                isActive: a.isActive ? 'Aktif' : 'Pasif',
                bankName: a.bankName ?? '',
                accountNumber: a.accountNumber ?? '',
                iban: a.iban ?? '',
              })),
              [
                { key: 'name', header: 'Hesap Adı', width: 24 },
                { key: 'type', header: 'Tip', width: 14 },
                { key: 'currency', header: 'Para Birimi', width: 12 },
                { key: 'balance', header: 'Bakiye', width: 16 },
                { key: 'isActive', header: 'Durum', width: 10 },
                { key: 'bankName', header: 'Banka', width: 18 },
                { key: 'accountNumber', header: 'Hesap No', width: 16 },
                { key: 'iban', header: 'IBAN', width: 30 },
              ],
              'finansal-hesaplar',
              'Finansal Hesaplar'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Hesap
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">Toplam TL Bakiyesi (Aktif Hesaplar)</p>
        {isLoading ? (
          <div className="animate-pulse bg-muted rounded h-10 w-48 mt-2" />
        ) : (
          <p
            className={`text-4xl font-bold mt-2 tabular-nums ${
              totalBalanceTRY >= 0 ? 'text-foreground' : 'text-red-600'
            }`}
          >
            {totalBalanceTRY.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </p>
        )}

        {!isLoading && (
          <div className="mt-5 space-y-3">
            {breakdown.map(({ type, amount, pct }) => {
              const Icon = TYPE_ICONS[type];
              return (
                <div key={type} className="flex items-center gap-3">
                  <div
                    className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${TYPE_BG[type]}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${TYPE_ICON_COLOR[type]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {TYPE_LABELS[type]}
                      </span>
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          amount < 0 ? 'text-red-600' : 'text-foreground'
                        }`}
                      >
                        {fmtCurrency(amount, 'TRY')}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${TYPE_BAR_COLOR[type]} transition-all`}
                        style={{ width: `${(pct * 100).toFixed(1)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Hesap adı veya banka..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-52"
          />
        </div>
        <div className="flex items-center gap-1">
          {TAB_KEYS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {TAB_LABELS[tab]}
              <span
                className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold min-w-[1.25rem] ${
                  activeTab === tab
                    ? 'bg-white/20 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {tabCounts[tab] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          Pasif hesapları göster
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Landmark className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Hesap bulunamadı</p>
              <p className="text-sm">
                {activeTab
                  ? 'Bu tipte hesap bulunmuyor.'
                  : 'Henüz finansal hesap oluşturulmamış.'}
              </p>
            </div>
            {!activeTab && (
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Yeni Hesap Ekle
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((account) => {
            const Icon = TYPE_ICONS[account.type] ?? Banknote;
            const isSelected = selectedAccount?.id === account.id;

            return (
              <div
                key={account.id}
                onClick={() =>
                  setSelectedAccount((prev) => (prev?.id === account.id ? null : account))
                }
                className={`group rounded-xl border bg-card p-5 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary/50'
                    : 'border-border hover:border-primary/40'
                } ${!account.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-11 w-11 rounded-lg flex items-center justify-center ${TYPE_BG[account.type]}`}
                  >
                    <Icon className={`h-5 w-5 ${TYPE_ICON_COLOR[account.type]}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                      {CURRENCY_SYMBOLS[account.currency] ?? account.currency}{' '}
                      {account.currency}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${
                        account.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          account.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      {account.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground leading-tight truncate">
                  {account.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                  {TYPE_LABELS[account.type]}
                </p>

                <div className="flex items-end justify-between">
                  <p
                    className={`text-2xl font-bold tabular-nums ${
                      Number(account.balance ?? 0) < 0 ? 'text-red-600' : 'text-foreground'
                    }`}
                  >
                    {fmtCurrency(Number(account.balance ?? 0), account.currency)}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {account.transactionCount ?? 0} işlem
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAccount((prev) =>
                        prev?.id === account.id ? null : account
                      );
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Hesap Hareketleri
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAccount(account);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Düzenle
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAccount && (
        <TransactionPanel
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}

      {showNewModal && <NewAccountModal onClose={() => setShowNewModal(false)} />}

      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card shadow-xl p-6 text-center space-y-3">
            <Pencil className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="font-medium text-foreground">Hesap Düzenleme</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">{editingAccount.name}</span> hesabı için düzenleme paneli yakında kullanıma açılacak.
            </p>
            <button
              onClick={() => setEditingAccount(null)}
              className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
