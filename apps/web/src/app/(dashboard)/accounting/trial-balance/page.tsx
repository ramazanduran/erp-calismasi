'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Scale, Download, TrendingUp, TrendingDown, Wallet, BarChart3, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';

interface TrialBalanceAccount {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debitBalance: number;
  creditBalance: number;
  balance: number;
}

interface TrialBalanceResponse {
  accounts: TrialBalanceAccount[];
  totals: {
    debitBalance: number;
    creditBalance: number;
    balance: number;
  };
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

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [2023, 2024, 2025, 2026].filter((y) => y <= CURRENT_YEAR + 1);

function formatAmount(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

function getNetBalanceColor(type: string, balance: number) {
  if (Math.abs(balance) < 0.01) return 'text-muted-foreground';
  if (type === 'asset' || type === 'expense') {
    return balance > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  }
  if (type === 'liability' || type === 'equity' || type === 'revenue') {
    return balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400';
  }
  return balance > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

export default function TrialBalancePage() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR.toString());
  const [activeFilter, setActiveFilter] = useState('all');
  const [showZeroBalance, setShowZeroBalance] = useState(false);

  const { data: rawData, isLoading } = useQuery<TrialBalanceResponse | TrialBalanceAccount[]>({
    queryKey: ['accounting', 'trial-balance', selectedYear],
    queryFn: () => api.get('/api/v1/accounting/trial-balance', { year: selectedYear }),
  });

  const { accounts, totals } = useMemo(() => {
    if (!rawData) return { accounts: [], totals: { debitBalance: 0, creditBalance: 0, balance: 0 } };

    if (Array.isArray(rawData)) {
      const accs = rawData as TrialBalanceAccount[];
      const debitBalance = accs.reduce((s, a) => s + (Number(a.debitBalance) || 0), 0);
      const creditBalance = accs.reduce((s, a) => s + (Number(a.creditBalance) || 0), 0);
      return { accounts: accs, totals: { debitBalance, creditBalance, balance: debitBalance - creditBalance } };
    }

    const res = rawData as TrialBalanceResponse;
    return {
      accounts: Array.isArray(res.accounts) ? res.accounts : [],
      totals: res.totals ?? { debitBalance: 0, creditBalance: 0, balance: 0 },
    };
  }, [rawData]);

  const totalByType = (type: string) =>
    accounts
      .filter((a) => a.type === type)
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const totalDebit = totals?.debitBalance ?? accounts.reduce((s, a) => s + (Number(a.debitBalance) || 0), 0);
  const totalCredit = totals?.creditBalance ?? accounts.reduce((s, a) => s + (Number(a.creditBalance) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.01;

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((a) => {
        if (activeFilter !== 'all' && a.type !== activeFilter) return false;
        if (!showZeroBalance && Math.abs(Number(a.debitBalance) || 0) < 0.01 && Math.abs(Number(a.creditBalance) || 0) < 0.01) return false;
        return true;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, activeFilter, showZeroBalance]);

  const summaryCards = [
    { key: 'asset', label: 'Varlıklar', icon: Wallet, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-900/40' },
    { key: 'liability', label: 'Borçlar', icon: TrendingDown, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-900/40' },
    { key: 'equity', label: 'Özkaynaklar', icon: BarChart3, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-900/40' },
    { key: 'revenue', label: 'Gelirler', icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-900/40' },
    { key: 'expense', label: 'Giderler', icon: DollarSign, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-900/40' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mizan</h1>
            <p className="text-muted-foreground text-sm">Hesap bakiyeleri ve genel denge özeti</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className={`rounded-xl border p-4 ${isBalanced ? 'border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10' : 'border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-900/10'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Toplam Borç: </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatAmount(totalDebit)}</span>
            </div>
            <div className="text-muted-foreground">|</div>
            <div>
              <span className="text-muted-foreground">Toplam Alacak: </span>
              <span className="font-bold text-red-600 dark:text-red-400">{formatAmount(totalCredit)}</span>
            </div>
            <div className="text-muted-foreground">|</div>
            <div>
              <span className="text-muted-foreground">Fark: </span>
              <span className={`font-bold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {formatAmount(diff)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            {isBalanced && totalDebit > 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">Mizan Dengeli</span>
              </>
            ) : totalDebit > 0 ? (
              <>
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-orange-600 dark:text-orange-400">Dengede Değil</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => {
          const balance = totalByType(card.key);
          const count = accounts.filter((a) => a.type === card.key).length;
          return (
            <button
              key={card.key}
              onClick={() => setActiveFilter((prev) => (prev === card.key ? 'all' : card.key))}
              className={`text-left rounded-xl border p-4 hover:shadow-sm transition-all ${card.border} ${card.bg} ${activeFilter === card.key ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className={`text-base font-bold ${card.color} leading-tight`}>
                {formatAmount(balance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{count} hesap</p>
            </button>
          );
        })}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showZeroBalance}
            onChange={(e) => setShowZeroBalance(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          Sıfır Bakiyeli Hesapları Göster
        </label>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <p className="text-muted-foreground text-sm">Mizan verileri yükleniyor...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <Scale className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {accounts.length === 0
                ? 'Mizan verisi bulunamadı. Hesap planı oluşturun ve yevmiye kayıtları yapın.'
                : 'Seçili filtreye uyan hesap bulunamadı'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hesap Kodu</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hesap Adı</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tip</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Borç Bakiyesi</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Alacak Bakiyesi</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Bakiye</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAccounts.map((acc) => {
                const debit = Number(acc.debitBalance) || 0;
                const credit = Number(acc.creditBalance) || 0;
                const net = Number(acc.balance) ?? debit - credit;
                const netColor = getNetBalanceColor(acc.type, net);

                return (
                  <tr key={acc.code} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold font-mono">{acc.code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{acc.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_CLASSES[acc.type] || 'bg-gray-100 text-gray-800'}`}>
                        {TYPE_LABELS[acc.type] || acc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {debit > 0 ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {formatAmount(debit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {credit > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {formatAmount(credit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${netColor}`}>
                      {formatAmount(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-border bg-muted/50">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-sm font-bold uppercase tracking-wide">
                  Toplam ({filteredAccounts.length} hesap)
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right text-blue-600 dark:text-blue-400">
                  {formatAmount(filteredAccounts.reduce((s, a) => s + (Number(a.debitBalance) || 0), 0))}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right text-red-600 dark:text-red-400">
                  {formatAmount(filteredAccounts.reduce((s, a) => s + (Number(a.creditBalance) || 0), 0))}
                </td>
                <td className={`px-4 py-3 text-sm font-bold text-right ${isBalanced && activeFilter === 'all' ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                  {formatAmount(filteredAccounts.reduce((s, a) => s + (Number(a.balance) ?? (Number(a.debitBalance) || 0) - (Number(a.creditBalance) || 0)), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
