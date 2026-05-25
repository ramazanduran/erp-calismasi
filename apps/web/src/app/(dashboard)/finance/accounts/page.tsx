'use client';

import { useState } from 'react';
import { Plus, Banknote, CreditCard, Landmark } from 'lucide-react';

type AccountType = 'bank' | 'cash' | 'credit';

interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  isActive: boolean;
  transactionCount: number;
}

const MOCK_ACCOUNTS: FinancialAccount[] = [
  {
    id: '1',
    name: 'Garanti Bankası - TL Ana Hesap',
    type: 'bank',
    currency: 'TRY',
    balance: 245000,
    isActive: true,
    transactionCount: 87,
  },
  {
    id: '2',
    name: 'İş Bankası - USD Döviz Hesabı',
    type: 'bank',
    currency: 'USD',
    balance: 12500,
    isActive: true,
    transactionCount: 23,
  },
  {
    id: '3',
    name: 'Kasa - Merkez',
    type: 'cash',
    currency: 'TRY',
    balance: 15750,
    isActive: true,
    transactionCount: 145,
  },
  {
    id: '4',
    name: 'Yapı Kredi - Kredi Kartı',
    type: 'credit',
    currency: 'TRY',
    balance: -8500,
    isActive: true,
    transactionCount: 34,
  },
  {
    id: '5',
    name: 'Eski Kasa',
    type: 'cash',
    currency: 'TRY',
    balance: 0,
    isActive: false,
    transactionCount: 12,
  },
];

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

export default function AccountsPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filtered = MOCK_ACCOUNTS.filter((a) => {
    const matchType = !typeFilter || a.type === typeFilter;
    const matchActive = showInactive || a.isActive;
    return matchType && matchActive;
  });

  const totalBalanceTRY = MOCK_ACCOUNTS
    .filter((a) => a.isActive && a.currency === 'TRY')
    .reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Total Balance */}
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Toplam TL Bakiyesi (Aktif Hesaplar)</p>
        <p className={`text-3xl font-bold mt-1 ${totalBalanceTRY >= 0 ? 'text-foreground' : 'text-red-600'}`}>
          {totalBalanceTRY.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
        </p>
      </div>

      {/* Filters */}
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

      {/* Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((account) => {
          const Icon = TYPE_ICONS[account.type];
          return (
            <div
              key={account.id}
              className={`rounded-lg border border-border bg-card p-5 hover:border-primary/50 transition-colors cursor-pointer ${!account.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${TYPE_COLORS[account.type]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{account.currency}</span>
                  {!account.isActive && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">
                      Pasif
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-medium text-foreground text-sm leading-tight mb-1">
                {account.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">{TYPE_LABELS[account.type]}</p>
              <div className="flex items-end justify-between">
                <p
                  className={`text-xl font-bold ${
                    account.balance < 0 ? 'text-red-600' : 'text-foreground'
                  }`}
                >
                  {account.balance.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: account.currency,
                  })}
                </p>
                <span className="text-xs text-muted-foreground">
                  {account.transactionCount} işlem
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground rounded-lg border border-border bg-card">
          Hesap bulunamadı
        </div>
      )}
    </div>
  );
}
