'use client';

import { useState } from 'react';
import { Search, Plus, Package, AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  code: string;
  name: string;
  category: { name: string } | null;
  unit: string;
  salePrice: number;
  purchasePrice: number;
  vatRate: number;
  currentStock: number;
  minStock: number;
  isActive: boolean;
  barcode: string | null;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    code: 'URN-001',
    name: 'Laptop Dell Inspiron 15',
    category: { name: 'Bilgisayar' },
    unit: 'adet',
    salePrice: 25000,
    purchasePrice: 20000,
    vatRate: 20,
    currentStock: 15,
    minStock: 5,
    isActive: true,
    barcode: '8695830001234',
  },
  {
    id: '2',
    code: 'URN-002',
    name: 'Mekanik Klavye Logitech',
    category: { name: 'Çevre Birimi' },
    unit: 'adet',
    salePrice: 1800,
    purchasePrice: 1200,
    vatRate: 20,
    currentStock: 3,
    minStock: 10,
    isActive: true,
    barcode: '8695830002345',
  },
  {
    id: '3',
    code: 'URN-003',
    name: 'USB-C Hub 7 Port',
    category: { name: 'Çevre Birimi' },
    unit: 'adet',
    salePrice: 650,
    purchasePrice: 400,
    vatRate: 20,
    currentStock: 0,
    minStock: 20,
    isActive: true,
    barcode: null,
  },
  {
    id: '4',
    code: 'URN-004',
    name: 'Yazıcı Mürekkebi HP 680',
    category: { name: 'Sarf Malzeme' },
    unit: 'adet',
    salePrice: 450,
    purchasePrice: 280,
    vatRate: 20,
    currentStock: 45,
    minStock: 15,
    isActive: false,
    barcode: '8695830003456',
  },
];

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const filtered = MOCK_PRODUCTS.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode ?? '').includes(search);
    const matchActive =
      !activeFilter ||
      (activeFilter === 'active' ? p.isActive : !p.isActive);
    const matchStock =
      !stockFilter ||
      (stockFilter === 'low' && p.currentStock <= p.minStock) ||
      (stockFilter === 'out' && p.currentStock === 0);
    return matchSearch && matchActive && matchStock;
  });

  const lowStockCount = MOCK_PRODUCTS.filter((p) => p.currentStock <= p.minStock && p.currentStock > 0).length;
  const outOfStockCount = MOCK_PRODUCTS.filter((p) => p.currentStock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ürünler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ürün kataloğunu yönetin ve stok durumunu takip edin
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Yeni Ürün
        </button>
      </div>

      {/* Alert Cards */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">
                <span className="font-semibold">{outOfStockCount} ürün</span> stokta yok
              </p>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-900/10 p-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                <span className="font-semibold">{lowStockCount} ürün</span> minimum stok seviyesinin altında
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
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
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm Stoklar</option>
          <option value="low">Düşük Stok</option>
          <option value="out">Stokta Yok</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kod</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ürün Adı</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Alış Fiyatı</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Satış Fiyatı</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stok</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Ürün bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const isLowStock = product.currentStock <= product.minStock && product.currentStock > 0;
                  const isOutOfStock = product.currentStock === 0;
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {product.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{product.name}</div>
                        {product.barcode && (
                          <div className="text-xs text-muted-foreground font-mono">{product.barcode}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.category?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {product.purchasePrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {product.salePrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            isOutOfStock
                              ? 'text-red-600 font-medium'
                              : isLowStock
                              ? 'text-yellow-600 font-medium'
                              : 'text-foreground'
                          }
                        >
                          {Number(product.currentStock).toLocaleString('tr-TR')} {product.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            product.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {product.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} ürün gösteriliyor</span>
          <span>Toplam: {MOCK_PRODUCTS.length}</span>
        </div>
      </div>
    </div>
  );
}
