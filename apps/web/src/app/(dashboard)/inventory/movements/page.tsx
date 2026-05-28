'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ArrowLeftRight,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Inbox,
  FileDown,
} from 'lucide-react';
import { useMovements } from '@/lib/api/hooks';
import { MovementModal } from '@/components/modals/movement-modal';
import { exportToExcel } from '@/lib/utils/excel-export';

type MovementType = 'in' | 'out' | 'adjustment' | 'transfer';

const TYPE_LABELS: Record<MovementType, string> = {
  in: 'Giriş',
  out: 'Çıkış',
  adjustment: 'Düzeltme',
  transfer: 'Transfer',
};

const TYPE_CLASSES: Record<MovementType, string> = {
  in: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  out: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  adjustment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  transfer: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const TAB_KEYS = ['', 'in', 'out', 'adjustment', 'transfer'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  '': 'Tümü',
  in: 'Giriş',
  out: 'Çıkış',
  adjustment: 'Düzeltme',
  transfer: 'Transfer',
};

const MOCK_MOVEMENTS = [
  { id: 'mv1', type: 'in', product: { code: 'PRD-001', name: 'Laptop Dell XPS 15' }, warehouse: { name: 'Ana Depo' }, quantity: 10, unit: 'Adet', reference: 'PO-2026-018', date: '2026-05-02T10:00:00Z', note: 'Satın alma girişi' },
  { id: 'mv2', type: 'out', product: { code: 'PRD-001', name: 'Laptop Dell XPS 15' }, warehouse: { name: 'Ana Depo' }, quantity: 3, unit: 'Adet', reference: 'SO-2026-001', date: '2026-05-05T14:00:00Z', note: 'Satış çıkışı' },
  { id: 'mv3', type: 'in', product: { code: 'PRD-004', name: 'A4 Kağıt 80gr' }, warehouse: { name: 'Ana Depo' }, quantity: 100, unit: 'Paket', reference: 'PO-2026-019', date: '2026-05-08T09:00:00Z', note: 'Stok takviyesi' },
  { id: 'mv4', type: 'transfer', product: { code: 'PRD-002', name: 'Ofis Koltuğu' }, warehouse: { name: 'Ana Depo' }, quantity: 5, unit: 'Adet', reference: 'TRF-001', date: '2026-05-10T11:00:00Z', note: 'Şube transferi' },
  { id: 'mv5', type: 'out', product: { code: 'PRD-003', name: 'HP Toner' }, warehouse: { name: 'Ana Depo' }, quantity: 8, unit: 'Kutu', reference: 'SO-2026-003', date: '2026-05-12T15:00:00Z', note: 'Satış çıkışı' },
];

function TypeIcon({ type }: { type: MovementType }) {
  if (type === 'in') return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
  if (type === 'out') return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
  if (type === 'transfer') return <ArrowLeftRight className="h-4 w-4 text-purple-600" />;
  return <RefreshCw className="h-4 w-4 text-blue-600" />;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.FC<{ className?: string }>;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
      <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
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

function SkeletonStatCards() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
          <div className="animate-pulse bg-muted rounded-lg h-11 w-11 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="animate-pulse bg-muted rounded h-3 w-24" />
            <div className="animate-pulse bg-muted rounded h-6 w-16" />
          </div>
        </div>
      ))}
    </>
  );
}

function fmt(n: number, currency = false) {
  if (currency) {
    return n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  }
  return n.toLocaleString('tr-TR');
}

