'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle2, PackageCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { usePurchaseOrder, useUpdatePurchaseOrderStatus } from '@/lib/api/hooks';

const MOCK_PURCHASE_ORDER = {
  id: 'po-demo',
  orderNumber: 'PO-2026-018',
  status: 'confirmed' as const,
  orderDate: '2026-05-01T09:00:00Z',
  expectedDate: '2026-05-15T09:00:00Z',
  notes: 'Acil sipariş',
  supplier: { id: 's1', name: 'Tekno Tedarik Ltd.', code: 'SUP-001', email: 'satis@tekno.com', phone: '+90 212 444 5566' },
  items: [
    { id: 'poi1', product: { id: 'p1', name: 'Laptop Dell XPS 15', code: 'PRD-001' }, quantity: 5, unitPrice: 38000, totalPrice: 190000, unit: 'Adet' },
    { id: 'poi2', product: { id: 'p3', name: 'HP Toner 26A', code: 'PRD-003' }, quantity: 20, unitPrice: 380, totalPrice: 7600, unit: 'Kutu' },
  ],
  totalAmount: 197600,
  taxAmount: 35568,
  currency: 'TRY',
};

type OrderStatus = 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  confirmed: 'Onaylandı',
  received: 'Teslim Alındı',
  cancelled: 'İptal',
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  confirmed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  received: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  draft: 'confirmed',
  confirmed: 'received',
};

// Steps shown in the stepper (sent is skipped in transitions)
const STEPPER_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'draft', label: 'Taslak', icon: FileText },
  { status: 'confirmed', label: 'Onaylandı', icon: CheckCircle2 },
  { status: 'received', label: 'Teslim Alındı', icon: PackageCheck },
];

const STEPPER_ORDER: OrderStatus[] = ['draft', 'confirmed', 'received'];

