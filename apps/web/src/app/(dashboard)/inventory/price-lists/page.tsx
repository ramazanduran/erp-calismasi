'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, Tag, Star, X, Search, Package, DollarSign,
  Percent, AlertCircle, Calendar, CheckCircle2,
  BadgeDollarSign, Layers, ShoppingCart, ChevronRight, FileDown,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceList {
  id: string;
  name: string;
  code: string;
  currency: string;
  startDate?: string;
  endDate?: string;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  _count?: { items: number };
}

interface PriceListItem {
  id: string;
  product: { id: string; name: string; code: string; unit: string; salePrice: number };
  price: number;
  minQty: number;
  discountPercent: number;
}

interface PriceListDetail extends PriceList {
  items: PriceListItem[];
}

interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  salePrice: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PRICE_LISTS: PriceList[] = [
  { id: 'pl1', name: 'Standart Fiyat Listesi', code: 'STANDART-01', currency: 'TRY', startDate: '2026-01-01', isDefault: true, isActive: true, description: 'Tüm müşteriler için geçerli standart liste', _count: { items: 48 } },
  { id: 'pl2', name: 'VIP Müşteri Listesi', code: 'VIP-01', currency: 'TRY', startDate: '2026-01-01', endDate: '2026-12-31', isDefault: false, isActive: true, description: 'VIP müşteriler için %10 indirimli liste', _count: { items: 48 } },
  { id: 'pl3', name: 'Kurumsal USD Fiyatları', code: 'CORP-USD-01', currency: 'USD', startDate: '2026-03-01', isDefault: false, isActive: true, description: 'Yurt dışı kurumsal müşteriler için', _count: { items: 25 } },
  { id: 'pl4', name: '2025 Arşiv Listesi', code: 'ARSIV-2025', currency: 'TRY', endDate: '2025-12-31', isDefault: false, isActive: false, description: 'Arşivlenmiş 2025 yılı listesi', _count: { items: 45 } },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCY_CONFIG: Record<string, { label: string; flag: string; color: string; bg: string }> = {
  TRY: { label: '₺ TRY', flag: '🇹🇷', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  USD: { label: '$ USD', flag: '🇺🇸', color: 'text-green-700', bg: 'bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  EUR: { label: '€ EUR', flag: '🇪🇺', color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  const locales: Record<string, string> = { TRY: 'tr-TR', USD: 'en-US', EUR: 'de-DE' };
  return amount.toLocaleString(locales[currency] ?? 'tr-TR', {
    style: 'currency',
    currency: currency ?? 'TRY',
    minimumFractionDigits: 2,
  });
}

function effectivePrice(price: number, discountPercent: number) {
  return price * (1 - discountPercent / 100);
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, colorClass, subLabel,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  colorClass: string;
  subLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={cn('flex items-center gap-2 mb-2', colorClass)}>
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground truncate">{value}</p>
      {subLabel && <p className="text-xs text-muted-foreground mt-0.5">{subLabel}</p>}
    </div>
  );
}

// ─── Add Price Item Modal ─────────────────────────────────────────────────────

function AddPriceItemModal({ priceListId, currency, onClose }: {
  priceListId: string;
  currency: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    productId: '',
    price: '',
    minQty: '1',
    discountPercent: '0',
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/api/v1/inventory/products'),
  });

  const allProducts = (productsData as Product[]) ?? [];
  const filteredProducts = search.trim()
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()),
      )
    : allProducts;

  const selectedProduct = allProducts.find(p => p.id === form.productId);

  const addItem = useMutation({
    mutationFn: (data: {
      productId: string;
      price: number;
      minQty?: number;
      discountPercent?: number;
    }) => api.post(`/api/v1/pricing/${priceListId}/items`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-list', priceListId] });
      qc.invalidateQueries({ queryKey: ['price-lists'] });
      toast.success('Fiyat eklendi');
      onClose();
    },
    onError: () => toast.error('Fiyat eklenemedi'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId) { toast.error('Ürün seçiniz'); return; }
    const price = parseFloat(form.price);
    if (!price || price <= 0) { toast.error('Geçerli bir fiyat giriniz'); return; }
    addItem.mutate({
      productId: form.productId,
      price,
      minQty: parseInt(form.minQty) || 1,
      discountPercent: parseFloat(form.discountPercent) || 0,
    });
  };

  const calcEffective = selectedProduct && form.price
    ? effectivePrice(parseFloat(form.price), parseFloat(form.discountPercent) || 0)
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Fiyat Ekle</h2>
            <p className="text-sm text-muted-foreground">Fiyat listesine ürün ekleyin</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Product search & select */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Ürün *</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ürün ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-input divide-y divide-border">
              {loadingProducts ? (
                <div className="px-3 py-2 text-sm text-muted-foreground text-center">Yükleniyor...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground text-center">Ürün bulunamadı</div>
              ) : filteredProducts.slice(0, 8).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setForm(f => ({
                      ...f,
                      productId: p.id,
                      price: p.salePrice ? String(p.salePrice) : f.price,
                    }));
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left',
                    form.productId === p.id && 'bg-primary/10',
                  )}
                >
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">{p.code}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.unit}</span>
                </button>
              ))}
            </div>
            {selectedProduct && (
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Seçili: {selectedProduct.name}
              </p>
            )}
          </div>

          {/* Price & discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Fiyat ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Min. Miktar</label>
              <input
                type="number"
                min="1"
                value={form.minQty}
                onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">
              İndirim % <span className="font-normal text-muted-foreground">(opsiyonel)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.discountPercent}
              onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
              placeholder="0"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Effective price preview */}
          {calcEffective !== null && (
            <div className="rounded-lg bg-muted/50 px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Efektif Fiyat</span>
              <span className="text-sm font-semibold text-primary">
                {formatCurrency(calcEffective, currency)}
              </span>
            </div>
          )}
        </form>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={addItem.isPending}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {addItem.isPending ? 'Ekleniyor...' : 'Fiyat Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Price List Detail Modal ──────────────────────────────────────────────────

function PriceListDetailModal({ list, onClose }: {
  list: PriceList;
  onClose: () => void;
}) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [searchItems, setSearchItems] = useState('');

  const { data, isLoading } = useQuery<PriceListDetail>({
    queryKey: ['price-list', list.id],
    queryFn: () => api.get(`/api/v1/pricing/${list.id}`),
    enabled: !!list.id,
  });

  const detail = data as PriceListDetail | undefined;
  const items = detail?.items ?? [];

  const filteredItems = searchItems.trim()
    ? items.filter(item =>
        item.product.name.toLowerCase().includes(searchItems.toLowerCase()) ||
        item.product.code.toLowerCase().includes(searchItems.toLowerCase()),
      )
    : items;

  const cc = CURRENCY_CONFIG[list.currency] ?? CURRENCY_CONFIG['TRY'];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold">{list.name}</h2>
                  {list.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                      <Star className="h-3 w-3" /> Varsayılan
                    </span>
                  )}
                  {list.isActive ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                      Pasif
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{list.code}</span>
                  <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', cc.bg)}>
                    {cc.label}
                  </span>
                  {list.startDate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(list.startDate).toLocaleDateString('tr-TR')}
                      {list.endDate && ` – ${new Date(list.endDate).toLocaleDateString('tr-TR')}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border shrink-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ürün ara..."
                value={searchItems}
                onChange={e => setSearchItems(e.target.value)}
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Fiyat Ekle
            </button>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">
                  {searchItems ? 'Arama sonucu bulunamadı' : 'Henüz fiyat eklenmemiş'}
                </p>
                {!searchItems && (
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="mt-2 text-primary text-sm hover:underline"
                  >
                    İlk fiyatı ekle
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ürün Kodu</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ürün Adı</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Birim Fiyat</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Min. Miktar</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">İndirim %</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Efektif Fiyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.map((item) => {
                    const effPrice = effectivePrice(Number(item.price), Number(item.discountPercent));
                    const hasDiscount = Number(item.discountPercent) > 0;
                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {item.product.code}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-xs text-muted-foreground">{item.product.unit}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">
                          {formatCurrency(Number(item.price), list.currency)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">
                          {Number(item.minQty) > 1
                            ? <span className="font-medium text-foreground">{Number(item.minQty).toLocaleString('tr-TR')}</span>
                            : '1'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {hasDiscount ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                              <Percent className="h-3 w-3" />
                              {Number(item.discountPercent).toLocaleString('tr-TR')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-primary">
                          {formatCurrency(effPrice, list.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border shrink-0 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {filteredItems.length} ürün fiyatı
              {searchItems && ` (${items.length} toplamdan)`}
            </span>
            <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
              Kapat
            </button>
          </div>
        </div>
      </div>

      {showAddItem && (
        <AddPriceItemModal
          priceListId={list.id}
          currency={list.currency}
          onClose={() => setShowAddItem(false)}
        />
      )}
    </>
  );
}

// ─── New Price List Modal ─────────────────────────────────────────────────────

function NewPriceListModal({ onClose, onLocalCreate }: { onClose: () => void; onLocalCreate: (list: PriceList) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    code: '',
    currency: 'TRY',
    startDate: '',
    endDate: '',
    isDefault: false,
    description: '',
  });

  const create = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/api/v1/pricing', {
        ...data,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-lists'] });
      toast.success('Fiyat listesi oluşturuldu');
      onClose();
    },
    onError: (_err, data) => {
      const newList: PriceList = { id: `local-${Date.now()}`, name: data.name, code: data.code, currency: data.currency, startDate: data.startDate || undefined, endDate: data.endDate || undefined, isDefault: data.isDefault, isActive: true, description: data.description || undefined, _count: { items: 0 } };
      onLocalCreate(newList);
      toast.success('Fiyat listesi oluşturuldu (yerel)');
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Liste adı zorunludur'); return; }
    if (!form.code.trim()) { toast.error('Liste kodu zorunludur'); return; }
    create.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Yeni Fiyat Listesi</h2>
            <p className="text-sm text-muted-foreground">Yeni bir fiyat listesi oluşturun</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Name & Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Liste Adı *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Perakende Fiyat Listesi"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Liste Kodu *</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="PERAKENDE-01"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Para Birimi</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, currency: code }))}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors',
                    form.currency === code
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <span>{cfg.flag}</span>
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Başlangıç Tarihi <span className="font-normal text-muted-foreground">(opsiyonel)</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Bitiş Tarihi <span className="font-normal text-muted-foreground">(opsiyonel)</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                min={form.startDate || undefined}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Açıklama <span className="font-normal text-muted-foreground">(opsiyonel)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Bu fiyat listesi hakkında kısa açıklama..."
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* isDefault toggle */}
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                id="isDefault"
                checked={form.isDefault}
                onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                className="sr-only peer"
              />
              <div
                onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
                className={cn(
                  'w-9 h-5 rounded-full cursor-pointer transition-colors',
                  form.isDefault ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              />
              <div className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                form.isDefault && 'translate-x-4',
              )} />
            </div>
            <div>
              <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                Varsayılan liste olarak ayarla
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Varsayılan liste yeni müşteriler için otomatik olarak kullanılır
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Liste oluşturulduktan sonra ürün fiyatlarını ürün fiyat ekle butonu ile ekleyebilirsiniz.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {create.isPending ? 'Oluşturuluyor...' : 'Liste Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Price List Card ──────────────────────────────────────────────────────────

function PriceListCard({ list, onClick }: { list: PriceList; onClick: () => void }) {
  const cc = CURRENCY_CONFIG[list.currency] ?? CURRENCY_CONFIG['TRY'];
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group w-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{list.name}</h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{list.code}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {list.isDefault && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400 whitespace-nowrap">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              Varsayılan
            </span>
          )}
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap', cc.bg)}>
            {cc.label}
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="mb-3">
        {list.isActive ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
            Pasif
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3 mt-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Ürün Sayısı
          </span>
          <span className="font-semibold text-foreground">
            {list._count?.items ?? 0}
          </span>
        </div>
        {(list.startDate || list.endDate) && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Geçerlilik
            </span>
            <span>
              {list.startDate
                ? new Date(list.startDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
                : '—'}
              {' – '}
              {list.endDate
                ? new Date(list.endDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Süresiz'}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-border text-xs text-primary font-medium group-hover:gap-2 transition-all">
        <span>Detayları görüntüle</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PriceListsPage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedList, setSelectedList] = useState<PriceList | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [localLists, setLocalLists] = useState<PriceList[]>(MOCK_PRICE_LISTS);

  const { data: rawData, isLoading } = useQuery<PriceList[]>({
    queryKey: ['price-lists'],
    queryFn: () => api.get('/api/v1/pricing'),
  });

  const apiLists: PriceList[] | null = rawData !== undefined ? (Array.isArray(rawData) ? rawData : []) : null;
  const allLists = apiLists ?? localLists;

  const filteredLists = allLists
    .filter(pl => {
      if (filter === 'active') return pl.isActive;
      if (filter === 'inactive') return !pl.isActive;
      return true;
    })
    .filter(pl =>
      !search.trim() ||
      pl.name.toLowerCase().includes(search.toLowerCase()) ||
      pl.code.toLowerCase().includes(search.toLowerCase()),
    );

  const totalCount = allLists.length;
  const activeCount = allLists.filter(pl => pl.isActive).length;
  const defaultList = allLists.find(pl => pl.isDefault);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fiyat Listeleri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ürün fiyatlandırma listelerini yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              allLists.map((pl) => ({
                code: pl.code,
                name: pl.name,
                currency: pl.currency,
                isDefault: pl.isDefault ? 'Evet' : 'Hayır',
                isActive: pl.isActive ? 'Aktif' : 'Pasif',
                itemCount: pl._count?.items ?? 0,
                description: pl.description ?? '',
                startDate: pl.startDate ? new Date(pl.startDate).toLocaleDateString('tr-TR') : '',
                endDate: pl.endDate ? new Date(pl.endDate).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'code', header: 'Kod', width: 10 },
                { key: 'name', header: 'Liste Adı', width: 26 },
                { key: 'currency', header: 'Para Birimi', width: 12 },
                { key: 'isDefault', header: 'Varsayılan', width: 12 },
                { key: 'isActive', header: 'Durum', width: 10 },
                { key: 'itemCount', header: 'Ürün Sayısı', width: 12 },
                { key: 'description', header: 'Açıklama', width: 26 },
                { key: 'startDate', header: 'Başlangıç', width: 12 },
                { key: 'endDate', header: 'Bitiş', width: 12 },
              ],
              'fiyat-listeleri',
              'Fiyat Listeleri'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Liste Oluştur
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Toplam Liste"
          value={totalCount}
          icon={Layers}
          colorClass="text-blue-600"
          subLabel="tanımlanmış liste"
        />
        <SummaryCard
          label="Aktif Liste"
          value={activeCount}
          icon={CheckCircle2}
          colorClass="text-green-600"
          subLabel="aktif fiyat listesi"
        />
        <SummaryCard
          label="Varsayılan Liste"
          value={defaultList?.name ?? '—'}
          icon={BadgeDollarSign}
          colorClass="text-yellow-600"
          subLabel={defaultList ? `${defaultList.currency} • ${defaultList._count?.items ?? 0} ürün` : 'henüz belirlenmedi'}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Liste ara (ad, kod)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'active', label: 'Aktif' },
            { key: 'inactive', label: 'Pasif' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filter === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse h-52" />
          ))}
        </div>
      ) : filteredLists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-foreground">
            {search || filter !== 'all' ? 'Sonuç bulunamadı' : 'Henüz fiyat listesi yok'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || filter !== 'all'
              ? 'Arama veya filtre kriterlerini değiştirin'
              : 'İlk fiyat listenizi oluşturun'}
          </p>
          {!search && filter === 'all' && (
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Yeni Liste Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLists.map(pl => (
            <PriceListCard
              key={pl.id}
              list={pl}
              onClick={() => setSelectedList(pl)}
            />
          ))}
        </div>
      )}

      {/* Currency legend */}
      {!isLoading && filteredLists.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
          <span>Para birimleri:</span>
          {Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => (
            <span key={code} className="flex items-center gap-1">
              <span className={cn('px-1.5 py-0.5 rounded font-medium', cfg.bg)}>{cfg.label}</span>
              <span>{allLists.filter(pl => pl.currency === code).length} liste</span>
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            {filteredLists.length} liste gösteriliyor
          </span>
        </div>
      )}

      {/* Modals */}
      {showNewModal && (
        <NewPriceListModal
          onClose={() => setShowNewModal(false)}
          onLocalCreate={(list) => setLocalLists((prev) => [...prev, list])}
        />
      )}
      {selectedList && (
        <PriceListDetailModal
          list={selectedList}
          onClose={() => setSelectedList(null)}
        />
      )}
    </div>
  );
}
