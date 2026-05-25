'use client';

import { useState } from 'react';
import { Search, Plus, Building2, User, Pencil, Trash2, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomers, useDeleteCustomer } from '@/lib/api/hooks';
import { CustomerModal } from '@/components/modals/customer-modal';
import { Pagination } from '@/components/ui/pagination';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { exportToExcel } from '@/lib/utils/excel-export';

type CustomerType = 'corporate' | 'individual';
type CustomerStatus = 'active' | 'passive' | 'blocked';

const STATUS_LABELS: Record<CustomerStatus, string> = {
  active: 'Aktif',
  passive: 'Pasif',
  blocked: 'Bloke',
};

const STATUS_CLASSES: Record<CustomerStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  passive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const TYPE_LABELS: Record<CustomerType, string> = {
  corporate: 'Kurumsal',
  individual: 'Bireysel',
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: customers, isLoading } = useCustomers({ search, status: statusFilter || undefined, page, limit: 20 } as any);
  const deleteCustomer = useDeleteCustomer();

  const customersData = customers as any;
  const customersList = customersData?.data ?? (Array.isArray(customers) ? customers : []);
  const totalPages = customersData?.meta?.totalPages || 1;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === customersList.length) setSelectedIds(new Set());
    else setSelectedIds(new Set((customersList as any[])?.map((c: any) => c.id) || []));
  };

  const handleEdit = (customer: Record<string, unknown>) => {
    setEditData(customer);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" müşterisini silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success('Müşteri silindi');
    } catch {
      toast.error('Müşteri silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Müşteriler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm müşterileri yönetin ve takip edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              customersList as any[] || [],
              [
                { key: 'code', header: 'Kod', width: 12 },
                { key: 'name', header: 'Ad', width: 30 },
                { key: 'email', header: 'E-posta', width: 25 },
                { key: 'phone', header: 'Telefon', width: 15 },
                { key: 'type', header: 'Tür', width: 12 },
                { key: 'status', header: 'Durum', width: 10 },
              ],
              'musteriler',
              'Müşteriler'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => { setEditData(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Müşteri
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Müşteri ara (ad, kod, e-posta)..."
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
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
          <option value="blocked">Bloke</option>
        </select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={customersList.length > 0 && selectedIds.size === customersList.length}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kod</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Müşteri</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tip</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-posta</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefon</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Bakiye</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : customersList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <div className="space-y-2">
                      <p>Henüz kayıt yok</p>
                      <button
                        onClick={() => { setEditData(null); setModalOpen(true); }}
                        className="text-primary hover:underline text-sm"
                      >
                        Yeni Müşteri Ekle
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                customersList.map((customer: Record<string, unknown>) => (
                  <tr
                    key={customer.id as string}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(customer.id as string)}
                        onChange={() => toggleSelect(customer.id as string)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {customer.code as string}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {customer.type === 'corporate' ? (
                            <Building2 className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{customer.name as string}</div>
                          {customer.taxNumber && (
                            <div className="text-xs text-muted-foreground">VKN: {customer.taxNumber as string}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {TYPE_LABELS[(customer.type as CustomerType)] ?? customer.type as string}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(customer.email as string) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(customer.phone as string) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={(customer.balance as number) < 0 ? 'text-red-600' : 'text-foreground'}>
                        {Number(customer.balance ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[(customer.status as CustomerStatus)] ?? ''}`}>
                        {STATUS_LABELS[(customer.status as CustomerStatus)] ?? customer.status as string}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id as string, customer.name as string)}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{customersData?.meta?.total ?? customersList.length} müşteri</span>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={[
          {
            label: 'Sil',
            icon: <Trash2 className="h-3.5 w-3.5" />,
            variant: 'danger',
            onClick: async () => {
              if (!confirm(`${selectedIds.size} müşteri silinecek, emin misiniz?`)) return;
              await Promise.all([...selectedIds].map(id => deleteCustomer.mutateAsync(id)));
              setSelectedIds(new Set());
              toast.success(`${selectedIds.size} müşteri silindi`);
            },
          },
        ]}
      />

      <CustomerModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        editData={editData as Parameters<typeof CustomerModal>[0]['editData']}
      />
    </div>
  );
}
