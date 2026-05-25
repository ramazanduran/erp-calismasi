'use client';

import { useState } from 'react';
import { Plus, Calculator } from 'lucide-react';
import { useChartOfAccounts } from '@/lib/api/hooks';

const TYPE_LABELS: Record<string, string> = {
  asset: 'Varlık',
  liability: 'Borç',
  equity: 'Özkaynak',
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

export default function AccountsPage() {
  const { data: accounts, isLoading } = useChartOfAccounts();
  const [search, setSearch] = useState('');

  const filtered = (Array.isArray(accounts) ? accounts : []).filter(
    (acc: any) =>
      acc.code.toLowerCase().includes(search.toLowerCase()) ||
      acc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Hesap Planı</h1>
            <p className="text-muted-foreground text-sm">Tek düzen hesap planı</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Yeni Hesap
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
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
          <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Hesap bulunamadı</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Kod</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hesap Adı</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tür</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Borç</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Alacak</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Bakiye</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((acc: any) => {
                const debit = 0;
                const credit = 0;
                const balance = debit - credit;
                return (
                  <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{acc.code}</td>
                    <td className="px-4 py-3 text-sm font-medium">{acc.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_CLASSES[acc.type] || 'bg-gray-100 text-gray-800'}`}>
                        {TYPE_LABELS[acc.type] || acc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {debit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${acc.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600'}`}>
                        {acc.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
