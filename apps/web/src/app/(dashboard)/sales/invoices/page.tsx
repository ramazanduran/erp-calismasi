'use client';

import { useState } from 'react';
import { Search, Plus, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useInvoices, useDeleteInvoice } from '@/lib/api/hooks';
import { InvoiceModal } from '@/components/modals/invoice-modal';

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

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
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

export default function SalesInvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: invoices, isLoading } = useInvoices({ search, status: statusFilter || undefined });
  const deleteInvoice = useDeleteInvoice();

  const invoicesList = Array.isArray(invoices) ? invoices : [];

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`"${invoiceNumber}" faturasını silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success('Fatura silindi');
    } catch {
      toast.error('Fatura silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faturalar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Satış faturalarını oluşturun ve yönetin
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Fatura
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Fatura ara (no, müşteri)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm Durumlar</option>
          <option value="draft">Taslak</option>
          <option value="sent">Gönderildi</option>
          <option value="paid">Ödendi</option>
          <option value="overdue">Vadesi Geçti</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fatura No</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Müşteri</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tip</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">KDV Hariç</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : invoicesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <div className="space-y-2">
                      <p>Henüz kayıt yok</p>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="text-primary hover:underline text-sm"
                      >
                        Yeni Fatura Ekle
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                invoicesList.map((invoice: Record<string, unknown>) => {
                  const customer = invoice.customer as Record<string, unknown> | undefined;
                  return (
                    <tr
                      key={invoice.id as string}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                        {invoice.invoiceNumber as string}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {customer?.name as string ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {TYPE_LABELS[(invoice.type as InvoiceType)] ?? invoice.type as string}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {Number(invoice.netAmount ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: (invoice.currency as string) ?? 'TRY' })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {Number(invoice.totalAmount ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: (invoice.currency as string) ?? 'TRY' })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {invoice.dueDate
                          ? new Date(invoice.dueDate as string).toLocaleDateString('tr-TR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[(invoice.status as InvoiceStatus)] ?? ''}`}>
                          {STATUS_LABELS[(invoice.status as InvoiceStatus)] ?? invoice.status as string}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(invoice.id as string, invoice.invoiceNumber as string)}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
            <span>{invoicesList.length} fatura gösteriliyor</span>
          </div>
        )}
      </div>

      <InvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
