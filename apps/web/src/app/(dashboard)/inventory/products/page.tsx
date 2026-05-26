'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Package, AlertTriangle, Pencil, Trash2, FileDown, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts, useDeleteProduct } from '@/lib/api/hooks';
import { ProductModal } from '@/components/modals/product-modal';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { exportToExcel } from '@/lib/utils/excel-export';
import { cn } from '@/lib/utils';

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

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: products, isLoading } = useProducts({ search });
  const deleteProduct = useDeleteProduct();

  const productsList = Array.isArray(products) ? products : [];

  const filteredProducts = productsList.filter((p: Record<string, unknown>) => {
    if (!activeFilter) return true;
    if (activeFilter === 'active') return p.isActive;
    if (activeFilter === 'inactive') return !p.isActive;
    if (activeFilter === 'low_stock') {
      const stock = Number(p.currentStock ?? 0);
      const min = Number(p.minStock ?? 0);
      return stock <= min && stock > 0;
    }
    if (activeFilter === 'out_of_stock') return Number(p.currentStock ?? 0) === 0;
    return true;
  });

  const productStats = useMemo(() => {
    const total = productsList.length;
    const active = productsList.filter((p: Record<string, unknown>) => p.isActive).length;
    const lowStock = productsList.filter((p: Record<string, unknown>) => {
      const stock = Number(p.currentStock ?? 0);
      const min = Number(p.minStock ?? 0);
      return stock <= min && stock > 0;
    }).length;
    const outOfStock = productsList.filter((p: Record<string, unknown>) => Number(p.currentStock ?? 0) === 0).length;
    return { total, active, lowStock, outOfStock };
  }, [productsList]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredProducts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set((filteredProducts as any[])?.map((p: any) => p.id) || []));
  };

  const handleEdit = (product: Record<string, unknown>) => {
    setEditData(product);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" ürününü silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Ürün silindi');
    } catch {
      toast.error('Ürün silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ürünler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ürün kataloğunu yönetin ve stok durumunu takip edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filteredProducts as any[] || [],
              [
                { key: 'code', header: 'Kod', width: 12 },
                { key: 'name', header: 'Ürün Adı', width: 30 },
                { key: 'barcode', header: 'Barkod', width: 15 },
                { key: 'purchasePrice', header: 'Alış Fiyatı', width: 15 },
                { key: 'salePrice', header: 'Satış Fiyatı', width: 15 },
                { key: 'currentStock', header: 'Stok', width: 10 },
                { key: 'unit', header: 'Birim', width: 10 },
              ],
              'urunler',
              'Ürünler'
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
            Yeni Ürün
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Ürün', value: productStats.total, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', filter: '' },
          { label: 'Aktif Ürün', value: productStats.active, icon: Package, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950', filter: 'active' },
          { label: 'Düşük Stok', value: productStats.lowStock, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950', filter: 'low_stock' },
          { label: 'Stok Tükendi', value: productStats.outOfStock, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950', filter: 'out_of_stock' },
        ].map((card) => (
          <button
            key={card.label}
            onClick={() => setActiveFilter(activeFilter === card.filter ? '' : card.filter)}
            className={cn(
              'rounded-xl border border-border bg-card p-4 shadow-sm text-left transition-all hover:shadow-md',
              activeFilter === card.filter && 'ring-2 ring-primary',
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold mt-0.5">{card.value}</p>
              </div>
              <div className={cn('p-2 rounded-lg', card.bg)}>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ürün ara (ad, kod, barkod)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm Ürünler</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
          <option value="low_stock">Düşük Stok</option>
          <option value="out_of_stock">Stok Tükendi</option>
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
                    checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kod</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ürün Adı</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Alış Fiyatı</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Satış Fiyatı</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stok</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <div className="space-y-2">
                      <p>Henüz kayıt yok</p>
                      <button
                        onClick={() => { setEditData(null); setModalOpen(true); }}
                        className="text-primary hover:underline text-sm"
                      >
                        Yeni Ürün Ekle
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: Record<string, unknown>) => {
                  const category = product.category as Record<string, unknown> | undefined;
                  const currentStock = Number(product.currentStock ?? 0);
                  const minStock = Number(product.minStock ?? 0);
                  const isLowStock = currentStock <= minStock && currentStock > 0;
                  const isOutOfStock = currentStock === 0;

                  return (
                    <tr
                      key={product.id as string}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id as string)}
                          onChange={() => toggleSelect(product.id as string)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {product.code as string}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{product.name as string}</div>
                        {product.barcode && (
                          <div className="text-xs text-muted-foreground font-mono">{product.barcode as string}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {category?.name as string ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {Number(product.purchasePrice ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {Number(product.salePrice ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isOutOfStock && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          {isLowStock && !isOutOfStock && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                          <span className={isOutOfStock ? 'text-red-600 font-medium' : isLowStock ? 'text-yellow-600 font-medium' : 'text-foreground'}>
                            {currentStock.toLocaleString('tr-TR')} {product.unit as string}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {product.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id as string, product.name as string)}
                            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
            <span>{filteredProducts.length} ürün gösteriliyor</span>
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
              if (!confirm(`${selectedIds.size} ürün silinecek, emin misiniz?`)) return;
              await Promise.all([...selectedIds].map(id => deleteProduct.mutateAsync(id)));
              setSelectedIds(new Set());
              toast.success(`${selectedIds.size} ürün silindi`);
            },
          },
        ]}
      />

      <ProductModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        editData={editData as Parameters<typeof ProductModal>[0]['editData']}
      />
    </div>
  );
}
