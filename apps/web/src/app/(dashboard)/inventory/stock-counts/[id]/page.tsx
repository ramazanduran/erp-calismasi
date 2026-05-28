'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, Package, AlertTriangle, BarChart3, ClipboardCheck } from 'lucide-react';
import { useStockCount, useUpdateStockCountLine, useCompleteStockCount } from '@/lib/api/hooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const MOCK_STOCK_COUNT = {
  id: 'sc-demo',
  name: 'Mayıs 2026 Sayımı',
  countNumber: 'SC-2026-001',
  status: 'in_progress',
  countDate: '2026-05-28T08:00:00Z',
  warehouse: { name: 'Ana Depo' },
  notes: 'Aylık periyodik sayım',
  lines: [
    { id: 'scl1', product: { id: 'p1', name: 'Laptop Dell XPS 15', code: 'PRD-001' }, unit: 'Adet', expectedQty: 10, countedQty: 8 },
    { id: 'scl2', product: { id: 'p2', name: 'Ofis Koltuğu', code: 'PRD-002' }, unit: 'Adet', expectedQty: 25, countedQty: 25 },
    { id: 'scl3', product: { id: 'p3', name: 'HP Toner', code: 'PRD-003' }, unit: 'Kutu', expectedQty: 50, countedQty: null },
    { id: 'scl4', product: { id: 'p4', name: 'A4 Kağıt 80gr', code: 'PRD-004' }, unit: 'Paket', expectedQty: 200, countedQty: 198 },
    { id: 'scl5', product: { id: 'p5', name: 'USB Hub 7 Port', code: 'PRD-005' }, unit: 'Adet', expectedQty: 15, countedQty: null },
  ],
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Açık',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

