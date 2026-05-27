'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, Package, DollarSign, TrendingDown, Wrench, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatCurrency, cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  disposed: 'bg-gray-100 text-gray-600',
  maintenance: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS: Record<string, string> = { active: 'Aktif', disposed: 'Hizmetten Çıktı', maintenance: 'Bakımda' };

interface Asset {
  id: string; code: string; name: string; status: string;
  purchasePrice: number | string; currentValue: number | string;
  purchaseDate?: string; warrantyExpiry?: string;
  category?: { name: string } | null;
  _count: { maintenances: number; depreciations: number };
}

interface AssetSummary { totalAssets: number; activeAssets: number; totalPurchaseValue: number; totalCurrentValue: number; totalDepreciation: number; depreciationRate: number }

function AddAssetModal({ onClose, onSave, categories }: { onClose: () => void; onSave: (d: Record<string, unknown>) => void; categories: Array<{ id: string; name: string }> }) {
  const [form, setForm] = useState({ code: '', name: '', status: 'active', purchasePrice: '', currentValue: '', salvageValue: '0', usefulLifeYears: '5', purchaseDate: '', serialNumber: '', location: '', categoryId: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Yeni Demirbaş</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, purchasePrice: Number(form.purchasePrice), currentValue: Number(form.currentValue || form.purchasePrice), salvageValue: Number(form.salvageValue), usefulLifeYears: Number(form.usefulLifeYears) }); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Demirbaş Kodu</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="DMB-001" />
            </div>
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Seçiniz</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Demirbaş Adı</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Alış Fiyatı</label>
              <input type="number" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium">Hurda Değeri</label>
              <input type="number" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.salvageValue} onChange={(e) => setForm({ ...form, salvageValue: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Faydalı Ömür (yıl)</label>
              <input type="number" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.usefulLifeYears} onChange={(e) => setForm({ ...form, usefulLifeYears: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Alış Tarihi</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Seri No</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Konum</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bina/Kat/Oda" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', statusFilter, categoryFilter],
    queryFn: () => api.get('/api/v1/assets', {
      ...(statusFilter && { status: statusFilter }),
      ...(categoryFilter && { categoryId: categoryFilter }),
    }),
  });

  const { data: summary } = useQuery({
    queryKey: ['assets', 'summary'],
    queryFn: () => api.get('/api/v1/assets/summary'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: () => api.get('/api/v1/assets/categories'),
  });

  const createAsset = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/v1/assets', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); setShowForm(false); },
  });

  const depreciate = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/assets/${id}/depreciate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });

  const s = summary as AssetSummary | undefined;

  const filteredAssets = useMemo(() => {
    if (!search) return assets as Asset[];
    const q = search.toLowerCase();
    return (assets as Asset[]).filter((a) =>
      a.code?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.category?.name?.toLowerCase().includes(q)
    );
  }, [assets, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demirbaş Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Sabit varlıklar ve amortisman takibi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filteredAssets.map((a) => ({
                code: a.code,
                name: a.name,
                category: a.category?.name ?? '',
                status: STATUS_LABELS[a.status] ?? a.status,
                purchasePrice: Number(a.purchasePrice),
                currentValue: Number(a.currentValue),
                purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('tr-TR') : '',
                warrantyExpiry: a.warrantyExpiry ? new Date(a.warrantyExpiry).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'code', header: 'Kod', width: 12 },
                { key: 'name', header: 'Demirbaş Adı', width: 26 },
                { key: 'category', header: 'Kategori', width: 16 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'purchasePrice', header: 'Alış Fiyatı', width: 14 },
                { key: 'currentValue', header: 'Net Değer', width: 14 },
                { key: 'purchaseDate', header: 'Alış Tarihi', width: 12 },
                { key: 'warrantyExpiry', header: 'Garanti Sonu', width: 12 },
              ],
              'demirbaslar',
              'Demirbaşlar'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Demirbaş Ekle
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Demirbaş', value: s?.totalAssets ?? 0, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Alış Değeri', value: formatCurrency(s?.totalPurchaseValue ?? 0), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Net Defter Değeri', value: formatCurrency(s?.totalCurrentValue ?? 0), icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
          { label: 'Birikmiş Amortisman', value: formatCurrency(s?.totalDepreciation ?? 0), icon: TrendingDown, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">{card.label}</p><p className="text-lg font-bold mt-0.5">{card.value}</p></div>
              <div className={cn('p-2 rounded-lg', card.bg)}><card.icon className={cn('h-4 w-4', card.color)} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kod veya ad ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-52"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
        >
          <option value="">Tüm Kategoriler</option>
          {(categories as Array<{ id: string; name: string }>).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {[{ value: '', label: 'Tüm Durumlar' }, ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))].map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Demirbaş bulunamadı</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{['Kod', 'Ad', 'Kategori', 'Alış Fiyatı', 'Net Değer', 'Durum', 'İşlemler'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAssets.map((asset) => {
                const depRate = Number(asset.purchasePrice) > 0
                  ? ((Number(asset.purchasePrice) - Number(asset.currentValue)) / Number(asset.purchasePrice)) * 100
                  : 0;
                return (
                  <tr key={asset.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-sm">{asset.code}</td>
                    <td className="px-4 py-3 font-medium">{asset.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{asset.category?.name ?? '-'}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(asset.purchasePrice))}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold">{formatCurrency(Number(asset.currentValue))}</span>
                        <div className="w-20 bg-muted rounded-full h-1.5 mt-1">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.max(0, 100 - depRate)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">%{depRate.toFixed(1)} amortisman</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[asset.status] ?? '')}>{STATUS_LABELS[asset.status] ?? asset.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => depreciate.mutate(asset.id)} title="Amortisman Hesapla" className="p-1 text-muted-foreground hover:text-primary">
                        <TrendingDown className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <AddAssetModal
          onClose={() => setShowForm(false)}
          onSave={(d) => createAsset.mutate(d)}
          categories={categories as Array<{ id: string; name: string }>}
        />
      )}
    </div>
  );
}
