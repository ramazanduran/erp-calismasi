'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Building2,
  Users,
  TrendingDown,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Clock,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSuppliers, useDeleteSupplier } from '@/lib/api/hooks';
import { SupplierModal } from '@/components/modals/supplier-modal';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Pasif' },
];

const PO_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  confirmed: 'Onaylandı',
  received: 'Teslim Alındı',
  cancelled: 'İptal',
};

const PO_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  confirmed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  received: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface Supplier {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  taxOffice?: string;
  contactPerson?: string;
  paymentTerms: number;
  balance: number;
  creditLimit?: number;
  currency?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt?: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: string;
  netAmount: number;
  totalAmount: number;
  expectedDate?: string;
  createdAt?: string;
}

function SupplierInitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full font-bold', sizeClasses[size], colors[colorIndex])}>
      {initials}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

function SupplierDetailPanel({
  supplier,
  onClose,
  onEdit,
  onDelete,
}: {
  supplier: Supplier;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['purchase-orders', 'supplier-recent', supplier.id],
    queryFn: () => api.get('/api/v1/purchasing/orders', { supplierId: supplier.id, limit: 5 } as Record<string, unknown>),
  });

  const orders = Array.isArray(recentOrders) ? (recentOrders as PurchaseOrder[]) : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Tedarikçi Detayı</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div className="flex items-center gap-4">
          <SupplierInitialsAvatar name={supplier.name} size="lg" />
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground leading-tight truncate">{supplier.name}</h3>
            <p className="text-sm font-mono text-muted-foreground">{supplier.code}</p>
            <span
              className={cn(
                'mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                supplier.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              )}
            >
              {supplier.status === 'active' ? 'Aktif' : 'Pasif'}
            </span>
          </div>
        </div>

        <DetailSection title="İletişim Bilgileri">
          <DetailRow icon={Mail} label="E-posta" value={supplier.email} />
          <DetailRow icon={Phone} label="Telefon" value={supplier.phone} />
          <DetailRow icon={MapPin} label="Adres" value={supplier.address} />
          <DetailRow icon={FileText} label="Vergi Numarası" value={supplier.taxNumber} />
          <DetailRow icon={Building2} label="Vergi Dairesi" value={supplier.taxOffice} />
          <DetailRow icon={Users} label="İletişim Kişisi" value={(supplier as any).contactPerson} />
        </DetailSection>

        <div className="border-t border-border" />

        <DetailSection title="Finansal Bilgiler">
          <div className="flex items-start gap-2.5">
            <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Bakiye</p>
              <p
                className={cn(
                  'text-sm font-bold',
                  supplier.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                )}
              >
                {formatCurrency(Math.abs(supplier.balance), supplier.currency || 'TRY')}
                {supplier.balance < 0 && <span className="ml-1 text-xs font-normal">(Borç)</span>}
              </p>
            </div>
          </div>
          <DetailRow icon={Clock} label="Ödeme Vadesi" value={`${supplier.paymentTerms} gün`} />
          {supplier.creditLimit && (
            <DetailRow
              icon={TrendingDown}
              label="Kredi Limiti"
              value={formatCurrency(supplier.creditLimit, supplier.currency || 'TRY')}
            />
          )}
        </DetailSection>

        <div className="border-t border-border" />

        <DetailSection title="Son Siparişler">
          {ordersLoading ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-6 text-center">
              <ShoppingCart className="h-6 w-6 text-muted-foreground/40 mb-1.5" />
              <p className="text-xs text-muted-foreground">Sipariş bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs font-mono font-medium text-foreground">{order.orderNumber}</p>
                    {order.createdAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        PO_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {PO_STATUS_LABELS[order.status] || order.status}
                    </span>
                    <p className="text-xs font-medium text-foreground mt-0.5">
                      {formatCurrency(Number(order.totalAmount || order.netAmount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DetailSection>

        {supplier.notes && (
          <>
            <div className="border-t border-border" />
            <DetailSection title="Notlar">
              <p className="text-sm text-muted-foreground leading-relaxed rounded-lg bg-muted/40 p-3">
                {supplier.notes}
              </p>
            </DetailSection>
          </>
        )}
      </div>

      <div className="flex gap-2 border-t border-border px-5 py-4">
        <button
          onClick={() => onEdit(supplier.id)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Pencil className="h-4 w-4" />
          Düzenle
        </button>
        <button
          onClick={() => onDelete(supplier.id)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
        >
          <Trash2 className="h-4 w-4" />
          Sil
        </button>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const queryParams = useMemo(() => {
    const p: { search?: string; status?: string } = {};
    if (search.trim()) p.search = search.trim();
    if (statusFilter !== 'all') p.status = statusFilter;
    return p;
  }, [search, statusFilter]);

  const { data: rawSuppliers, isLoading } = useSuppliers(queryParams);
  const deleteMutation = useDeleteSupplier();

  const suppliers = useMemo<Supplier[]>(
    () => (Array.isArray(rawSuppliers) ? (rawSuppliers as Supplier[]) : []),
    [rawSuppliers]
  );

  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.status === 'active').length;
    const negativeBalances = suppliers.filter((s) => Number(s.balance) < 0);
    const totalDebt = negativeBalances.reduce((sum, s) => sum + Math.abs(Number(s.balance)), 0);
    const maxDebt = negativeBalances.reduce((max, s) => Math.max(max, Math.abs(Number(s.balance))), 0);
    return { total, active, totalDebt, maxDebt };
  }, [suppliers]);

  const handleEdit = (id: string) => {
    setEditId(id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu tedarikçiyi silmek istiyor musunuz? Bu işlem geri alınamaz.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Tedarikçi başarıyla silindi');
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
    } catch {
      toast.error('Tedarikçi silinemedi');
    }
  };

  const handleRowClick = (supplier: Supplier) => {
    setSelectedSupplier((prev) => (prev?.id === supplier.id ? null : supplier));
  };

  const statCards = [
    {
      label: 'Toplam Tedarikçi',
      value: stats.total,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      format: 'number',
    },
    {
      label: 'Aktif Tedarikçi',
      value: stats.active,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      format: 'number',
    },
    {
      label: 'Toplam Borç',
      value: stats.totalDebt,
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      format: 'currency',
    },
    {
      label: 'En Yüksek Borç',
      value: stats.maxDebt,
      icon: AlertCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      format: 'currency',
    },
  ];

  return (
    <div className="flex h-full min-h-0 gap-6">
      <div className={cn('flex min-w-0 flex-1 flex-col space-y-6 transition-all duration-300', selectedSupplier ? 'xl:max-w-[calc(100%-424px)]' : '')}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tedarikçiler</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tedarikçi firmalarını yönetin</p>
          </div>
          <button
            onClick={() => { setEditId(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Yeni Tedarikçi
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    {isLoading ? (
                      <div className="mt-1 h-7 w-20 animate-pulse rounded bg-muted" />
                    ) : (
                      <p className="mt-0.5 text-xl font-bold text-foreground leading-tight">
                        {card.format === 'currency'
                          ? formatCurrency(card.value)
                          : card.value}
                      </p>
                    )}
                  </div>
                  <div className={cn('flex shrink-0 items-center justify-center rounded-xl p-2', card.bg)}>
                    <Icon className={cn('h-5 w-5', card.color)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tedarikçi ara..."
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === tab.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  {['Kod', 'Ad', 'Telefon', 'Ödeme Vadesi', 'Bakiye', 'Durum', 'İşlemler'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(7).fill(0).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                      <p className="font-medium text-foreground">Tedarikçi bulunamadı</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {search || statusFilter !== 'all'
                          ? 'Arama kriterlerinizi değiştirmeyi deneyin'
                          : 'İlk tedarikçinizi ekleyin'}
                      </p>
                      {!search && statusFilter === 'all' && (
                        <button
                          onClick={() => { setEditId(null); setModalOpen(true); }}
                          className="mt-4 flex items-center gap-2 mx-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Tedarikçi Ekle
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      onClick={() => handleRowClick(supplier)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-muted/30',
                        selectedSupplier?.id === supplier.id && 'bg-primary/5 hover:bg-primary/8'
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-muted-foreground">
                          {supplier.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <SupplierInitialsAvatar name={supplier.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{supplier.name}</p>
                            {supplier.email && (
                              <p className="text-xs text-muted-foreground truncate">{supplier.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {supplier.phone || <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {supplier.paymentTerms} gün
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'font-medium tabular-nums',
                            Number(supplier.balance) < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-foreground'
                          )}
                        >
                          {formatCurrency(Math.abs(Number(supplier.balance)), supplier.currency || 'TRY')}
                          {Number(supplier.balance) < 0 && (
                            <span className="ml-1 text-xs font-normal">↑</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            supplier.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          )}
                        >
                          {supplier.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(supplier.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Düzenle"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            title="Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <ChevronRight
                            className={cn(
                              'h-3.5 w-3.5 text-muted-foreground/40 transition-transform',
                              selectedSupplier?.id === supplier.id && 'rotate-90 text-primary'
                            )}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && suppliers.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {suppliers.length} tedarikçi
                {statusFilter !== 'all' && (
                  <span className="ml-1">
                    ({statusFilter === 'active' ? 'aktif' : 'pasif'} filtre)
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {suppliers.filter((s) => s.status === 'active').length} aktif,{' '}
                {suppliers.filter((s) => s.status !== 'active').length} pasif
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedSupplier && (
        <div className="hidden xl:flex w-[400px] shrink-0 flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <SupplierDetailPanel
            supplier={selectedSupplier}
            onClose={() => setSelectedSupplier(null)}
            onEdit={(id) => {
              handleEdit(id);
            }}
            onDelete={handleDelete}
          />
        </div>
      )}

      {selectedSupplier && (
        <div className="fixed inset-0 z-40 xl:hidden" onClick={() => setSelectedSupplier(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-[400px] bg-card shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <SupplierDetailPanel
              supplier={selectedSupplier}
              onClose={() => setSelectedSupplier(null)}
              onEdit={(id) => {
                handleEdit(id);
                setSelectedSupplier(null);
              }}
              onDelete={(id) => {
                handleDelete(id);
              }}
            />
          </div>
        </div>
      )}

      <SupplierModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
        }}
        editId={editId}
      />
    </div>
  );
}