const STATUS_CLASSES: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function StockCountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: stockCount, isLoading } = useStockCount(id);
  const updateLine = useUpdateStockCountLine();
  const completeCount = useCompleteStockCount();
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const effectiveSC = stockCount ?? (!isLoading ? MOCK_STOCK_COUNT : undefined);
  const sc = effectiveSC as Record<string, unknown> | undefined;
  const lines = Array.isArray((sc as Record<string, unknown>)?.lines) ? (sc as Record<string, unknown>).lines as Record<string, unknown>[] : [];

  const stats = useMemo(() => {
    const total = lines.length;
    const counted = lines.filter((l) => l.countedQty !== null && l.countedQty !== undefined).length;
    const discrepancies = lines.filter((l) => {
      if (l.countedQty === null || l.countedQty === undefined) return false;
      return Number(l.countedQty) !== Number(l.expectedQty);
    }).length;
    const totalExpected = lines.reduce((s, l) => s + Number(l.expectedQty ?? 0), 0);
    const totalCounted = lines.reduce((s, l) => s + (l.countedQty !== null && l.countedQty !== undefined ? Number(l.countedQty) : 0), 0);
    const progress = total > 0 ? Math.round((counted / total) * 100) : 0;
    return { total, counted, discrepancies, totalExpected, totalCounted, progress };
  }, [lines]);

  const handleLineUpdate = async (lineId: string) => {
    const val = editingValues[lineId];
    if (val === undefined || val === '') return;
    const countedQty = Number(val);
    if (isNaN(countedQty)) return;
    try {
      await updateLine.mutateAsync({ stockCountId: id, lineId, countedQty });
      toast.success('Miktar güncellendi');
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  const handleComplete = async () => {
    if (!confirm('Sayımı tamamlamak istiyor musunuz? Stok miktarları güncellenecektir.')) return;
    try {
      await completeCount.mutateAsync(id);
      toast.success('Sayım tamamlandı, stok miktarları güncellendi');
      router.push('/inventory/stock-counts');
    } catch {
      toast.error('Sayım tamamlanamadı');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!sc) return (
    <div className="text-center py-12 text-muted-foreground">
      <p>Sayım bulunamadı</p>
      <Link href="/inventory/stock-counts" className="text-primary hover:underline text-sm mt-2 inline-block">
        Sayım Listesi
      </Link>
    </div>
  );

  const isCompleted = sc.status === 'completed' || sc.status === 'cancelled';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono">{sc.countNumber as string}</h1>
              <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_CLASSES[sc.status as string] ?? STATUS_CLASSES.open)}>
                {STATUS_LABELS[sc.status as string] ?? sc.status as string}
              </span>
            </div>
            {sc.notes && <p className="text-sm text-muted-foreground mt-0.5">{sc.notes as string}</p>}
          </div>
        </div>
        {!isCompleted && (
          <button
            onClick={handleComplete}
            disabled={completeCount.isPending || stats.counted === 0}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            {completeCount.isPending ? 'Tamamlanıyor...' : 'Sayımı Tamamla'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Ürün', value: stats.total, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Sayılan', value: `${stats.counted} / ${stats.total}`, icon: ClipboardCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Fark Var', value: stats.discrepancies, icon: AlertTriangle, color: stats.discrepancies > 0 ? 'text-yellow-500' : 'text-gray-400', bg: stats.discrepancies > 0 ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-gray-50 dark:bg-gray-900' },
          { label: 'Tamamlanma', value: `%${stats.progress}`, icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold mt-0.5">{card.value}</p>
              </div>
              <div className={cn('p-2 rounded-lg', card.bg)}>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {!isCompleted && stats.total > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-foreground">Sayım İlerlemesi</span>
            <span className="text-muted-foreground">{stats.counted} / {stats.total} ürün sayıldı</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Lines Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Sayım Kalemleri</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Ürün</th>
                <th className="px-4 py-3 text-right font-medium">Beklenen</th>
                <th className="px-4 py-3 text-right font-medium">Sayılan</th>
                <th className="px-4 py-3 text-right font-medium">Fark</th>
                {!isCompleted && <th className="px-4 py-3 text-left font-medium">İşlem</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!lines.length ? (
                <tr><td colSpan={isCompleted ? 4 : 5} className="px-4 py-8 text-center text-muted-foreground">Satır bulunamadı</td></tr>
              ) : lines.map((line) => {
                const product = line.product as Record<string, unknown> | undefined;
                const productName = product?.name as string ?? (product?.code as string) ?? `#${(line.productId as string).substring(0, 8)}`;
                const productCode = product?.code as string | undefined;
                const expected = Number(line.expectedQty ?? 0);
                const counted = line.countedQty !== null && line.countedQty !== undefined ? Number(line.countedQty) : null;
                const diff = counted !== null ? counted - expected : null;

                return (
                  <tr key={line.id as string} className={cn('hover:bg-muted/30 transition-colors', diff !== null && diff !== 0 ? 'bg-yellow-50/30 dark:bg-yellow-950/10' : '')}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{productName}</div>
                      {productCode && <div className="text-xs text-muted-foreground font-mono">{productCode}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{expected.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      {isCompleted ? (
                        <span className="font-medium">{counted !== null ? counted.toFixed(2) : '-'}</span>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={counted !== null ? counted : ''}
                          onChange={(e) => setEditingValues((prev) => ({ ...prev, [line.id as string]: e.target.value }))}
                          onBlur={() => handleLineUpdate(line.id as string)}
                          className="w-28 rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring text-right"
                          placeholder="0.00"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {diff !== null ? (
                        <span className={cn('font-medium', diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-muted-foreground')}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    {!isCompleted && (
                      <td className="px-4 py-3">
                        {editingValues[line.id as string] !== undefined && (
                          <button
                            onClick={() => handleLineUpdate(line.id as string)}
                            className="text-xs text-primary hover:underline"
                          >
                            Kaydet
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            {isCompleted && stats.total > 0 && (
              <tfoot className="border-t border-border bg-muted/30">
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">Toplam</td>
                  <td className="px-4 py-3 text-right font-semibold">{stats.totalExpected.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{stats.totalCounted.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('font-semibold', (stats.totalCounted - stats.totalExpected) !== 0 ? 'text-yellow-600' : 'text-muted-foreground')}>
                      {(stats.totalCounted - stats.totalExpected) >= 0 ? '+' : ''}{(stats.totalCounted - stats.totalExpected).toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
