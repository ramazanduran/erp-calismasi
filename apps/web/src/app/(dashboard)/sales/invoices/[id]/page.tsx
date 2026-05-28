'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Download, FileText, Send, AlertTriangle, XCircle, User, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useInvoice, useUpdateInvoice } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

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

const STEPS = [
  { key: 'draft', label: 'Taslak', icon: FileText },
  { key: 'sent', label: 'Gönderildi', icon: Send },
  { key: 'paid', label: 'Ödendi', icon: CheckCircle },
];

const MOCK_INVOICE = {
  id: 'inv-demo',
  invoiceNumber: 'INV-2026-001',
  status: 'sent' as const,
  issueDate: '2026-05-01T09:00:00Z',
  dueDate: '2026-05-31T09:00:00Z',
  customer: { id: 'c1', name: 'ABC Ticaret A.Ş.', code: 'CUS-001', email: 'info@abc.com', phone: '+90 212 555 0101', address: 'İstanbul, Türkiye' },
  items: [
    { id: 'ii1', description: 'Laptop Dell XPS 15', quantity: 2, unitPrice: 42000, totalPrice: 84000 },
    { id: 'ii2', description: 'Ofis Koltuğu', quantity: 5, unitPrice: 3500, totalPrice: 17500 },
  ],
  subtotal: 101500,
  taxRate: 18,
  taxAmount: 18270,
  totalAmount: 119770,
  currency: 'TRY',
  notes: 'Ödeme vadesinde yapılacaktır',
};

function StatusStepper({ status }: { status: InvoiceStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 p-3">
        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
        <span className="text-sm font-medium text-red-700 dark:text-red-400">Bu fatura iptal edildi</span>
      </div>
    );
  }

  const stepKeys = ['draft', 'sent', 'paid'];
  const effectiveStatus = status === 'overdue' ? 'sent' : status;
  const currentIdx = stepKeys.indexOf(effectiveStatus);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isOverdueCurrent = status === 'overdue' && isCurrent;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                  isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                  isOverdueCurrent ? 'bg-red-100 border-red-500 text-red-600 dark:bg-red-950 dark:border-red-700 dark:text-red-400' :
                  isCurrent ? 'bg-primary/10 border-primary text-primary' :
                  'bg-muted border-border text-muted-foreground'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  isOverdueCurrent ? 'text-red-600 dark:text-red-400' :
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn('h-0.5 flex-1 mx-2 mb-4', idx < currentIdx ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: rawInvoice, isLoading } = useInvoice(id);
  const invoice = rawInvoice ?? (!isLoading ? MOCK_INVOICE : undefined);
  const updateInvoice = useUpdateInvoice();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-16 bg-muted rounded-lg" />
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

  const handleMarkSent = async () => {
    try {
      await updateInvoice.mutateAsync({ id, data: { status: 'sent' } });
      toast.success('Fatura gönderildi olarak işaretlendi');
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  const handleMarkPaid = async () => {
    try {
      await updateInvoice.mutateAsync({ id, data: { status: 'paid', paidAt: new Date().toISOString() } });
      toast.success('Fatura ödendi olarak işaretlendi');
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura-${inv.invoiceNumber as string}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF indirilemedi');
    }
  };

  const netAmount = Number(inv.netAmount ?? 0);
  const taxAmount = Number(inv.taxAmount ?? 0);
  const totalAmount = Number(inv.totalAmount ?? netAmount + taxAmount);
  const isOverdue = currentStatus === 'overdue';

  return (
    <div className="space-y-6">
      {/* Header */}
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" />
            PDF İndir
          </button>
          {currentStatus === 'draft' && (
            <button
              onClick={handleMarkSent}
              disabled={updateInvoice.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              Gönderildi İşaretle
            </button>
          )}
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
      </div>

      {/* Status Stepper */}
      <StatusStepper status={currentStatus} />

      {/* Overdue Warning */}
      {isOverdue && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">Bu faturanın vadesi geçti.</span>
            {inv.dueDate ? ` Vade tarihi: ${new Date(inv.dueDate as string).toLocaleDateString('tr-TR')}` : ''}
          </p>
        </div>
      )}

      {/* Info Grid + Customer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Düzenlenme Tarihi', value: inv.issueDate ? new Date(inv.issueDate as string).toLocaleDateString('tr-TR') : '-' },
            { label: 'Vade Tarihi', value: inv.dueDate ? new Date(inv.dueDate as string).toLocaleDateString('tr-TR') : '-', highlight: isOverdue },
            { label: 'Ödeme Tarihi', value: inv.paidAt ? new Date(inv.paidAt as string).toLocaleDateString('tr-TR') : '-' },
            { label: 'Toplam Tutar', value: totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }), bold: true },
          ].map((info) => (
            <div key={info.label} className={cn('rounded-lg border bg-card p-4', info.highlight ? 'border-red-300 dark:border-red-900/40' : 'border-border')}>
              <p className="text-xs text-muted-foreground">{info.label}</p>
              <p className={cn('text-sm font-semibold mt-1', info.highlight ? 'text-red-600 dark:text-red-400' : info.bold ? 'text-primary text-base' : 'text-foreground')}>
                {info.value}
              </p>
            </div>
          ))}
        </div>

        {/* Customer Card */}
        {customer && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Müşteri</p>
            </div>
            <p className="font-medium text-foreground mb-2">{customer.name as string}</p>
            {customer.email && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{customer.email as string}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{customer.phone as string}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{customer.address as string}</span>
              </div>
            )}
            {customer.taxNumber && (
              <p className="text-xs text-muted-foreground mt-1.5 font-mono">VKN: {customer.taxNumber as string}</p>
            )}
            <Link href={`/sales/customers/${customer.id as string}`} className="mt-3 text-xs text-primary hover:underline block">
              Müşteri Detayı →
            </Link>
          </div>
        )}
      </div>

      {/* Items Table */}
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
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">KDV %</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">KDV Tutarı</th>
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
                      <tr key={(item.id as string) ?? index} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{item.description as string}</td>
                        <td className="px-4 py-3 text-right">{qty.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {unitPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">%{taxRate}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {lineTax.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {lineTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border bg-muted/20">
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
