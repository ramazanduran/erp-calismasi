'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Clock,
  PackageCheck,
  DollarSign,
  Send,
  CheckCircle2,
  Package,
  ArrowUpDown,
  FileDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePurchaseOrders, useUpdatePurchaseOrderStatus } from '@/lib/api/hooks';
import { PurchaseOrderModal } from '@/components/modals/purchase-order-modal';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

type SortField = 'orderNumber' | 'supplier' | 'createdAt' | 'expectedDate' | 'netAmount' | 'totalAmount';
type SortDir = 'asc' | 'desc';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  confirmed: 'Onaylandı',
  received: 'Teslim Alındı',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  confirmed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  received: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const ALL_STATUSES = ['draft', 'sent', 'confirmed', 'received', 'cancelled'];

const MOCK_ORDERS: PurchaseOrder[] = [
  { id: 'po1', orderNumber: 'SPN-2026-001', status: 'received', netAmount: 420000, taxAmount: 75600, totalAmount: 495600, expectedDate: '2026-02-15', createdAt: '2026-02-01', supplier: { id: 's1', name: 'Demir Çelik San. Ltd.', code: 'TDR-001' }, items: [] },
  { id: 'po2', orderNumber: 'SPN-2026-002', status: 'confirmed', netAmount: 75000, taxAmount: 13500, totalAmount: 88500, expectedDate: '2026-06-10', createdAt: '2026-03-10', supplier: { id: 's2', name: 'TechSoft A.Ş.', code: 'TDR-002' }, items: [] },
  { id: 'po3', orderNumber: 'SPN-2026-003', status: 'sent', netAmount: 30000, taxAmount: 5400, totalAmount: 35400, expectedDate: '2026-06-01', createdAt: '2026-04-01', supplier: { id: 's3', name: 'Hızlı Kargo A.Ş.', code: 'TDR-003' }, items: [] },
  { id: 'po4', orderNumber: 'SPN-2026-004', status: 'draft', netAmount: 55000, taxAmount: 9900, totalAmount: 64900, expectedDate: '2026-07-15', createdAt: '2026-05-15', supplier: { id: 's5', name: 'İstanbul Yazılım Ltd.', code: 'TDR-005' }, items: [] },
  { id: 'po5', orderNumber: 'SPN-2026-005', status: 'received', netAmount: 185000, taxAmount: 33300, totalAmount: 218300, expectedDate: '2026-03-20', createdAt: '2026-03-01', supplier: { id: 's8', name: 'Güvenli Ambalaj A.Ş.', code: 'TDR-008' }, items: [] },
  { id: 'po6', orderNumber: 'SPN-2026-006', status: 'confirmed', netAmount: 92000, taxAmount: 16560, totalAmount: 108560, expectedDate: '2026-06-30', createdAt: '2026-05-01', supplier: { id: 's1', name: 'Demir Çelik San. Ltd.', code: 'TDR-001' }, items: [] },
  { id: 'po7', orderNumber: 'SPN-2025-088', status: 'cancelled', netAmount: 48000, taxAmount: 8640, totalAmount: 56640, expectedDate: '2025-12-10', createdAt: '2025-11-20', supplier: { id: 's6', name: 'Eski Hammadde A.Ş.', code: 'TDR-006' }, items: [] },
];

const FILTER_TABS = [
  { value: '', label: 'Tümü' },
  { value: 'draft', label: 'Taslak' },
  { value: 'sent', label: 'Gönderildi' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'received', label: 'Teslim Alındı' },
  { value: 'cancelled', label: 'İptal' },
];

interface OrderItem {
  id: string;
  description?: string;
  productId?: string;
  product?: { name: string; code?: string };
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxRate: number;
  totalPrice?: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: string;
  netAmount: number;
  taxAmount?: number;
  totalAmount: number;
  expectedDate?: string;
  createdAt?: string;
  supplier?: { id: string; name: string; code?: string };
  items?: OrderItem[];
}

