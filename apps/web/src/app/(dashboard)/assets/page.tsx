'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, Package, DollarSign, TrendingDown, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { formatCurrency, cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  disposed: 'bg-gray-100 text-gray-600',
  maintenance: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  disposed: 'Hizmetten Çıktı',
  maintenance: 'Bakımda',
};

interface Asset {
  id: string;
  code: string;
  name: string;
  status: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate?: string;
  warrantyExpiry?: string;
  category?: { name: string } | null;
  _count: { maintenances: number; depreciations: number };
}

const MOCK_CATEGORIES = [
  { id: 'cat1', name: 'Bilgisayar ve Çevre Birimleri' },
  { id: 'cat2', name: 'Taşıt Araçları' },
  { id: 'cat3', name: 'Makine ve Teçhizat' },
  { id: 'cat4', name: 'Mobilya ve Demirbaş' },
  { id: 'cat5', name: 'Ofis Ekipmanları' },
];

const MOCK_ASSETS: Asset[] = [
  {
    id: 'a1', code: 'DMB-2024-001', name: 'Dell Latitude 5520 Dizüstü Bilgisayar',
    status: 'active', purchasePrice: 45000, currentValue: 31500,
    purchaseDate: '2024-03-15', warrantyExpiry: '2027-03-15',
    category: { name: 'Bilgisayar ve Çevre Birimleri' }, _count: { maintenances: 0, depreciations: 3 },
  },
  {
    id: 'a2', code: 'DMB-2023-015', name: 'Ford Transit Kargo Aracı',
    status: 'active', purchasePrice: 1450000, currentValue: 1087500,
    purchaseDate: '2023-06-01', warrantyExpiry: '2026-06-01',
    category: { name: 'Taşıt Araçları' }, _count: { maintenances: 2, depreciations: 6 },
  },
  {
    id: 'a3', code: 'DMB-2022-003', name: 'CNC Freze Makinesi Mod-2200',
    status: 'active', purchasePrice: 3200000, currentValue: 2240000,
    purchaseDate: '2022-01-10', warrantyExpiry: '2025-01-10',
    category: { name: 'Makine ve Teçhizat' }, _count: { maintenances: 5, depreciations: 12 },
  },
  {
    id: 'a4', code: 'DMB-2024-022', name: 'HP LaserJet Pro M404n Yazıcı',
    status: 'active', purchasePrice: 12500, currentValue: 10000,
    purchaseDate: '2024-07-20', warrantyExpiry: '2026-07-20',
    category: { name: 'Ofis Ekipmanları' }, _count: { maintenances: 0, depreciations: 2 },
  },
  {
    id: 'a5', code: 'DMB-2021-008', name: 'Depo Raf Sistemi (200 Bölüm)',
    status: 'active', purchasePrice: 185000, currentValue: 111000,
    purchaseDate: '2021-04-01',
    category: { name: 'Mobilya ve Demirbaş' }, _count: { maintenances: 1, depreciations: 15 },
  },
  {
    id: 'a6', code: 'DMB-2024-030', name: 'Apple MacBook Pro M3 14"',
    status: 'active', purchasePrice: 89000, currentValue: 80100,
    purchaseDate: '2024-09-01', warrantyExpiry: '2026-09-01',
    category: { name: 'Bilgisayar ve Çevre Birimleri' }, _count: { maintenances: 0, depreciations: 1 },
  },
  {
    id: 'a7', code: 'DMB-2020-005', name: 'Torna Tezgahı T-500XL',
    status: 'maintenance', purchasePrice: 780000, currentValue: 390000,
    purchaseDate: '2020-08-15',
    category: { name: 'Makine ve Teçhizat' }, _count: { maintenances: 8, depreciations: 24 },
  },
  {
    id: 'a8', code: 'DMB-2024-040', name: 'Ergonomik Ofis Koltukları (10 Adet)',
    status: 'active', purchasePrice: 35000, currentValue: 28000,
    purchaseDate: '2024-05-01',
    category: { name: 'Mobilya ve Demirbaş' }, _count: { maintenances: 0, depreciations: 2 },
  },
  {
    id: 'a9', code: 'DMB-2018-002', name: 'Eski Fotokopi Makinesi Konica 230i',
    status: 'disposed', purchasePrice: 25000, currentValue: 0,
    purchaseDate: '2018-02-01',
    category: { name: 'Ofis Ekipmanları' }, _count: { maintenances: 4, depreciations: 36 },
  },
  {
    id: 'a10', code: 'DMB-2025-005', name: 'Forklift Elektrikli 2T',
    status: 'active', purchasePrice: 620000, currentValue: 558000,
    purchaseDate: '2025-01-15', warrantyExpiry: '2028-01-15',
    category: { name: 'Makine ve Teçhizat' }, _count: { maintenances: 0, depreciations: 1 },
  },
];

