'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: order, isLoading } = useOrder(id);
  const updateOrder = useUpdateOrder();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
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
  const items = Array.isArray(o.items) ? o.items as Record<string, unknown>[] : [];
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

  const netAmount = Number(o.netAmount ?? 0);
  const taxAmount = Number(o.taxAmount ?? 0);
  const totalAmount = Number(o.totalAmount ?? netAmount + taxAmount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/sales/orders"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground font-mono">{o.orderNumber as string}</h1>
            <p className="text-sm text-muted-foreground">{customer?.name as string ?? '-'}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[currentStatus] ?? ''}`}>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Sipariş Tarihi', value: o.createdAt ? new Date(o.createdAt as string).toLocaleDateString('tr-TR') : '-' },
          { label: 'Vade Tarihi', value: o.dueDate ? new Date(o.dueDate as string).toLocaleDateString('tr-TR') : '-' },
          { label: 'Kalem Sayısı', value: `${items.length} kalem` },
        ].map((info) => (
          <div key={info.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{info.label}</p>
            <p className="text-lg font-semibold text-foreground mt-1">{info.value}</p>
          </div>
        ))}
      </div>

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
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">İskonto</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const product = item.product as Record<string, unknown> | undefined;
                    const qty = Number(item.quantity ?? 0);
                    const unitPrice = Number(item.unitPrice ?? 0);
                    const discountRate = Number(item.discountRate ?? 0);
                    const lineTotal = qty * unitPrice * (1 - discountRate / 100);
                    return (
                      <tr key={item.id as string ?? index} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{product?.name as string ?? (item.productName as string) ?? '-'}</div>
                          {product?.code && <div className="text-xs text-muted-foreground font-mono">{product.code as string}</div>}
                        </td>
                        <td className="px-4 py-3 text-right">{qty.toLocaleString('tr-TR')} {product?.unit as string ?? ''}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {unitPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
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
            <div className="p-4 border-t border-border">
              <div className="flex flex-col items-end gap-1.5 text-sm">
                <div className="flex gap-8">
                  <span className="text-muted-foreground">Net Tutar:</span>
                  <span className="font-medium w-32 text-right">{netAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-muted-foreground">KDV:</span>
                  <span className="font-medium w-32 text-right">{taxAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                </div>
                <div className="flex gap-8 text-base font-semibold border-t border-border pt-1.5 mt-1">
                  <span>Genel Toplam:</span>
                  <span className="w-32 text-right text-primary">{totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {o.notes && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground mb-2">Notlar</h2>
          <p className="text-sm text-muted-foreground">{o.notes as string}</p>
        </div>
      )}
    </div>
  );
}