export default function MovementsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: movements, isLoading } = useMovements({ search, type: activeTab || undefined });

  const allMovements: Record<string, unknown>[] = Array.isArray(movements) ? movements : (!isLoading ? MOCK_MOVEMENTS : []);

  const filtered = useMemo(() => {
    return allMovements.filter((m) => {
      if (dateFrom) {
        const created = new Date(m.createdAt as string);
        if (created < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const created = new Date(m.createdAt as string);
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
      return true;
    });
  }, [allMovements, dateFrom, dateTo]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { '': allMovements.length };
    for (const m of allMovements) {
      const t = m.type as string;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [allMovements]);

  const stats = useMemo(() => {
    let inCount = 0;
    let outCount = 0;
    let netValue = 0;
    for (const m of filtered) {
      const qty = Number(m.quantity ?? 0);
      const cost = Number(m.unitCost ?? 0);
      const type = m.type as string;
      if (type === 'in') {
        inCount += qty;
        netValue += qty * cost;
      } else if (type === 'out') {
        outCount += qty;
        netValue -= qty * cost;
      }
    }
    return { total: filtered.length, inCount, outCount, netValue };
  }, [filtered]);

  const footerStats = useMemo(() => {
    let inQty = 0;
    let outQty = 0;
    let totalValue = 0;
    for (const m of filtered) {
      const qty = Number(m.quantity ?? 0);
      const cost = Number(m.unitCost ?? 0);
      const type = m.type as string;
      if (type === 'in') {
        inQty += qty;
        totalValue += qty * cost;
      } else if (type === 'out') {
        outQty += qty;
        totalValue += qty * cost;
      }
    }
    return { inQty, outQty, totalValue };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stok Hareketleri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stok giriş, çıkış ve düzeltme işlemlerini takip edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filtered.map((m) => ({
                type: TYPE_LABELS[(m.type as MovementType)] ?? m.type,
                productName: (m.product as Record<string, unknown>)?.name ?? '',
                productCode: (m.product as Record<string, unknown>)?.code ?? '',
                quantity: m.quantity,
                unitCost: m.unitCost,
                warehouse: (m.warehouse as Record<string, unknown>)?.name ?? '',
                reference: m.reference ?? '',
                notes: m.notes ?? '',
                createdAt: m.createdAt ? new Date(m.createdAt as string).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'type', header: 'Hareket Tipi', width: 14 },
                { key: 'productName', header: 'Ürün', width: 25 },
                { key: 'productCode', header: 'Kod', width: 12 },
                { key: 'quantity', header: 'Miktar', width: 10 },
                { key: 'unitCost', header: 'Birim Maliyet', width: 14 },
                { key: 'warehouse', header: 'Depo', width: 18 },
                { key: 'reference', header: 'Referans', width: 16 },
                { key: 'createdAt', header: 'Tarih', width: 12 },
              ],
              'stok-hareketleri',
              'Stok Hareketleri'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Hareket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <SkeletonStatCards />
        ) : (
          <>
            <StatCard
              label="Toplam Hareket"
              value={fmt(stats.total)}
              sub={`${filtered.length} kayıt`}
              icon={Activity}
              iconClass="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            />
            <StatCard
              label="Giriş"
              value={fmt(stats.inCount)}
              sub={`${tabCounts['in'] ?? 0} hareket`}
              icon={TrendingUp}
              iconClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            />
            <StatCard
              label="Çıkış"
              value={fmt(stats.outCount)}
              sub={`${tabCounts['out'] ?? 0} hareket`}
              icon={TrendingDown}
              iconClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            />
            <StatCard
              label="Net Stok Değeri"
              value={fmt(stats.netValue, true)}
              sub="Giriş − Çıkış maliyeti"
              icon={DollarSign}
              iconClass={stats.netValue >= 0
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}
            />
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Başlangıç</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1"
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Bitiş</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Tarihi Temizle
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ürün adı veya referans ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {TAB_KEYS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {TAB_LABELS[tab]}
              <span
                className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold min-w-[1.25rem] ${
                  activeTab === tab
                    ? 'bg-white/20 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {tabCounts[tab] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tip</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ürün</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Miktar</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Birim Maliyet</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Depo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referans</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                        <Inbox className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">Hareket bulunamadı</p>
                        <p className="text-sm">
                          {search || activeTab || dateFrom || dateTo
                            ? 'Filtrelerinizi değiştirerek tekrar deneyin.'
                            : 'Henüz stok hareketi oluşturulmamış.'}
                        </p>
                      </div>
                      {!search && !activeTab && !dateFrom && !dateTo && (
                        <button
                          onClick={() => setModalOpen(true)}
                          className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Yeni Hareket Ekle
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((movement) => {
                  const product = movement.product as Record<string, unknown> | undefined;
                  const warehouse = movement.warehouse as Record<string, unknown> | undefined;
                  const qty = Number(movement.quantity ?? 0);
                  const unitCost = Number(movement.unitCost ?? 0);
                  const total = qty * unitCost;
                  const mType = movement.type as MovementType;
                  const isIn = mType === 'in';
                  const isOut = mType === 'out';

                  return (
                    <tr
                      key={movement.id as string}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TypeIcon type={mType} />
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              TYPE_CLASSES[mType] ?? ''
                            }`}
                          >
                            {TYPE_LABELS[mType] ?? (movement.type as string)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded bg-muted flex items-center justify-center shrink-0">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {(product?.name as string) ?? '-'}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono truncate">
                              {(product?.code as string) ?? ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        <span
                          className={
                            isIn
                              ? 'text-green-600 dark:text-green-400'
                              : isOut
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-foreground'
                          }
                        >
                          {isIn ? '+' : isOut ? '-' : ''}
                          {Math.abs(qty).toLocaleString('tr-TR')}
                          {product?.unit ? (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              {product.unit as string}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                        {movement.unitCost != null
                          ? Number(movement.unitCost).toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {total > 0
                          ? total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {(warehouse?.name as string) ?? (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {(movement.reference as string) ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {new Date(movement.createdAt as string).toLocaleString('tr-TR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-border bg-muted/30 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{filtered.length}</span> hareket gösteriliyor
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <ArrowUpCircle className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Toplam Giriş:</span>
                  <span className="font-semibold text-green-600 tabular-nums">
                    +{footerStats.inQty.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  <span className="text-muted-foreground">Toplam Çıkış:</span>
                  <span className="font-semibold text-red-600 tabular-nums">
                    -{footerStats.outQty.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pl-4 border-l border-border">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Toplam Değer:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {footerStats.totalValue.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MovementModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
