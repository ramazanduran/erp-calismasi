'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useStockCount, useUpdateStockCountLine, useCompleteStockCount } from '@/lib/api/hooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  open: 'Açık',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

export default function StockCountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: stockCount, isLoading } = useStockCount(id);
  const updateLine = useUpdateStockCountLine();
  const completeCount = useCompleteStockCount();
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const sc = stockCount as any;

  const handleLineUpdate = async (lineId: string, expectedQty: number) => {
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
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!sc) return <div className="text-muted-foreground">Sayım bulunamadı</div>;

  const isCompleted = sc.status === 'completed' || sc.status === 'cancelled';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{sc.countNumber}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Durum: <span className="font-medium">{STATUS_LABELS[sc.status] || sc.status}</span>
              {sc.notes && ` — ${sc.notes}`}
            </p>
          </div>
        </div>
        {!isCompleted && (
          <button
            onClick={handleComplete}
            disabled={completeCount.isPending}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            <CheckCircle className="h-4 w-4" />
            {completeCount.isPending ? 'Tamamlanıyor...' : 'Sayımı Tamamla'}
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {['Ürün ID', 'Beklenen Miktar', 'Sayılan Miktar', 'Fark', 'İşlem'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!sc.lines?.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Satır bulunamadı</td></tr>
            ) : sc.lines.map((line: any) => {
              const diff = line.countedQty !== null ? Number(line.countedQty) - Number(line.expectedQty) : null;
              return (
                <tr key={line.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{line.productId.substring(0, 8)}...</td>
                  <td className="px-4 py-3 font-medium">{Number(line.expectedQty).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {isCompleted ? (
                      <span className="font-medium">{line.countedQty !== null ? Number(line.countedQty).toFixed(2) : '-'}</span>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={line.countedQty !== null ? Number(line.countedQty) : ''}
                        onChange={(e) => setEditingValues(prev => ({ ...prev, [line.id]: e.target.value }))}
                        onBlur={() => handleLineUpdate(line.id, Number(line.expectedQty))}
                        className="w-28 rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="0.00"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {diff !== null ? (
                      <span className={cn('font-medium', diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-muted-foreground')}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {!isCompleted && editingValues[line.id] !== undefined && (
                      <button
                        onClick={() => handleLineUpdate(line.id, Number(line.expectedQty))}
                        className="text-xs text-primary hover:underline">
                        Kaydet
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
