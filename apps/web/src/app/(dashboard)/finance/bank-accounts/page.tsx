'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Landmark, X, CreditCard, FileDown } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { api } from '@/lib/api/client';

interface FinanceAccount {
  id: string;
  name: string;
  type: string;
  iban?: string;
  swift?: string;
  currency: string;
  balance: number;
  isActive: boolean;
}

interface NewAccountForm {
  name: string;
  iban: string;
  swift: string;
  currency: string;
  balance: string;
}

function formatMoney(amount: number, currency: string) {
  return (
    Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) +
    ' ' +
    currency
  );
}

function maskIban(iban: string) {
  if (!iban || iban.length < 4) return iban;
  return '**** **** **** ' + iban.slice(-4);
}

function NewAccountModal({
  onClose,
  onSave,
  isPending,
}: {
  onClose: () => void;
  onSave: (data: NewAccountForm & { type: 'bank' }) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<NewAccountForm>({
    name: '',
    iban: '',
    swift: '',
    currency: 'TRY',
    balance: '0',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, type: 'bank' });
  };

  const set = (field: keyof NewAccountForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Yeni Banka Hesabı</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Hesap Adı <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="örn. Ziraat Bankası Vadesiz"
              value={form.name}
              onChange={set('name')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              IBAN
            </label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              value={form.iban}
              onChange={set('iban')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              SWIFT / BIC
            </label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="örn. ZIRAASAT"
              value={form.swift}
              onChange={set('swift')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Para Birimi
              </label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={form.currency}
                onChange={set('currency')}
              >
                <option value="TRY">TRY - Türk Lirası</option>
                <option value="USD">USD - Dolar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Başlangıç Bakiyesi
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="0.00"
                value={form.balance}
                onChange={set('balance')}
              />
            </div>
          </div>

          {/* type=bank hidden */}
          <input type="hidden" value="bank" readOnly />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Kaydediliyor...' : 'Hesap Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BankAccountsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: accounts = [], isLoading } = useQuery<FinanceAccount[]>({
    queryKey: ['finance', 'accounts'],
    queryFn: () => api.get<FinanceAccount[]>('api/v1/finance/accounts'),
  });

  const createMutation = useMutation({
    mutationFn: (data: NewAccountForm & { type: 'bank' }) =>
      api.post('api/v1/finance/accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] });
      setShowModal(false);
    },
  });

  // Client-side filter: only bank accounts
  const bankAccounts = accounts.filter((a) => a.type === 'bank');

  const totalTRY = bankAccounts
    .filter((a) => a.isActive && a.currency === 'TRY')
    .reduce((sum, a) => sum + Number(a.balance ?? 0), 0);

  const handleSave = (data: NewAccountForm & { type: 'bank' }) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banka Hesapları</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Şirkete ait banka hesaplarını yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              bankAccounts.map((a) => ({
                name: a.name,
                iban: a.iban ?? '',
                swift: a.swift ?? '',
                currency: a.currency,
                balance: Number(a.balance),
                isActive: a.isActive ? 'Aktif' : 'Pasif',
              })),
              [
                { key: 'name', header: 'Hesap Adı', width: 24 },
                { key: 'iban', header: 'IBAN', width: 30 },
                { key: 'swift', header: 'SWIFT', width: 14 },
                { key: 'currency', header: 'Para Birimi', width: 12 },
                { key: 'balance', header: 'Bakiye', width: 16 },
                { key: 'isActive', header: 'Durum', width: 10 },
              ],
              'banka-hesaplari',
              'Banka Hesapları'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Hesap Ekle
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Toplam Hesap</p>
              <p className="text-2xl font-bold text-foreground">{bankAccounts.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Toplam Bakiye (TRY)</p>
              <p className={`text-2xl font-bold ${totalTRY >= 0 ? 'text-foreground' : 'text-red-600'}`}>
                {isLoading ? (
                  <span className="animate-pulse bg-muted rounded inline-block h-7 w-36" />
                ) : (
                  Number(totalTRY).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="h-5 w-12 bg-muted rounded" />
              </div>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-6 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : bankAccounts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <Landmark className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">Henüz banka hesabı eklenmemiş</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-1 text-sm text-primary hover:underline"
          >
            İlk hesabı ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankAccounts.map((account) => (
            <div
              key={account.id}
              className={`rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all ${
                !account.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {account.currency}
                  </span>
                  {!account.isActive && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">
                      Pasif
                    </span>
                  )}
                </div>
              </div>

              {/* Account Name */}
              <h3 className="font-semibold text-foreground text-sm mb-1 leading-tight">
                {account.name}
              </h3>

              {/* IBAN */}
              {account.iban && (
                <p className="text-xs text-muted-foreground font-mono mb-1">
                  {maskIban(account.iban)}
                </p>
              )}

              {/* SWIFT */}
              {account.swift && (
                <p className="text-xs text-muted-foreground mb-3">
                  SWIFT: {account.swift}
                </p>
              )}

              {/* Balance */}
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-0.5">Güncel Bakiye</p>
                <p className={`text-xl font-bold ${Number(account.balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatMoney(Number(account.balance ?? 0), account.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NewAccountModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          isPending={createMutation.isPending}
        />
      )}
    </div>
  );
}
