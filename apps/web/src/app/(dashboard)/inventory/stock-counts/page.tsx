'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';
import { useStockCounts, useCreateStockCount } from '@/lib/api/hooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  open: 'Açık',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function StockCountsPage() {
  const { data: counts, isLoading } = useStockCounts();
  const createCount = useCreateStockCount();
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const list = (counts as any[]) || [];

  const handleCreate = async () => {
    try {
      await createCount.mutateAsync({ notes: notes || undefined });
      toast.success('Stok sayımı oluşturuldu');
      setShowForm(false);
      setNotes('');
    } catch {
      toast.error('Stok sayımı oluşturulamadı');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stok Sayım</h1>
          <p className="text-muted-foreground text-sm mt-1">Stok sayım listesi ve yönetimi</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Yeni Sayım
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <h2 className="font-semibold">Yeni Stok Sayımı Oluştur</h2>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Notlar (opsiyonel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sayım notları..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createCount.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {createCount.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
              İptal
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {['Sayım No', 'Durum', 'Ürün Sayısı', 'Başlangıç', 'Tamamlanma', 'İşlemler'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
            )) : !list.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                    <p>Henüz stok sayımı yok</p>
                  </div>
                </td>
              </tr>
            ) : list.map((sc: any) => (
              <tr key={sc.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm font-medium">{sc.countNumber}</td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[sc.status] || 'bg-muted text-muted-foreground')}>
                    {STATUS_LABELS[sc.status] || sc.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{sc._count?.lines ?? 0} ürün</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {sc.startedAt ? new Date(sc.startedAt).toLocaleDateString('tr-TR') : '-'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {sc.completedAt ? new Date(sc.completedAt).toLocaleDateString('tr-TR') : '-'}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/inventory/stock-counts/${sc.id}`} className="text-xs text-primary hover:underline">
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
