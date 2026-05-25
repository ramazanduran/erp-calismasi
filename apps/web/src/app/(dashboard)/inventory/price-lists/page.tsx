'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Tag, Star } from 'lucide-react';
import { usePriceLists, useCreatePriceList } from '@/lib/api/hooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PriceListsPage() {
  const { data: priceLists, isLoading } = usePriceLists();
  const createList = useCreatePriceList();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', currency: 'TRY', isDefault: false });

  const list = (priceLists as any[]) || [];

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Ad zorunludur'); return; }
    try {
      await createList.mutateAsync(form);
      toast.success('Fiyat listesi oluşturuldu');
      setShowForm(false);
      setForm({ name: '', currency: 'TRY', isDefault: false });
    } catch {
      toast.error('Fiyat listesi oluşturulamadı');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fiyat Listeleri</h1>
          <p className="text-muted-foreground text-sm mt-1">Ürün fiyatlandırma listelerini yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Yeni Fiyat Listesi
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <h2 className="font-semibold">Yeni Fiyat Listesi</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Ad *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Fiyat listesi adı"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Para Birimi</label>
              <select
                value={form.currency}
                onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault}
              onChange={(e) => setForm(f => ({ ...f, isDefault: e.target.checked }))}
              className="rounded" />
            <label htmlFor="isDefault" className="text-sm">Varsayılan liste olarak ayarla</label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createList.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {createList.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
              İptal
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array(3).fill(0).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm animate-pulse h-32" />
        )) : !list.length ? (
          <div className="col-span-3 rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            <Tag className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>Henüz fiyat listesi yok</p>
          </div>
        ) : list.map((pl: any) => (
          <Link key={pl.id} href={`/inventory/price-lists/${pl.id}`}
            className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow block">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{pl.name}</h3>
                  <p className="text-xs text-muted-foreground">{pl.currency}</p>
                </div>
              </div>
              {pl.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  <Star className="h-3 w-3" /> Varsayılan
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{pl._count?.items ?? 0}</span> ürün
              {pl.validFrom && (
                <span className="ml-2">· {new Date(pl.validFrom).toLocaleDateString('tr-TR')}</span>
              )}
              {pl.validTo && (
                <span> – {new Date(pl.validTo).toLocaleDateString('tr-TR')}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
