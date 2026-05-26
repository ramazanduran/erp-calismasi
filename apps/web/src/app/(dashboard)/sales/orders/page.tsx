'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  ShoppingCart,
  Truck,
  CheckCircle2,
  Boxes,
  PackageCheck,
  X,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrders, useOrder, useUpdateOrder, useDeleteOrder } from '@/lib/api/hooks';
import { OrderModal } from '@/components/modals/order-modal';
import { cn } from '@/lib/utils';

type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type SortField = 'orderNumber' | 'customer' | 'itemCount' | 'netAmount' | 'taxAmount' | 'totalAmount' | 'dueDate' | 'createdAt' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Taslak',
  confirmed: 'Onaylandı',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'draft', label: 'Taslak' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'processing', label: 'Hazırlanıyor' },
  { value: 'shipped', label: 'Kargoda' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal' },
];

function formatCurrency(amount: number, currency = 'TRY') {
  return amount.toLocaleString('tr-TR', { style: 'currency', currency });
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function SortButton({
  field,
  sortField,
  sortDir,
  onSort,
  children,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  children: React.ReactNode;
}) {
  const active = sortField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        'inline-flex items-center gap-1 hover:text-foreground transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {children}
      {active ? (
        sortDir === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );
}

function ExpandedOrderRow({ orderId, colSpan }: { orderId: string; colSpan: number }) {
  const { data: order, isLoading } = useOrder(orderId);
  const orderData = order as Record<string, unknown> | undefined;
  const items = Array.isArray(orderData?.items) ? (orderData!.items as Record<string, unknown>[]) : [];

  if (isLoading) {
    return (
      <tr>
        <td colSpan={colSpan} className="bg-muted/20 px-8 py-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left pb-2 font-medium">Ürün</th>
                <th className="text-right pb-2 font-medium">Miktar</th>
                <th className="text-left pb-2 font-medium">Birim</th>
                <th className="text-right pb-2 font-medium">Birim Fiyat</th>
                <th className="text-right pb-2 font-medium">KDV%</th>
                <th className="text-right pb-2 font-medium">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="py-1.5 pr-3">
                      <div className="animate-pulse bg-muted rounded h-3 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </td>
      </tr>
    );
  }

  const currency = (orderData?.currency as string) ?? 'TRY';
  const totalAmount = Number(orderData?.totalAmount ?? 0);

  return (
    <tr>
      <td colSpan={colSpan} className="bg-muted/20 px-8 py-4">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sipariş kalemi bulunamadı.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left pb-2 font-medium">Ürün</th>
                <th className="text-right pb-2 font-medium">Miktar</th>
                <th className="text-left pb-2 font-medium">Birim</th>
                <th className="text-right pb-2 font-medium">Birim Fiyat</th>
                <th className="text-right pb-2 font-medium">KDV%</th>
                <th className="text-right pb-2 font-medium">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const product = item.product as Record<string, unknown> | undefined;
                const productName = (product?.name as string) ?? (item.productName as string) ?? '-';
                const qty = Number(item.quantity ?? 0);
                const unit = (item.unit as string) ?? '';
                const unitPrice = Number(item.unitPrice ?? 0);
                const taxRate = Number(item.taxRate ?? 0);
                const lineTotal = Number(item.totalAmount ?? qty * unitPrice);
                return (
                  <tr key={idx} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 pr-3 text-foreground font-medium">{productName}</td>
                    <td className="py-1.5 pr-3 text-right text-muted-foreground">{qty}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{unit}</td>
                    <td className="py-1.5 pr-3 text-right text-muted-foreground">
                      {formatCurrency(unitPrice, currency)}
                    </td>
                    <td className="py-1.5 pr-3 text-right text-muted-foreground">%{taxRate}</td>
                    <td className="py-1.5 text-right font-medium text-foreground">
                      {formatCurrency(lineTotal, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={5} className="pt-2 text-right font-semibold text-foreground pr-3">
                  Sipariş Toplamı
                </td>
                <td className="pt-2 text-right font-semibold text-foreground">
                  {formatCurrency(totalAmount, currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </td>
    </tr>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: orders, isLoading } = useOrders({ search });
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const allOrders = useMemo(() => (Array.isArray(orders) ? (orders as Record<string, unknown>[]) : []), [orders]);

  const stats = useMemo(() => {
    const total = allOrders.length;
    const pending = allOrders.filter((o) => o.status === 'draft' || o.status === 'confirmed').length;
    const processing = allOrders.filter((o) => o.status === 'processing').length;
    const totalAmount = allOrders.reduce((sum, o) => sum + Number(o.totalAmount ?? o.netAmount ?? 0), 0);
    return { total, pending, processing, totalAmount };
  }, [allOrders]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { '': allOrders.length };
    for (const s of ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']) {
      counts[s] = allOrders.filter((o) => o.status === s).length;
    }
    return counts;
  }, [allOrders]);

  const filtered = useMemo(() => {
    let list = allOrders;
    if (statusFilter) {
      list = list.filter((o) => o.status === statusFilter);
    }
    list = [...list].sort((a, b) => {
      let av: unknown;
      let bv: unknown;
      if (sortField === 'customer') {
        av = (a.customer as Record<string, unknown>)?.name ?? '';
        bv = (b.customer as Record<string, unknown>)?.name ?? '';
      } else {
        av = a[sortField];
        bv = b[sortField];
      }
      const aStr = String(av ?? '');
      const bStr = String(bv ?? '');
      const aNum = Number(av);
      const bNum = Number(bv);
      const isNumeric = !isNaN(aNum) && !isNaN(bNum) && av !== '' && bv !== '';
      if (isNumeric) {
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return sortDir === 'asc' ? aStr.localeCompare(bStr, 'tr') : bStr.localeCompare(aStr, 'tr');
    });
    return list;
  }, [allOrders, statusFilter, sortField, sortDir]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, o) => sum + Number(o.totalAmount ?? o.netAmount ?? 0), 0),
    [filtered],
  );

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleStatusAdvance(id: string, currentStatus: OrderStatus) {
    const nextMap: Partial<Record<OrderStatus, OrderStatus>> = {
      draft: 'confirmed',
      confirmed: 'processing',
      processing: 'shipped',
      shipped: 'delivered',
    };
    const next = nextMap[currentStatus];
    if (!next) return;
    setPendingId(id);
    try {
      await updateOrder.mutateAsync({ id, data: { status: next } });
      toast.success(`Sipariş durumu "${STATUS_LABELS[next]}" olarak güncellendi`);
    } catch {
      toast.error('Durum güncellenemedi');
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string, orderNumber: string) {
    if (!confirm(`"${orderNumber}" siparişini silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteOrder.mutateAsync(id);
      toast.success('Sipariş silindi');
    } catch {
      toast.error('Sipariş silinemedi');
    }
  }

  function WorkflowButton({ order }: { order: Record<string, unknown> }) {
    const id = order.id as string;
    const status = order.status as OrderStatus;
    const isPending = pendingId === id;

    if (status === 'draft') {
      return (
        <button
          onClick={() => handleStatusAdvance(id, status)}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          Onayla
        </button>
      );
    }
    if (status === 'confirmed') {
      return (
        <button
          onClick={() => handleStatusAdvance(id, status)}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Boxes className="h-3 w-3" />}
          Hazırla
        </button>
      );
    }
    if (status === 'processing') {
      return (
        <button
          onClick={() => handleStatusAdvance(id, status)}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
          Kargoya Ver
        </button>
      );
    }
    if (status === 'shipped') {
      return (
        <button
          onClick={() => handleStatusAdvance(id, status)}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />}
          Teslim Edildi
        </button>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Siparişler</h1>
          <p className="text-sm text-muted-foreground mt-1">Satış siparişlerini yönetin ve takip edin</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Sipariş
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Toplam Sipariş</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Tüm siparişler</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Bekleyen</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">Taslak + Onaylandı</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">İşlemde</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.processing}</p>
          <p className="text-xs text-muted-foreground">Hazırlanıyor</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Toplam Tutar</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalAmount)}</p>
          <p className="text-xs text-muted-foreground">Tüm siparişler</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              statusFilter === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium min-w-[1.25rem]',
                statusFilter === tab.value
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {tabCounts[tab.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Sipariş ara (no, müşteri)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-8 px-2 py-3" />
                <th className="text-left px-4 py-3 font-medium">
                  <SortButton field="orderNumber" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                    Sipariş No
                  </SortButton>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <SortButton field="customer" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                    Müşteri
                  </SortButton>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <SortButton field="itemCount" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                    Kalemler
                  </SortButton>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <SortButton field="netAmount" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                    Tutar
                  </SortButton>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <SortButton field="taxAmount" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                    KDV
                  </SortButton>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <SortButton field="totalAmount" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                    Toplam
                  </SortButton>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <SortButton field="dueDate" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                    Vade
                  </SortButton>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <SortButton field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                    Tarih
                  </SortButton>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <SortButton field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                    Durum
                  </SortButton>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Sipariş bulunamadı</p>
                    <p className="text-xs mt-1">Arama kriterlerini değiştirin veya yeni sipariş ekleyin</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="mt-3 text-primary hover:underline text-sm"
                    >
                      Yeni Sipariş Ekle
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const id = order.id as string;
                  const customer = order.customer as Record<string, unknown> | undefined;
                  const currency = (order.currency as string) ?? 'TRY';
                  const expanded = expandedIds.has(id);
                  return (
                    <>
                      <tr
                        key={id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-2 py-3">
                          <button
                            onClick={() => toggleExpand(id)}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {expanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                          {order.orderNumber as string}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {customer?.name as string ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {(order.itemCount as number) ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatCurrency(Number(order.netAmount ?? 0), currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatCurrency(Number(order.taxAmount ?? 0), currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {formatCurrency(Number(order.totalAmount ?? order.netAmount ?? 0), currency)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {order.dueDate
                            ? new Date(order.dueDate as string).toLocaleDateString('tr-TR')
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(order.createdAt as string).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              STATUS_CLASSES[(order.status as OrderStatus)] ?? '',
                            )}
                          >
                            {STATUS_LABELS[(order.status as OrderStatus)] ?? (order.status as string)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <WorkflowButton order={order} />
                            <button
                              onClick={() => setModalOpen(true)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(id, order.orderNumber as string)}
                              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <ExpandedOrderRow key={`${id}-expanded`} orderId={id} colSpan={11} />
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filtered.length} sipariş gösteriliyor
              {statusFilter ? ` (${STATUS_LABELS[statusFilter as OrderStatus]} filtresi)` : ''}
            </span>
            <span className="font-medium text-foreground">
              Toplam: {formatCurrency(filteredTotal)}
            </span>
          </div>
        )}
      </div>

      <OrderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
