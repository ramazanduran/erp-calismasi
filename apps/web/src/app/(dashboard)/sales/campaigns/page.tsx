'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Tag, Percent, Gift, Truck, ShoppingBag, Award, Edit2, Copy, BarChart3, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type CampaignType = 'discount' | 'bundle' | 'buy_x_get_y' | 'free_shipping' | 'loyalty' | 'flash_sale';
type CampaignStatus = 'draft' | 'active' | 'scheduled' | 'ended' | 'paused';
type DiscountType = 'percentage' | 'fixed';
type TargetType = 'all' | 'segment' | 'product' | 'category';

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  discountType: DiscountType;
  discountValue: number;
  targetType: TargetType;
  targetName: string;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit?: number;
  revenue: number;
  description: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Yaz Sezonu İndirimi', type: 'discount', status: 'active', discountType: 'percentage', discountValue: 20, targetType: 'all', targetName: 'Tüm Müşteriler', minOrderAmount: 5000, startDate: '2026-06-01', endDate: '2026-08-31', usageCount: 142, usageLimit: 500, revenue: 285000, description: 'Yaz sezonu özel %20 indirim kampanyası' },
  { id: '2', name: 'Ücretsiz Kargo - Mayıs', type: 'free_shipping', status: 'active', discountType: 'fixed', discountValue: 0, targetType: 'segment', targetName: 'Premium Müşteriler', minOrderAmount: 3000, startDate: '2026-05-01', endDate: '2026-05-31', usageCount: 88, usageLimit: undefined, revenue: 520000, description: '₺3000 üzeri siparişlerde ücretsiz kargo' },
  { id: '3', name: '3 Al 2 Öde', type: 'buy_x_get_y', status: 'active', discountType: 'percentage', discountValue: 33, targetType: 'category', targetName: 'Elektronik', startDate: '2026-05-15', endDate: '2026-06-15', usageCount: 37, usageLimit: 200, revenue: 145000, description: 'Elektronik kategorisinde 3 al 2 öde' },
  { id: '4', name: 'Yeni Müşteri Hoş Geldin', type: 'discount', status: 'active', discountType: 'percentage', discountValue: 10, targetType: 'segment', targetName: 'Yeni Müşteriler', startDate: '2026-01-01', endDate: '2026-12-31', usageCount: 215, usageLimit: undefined, revenue: 380000, description: 'İlk siparişe özel %10 indirim' },
  { id: '5', name: 'Flash Sale - Cuma', type: 'flash_sale', status: 'scheduled', discountType: 'percentage', discountValue: 40, targetType: 'product', targetName: 'Seçili 20 Ürün', startDate: '2026-05-30', endDate: '2026-05-30', usageCount: 0, usageLimit: 100, revenue: 0, description: '24 saat süre sınırlı flash sale' },
  { id: '6', name: 'Sadakat Puan Kampanyası', type: 'loyalty', status: 'active', discountType: 'percentage', discountValue: 5, targetType: 'segment', targetName: 'Gold Üyeler', startDate: '2026-01-01', endDate: '2026-12-31', usageCount: 482, usageLimit: undefined, revenue: 920000, description: 'Gold üyelere her alışverişte 5% puan iadesi' },
  { id: '7', name: 'Paket Ürün İndirimi', type: 'bundle', status: 'ended', discountType: 'fixed', discountValue: 1500, targetType: 'product', targetName: 'Starter Pack', startDate: '2026-04-01', endDate: '2026-04-30', usageCount: 64, revenue: 192000, description: 'Başlangıç paketinde ₺1500 indirim' },
  { id: '8', name: 'Kurumsal Müşteri Fırsatı', type: 'discount', status: 'draft', discountType: 'percentage', discountValue: 15, targetType: 'segment', targetName: 'Kurumsal', startDate: '2026-07-01', endDate: '2026-09-30', usageCount: 0, revenue: 0, description: 'Kurumsal müşterilere özel Q3 indirim' },
];

