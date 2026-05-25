'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { usePriceList, useAddPriceListItem, useRemovePriceListItem, useProducts } from '@/lib/api/hooks';
import { toast } from 'sonner';

export default function PriceListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: priceList, isLoading } = usePriceList(id);
  const { data: productsData } = useProducts({});
  const addItem = useAddPriceListItem();
  const removeItem = useRemovePriceListItem();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: '', price: '', discountRate: '0' });

  const pl = priceList as any;
  const products = (productsData as any)?.data ?? (Array.isArray(productsData) ? productsData : []);

  const handleAddItem = async () => {
    if (!form.productId || !form.price) { toast.error('Ürün ve fiyat zorunludur'); return; }
    try {
      await addItem.mutateAsync({
        priceListId: id,
        productId: form.productId,
        price: Number(form.price),
        discountRate: Number(form.discountRate) || 0,
      });
      toast.success('Ürün eklendi');
      setShowForm(false);
      setForm({ productId: '', price: '', discountRate: '0' });
    } catch {
      toast.error('Ürün eklenemedi');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Bu ürünü fiyat listesinden çıkarmak istiyor musunuz?')) return;
    try {
      await removeItem.mutateAsync({ priceListId: id, itemId });
      toast.success('Ürün kaldırıldı');
    } catch {
      toast.error('Kaldırma işlemi başarısız');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!pl) return <div className="text-muted-foreground">Fiyat listesi bulunamadı</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{pl.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {pl.currency} · {pl.items?.length ?? 0} ürün
              {pl.isDefault && <span className="ml-2 text-yellow-600 font-medium">· Varsayılan</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Ürün Ekle
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <h2 className="font-semibold">Ürün Ekle</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Ürün *</label>
              <select
                value={form.productId}
                onChange={(e) => setForm(f => ({ ...f, productId: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="">Seçiniz...</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Fiyat *</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">İskonto (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.discountRate}
                onChange={(e) => setForm(f => ({ ...f, discountRate: e.target.value }))}
                placeholder="0"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddItem}
              disabled={addItem.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {addItem.isPending ? 'Ekleniyor...' : 'Ekle'}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
              İptal
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {['Ürün ID', 'Fiyat', 'İskonto (%)', 'Net Fiyat', 'İşlemler'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!pl.items?.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Bu fiyat listesine henüz ürün eklenmemiş</td></tr>
            ) : pl.items.map((item: any) => {
              const netPrice = Number(item.price) * (1 - Number(item.discountRate) / 100);
              return (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.productId.substring(0, 8)}...</td>
                  <td className="px-4 py-3 font-medium">
                    {Number(item.price).toLocaleString('tr-TR', { style: 'currency', currency: pl.currency || 'TRY' })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">%{Number(item.discountRate).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">
                    {netPrice.toLocaleString('tr-TR', { style: 'currency', currency: pl.currency || 'TRY' })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
