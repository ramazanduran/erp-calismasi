'use client';

import { useState } from 'react';
import { Plus, Banknote, CreditCard, Landmark } from 'lucide-react';
import { useAccounts } from '@/lib/api/hooks';

type AccountType = 'bank' | 'cash' | 'credit';

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

const TYPE_COLORS: Record<AccountType, string> = {
  bank: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  cash: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  credit: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
};

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="animate-pulse bg-muted rounded h-10 w-10" />
        <div className="animate-pulse bg-muted rounded h-4 w-8" />
      </div>
      <div className="animate-pulse bg-muted rounded h-4 w-3/4" />
      <div className="animate-pulse bg-muted rounded h-3 w-1/2" />
      <div className="animate-pulse bg-muted rounded h-6 w-1/2" />
    </div>
  );
}

export default function AccountsPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const { data: accounts, isLoading } = useAccounts({ type: typeFilter || undefined, isActive: showInactive ? undefined : true });

  const accountsList = Array.isArray(accounts) ? accounts : [];
  const filtered = accountsList.filter((a: Record<string, unknown>) => {
    if (typeFilter && a.type !== typeFilter) return false;
    if (!showInactive && !a.isActive) return false;
    return true;
  });

  const totalBalanceTRY = accountsList
    .filter((a: Record<string, unknown>) => a.isActive && a.currency === 'TRY')
    .reduce((s: number, a: Record<string, unknown>) => s + Number(a.balance ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finansal Hesaplar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Banka hesapları, kasalar ve kredi kartlarını yönetin
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Yeni Hesap
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Toplam TL Bakiyesi (Aktif Hesaplar)</p>
        <p className={`text-3xl font-bold mt-1 ${totalBalanceTRY >= 0 ? 'text-foreground' : 'text-red-600'}`}>
          {isLoading ? (
            <span className="animate-pulse bg-muted rounded inline-block h-8 w-40" />
          ) : (
            totalBalanceTRY.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm Hesap Tipleri</option>
          <option value="bank">Banka Hesabı</option>
          <option value="cash">Kasa</option>
          <option value="credit">Kredi Kartı</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-border"
          />
          Pasif hesapları göster
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-lg border border-border bg-card">
          Henüz kayıt yok
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((account: Record<string, unknown>) => {
            const Icon = TYPE_ICONS[(account.type as AccountType)] ?? Banknote;
            return (
              <div
                key={account.id as string}
                className={`rounded-lg border border-border bg-card p-5 hover:border-primary/50 transition-colors cursor-pointer ${!account.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${TYPE_COLORS[(account.type as AccountType)] ?? 'text-foreground bg-muted'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{account.currency as string}</span>
                    {!account.isActive && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">
                        Pasif
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-medium text-foreground text-sm leading-tight mb-1">
                  {account.name as string}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {TYPE_LABELS[(account.type as AccountType)] ?? account.type as string}
                </p>
                <div className="flex items-end justify-between">
                  <p className={`text-xl font-bold ${Number(account.balance ?? 0) < 0 ? 'text-red-600' : 'text-foreground'}`}>
                    {Number(account.balance ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: account.currency as string ?? 'TRY' })}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {account.transactionCount as number ?? 0} işlem
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
