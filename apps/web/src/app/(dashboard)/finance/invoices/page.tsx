'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, TrendingUp, TrendingDown, Clock, FileText, AlertTriangle, X, Loader2, FileDown } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type InvoiceType = 'sale' | 'purchase' | 'refund';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  paid: 'Ödendi',
  overdue: 'Vadesi Geçti',
  cancelled: 'İptal',
};

const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

const TYPE_LABELS: Record<InvoiceType, string> = {
  sale: 'Satış',
  purchase: 'Alış',
  refund: 'İade',
};

const TYPE_CLASSES: Record<InvoiceType, string> = {
  sale: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  purchase: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  refund: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'draft', label: 'Taslak' },
  { value: 'sent', label: 'Gönderildi' },
  { value: 'paid', label: 'Ödendi' },
  { value: 'overdue', label: 'Vadesi Geçti' },
  { value: 'cancelled', label: 'İptal' },
];

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

type Invoice = Record<string, unknown>;

export default function FinanceInvoicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['finance-invoices', search, statusFilter, typeFilter],
    queryFn: () =>
      api.get('/api/v1/sales/invoices', {
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        limit: 200,
      }),
  });

  const updateInvoice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/api/v1/sales/invoices/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-invoices'] }),
  });

  const invoices: Invoice[] = useMemo(() => {
    if (Array.isArray(rawData)) return rawData as Invoice[];
    return ((rawData as { data?: Invoice[] } | undefined)?.data ?? []) as Invoice[];
  }, [rawData]);

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === 'paid');
    const purchase = invoices.filter((i) => i.type === 'purchase' && i.status === 'paid');
    const pending = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
    const overdue = invoices.filter((i) => i.status === 'overdue');

    return {
      totalCount: invoices.length,
      income: paid.filter((i) => i.type === 'sale').reduce((s, i) => s + Number(i.totalAmount ?? 0), 0),
      expense: purchase.reduce((s, i) => s + Number(i.totalAmount ?? 0), 0),
      pendingAmount: pending.reduce((s, i) => s + Number(i.totalAmount ?? 0), 0),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + Number(i.totalAmount ?? 0), 0),
    };
  }, [invoices]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { '': invoices.length };
    ['draft', 'sent', 'paid', 'overdue', 'cancelled'].forEach((s) => {
      counts[s] = invoices.filter((i) => i.status === s).length;
    });
    return counts;
  }, [invoices]);

  const handleStatusUpdate = async (id: string, status: string) => {
    setPendingId(id);
    try {
      await updateInvoice.mutateAsync({ id, data: { status } });
      toast.success('Fatura durumu güncellendi');
    } catch {
      toast.error('Fatura güncellenemedi');
    } finally {
      setPendingId(null);
    }
  };

  const totalVisible = useMemo(
    () => invoices.reduce((s, i) => s + Number(i.totalAmount ?? 0), 0),
    [invoices],
  );

  const fmt = (n: number, currency = 'TRY') =>
    n.toLocaleString('tr-TR', { style: 'currency', currency });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finansal Faturalar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm gelir ve gider faturalarını yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              invoices.map((i) => {
                const customer = i.customer as Record<string, unknown> | undefined;
                return {
                  invoiceNumber: i.invoiceNumber as string ?? '',
                  customerName: (customer?.name as string) ?? (i.customerName as string) ?? '',
                  type: TYPE_LABELS[(i.type as InvoiceType)] ?? i.type as string,
                  status: STATUS_LABELS[(i.status as InvoiceStatus)] ?? i.status as string,
                  netAmount: Number(i.netAmount ?? 0),
                  totalAmount: Number(i.totalAmount ?? 0),
                  currency: i.currency as string ?? 'TRY',
                  issueDate: i.issueDate ? new Date(i.issueDate as string).toLocaleDateString('tr-TR') : '',
                  dueDate: i.dueDate ? new Date(i.dueDate as string).toLocaleDateString('tr-TR') : '',
                };
              }),
              [
                { key: 'invoiceNumber', header: 'Fatura No', width: 14 },
                { key: 'customerName', header: 'Müşteri/Tedarikçi', width: 24 },
                { key: 'type', header: 'Tip', width: 12 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'netAmount', header: 'Net Tutar', width: 14 },
                { key: 'totalAmount', header: 'Toplam Tutar', width: 14 },
                { key: 'currency', header: 'Para Birimi', width: 12 },
                { key: 'issueDate', header: 'Fatura Tarihi', width: 14 },
                { key: 'dueDate', header: 'Vade Tarihi', width: 14 },
              ],
              'finansal-faturalar',
              'Finansal Faturalar'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Yeni Fatura
          </button>
        </div>
      </div>

      {stats.overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">{stats.overdueCount} faturanın</span> vadesi geçti — toplam{' '}
            <span className="font-semibold">{fmt(stats.overdueAmount)}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Toplam Fatura</p>
              <p className="text-xl font-bold mt-0.5">{stats.totalCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Toplam Gelir (Ödenen)</p>
              <p className="text-xl font-bold mt-0.5 text-green-600">{fmt(stats.income)}</p>
            </div>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Toplam Gider (Ödenen)</p>
              <p className="text-xl font-bold mt-0.5 text-red-600">{fmt(stats.expense)}</p>
            </div>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Bekleyen Tahsilat</p>
              <p className="text-xl font-bold mt-0.5 text-yellow-600">{fmt(stats.pendingAmount)}</p>
            </div>
            <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const count = tabCounts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                  statusFilter === tab.value
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-muted text-muted-foreground',
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-xs',
                      statusFilter === tab.value
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 ml-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Tüm Tipler</option>
            <option value="sale">Satış</option>
            <option value="purchase">Alış</option>
            <option value="refund">İade</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Fatura ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fatura No</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Taraf</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tip</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net Tutar</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tarih</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Fatura bulunamadı</p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const status = invoice.status as InvoiceStatus;
                  const type = invoice.type as InvoiceType;
                  const currency = (invoice.currency as string) ?? 'TRY';
                  const customer = invoice.customer as Record<string, unknown> | undefined;
                  const customerName =
                    (customer?.name as string) ?? (invoice.customerName as string) ?? '-';
                  const dueDate = invoice.dueDate as string | undefined;
                  const isOverdue = status === 'overdue';
                  const isPending = pendingId === (invoice.id as string);

                  return (
                    <tr
                      key={invoice.id as string}
                      className={cn(
                        'border-b border-border last:border-0 hover:bg-muted/30 transition-colors',
                        isOverdue && 'bg-red-50/30 dark:bg-red-950/10',
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                        {invoice.invoiceNumber as string}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{customerName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            TYPE_CLASSES[type] ?? 'bg-muted text-muted-foreground',
                          )}
                        >
                          {TYPE_LABELS[type] ?? type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {fmt(Number(invoice.netAmount ?? 0), currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {fmt(Number(invoice.totalAmount ?? 0), currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {invoice.issueDate
                          ? new Date(invoice.issueDate as string).toLocaleDateString('tr-TR')
                          : invoice.createdAt
                          ? new Date(invoice.createdAt as string).toLocaleDateString('tr-TR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {dueDate ? (
                          <span
                            className={cn(
                              'flex items-center gap-1',
                              isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground',
                            )}
                          >
                            {isOverdue && <AlertTriangle className="h-3.5 w-3.5" />}
                            {new Date(dueDate).toLocaleDateString('tr-TR')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground',
                          )}
                        >
                          {STATUS_LABELS[status] ?? status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : status === 'draft' ? (
                          <button
                            onClick={() =>
                              handleStatusUpdate(invoice.id as string, 'sent')
                            }
                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition-colors"
                          >
                            Gönder
                          </button>
                        ) : status === 'sent' ? (
                          <button
                            onClick={() =>
                              handleStatusUpdate(invoice.id as string, 'paid')
                            }
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
                          >
                            Ödendi
                          </button>
                        ) : status === 'overdue' ? (
                          <button
                            onClick={() =>
                              handleStatusUpdate(invoice.id as string, 'paid')
                            }
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
                          >
                            Ödendi
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{invoices.length} fatura gösteriliyor</span>
            <span className="font-medium text-foreground">
              Toplam: {fmt(totalVisible)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
