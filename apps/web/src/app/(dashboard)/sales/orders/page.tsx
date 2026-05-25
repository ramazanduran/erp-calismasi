'use client';

import { useState } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrders, useDeleteOrder } from '@/lib/api/hooks';
import { OrderModal } from '@/components/modals/order-modal';

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

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: orders, isLoading } = useOrders({ search, status: statusFilter || undefined });
  const deleteOrder = useDeleteOrder();

  const ordersList = Array.isArray(orders) ? orders : [];

  const handleDelete = async (id: string, orderNumber: string) => {
    if (!confirm(`"${orderNumber}" siparişini silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteOrder.mutateAsync(id);
      toast.success('Sipariş silindi');
    } catch {
      toast.error('Sipariş silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Siparişler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Satış siparişlerini yönetin ve takip edin
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Sipariş
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Sipariş ara (no, müşteri)..."
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
          <option value="confirmed">Onaylandı</option>
          <option value="processing">Hazırlanıyor</option>
          <option value="shipped">Kargoda</option>
          <option value="delivered">Teslim Edildi</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sipariş No</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Müşteri</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kalemler</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Tutar</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tarih</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : ordersList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="space-y-2">
                      <p>Henüz kayıt yok</p>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="text-primary hover:underline text-sm"
                      >
                        Yeni Sipariş Ekle
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                ordersList.map((order: Record<string, unknown>) => {
                  const customer = order.customer as Record<string, unknown> | undefined;
                  return (
                    <tr
                      key={order.id as string}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                        {order.orderNumber as string}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {customer?.name as string ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.itemCount as number ?? 0} kalem
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {Number(order.netAmount ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: (order.currency as string) ?? 'TRY' })}
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
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[(order.status as OrderStatus)] ?? ''}`}>
                          {STATUS_LABELS[(order.status as OrderStatus)] ?? order.status as string}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(order.id as string, order.orderNumber as string)}
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
            <span>{ordersList.length} sipariş gösteriliyor</span>
          </div>
        )}
      </div>

      <OrderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
