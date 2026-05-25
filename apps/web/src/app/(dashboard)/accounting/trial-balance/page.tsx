'use client';

import { Scale } from 'lucide-react';
import { useTrialBalance } from '@/lib/api/hooks';

const TYPE_LABELS: Record<string, string> = {
  asset: 'Varlık',
  liability: 'Borç',
  equity: 'Özkaynak',
  revenue: 'Gelir',
  expense: 'Gider',
};

export default function TrialBalancePage() {
  const { data: lines, isLoading } = useTrialBalance();

  const list = Array.isArray(lines) ? lines : [];

  const totalDebit = list.reduce((s: number, l: any) => s + Number(l.debit), 0);
  const totalCredit = list.reduce((s: number, l: any) => s + Number(l.credit), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mizan</h1>
          <p className="text-muted-foreground text-sm">Hesap bakiyeleri özeti</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Toplam Borç</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Toplam Alacak</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Fark</p>
          <p className={`text-2xl font-bold mt-1 ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
            {Math.abs(totalDebit - totalCredit).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
          {Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Dengeli</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Mizan verisi bulunamadı. Önce hesap planı oluşturun ve yevmiye kayıtları yapın.
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hesap Kodu</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hesap Adı</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tür</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Borç</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Alacak</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Bakiye</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((line: any) => {
                const balance = line.debit - line.credit;
                return (
                  <tr key={line.code} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{line.code}</td>
                    <td className="px-4 py-3 text-sm">{line.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{TYPE_LABELS[line.type] || line.type}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {line.debit > 0 ? line.debit.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {line.credit > 0 ? line.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${balance > 0 ? 'text-blue-600 dark:text-blue-400' : balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                      {balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-border bg-muted/50">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-sm font-bold">TOPLAM</td>
                <td className="px-4 py-3 text-sm font-bold text-right text-blue-600 dark:text-blue-400">
                  {totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right text-red-600 dark:text-red-400">
                  {totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td className={`px-4 py-3 text-sm font-bold text-right ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                  {(totalDebit - totalCredit).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
