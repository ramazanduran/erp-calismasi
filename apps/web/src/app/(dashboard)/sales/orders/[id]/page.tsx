'use client';

import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Boxes,
  Truck,
  PackageCheck,
  XCircle,
  User,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Mail,
  Phone,
  Hash,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useOrder, useUpdateOrder } from '@/lib/api/hooks';

type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

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

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  draft: 'confirmed',
  confirmed: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
  delivered: null,
  cancelled: null,
};

const NEXT_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Onayla',
  confirmed: 'Hazırlığa Al',
  processing: 'Kargoya Ver',
  shipped: 'Teslim Edildi',
  delivered: '',
  cancelled: '',
};

// Ordered steps for the stepper (cancelled handled separately)
const STEPPER_STEPS: { status: OrderStatus; label: string; Icon: React.ElementType }[] = [
  { status: 'draft',     label: 'Taslak',        Icon: FileText },
  { status: 'confirmed', label: 'Onaylandı',      Icon: CheckCircle2 },
  { status: 'processing',label: 'Hazırlanıyor',   Icon: Boxes },
  { status: 'shipped',   label: 'Kargoda',        Icon: Truck },
  { status: 'delivered', label: 'Teslim Edildi',  Icon: PackageCheck },
];

const STEP_ORDER: Record<OrderStatus, number> = {
  draft: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
};

const MOCK_ORDER = {
  id: 'ord-demo',
  orderNumber: 'SO-2026-001',
  status: 'processing' as const,
  orderDate: '2026-05-01T09:00:00Z',
  deliveryDate: '2026-05-15T09:00:00Z',
  notes: 'Demo sipariş',
  customer: { id: 'c1', name: 'ABC Ticaret A.Ş.', code: 'CUS-001', email: 'info@abc.com', phone: '+90 212 555 0101' },
  items: [
    { id: 'oi1', product: { id: 'p1', name: 'Laptop Dell XPS 15', code: 'PRD-001' }, quantity: 2, unitPrice: 42000, totalPrice: 84000, unit: 'Adet' },
    { id: 'oi2', product: { id: 'p2', name: 'Ofis Koltuğu Ergonomik', code: 'PRD-002' }, quantity: 5, unitPrice: 3500, totalPrice: 17500, unit: 'Adet' },
  ],
  subtotal: 101500,
  taxAmount: 18270,
  totalAmount: 119770,
  currency: 'TRY',
};