function StatusStepper({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIndex = STEPPER_ORDER.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between relative">
        {/* Connector line behind the steps */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border mx-8" aria-hidden="true" />
        {STEPPER_STEPS.map((step, index) => {
          const stepIndex = STEPPER_ORDER.indexOf(step.status);
          const isPast = !isCancelled && currentIndex > stepIndex;
          const isCurrent = !isCancelled && currentIndex === stepIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="relative flex flex-col items-center gap-2 z-10 flex-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  isCancelled
                    ? 'bg-card border-border text-muted-foreground'
                    : isPast
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-card border-border text-muted-foreground'
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  isCancelled
                    ? 'text-muted-foreground'
                    : isPast
                    ? 'text-green-600 dark:text-green-400'
                    : isCurrent
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
              {isCurrent && !isCancelled && (
                <span className="absolute -bottom-5 text-[10px] text-primary font-semibold">Şu an</span>
              )}
            </div>
          );
        })}
      </div>
      {isCancelled && (
        <p className="text-center text-xs text-red-500 mt-4 font-medium">Bu sipariş iptal edilmiştir</p>
      )}
    </div>
  );
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: orderData, isLoading } = usePurchaseOrder(id);
  const effectiveOrder = orderData ?? (!isLoading ? MOCK_PURCHASE_ORDER : undefined);
  const updateStatus = useUpdatePurchaseOrderStatus();

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

  if (!effectiveOrder) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Satın alma siparişi bulunamadı</p>
        <Link href="/purchasing/orders" className="text-primary hover:underline text-sm mt-2 inline-block">
          Sipariş Listesi
        </Link>
      </div>
    );
  }

  const po = effectiveOrder as Record<string, unknown>;
  const supplier = po.supplier as Record<string, unknown> | undefined;
  const items = Array.isArray(po.items) ? (po.items as Record<string, unknown>[]) : [];
  const currentStatus = po.status as OrderStatus;
  const nextStatus = STATUS_TRANSITIONS[currentStatus];

  // Fix: totalAmount = net (before tax), taxAmount = VAT, grand = totalAmount + taxAmount
  const subtotal = Number(po.totalAmount ?? 0);
  const tax = Number(po.taxAmount ?? 0);
  const grand = subtotal + tax;

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success('Sipariş durumu güncellendi');
    } catch {
      toast.error('Durum güncellenemedi');
    }
  };

  const infoCards = [
    {
      label: 'Sipariş Tarihi',
      value: po.orderDate ? new Date(po.orderDate as string).toLocaleDateString('tr-TR') : '-',
    },
    {
      label: 'Beklenen Teslim',
      value: po.expectedDate ? new Date(po.expectedDate as string).toLocaleDateString('tr-TR') : '-',
    },
    {
      label: 'Toplam Tutar',
      value: grand.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
    },
    {
      label: 'Teslim Alındı',
      value: po.receivedDate ? new Date(po.receivedDate as string).toLocaleDateString('tr-TR') : '-',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/purchasing/orders"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground font-mono">{po.orderNumber as string}</h1>
            <p className="text-sm text-muted-foreground">{(supplier?.name as string) ?? '-'}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[currentStatus] ?? ''}`}
          >
            {STATUS_LABELS[currentStatus] ?? currentStatus}
          </span>
        </div>

        {nextStatus && (
          <button
            onClick={() => handleStatusChange(nextStatus)}
            disabled={updateStatus.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {STATUS_LABELS[nextStatus]} Olarak İşaretle
          </button>
        )}
      </div>

      {/* Status Progress Stepper */}
      <StatusStepper currentStatus={currentStatus} />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {infoCards.map((info) => (
          <div key={info.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{info.label}</p>
            <p className="text-base font-semibold text-foreground mt-1">{info.value}</p>
          </div>
        ))}
      </div>

      {/* Supplier Info */}
      {supplier && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground mb-3">Tedarikçi Bilgisi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Ad</p>
              <p className="font-medium">{supplier.name as string}</p>
            </div>
            {supplier.email && (
              <div>
                <p className="text-muted-foreground">E-posta</p>
                <p className="font-medium">{supplier.email as string}</p>
              </div>
            )}
            {supplier.phone && (
              <div>
                <p className="text-muted-foreground">Telefon</p>
                <p className="font-medium">{supplier.phone as string}</p>
              </div>
            )}
            {supplier.taxNumber && (
              <div>
                <p className="text-muted-foreground">VKN</p>
                <p className="font-medium">{supplier.taxNumber as string}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Sipariş Kalemleri</h2>
        </div>
        {items.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Kalem bulunamadı</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ürün</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Miktar</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Birim Fiyat</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">KDV%</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const product = item.product as Record<string, unknown> | undefined;
                    const productName = (product?.name as string) ?? (item.description as string) ?? '-';
                    const productCode = product?.code as string | undefined;
                    const qty = Number(item.quantity ?? 0);
                    const unitPrice = Number(item.unitPrice ?? 0);
                    const taxRate = Number(item.taxRate ?? 0);
                    const lineNet = qty * unitPrice;
                    const lineTax = lineNet * (taxRate / 100);
                    const lineTotal = Number(item.totalPrice ?? lineNet + lineTax);

                    return (
                      <tr
                        key={(item.id as string) ?? index}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{productName}</p>
                          {productCode && (
                            <p className="text-xs text-muted-foreground mt-0.5">{productCode}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">{qty.toLocaleString('tr-TR')}</td>
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

            {/* Totals */}
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex flex-col items-end gap-1.5 text-sm">
                <div className="flex gap-8">
                  <span className="text-muted-foreground">Ara Toplam:</span>
                  <span className="font-medium w-40 text-right">
                    {subtotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                </div>
                <div className="flex gap-8">
                  <span className="text-muted-foreground">KDV:</span>
                  <span className="font-medium w-40 text-right">
                    {tax.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                </div>
                <div className="flex gap-8 text-base font-semibold border-t border-border pt-2 mt-1">
                  <span>Genel Toplam:</span>
                  <span className="w-40 text-right text-primary">
                    {grand.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      {po.notes && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground mb-2">Notlar</h2>
          <p className="text-sm text-muted-foreground">{po.notes as string}</p>
        </div>
      )}
    </div>
  );
}