const TYPE_CONFIG: Record<CampaignType, { label: string; icon: React.ReactNode; color: string }> = {
  discount: { label: 'İndirim', icon: <Percent className="h-4 w-4" />, color: 'bg-red-100 text-red-700' },
  bundle: { label: 'Paket', icon: <ShoppingBag className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700' },
  buy_x_get_y: { label: '3 Al 2 Öde', icon: <Gift className="h-4 w-4" />, color: 'bg-pink-100 text-pink-700' },
  free_shipping: { label: 'Ücretsiz Kargo', icon: <Truck className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
  loyalty: { label: 'Sadakat', icon: <Award className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700' },
  flash_sale: { label: 'Flash Sale', icon: <Tag className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700' },
};

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string }> = {
  active: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
  scheduled: { label: 'Planlandı', color: 'bg-blue-100 text-blue-800' },
  draft: { label: 'Taslak', color: 'bg-gray-100 text-gray-800' },
  ended: { label: 'Bitti', color: 'bg-muted text-muted-foreground' },
  paused: { label: 'Duraklatıldı', color: 'bg-yellow-100 text-yellow-800' },
};

function fmt(n: number): string {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n);
}

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: campaigns = MOCK_CAMPAIGNS } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/v1/sales/campaigns');
      if (!res.ok) return MOCK_CAMPAIGNS;
      return res.json();
    },
    initialData: MOCK_CAMPAIGNS,
  });

  const filtered = useMemo(() => campaigns.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [campaigns, statusFilter, search]);

  const stats = useMemo(() => ({
    active: campaigns.filter((c) => c.status === 'active').length,
    totalRevenue: campaigns.reduce((s, c) => s + c.revenue, 0),
    totalUsage: campaigns.reduce((s, c) => s + c.usageCount, 0),
    scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
  }), [campaigns]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kampanya & Promosyon Yönetimi</h1>
          <p className="text-muted-foreground">İndirim, paket, sadakat ve flash sale kampanyaları</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
          <PlusCircle className="h-4 w-4" /> Yeni Kampanya
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Aktif Kampanya</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam Kullanım</p>
          <p className="mt-1 text-2xl font-bold">{fmt(stats.totalUsage)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Kampanya Geliri</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">₺{fmt(stats.totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Planlanan</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">{stats.scheduled}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'scheduled', 'draft', 'ended'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {s === 'all' ? 'Tümü' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kampanya ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-56"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((camp) => {
          const typeCfg = TYPE_CONFIG[camp.type];
          const statusCfg = STATUS_CONFIG[camp.status];
          const usagePct = camp.usageLimit ? Math.round((camp.usageCount / camp.usageLimit) * 100) : null;
          return (
            <div key={camp.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn('flex items-center justify-center h-8 w-8 rounded-lg', typeCfg.color)}>
                    {typeCfg.icon}
                  </span>
                  <div>
                    <p className="font-semibold">{camp.name}</p>
                    <p className="text-xs text-muted-foreground">{typeCfg.label} · {camp.targetName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusCfg.color)}>
                    {statusCfg.label}
                  </span>
                  <button className="p-1 rounded hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button className="p-1 rounded hover:bg-muted"><Copy className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{camp.description}</p>

              <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 text-sm">
                <span>
                  <span className="text-muted-foreground">İndirim: </span>
                  <b className="text-red-600">
                    {camp.type === 'free_shipping' ? 'Ücretsiz Kargo' : camp.discountType === 'percentage' ? `%${camp.discountValue}` : `₺${fmt(camp.discountValue)}`}
                  </b>
                </span>
                {camp.minOrderAmount && (
                  <span>
                    <span className="text-muted-foreground">Min. Sipariş: </span>
                    <b>₺{fmt(camp.minOrderAmount)}</b>
                  </span>
                )}
                <span>
                  <span className="text-muted-foreground">Tarih: </span>
                  <b>{camp.startDate} – {camp.endDate}</b>
                </span>
              </div>

              {usagePct !== null && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Kullanım: {camp.usageCount} / {camp.usageLimit}</span>
                    <span className="font-medium">{usagePct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', usagePct >= 90 ? 'bg-red-500' : usagePct >= 60 ? 'bg-yellow-500' : 'bg-green-500')} style={{ width: `${usagePct}%` }} />
                  </div>
                </div>
              )}

              {camp.revenue > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Kampanya geliri: <b className="text-foreground">₺{fmt(camp.revenue)}</b></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
