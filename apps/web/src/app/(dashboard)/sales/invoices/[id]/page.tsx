'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useInvoice, useUpdateInvoice } from '@/lib/api/hooks';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

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

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: invoice, isLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoice();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-40 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Fatura bulunamadı</p>
        <Link href="/sales/invoices" className="text-primary hover:underline text-sm mt-2 inline-block">
          Fatura Listesi
        </Link>
      </div>
    );
  }

  const inv = invoice as Record<string, unknown>;
  const customer = inv.customer as Record<string, unknown> | undefined;
  const items = Array.isArray(inv.items) ? inv.items as Record<string, unknown>[] : [];
  const currentStatus = inv.status as InvoiceStatus;

  const handleMarkPaid = async () => {
    try {
      await updateInvoice.mutateAsync({ id, data: { status: 'paid', paidAt: new Date().toISOString() } });
      toast.success('Fatura ödendi olarak işaretlendi');
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  const netAmount = Number(inv.netAmount ?? 0);
  const taxAmount = Number(inv.taxAmount ?? 0);
  const totalAmount = Number(inv.totalAmount ?? netAmount + taxAmount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/sales/invoices"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground font-mono">{inv.invoiceNumber as string}</h1>
            <p className="text-sm text-muted-foreground">{customer?.name as string ?? '-'}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[currentStatus] ?? ''}`}>
            {STATUS_LABELS[currentStatus] ?? currentStatus}
          </span>
        </div>

        {(currentStatus === 'sent' || currentStatus === 'overdue') && (
          <button
            onClick={handleMarkPaid}
            disabled={updateInvoice.isPending}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Ödendi Olarak İşaretle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Düzenlenme Tarihi', value: inv.issueDate ? new Date(inv.issueDate as string).toLocaleDateString('tr-TR') : '-' },
          { label: 'Vade Tarihi', value: inv.dueDate ? new Date(inv.dueDate as string).toLocaleDateString('tr-TR') : '-' },
          { label: 'Ödeme Tarihi', value: inv.paidAt ? new Date(inv.paidAt as string).toLocaleDateString('tr-TR') : '-' },
          { label: 'Toplam Tutar', value: totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) },
        ].map((info) => (
          <div key={info.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{info.label}</p>
            <p className="text-base font-semibold text-foreground mt-1">{info.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Fatura Kalemleri</h2>
        </div>
        {items.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Kalem bulunamadı</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Açıklama</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Miktar</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Birim Fiyat</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">KDV</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const qty = Number(item.quantity ?? 0);
                    const unitPrice = Number(item.unitPrice ?? 0);
                    const taxRate = Number(item.taxRate ?? 0);
                    const lineNet = qty * unitPrice;
                    const lineTax = lineNet * taxRate / 100;
                    const lineTotal = lineNet + lineTax;
                    return (
                      <tr key={item.id as string ?? index} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">{item.description as string}</td>
                        <td className="px-4 py-3 text-right">{qty.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {unitPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">%{taxRate}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {lineTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex flex-col items-end gap-1.5 text-sm">
                <div className="flex gap-8">
                  <span className="text-muted-foreground">Net Tutar:</span>
                  <span className="font-medium w-36 text-right">{netAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-muted-foreground">KDV Tutarı:</span>
                  <span className="font-medium w-36 text-right">{taxAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                </div>
                <div className="flex gap-8 text-base font-semibold border-t border-border pt-1.5 mt-1">
                  <span>Genel Toplam:</span>
                  <span className="w-36 text-right text-primary">{totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {inv.notes && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground mb-2">Notlar</h2>
          <p className="text-sm text-muted-foreground">{inv.notes as string}</p>
        </div>
      )}
    </div>
  );
}