function AddAssetModal({
  onClose,
  onSave,
  categories,
}: {
  onClose: () => void;
  onSave: (d: Record<string, unknown>) => void;
  categories: Array<{ id: string; name: string }>;
}) {
  const [form, setForm] = useState({
    code: '', name: '', status: 'active',
    purchasePrice: '', currentValue: '', salvageValue: '0',
    usefulLifeYears: '5', purchaseDate: '', serialNumber: '',
    location: '', categoryId: '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Yeni Demirbaş</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              ...form,
              purchasePrice: Number(form.purchasePrice),
              currentValue: Number(form.currentValue || form.purchasePrice),
              salvageValue: Number(form.salvageValue),
              usefulLifeYears: Number(form.usefulLifeYears),
            });
          }}
          className="space-y-3"
        >
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
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const categories = MOCK_CATEGORIES;
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const summary = useMemo(() => {
    const totalPurchaseValue = assets.reduce((s, a) => s + a.purchasePrice, 0);
    const totalCurrentValue = assets.reduce((s, a) => s + a.currentValue, 0);
    const totalDepreciation = totalPurchaseValue - totalCurrentValue;
    return {
      totalAssets: assets.length,
      activeAssets: assets.filter((a) => a.status === 'active').length,
      totalPurchaseValue,
      totalCurrentValue,
      totalDepreciation,
      depreciationRate: totalPurchaseValue > 0 ? (totalDepreciation / totalPurchaseValue) * 100 : 0,
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const catName = categories.find((c) => c.id === categoryFilter)?.name;
    const q = search.toLowerCase();
    return assets.filter((a) => {
      if (statusFilter && a.status !== statusFilter) return false;
      if (catName && a.category?.name !== catName) return false;
      if (q && !a.code.toLowerCase().includes(q) && !a.name.toLowerCase().includes(q) && !a.category?.name?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, statusFilter, categoryFilter, search, categories]);

  function handleCreate(d: Record<string, unknown>) {
    const category = categories.find((c) => c.id === (d.categoryId as string));
    const newAsset: Asset = {
      id: `a${Date.now()}`,
      code: (d.code as string) || `DMB-${Date.now()}`,
      name: d.name as string,
      status: d.status as string,
      purchasePrice: d.purchasePrice as number,
      currentValue: d.currentValue as number,
      purchaseDate: (d.purchaseDate as string) || undefined,
      category: category ? { name: category.name } : null,
      _count: { maintenances: 0, depreciations: 0 },
    };
    setAssets((prev) => [newAsset, ...prev]);
    setShowForm(false);
  }

  function handleDepreciate(id: string) {
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const annualDep = a.purchasePrice * 0.2;
        return {
          ...a,
          currentValue: Math.max(0, a.currentValue - annualDep),
          _count: { ...a._count, depreciations: a._count.depreciations + 1 },
        };
      })
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demirbaş Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Sabit varlıklar ve amortisman takibi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportToExcel(
                filteredAssets.map((a) => ({
                  code: a.code,
                  name: a.name,
                  category: a.category?.name ?? '',
                  status: STATUS_LABELS[a.status] ?? a.status,
                  purchasePrice: a.purchasePrice,
                  currentValue: a.currentValue,
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
              )
            }
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
          >
            <PlusCircle className="h-4 w-4" />Demirbaş Ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Demirbaş', value: summary.totalAssets, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', fmt: 'number' },
          { label: 'Alış Değeri', value: summary.totalPurchaseValue, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950', fmt: 'currency' },
          { label: 'Net Defter Değeri', value: summary.totalCurrentValue, icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', fmt: 'currency' },
          { label: 'Birikmiş Amortisman', value: summary.totalDepreciation, icon: TrendingDown, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', fmt: 'currency' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold mt-0.5">
                  {card.fmt === 'currency' ? formatCurrency(card.value) : card.value}
                </p>
              </div>
              <div className={cn('p-2 rounded-lg', card.bg)}>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

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
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {[{ value: '', label: 'Tüm Durumlar' }, ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Demirbaş bulunamadı</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Kod', 'Ad', 'Kategori', 'Alış Fiyatı', 'Net Değer', 'Durum', 'İşlemler'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAssets.map((asset) => {
                const depRate = asset.purchasePrice > 0
                  ? ((asset.purchasePrice - asset.currentValue) / asset.purchasePrice) * 100
                  : 0;
                return (
                  <tr key={asset.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-sm">{asset.code}</td>
                    <td className="px-4 py-3 font-medium">{asset.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{asset.category?.name ?? '-'}</td>
                    <td className="px-4 py-3">{formatCurrency(asset.purchasePrice)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold">{formatCurrency(asset.currentValue)}</span>
                        <div className="w-20 bg-muted rounded-full h-1.5 mt-1">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.max(0, 100 - depRate)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">%{depRate.toFixed(1)} amortisman</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[asset.status] ?? '')}>
                        {STATUS_LABELS[asset.status] ?? asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDepreciate(asset.id)}
                        title="Yıllık Amortisman Uygula (%20)"
                        className="p-1 text-muted-foreground hover:text-primary rounded"
                      >
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
          onSave={handleCreate}
          categories={categories}
        />
      )}
    </div>
  );
}
