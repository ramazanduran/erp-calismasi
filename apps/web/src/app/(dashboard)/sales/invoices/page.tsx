'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Pencil,
  ChevronRight,
  ChevronDown,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useInvoices, useInvoice, useUpdateInvoice, useDeleteInvoice } from '@/lib/api/hooks';
import { InvoiceModal } from '@/components/modals/invoice-modal';
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
  sale: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  purchase: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  refund: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'draft', label: 'Taslak' },
  { value: 'sent', label: 'Gönderildi' },
  { value: 'paid', label: 'Ödendi' },
  { value: 'overdue', label: 'Vadesi Geçti' },
  { value: 'cancelled', label: 'İptal' },
];

const TYPE_TABS: { value: string; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'sale', label: 'Satış' },
  { value: 'purchase', label: 'Alış' },
  { value: 'refund', label: 'İade' },
];

function formatCurrency(amount: number, currency = 'TRY') {
  return amount.toLocaleString('tr-TR', { style: 'currency', currency });
}

function isOverdue(invoice: Record<string, unknown>): boolean {
  if (invoice.status === 'overdue') return true;
  if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
  if (!invoice.dueDate) return false;
  return new Date(invoice.dueDate as string) < new Date();
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 10 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function ExpandedInvoiceRow({ invoiceId, colSpan }: { invoiceId: string; colSpan: number }) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const invoiceData = invoice as Record<string, unknown> | undefined;
  const items = Array.isArray(invoiceData?.items) ? (invoiceData!.items as Record<string, unknown>[]) : [];

  if (isLoading) {
    return (
      <tr>
        <td colSpan={colSpan} className="bg-muted/20 px-8 py-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left pb-2 font-medium">Açıklama</th>
                <th className="text-right pb-2 font-medium">Miktar</th>
                <th className="text-right pb-2 font-medium">Birim Fiyat</th>
                <th className="text-right pb-2 font-medium">KDV%</th>
                <th className="text-right pb-2 font-medium">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
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

  const currency = (invoiceData?.currency as string) ?? 'TRY';
  const netAmount = Number(invoiceData?.netAmount ?? 0);
  const taxAmount = Number(invoiceData?.taxAmount ?? 0);
  const totalAmount = Number(invoiceData?.totalAmount ?? 0);

  return (
    <tr>
      <td colSpan={colSpan} className="bg-muted/20 px-8 py-4">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Fatura kalemi bulunamadı.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left pb-2 font-medium">Açıklama</th>
                <th className="text-right pb-2 font-medium">Miktar</th>
                <th className="text-right pb-2 font-medium">Birim Fiyat</th>
                <th className="text-right pb-2 font-medium">KDV%</th>
                <th className="text-right pb-2 font-medium">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const description = (item.description as string) ?? '-';
                const qty = Number(item.quantity ?? 0);
                const unitPrice = Number(item.unitPrice ?? 0);
                const taxRate = Number(item.taxRate ?? 0);
                const lineTotal = Number(item.totalAmount ?? qty * unitPrice * (1 + taxRate / 100));
                return (
                  <tr key={idx} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 pr-3 text-foreground font-medium">{description}</td>
                    <td className="py-1.5 pr-3 text-right text-muted-foreground">{qty}</td>
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
              <tr className="border-t border-border">
                <td colSpan={4} className="pt-2 text-right text-muted-foreground pr-3">
                  Ara Toplam
                </td>
                <td className="pt-2 text-right text-muted-foreground">
                  {formatCurrency(netAmount, currency)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="py-0.5 text-right text-muted-foreground pr-3">
                  KDV
                </td>
                <td className="py-0.5 text-right text-muted-foreground">
                  {formatCurrency(taxAmount, currency)}
                </td>
              </tr>
              <tr className="border-t-2 border-border">
                <td colSpan={4} className="pt-2 text-right font-semibold text-foreground pr-3">
                  Genel Toplam
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

export default function SalesInvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: invoices, isLoading } = useInvoices({ search });
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();

  const allInvoices = useMemo(
    () => (Array.isArray(invoices) ? (invoices as Record<string, unknown>[]) : []),
    [invoices],
  );

  const overdueInvoices = useMemo(() => allInvoices.filter(isOverdue), [allInvoices]);

  const overdueTotal = useMemo(
    () => overdueInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount ?? 0), 0),
    [overdueInvoices],
  );

  const stats = useMemo(() => {
    const total = allInvoices.length;
    const unpaidList = allInvoices.filter((inv) => inv.status === 'sent' || isOverdue(inv));
    const unpaidCount = unpaidList.length;
    const unpaidAmount = unpaidList.reduce((sum, inv) => sum + Number(inv.totalAmount ?? 0), 0);
    const overdueCount = overdueInvoices.length;
    const paidAmount = allInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.totalAmount ?? 0), 0);
    return { total, unpaidCount, unpaidAmount, overdueCount, paidAmount };
  }, [allInvoices, overdueInvoices]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { '': allInvoices.length };
    for (const s of ['draft', 'sent', 'paid', 'overdue', 'cancelled']) {
      counts[s] = allInvoices.filter((inv) => inv.status === s).length;
    }
    return counts;
  }, [allInvoices]);

  const filtered = useMemo(() => {
    let list = allInvoices;
    if (statusFilter) {
      list = list.filter((inv) => inv.status === statusFilter);
    }
    if (typeFilter) {
      list = list.filter((inv) => inv.type === typeFilter);
    }
    return list;
  }, [allInvoices, statusFilter, typeFilter]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, inv) => sum + Number(inv.totalAmount ?? 0), 0),
    [filtered],
  );

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

  async function handleStatusAdvance(id: string, currentStatus: InvoiceStatus) {
    const nextMap: Partial<Record<InvoiceStatus, InvoiceStatus>> = {
      draft: 'sent',
      sent: 'paid',
    };
    const next = nextMap[currentStatus];
    if (!next) return;
    setPendingId(id);
    try {
      await updateInvoice.mutateAsync({ id, data: { status: next } });
      toast.success(`Fatura durumu "${STATUS_LABELS[next]}" olarak güncellendi`);
    } catch {
      toast.error('Durum güncellenemedi');
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string, invoiceNumber: string) {
    if (!confirm(`"${invoiceNumber}" faturasını silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success('Fatura silindi');
    } catch {
      toast.error('Fatura silinemedi');
    }
  }

  function WorkflowButton({ invoice }: { invoice: Record<string, unknown> }) {
    const id = invoice.id as string;
    const status = invoice.status as InvoiceStatus;
    const isPending = pendingId === id;

    if (status === 'draft') {
      return (
        <button
          onClick={() => handleStatusAdvance(id, status)}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          Gönder
        </button>
      );
    }
    if (status === 'sent' || status === 'overdue') {
      return (
        <button
          onClick={() => handleStatusAdvance(id, 'sent')}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          Ödendi
        </button>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {overdueInvoices.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            <span className="font-bold">{overdueInvoices.length}</span> faturanın vadesi geçti — toplam{' '}
            <span className="font-bold">{formatCurrency(overdueTotal)}</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faturalar</h1>
          <p className="text-sm text-muted-foreground mt-1">Satış faturalarını oluşturun ve yönetin</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Fatura
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Toplam Fatura</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Tüm faturalar</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ödenmemiş</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.unpaidCount}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(stats.unpaidAmount)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Vadesi Geçmiş</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueCount}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(overdueTotal)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Toplam Tahsilat</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(stats.paidAmount)}
          </p>
          <p className="text-xs text-muted-foreground">Ödenen faturalar</p>
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Fatura ara (no, müşteri)..."
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
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 self-start">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                typeFilter === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-8 px-2 py-3" />
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fatura No</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Müşteri</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tip</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">KDV Hariç</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">KDV</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tarih</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Fatura bulunamadı</p>
                    <p className="text-xs mt-1">Arama kriterlerini değiştirin veya yeni fatura ekleyin</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="mt-3 text-primary hover:underline text-sm"
                    >
                      Yeni Fatura Ekle
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => {
                  const id = invoice.id as string;
                  const customer = invoice.customer as Record<string, unknown> | undefined;
                  const currency = (invoice.currency as string) ?? 'TRY';
                  const expanded = expandedIds.has(id);
                  const overdue = isOverdue(invoice);
                  const dueDate = invoice.dueDate ? new Date(invoice.dueDate as string) : null;

                  return (
                    <>
                      <tr
                        key={id}
                        className={cn(
                          'border-b border-border last:border-0 hover:bg-muted/30 transition-colors',
                          overdue && 'bg-red-50/30 dark:bg-red-950/10',
                        )}
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
                          {invoice.invoiceNumber as string}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {customer?.name as string ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              TYPE_CLASSES[(invoice.type as InvoiceType)] ?? '',
                            )}
                          >
                            {TYPE_LABELS[(invoice.type as InvoiceType)] ?? (invoice.type as string)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatCurrency(Number(invoice.netAmount ?? 0), currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatCurrency(Number(invoice.taxAmount ?? 0), currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {formatCurrency(Number(invoice.totalAmount ?? 0), currency)}
                        </td>
                        <td className="px-4 py-3">
                          {dueDate ? (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1',
                                overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground',
                              )}
                            >
                              {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
                              {dueDate.toLocaleDateString('tr-TR')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(invoice.createdAt as string).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              STATUS_CLASSES[(invoice.status as InvoiceStatus)] ?? '',
                            )}
                          >
                            {STATUS_LABELS[(invoice.status as InvoiceStatus)] ?? (invoice.status as string)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <WorkflowButton invoice={invoice} />
                            <button
                              onClick={() => setModalOpen(true)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(id, invoice.invoiceNumber as string)}
                              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <ExpandedInvoiceRow key={`${id}-expanded`} invoiceId={id} colSpan={11} />
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
              {filtered.length} fatura gösteriliyor
              {statusFilter ? ` (${STATUS_LABELS[statusFilter as InvoiceStatus]} filtresi)` : ''}
              {typeFilter ? ` · ${TYPE_LABELS[typeFilter as InvoiceType]}` : ''}
            </span>
            <span className="font-medium text-foreground">
              Toplam: {formatCurrency(filteredTotal)}
            </span>
          </div>
        )}
      </div>

      <InvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
