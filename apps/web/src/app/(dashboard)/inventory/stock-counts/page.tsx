'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, ClipboardList, X, CheckCircle2, Clock, FileSearch,
  Hash, Calendar, Package, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, AlertCircle, User, Layers, FileDown, Search,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StockCountLine {
  id: string;
  product: { name: string; code: string; unit: string };
  expectedQty: number;
  actualQty: number;
  difference: number;
}

interface StockCount {
  id: string;
  countNumber: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  warehouseId?: string;
  startedAt?: string;
  completedAt?: string;
  createdBy?: { firstName: string; lastName: string };
  _count?: { lines: number };
}

interface StockCountDetail extends StockCount {
  lines: StockCountLine[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const FILTER_TABS = [
  { key: 'all', label: 'Tümü' },
  { key: 'in_progress', label: 'Devam Ediyor' },
  { key: 'completed', label: 'Tamamlandı' },
  { key: 'draft', label: 'Taslak' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function DiffCell({ diff }: { diff: number }) {
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" />
        {diff.toLocaleString('tr-TR')}
      </span>
    );
  }
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
        <TrendingUp className="h-3 w-3" />
        +{diff.toLocaleString('tr-TR')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
      <TrendingDown className="h-3 w-3" />
      {diff.toLocaleString('tr-TR')}
    </span>
  );
}

// ─── Count Detail Modal ───────────────────────────────────────────────────────

function CountDetailModal({ countId, countNumber, onClose }: {
  countId: string;
  countNumber: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery<StockCountDetail>({
    queryKey: ['stock-count', countId],
    queryFn: () => api.get(`/api/v1/inventory/stock-counts/${countId}`),
    enabled: !!countId,
  });

  const detail = data as StockCountDetail | undefined;
  const lines = detail?.lines ?? [];

  const surplusLines = lines.filter(l => l.difference > 0).length;
  const deficitLines = lines.filter(l => l.difference < 0).length;
  const matchedLines = lines.filter(l => l.difference === 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Sayım Detayı</h2>
            <p className="text-sm text-muted-foreground font-mono">{countNumber}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary bar */}
        {!isLoading && lines.length > 0 && (
          <div className="grid grid-cols-3 gap-3 px-6 py-3 bg-muted/30 border-b border-border shrink-0">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Fazla</p>
              <p className="text-lg font-bold text-green-600">{surplusLines}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Eşleşti</p>
              <p className="text-lg font-bold text-foreground">{matchedLines}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Eksik</p>
              <p className="text-lg font-bold text-red-600">{deficitLines}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-10 w-10 mb-3 opacity-40" />
              <p>Bu sayımda ürün satırı bulunamadı</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ürün Kodu</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ürün Adı</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Beklenen</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Gerçek</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Fark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line) => (
                  <tr key={line.id} className={cn(
                    'hover:bg-muted/30 transition-colors',
                    line.difference < 0 && 'bg-red-50/50 dark:bg-red-950/10',
                    line.difference > 0 && 'bg-green-50/50 dark:bg-green-950/10',
                  )}>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      {line.product.code}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium">{line.product.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">({line.product.unit})</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {Number(line.expectedQty).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {Number(line.actualQty).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <DiffCell diff={Number(line.difference)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border shrink-0 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{lines.length} ürün satırı</span>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Count Modal ──────────────────────────────────────────────────────────

function NewCountModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');

  const create = useMutation({
    mutationFn: (data: { notes?: string }) =>
      api.post('/api/v1/inventory/stock-counts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-counts'] });
      toast.success('Stok sayımı başlatıldı');
      onClose();
    },
    onError: () => toast.error('Stok sayımı oluşturulamadı'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({ notes: notes.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Yeni Sayım Başlat</h2>
            <p className="text-sm text-muted-foreground">Yeni bir stok sayımı oluşturun</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Notlar <span className="text-muted-foreground font-normal">(opsiyonel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sayım hakkında notlar ekleyin..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Sayım başlatıldığında otomatik bir sayım numarası atanır ve sayım durumu &quot;Devam Ediyor&quot; olarak işaretlenir.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {create.isPending ? 'Oluşturuluyor...' : 'Sayım Başlat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Complete Confirm Modal ───────────────────────────────────────────────────

function CompleteConfirmModal({ count, onClose }: {
  count: StockCount;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const complete = useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/v1/inventory/stock-counts/${id}/complete`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-counts'] });
      qc.invalidateQueries({ queryKey: ['stock-count', count.id] });
      toast.success('Sayım tamamlandı');
      onClose();
    },
    onError: () => toast.error('Sayım tamamlanamadı'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-sm">
        <div className="px-6 py-5 text-center space-y-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sayımı Tamamla</h2>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-mono font-medium">{count.countNumber}</span> numaralı sayımı tamamlamak istediğinizden emin misiniz?
            </p>
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
            Bu işlem geri alınamaz. Sayım tamamlandıktan sonra stok düzeltmeleri uygulanacaktır.
          </p>
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => complete.mutate(count.id)}
            disabled={complete.isPending}
            className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {complete.isPending ? 'Tamamlanıyor...' : 'Tamamla'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, colorClass, subLabel,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  colorClass: string;
  subLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={cn('flex items-center gap-2 mb-2', colorClass)}>
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subLabel && <p className="text-xs text-muted-foreground mt-0.5">{subLabel}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StockCountsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [detailCount, setDetailCount] = useState<StockCount | null>(null);
  const [completeCount, setCompleteCount] = useState<StockCount | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<StockCount[]>({
    queryKey: ['stock-counts'],
    queryFn: () => api.get('/api/v1/inventory/stock-counts'),
  });

  const allCounts = (data as StockCount[]) ?? [];

  const filteredCounts = useMemo(() => {
    let result = activeTab === 'all' ? allCounts : allCounts.filter(c => c.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.countNumber?.toLowerCase().includes(q) ||
        (c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}`.toLowerCase().includes(q) : false)
      );
    }
    return result;
  }, [allCounts, activeTab, search]);

  const totalCount = allCounts.length;
  const inProgressCount = allCounts.filter(c => c.status === 'in_progress').length;
  const completedCount = allCounts.filter(c => c.status === 'completed').length;

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stok Sayım</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stok sayım işlemlerini yönetin ve takip edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filteredCounts.map((c) => ({
                countNumber: c.countNumber,
                status: STATUS_LABELS[c.status] ?? c.status,
                createdBy: c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}` : '',
                lineCount: c._count?.lines ?? 0,
                startedAt: c.startedAt ? new Date(c.startedAt).toLocaleDateString('tr-TR') : '',
                completedAt: c.completedAt ? new Date(c.completedAt).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'countNumber', header: 'Sayım No', width: 14 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'createdBy', header: 'Oluşturan', width: 20 },
                { key: 'lineCount', header: 'Kalem Sayısı', width: 12 },
                { key: 'startedAt', header: 'Başlangıç', width: 12 },
                { key: 'completedAt', header: 'Tamamlanma', width: 12 },
              ],
              'stok-sayim',
              'Stok Sayım'
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
            Yeni Sayım Başlat
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Toplam Sayım"
          value={totalCount}
          icon={Layers}
          colorClass="text-blue-600"
          subLabel="tüm zamanlar"
        />
        <SummaryCard
          label="Devam Eden"
          value={inProgressCount}
          icon={Clock}
          colorClass="text-yellow-600"
          subLabel="aktif sayım"
        />
        <SummaryCard
          label="Tamamlandı"
          value={completedCount}
          icon={CheckCircle2}
          colorClass="text-green-600"
          subLabel="tamamlanan sayım"
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Sayım no veya oluşturan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-52"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {FILTER_TABS.map((tab) => {
          const count = tab.key === 'all'
            ? allCounts.length
            : allCounts.filter(c => c.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}>
                {count}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    Sayım No
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Başlangıç
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Bitiş
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Oluşturan
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Ürün Sayısı
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={7} />
              ) : filteredCounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardList className="h-10 w-10 opacity-30" />
                      <div>
                        <p className="font-medium">Sayım bulunamadı</p>
                        <p className="text-xs mt-1">
                          {activeTab === 'all'
                            ? 'Henüz hiç sayım başlatılmamış'
                            : 'Bu kategoride sayım yok'}
                        </p>
                      </div>
                      {activeTab === 'all' && (
                        <button
                          onClick={() => setShowNewModal(true)}
                          className="text-primary text-sm hover:underline"
                        >
                          İlk sayımı başlat
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCounts.map((sc) => {
                  const isExpanded = expandedRows.has(sc.id);
                  return (
                    <tr
                      key={sc.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {sc.countNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sc.startedAt
                          ? new Date(sc.startedAt).toLocaleDateString('tr-TR', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sc.completedAt
                          ? new Date(sc.completedAt).toLocaleDateString('tr-TR', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sc.createdBy
                          ? `${sc.createdBy.firstName} ${sc.createdBy.lastName}`
                          : <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Package className="h-3.5 w-3.5" />
                          {sc._count?.lines ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          STATUS_COLORS[sc.status] ?? 'bg-muted text-muted-foreground',
                        )}>
                          {STATUS_LABELS[sc.status] ?? sc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetailCount(sc)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <FileSearch className="h-3.5 w-3.5" />
                            Detay
                          </button>
                          {sc.status === 'in_progress' && (
                            <button
                              onClick={() => setCompleteCount(sc)}
                              className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Tamamla
                            </button>
                          )}
                          {sc._count && sc._count.lines > 0 && (
                            <button
                              onClick={() => toggleExpand(sc.id)}
                              className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                              title={isExpanded ? 'Küçült' : 'Satırları göster'}
                            >
                              {isExpanded
                                ? <ChevronUp className="h-4 w-4" />
                                : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!isLoading && filteredCounts.length > 0 && (
          <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filteredCounts.length} sayım gösteriliyor
            </span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Devam Ediyor: {inProgressCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Tamamlandı: {completedCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewCountModal onClose={() => setShowNewModal(false)} />
      )}
      {detailCount && (
        <CountDetailModal
          countId={detailCount.id}
          countNumber={detailCount.countNumber}
          onClose={() => setDetailCount(null)}
        />
      )}
      {completeCount && (
        <CompleteConfirmModal
          count={completeCount}
          onClose={() => setCompleteCount(null)}
        />
      )}
    </div>
  );
}