function StatusStepper({ currentStatus }: { currentStatus: OrderStatus }) {
  const isCancelled = currentStatus === 'cancelled';
  const currentIdx = STEP_ORDER[currentStatus];

  if (isCancelled) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-4 flex items-center gap-3">
        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <span className="text-sm font-medium text-red-700 dark:text-red-400">
          Bu sipariş iptal edildi.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center w-full">
        {STEPPER_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isFuture = idx > currentIdx;
          const Icon = step.Icon;

          return (
            <div key={step.status} className="flex items-center flex-1 last:flex-none">
              {/* Step bubble + label */}
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={[
                    'h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={[
                    'text-xs font-medium text-center leading-tight',
                    isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : isActive
                      ? 'text-primary'
                      : isFuture
                      ? 'text-muted-foreground'
                      : '',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPPER_STEPS.length - 1 && (
                <div
                  className={[
                    'flex-1 h-0.5 mx-2 rounded transition-colors',
                    idx < currentIdx ? 'bg-green-500' : 'bg-muted',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomerCard({ customer }: { customer: Record<string, unknown> | undefined }) {
  if (!customer) return null;

  const name  = customer.name  as string | undefined;
  const code  = customer.code  as string | undefined;
  const email = customer.email as string | undefined;
  const phone = customer.phone as string | undefined;

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h2 className="font-semibold text-foreground text-sm">Müşteri Bilgileri</h2>
      </div>

      {name && (
        <p className="text-sm font-medium text-foreground">{name}</p>
      )}

      {code && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Hash className="h-3 w-3 flex-shrink-0" />
          <span className="font-mono">{code}</span>
        </div>
      )}

      {email && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{email}</span>
        </div>
      )}

      {phone && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="h-3 w-3 flex-shrink-0" />
          <span>{phone}</span>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: rawOrder, isLoading } = useOrder(id);
  const order = rawOrder ?? (!isLoading ? MOCK_ORDER : undefined);
  const updateOrder = useUpdateOrder();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-40 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Sipariş bulunamadı</p>
        <Link href="/sales/orders" className="text-primary hover:underline text-sm mt-2 inline-block">
          Sipariş Listesi
        </Link>
      </div>
    );
  }

  const o = order as Record<string, unknown>;
  const customer = o.customer as Record<string, unknown> | undefined;
  const items = Array.isArray(o.items) ? (o.items as Record<string, unknown>[]) : [];
  const currentStatus = o.status as OrderStatus;
  const nextStatus = STATUS_TRANSITIONS[currentStatus];

  const handleStatusChange = async (status: OrderStatus) => {
    try {
      await updateOrder.mutateAsync({ id, data: { status } });
      toast.success(`Sipariş durumu güncellendi: ${STATUS_LABELS[status]}`);
    } catch {
      toast.error('Durum güncellenemedi');
    }
  };

  const netAmount   = Number(o.netAmount   ?? 0);
  const taxAmount   = Number(o.taxAmount   ?? 0);
  const totalAmount = Number(o.totalAmount ?? netAmount + taxAmount);

  const infoCards = [
    {
      label: 'Sipariş Tarihi',
      value: o.createdAt
        ? new Date(o.createdAt as string).toLocaleDateString('tr-TR')
        : '-',
      Icon: Calendar,
    },
    {
      label: 'Vade Tarihi',
      value: o.dueDate
        ? new Date(o.dueDate as string).toLocaleDateString('tr-TR')
        : '-',
      Icon: Calendar,
    },
    {
      label: 'Kalem Sayısı',
      value: `${items.length} kalem`,
      Icon: ShoppingCart,
    },
    {
      label: 'Toplam Tutar',
      value: totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      Icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/sales/orders"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground font-mono">{o.orderNumber as string}</h1>
            <p className="text-sm text-muted-foreground">{(customer?.name as string) ?? '-'}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[currentStatus] ?? ''}`}
          >
            {STATUS_LABELS[currentStatus] ?? currentStatus}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {nextStatus && (
            <button
              onClick={() => handleStatusChange(nextStatus)}
              disabled={updateOrder.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {NEXT_STATUS_LABELS[currentStatus]}
            </button>
          )}
          {currentStatus !== 'cancelled' && currentStatus !== 'delivered' && (
            <button
              onClick={() => handleStatusChange('cancelled')}
              disabled={updateOrder.isPending}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              İptal Et
            </button>
          )}
        </div>
      </div>

      {/* Status Stepper */}
      <StatusStepper currentStatus={currentStatus} />

      {/* Info Cards + Customer Card */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 4 info cards take 4/5 columns on large screens */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {infoCards.map((card) => {
            const CardIcon = card.Icon;
            return (
              <div key={card.label} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <CardIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
                <p className="text-base font-semibold text-foreground">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Customer card takes 1/5 column */}
        {customer && (
          <div className="lg:col-span-1">
            <CustomerCard customer={customer} />
          </div>
        )}
      </div>

      {/* Order Items */}
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
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">İskonto</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const product     = item.product as Record<string, unknown> | undefined;
                    const qty         = Number(item.quantity    ?? 0);
                    const unitPrice   = Number(item.unitPrice   ?? 0);
                    const discountRate = Number(item.discountRate ?? 0);
                    const taxRate     = Number(item.taxRate     ?? 0);
                    const lineTotal   = Number(item.totalPrice  ?? qty * unitPrice * (1 - discountRate / 100));

                    return (
                      <tr
                        key={(item.id as string) ?? index}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {(product?.name as string) ?? (item.productName as string) ?? '-'}
                          </div>
                          {product?.code && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {product.code as string}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {qty.toLocaleString('tr-TR')} {(product?.unit as string) ?? ''}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {unitPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {taxRate > 0 ? `%${taxRate}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {discountRate > 0 ? `%${discountRate}` : '-'}
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

            {/* Totals */}
            <div className="p-4 border-t border-border">
              <div className="flex flex-col items-end gap-1.5 text-sm">
                <div className="flex gap-8">
                  <span className="text-muted-foreground">Net Tutar:</span>
                  <span className="font-medium w-36 text-right">
                    {netAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                </div>
                <div className="flex gap-8">
                  <span className="text-muted-foreground">KDV:</span>
                  <span className="font-medium w-36 text-right">
                    {taxAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                </div>
                <div className="flex gap-8 text-base font-semibold border-t border-border pt-1.5 mt-1">
                  <span>Genel Toplam:</span>
                  <span className="w-36 text-right text-primary">
                    {totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      {o.notes && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground mb-2">Notlar</h2>
          <p className="text-sm text-muted-foreground">{o.notes as string}</p>
        </div>
      )}
    </div>
  );
}
