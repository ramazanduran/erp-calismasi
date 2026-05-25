'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';

type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type OrderType = 'sale' | 'purchase';

interface Order {
  id: string;
  orderNumber: string;
  customer: { name: string };
  status: OrderStatus;
  type: OrderType;
  netAmount: number;
  currency: string;
  dueDate: string | null;
  createdAt: string;
  itemCount: number;
}

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'SIP-2024-001',
    customer: { name: 'ABC Teknoloji A.Ş.' },
    status: 'confirmed',
    type: 'sale',
    netAmount: 24500,
    currency: 'TRY',
    dueDate: '2024-04-30',
    createdAt: '2024-03-15',
    itemCount: 3,
  },
  {
    id: '2',
    orderNumber: 'SIP-2024-002',
    customer: { name: 'Mehmet Yılmaz' },
    status: 'processing',
    type: 'sale',
    netAmount: 1850,
    currency: 'TRY',
    dueDate: '2024-04-15',
    createdAt: '2024-03-20',
    itemCount: 1,
  },
  {
    id: '3',
    orderNumber: 'SIP-2024-003',
    customer: { name: 'XYZ Ticaret Ltd. Şti.' },
    status: 'draft',
    type: 'sale',
    netAmount: 8700,
    currency: 'TRY',
    dueDate: null,
    createdAt: '2024-03-25',
    itemCount: 5,
  },
  {
    id: '4',
    orderNumber: 'SIP-2024-004',
    customer: { name: 'ABC Teknoloji A.Ş.' },
    status: 'shipped',
    type: 'sale',
    netAmount: 15300,
    currency: 'TRY',
    dueDate: '2024-05-01',
    createdAt: '2024-03-28',
    itemCount: 2,
  },
];

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

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Siparişler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Satış siparişlerini yönetin ve takip edin
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Yeni Sipariş
        </button>
      </div>

      {/* Filters */}
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

      {/* Table */}
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
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Sipariş bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {order.customer.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.itemCount} kalem
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {order.netAmount.toLocaleString('tr-TR', { style: 'currency', currency: order.currency })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.dueDate
                        ? new Date(order.dueDate).toLocaleDateString('tr-TR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[order.status]}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} sipariş gösteriliyor</span>
          <span>Toplam: {MOCK_ORDERS.length}</span>
        </div>
      </div>
    </div>
  );
}