function SortButton({
  field,
  currentField,
  currentDir,
  onSort,
  children,
}: {
  field: SortField;
  currentField: SortField | null;
  currentDir: SortDir;
  onSort: (f: SortField) => void;
  children: React.ReactNode;
}) {
  const active = currentField === field;
  return (
    <button
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
      onClick={() => onSort(field)}
    >
      {children}
      {active ? (
        currentDir === 'asc' ? (
          <ChevronUp className="h-3 w-3 text-primary" />
        ) : (
          <ChevronDown className="h-3 w-3 text-primary" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      )}
    </button>
  );
}

function OrderItemsRow({ orderId }: { orderId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', 'detail', orderId],
    queryFn: () => api.get(`/api/v1/purchasing/orders/${orderId}`),
  });

  const order = data as PurchaseOrder | undefined;
  const items: OrderItem[] = order?.items || [];

  if (isLoading) {
    return (
      <tr>
        <td colSpan={9} className="px-0 py-0">
          <div className="border-t border-border bg-muted/20 px-6 py-4">
            <div className="space-y-2">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={9} className="px-0 py-0">
        <div className="border-t border-border bg-muted/20">
          <div className="px-6 py-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sipariş Kalemleri
            </h4>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Kalem bulunamadı</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60">
                    <tr>
                      {['Ürün', 'Miktar', 'Birim', 'Birim Fiyat', 'KDV %', 'Toplam'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {items.map((item) => {
                      const lineTotal =
                        item.totalPrice !== undefined
                          ? item.totalPrice
                          : Number(item.quantity) * Number(item.unitPrice) * (1 + Number(item.taxRate) / 100);
                      const productName =
                        item.product?.name || item.description || item.productId || '—';
                      return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 font-medium text-foreground">{productName}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {Number(item.quantity).toLocaleString('tr-TR')}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{item.unit || 'Adet'}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {formatCurrency(Number(item.unitPrice))}
                          </td>
                          <td className="px-3 py-2 tabular-nums">%{item.taxRate}</td>
                          <td className="px-3 py-2 tabular-nums font-semibold text-foreground">
                            {formatCurrency(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-border bg-muted/40">
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                        Toplam (KDV dahil)
                      </td>
                      <td className="px-3 py-2 text-xs font-bold text-foreground tabular-nums">
                        {formatCurrency(Number(order?.totalAmount || order?.netAmount || 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function PurchaseOrdersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: rawOrders, isLoading: ordersLoading } = usePurchaseOrders(
    statusFilter ? { status: statusFilter } : {}
  );
  const isLoading = ordersLoading && rawOrders === undefined;
  const updateStatus = useUpdatePurchaseOrderStatus();

  const allOrders = useMemo<PurchaseOrder[]>(
    () => rawOrders !== undefined
      ? (Array.isArray(rawOrders) ? (rawOrders as PurchaseOrder[]) : [])
      : MOCK_ORDERS,
    [rawOrders]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { '': allOrders.length };
    ALL_STATUSES.forEach((s) => {
      counts[s] = allOrders.filter((o) => o.status === s).length;
    });
    return counts;
  }, [allOrders]);

  const stats = useMemo(() => {
    const total = allOrders.length;
    const pending = allOrders.filter((o) => o.status === 'draft' || o.status === 'sent').length;
    const awaitingDelivery = allOrders.filter((o) => o.status === 'confirmed').length;
    const totalAmount = allOrders.reduce((sum, o) => sum + Number(o.totalAmount || o.netAmount || 0), 0);
    return { total, pending, awaitingDelivery, totalAmount };
  }, [allOrders]);

  const filteredOrders = useMemo(() => {
    let list = allOrders;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.supplier?.name?.toLowerCase().includes(q)
      );
    }
    if (sortField) {
      list = [...list].sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';
        switch (sortField) {
          case 'orderNumber':
            aVal = a.orderNumber || '';
            bVal = b.orderNumber || '';
            break;
          case 'supplier':
            aVal = a.supplier?.name || '';
            bVal = b.supplier?.name || '';
            break;
          case 'createdAt':
            aVal = a.createdAt || '';
            bVal = b.createdAt || '';
            break;
          case 'expectedDate':
            aVal = a.expectedDate || '';
            bVal = b.expectedDate || '';
            break;
          case 'netAmount':
            aVal = Number(a.netAmount);
            bVal = Number(b.netAmount);
            break;
          case 'totalAmount':
            aVal = Number(a.totalAmount || a.netAmount);
            bVal = Number(b.totalAmount || b.netAmount);
            break;
        }
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [allOrders, search, sortField, sortDir]);

  const footerTotals = useMemo(() => {
    return filteredOrders.reduce(
      (acc, o) => ({
        amount: acc.amount + Number(o.totalAmount || o.netAmount || 0),
      }),
      { amount: 0 }
    );
  }, [filteredOrders]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success('Sipariş durumu güncellendi');
    } catch {
      toast.error('Güncelleme başarısız oldu');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const statCards = [
    {
      label: 'Toplam Sipariş',
      value: stats.total,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      format: 'number',
    },
    {
      label: 'Bekleyen',
      value: stats.pending,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      format: 'number',
    },
    {
      label: 'Teslim Bekleyen',
      value: stats.awaitingDelivery,
      icon: PackageCheck,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      format: 'number',
    },
    {
      label: 'Toplam Tutar',
      value: stats.totalAmount,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      format: 'currency',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Satın Alma Siparişleri</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tedarikçi sipariş süreçlerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filteredOrders.map((o) => ({
                orderNumber: o.orderNumber,
                supplierName: (o.supplier as Record<string, unknown>)?.name ?? '',
                status: STATUS_LABELS[o.status as string] ?? o.status,
                netAmount: o.netAmount,
                totalAmount: o.totalAmount,
                expectedDate: o.expectedDate ? new Date(o.expectedDate as string).toLocaleDateString('tr-TR') : '',
                createdAt: o.createdAt ? new Date(o.createdAt as string).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'orderNumber', header: 'Sipariş No', width: 14 },
                { key: 'supplierName', header: 'Tedarikçi', width: 25 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'netAmount', header: 'Net Tutar', width: 14 },
                { key: 'totalAmount', header: 'Toplam', width: 14 },
                { key: 'expectedDate', header: 'Beklenen Teslim', width: 16 },
                { key: 'createdAt', header: 'Oluşturma', width: 12 },
              ],
              'satin-alma-siparisleri',
              'Satın Alma Siparişleri'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Sipariş Oluştur
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  {isLoading ? (
                    <div className="mt-1 h-7 w-20 animate-pulse rounded bg-muted" />
                  ) : (
                    <p className="mt-0.5 text-xl font-bold text-foreground leading-tight">
                      {card.format === 'currency'
                        ? formatCurrency(card.value as number)
                        : card.value}
                    </p>
                  )}
                </div>
                <div className={cn('flex shrink-0 items-center justify-center rounded-xl p-2', card.bg)}>
                  <Icon className={cn('h-5 w-5', card.color)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => {
            const count = statusCounts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === tab.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
                {!isLoading && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px]',
                      statusFilter === tab.value
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full max-w-xs shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sipariş no veya tedarikçi ara..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-9 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left">
                  <SortButton field="orderNumber" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Sipariş No
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="supplier" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Tedarikçi
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="createdAt" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Tarih
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="expectedDate" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Beklenen Teslim
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="netAmount" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Tutar
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  KDV
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="totalAmount" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Toplam
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(10).fill(0).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="font-medium text-foreground">Sipariş bulunamadı</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {search || statusFilter
                        ? 'Arama kriterlerinizi değiştirmeyi deneyin'
                        : 'İlk siparişinizi oluşturun'}
                    </p>
                    {!search && !statusFilter && (
                      <button
                        onClick={() => setModalOpen(true)}
                        className="mt-4 flex items-center gap-2 mx-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Sipariş Oluştur
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const isUpdating = updatingId === order.id;
                  const netAmt = Number(order.netAmount || 0);
                  const totalAmt = Number(order.totalAmount || order.netAmount || 0);
                  const taxAmt = Number(order.taxAmount ?? (totalAmt - netAmt));

                  return (
                    <>
                      <tr
                        key={order.id}
                        className={cn(
                          'transition-colors hover:bg-muted/30',
                          isExpanded && 'bg-primary/5 hover:bg-primary/8'
                        )}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {order.supplier?.name || '—'}
                            </p>
                            {order.supplier?.code && (
                              <p className="text-xs font-mono text-muted-foreground">
                                {order.supplier.code}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {order.createdAt ? formatDate(order.createdAt) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {order.expectedDate ? (
                            <span
                              className={cn(
                                'text-sm',
                                new Date(order.expectedDate) < new Date() &&
                                  order.status !== 'received' &&
                                  order.status !== 'cancelled'
                                  ? 'font-medium text-red-600 dark:text-red-400'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {formatDate(order.expectedDate)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                          {formatCurrency(netAmt)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                          {formatCurrency(taxAmt)}
                        </td>
                        <td className="px-4 py-3 tabular-nums font-semibold text-foreground">
                          {formatCurrency(totalAmt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {order.status === 'draft' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'sent')}
                                disabled={isUpdating}
                                className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                              >
                                {isUpdating ? (
                                  <span className="h-3 w-3 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                                Gönder
                              </button>
                            )}
                            {order.status === 'sent' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'confirmed')}
                                disabled={isUpdating}
                                className="flex items-center gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 transition-colors hover:bg-yellow-100 disabled:opacity-50 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40"
                              >
                                {isUpdating ? (
                                  <span className="h-3 w-3 rounded-full border-2 border-yellow-500/30 border-t-yellow-500 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                Onayla
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'received')}
                                disabled={isUpdating}
                                className="flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                              >
                                {isUpdating ? (
                                  <span className="h-3 w-3 rounded-full border-2 border-green-500/30 border-t-green-500 animate-spin" />
                                ) : (
                                  <Package className="h-3 w-3" />
                                )}
                                Teslim Alındı
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && <OrderItemsRow key={`${order.id}-items`} orderId={order.id} />}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredOrders.length > 0 && (
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {filteredOrders.length} sipariş
              {search && allOrders.length !== filteredOrders.length && (
                <span className="ml-1">({allOrders.length} toplam)</span>
              )}
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">
                Görünür Toplam:
              </span>
              <span className="font-bold text-foreground tabular-nums">
                {formatCurrency(footerTotals.amount)}
              </span>
            </div>
          </div>
        )}
      </div>

      <PurchaseOrderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
