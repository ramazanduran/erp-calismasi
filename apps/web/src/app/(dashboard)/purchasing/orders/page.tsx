'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePurchaseOrders, useUpdatePurchaseOrderStatus } from '@/lib/api/hooks';
import { PurchaseOrderModal } from '@/components/modals/purchase-order-modal';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  confirmed: 'Onaylandı',
  received: 'Teslim Alındı',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-yellow-100 text-yellow-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function PurchaseOrdersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const { data: orders, isLoading } = usePurchaseOrders({ status: statusFilter || undefined });
  const updateStatus = useUpdatePurchaseOrderStatus();

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success('Durum güncellendi');
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Satın Alma Siparişleri</h1>
          <p className="text-muted-foreground text-sm mt-1">Tedarikçi sipariş yönetimi</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Sipariş Oluştur
        </button>
      </div>

      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {['Sipariş No', 'Tedarikçi', 'Durum', 'Net Tutar', 'Beklenen Tarih', 'İşlemler'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
            )) : !(orders as any[])?.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Henüz sipariş oluşturulmamış</td></tr>
            ) : (orders as any[]).map((o) => (
              <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium">{o.orderNumber}</td>
                <td className="px-4 py-3">{o.supplier?.name || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </td>
                <td className="px-4 py-3">₺{Number(o.netAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.expectedDate ? new Date(o.expectedDate).toLocaleDateString('tr-TR') : '-'}
                </td>
                <td className="px-4 py-3">
                  {o.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(o.id, 'sent')}
                      className="text-xs rounded-md border border-border px-2 py-1 hover:bg-muted transition-colors"
                    >
                      Gönder
                    </button>
                  )}
                  {o.status === 'sent' && (
                    <button
                      onClick={() => handleStatusChange(o.id, 'confirmed')}
                      className="text-xs rounded-md border border-border px-2 py-1 hover:bg-muted transition-colors"
                    >
                      Onayla
                    </button>
                  )}
                  {o.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(o.id, 'received')}
                      className="text-xs rounded-md bg-green-50 border border-green-200 text-green-700 px-2 py-1 hover:bg-green-100 transition-colors"
                    >
                      Teslim Alındı
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && orders && (
          <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border">
            {(orders as any[]).length} sipariş
          </div>
        )}
      </div>

      <PurchaseOrderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
