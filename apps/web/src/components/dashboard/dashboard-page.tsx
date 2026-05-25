'use client';

import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';

const kpiCards = [
  {
    label: 'Aylık Gelir',
    value: formatCurrency(1250000),
    change: 12.5,
    icon: DollarSign,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
  },
  {
    label: 'Aktif Siparişler',
    value: formatNumber(342),
    change: -3.2,
    icon: ShoppingCart,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    label: 'Stok Kalemi',
    value: formatNumber(1847),
    change: 5.8,
    icon: Package,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950',
  },
  {
    label: 'Aktif Müşteri',
    value: formatNumber(528),
    change: 8.1,
    icon: Users,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950',
  },
];

const recentActivity = [
  { id: 1, action: 'Yeni sipariş oluşturuldu', detail: 'SIP-2024-0342 — Acme Ltd.', time: '5 dk önce', type: 'order' },
  { id: 2, action: 'Fatura onaylandı', detail: 'FAT-2024-0128 — ₺12,500', time: '18 dk önce', type: 'invoice' },
  { id: 3, action: 'Stok uyarısı', detail: 'Ürün A (SKU: PRD-001) kritik seviyede', time: '34 dk önce', type: 'warning' },
  { id: 4, action: 'Yeni müşteri', detail: 'Beta Teknoloji A.Ş. kayıt oldu', time: '1 saat önce', type: 'customer' },
  { id: 5, action: 'Ödeme alındı', detail: 'Gamma Ltd. — ₺48,200', time: '2 saat önce', type: 'payment' },
];

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ana Panel</h1>
        <p className="text-muted-foreground mt-1">Hoşgeldiniz — işletmenizin genel durumu</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.change >= 0;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={cn('p-2 rounded-lg', card.bg)}>
                  <Icon className={cn('h-5 w-5', card.color)} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                )}
                <span className={cn('text-xs font-medium', isPositive ? 'text-green-500' : 'text-destructive')}>
                  {isPositive ? '+' : ''}{card.change}%
                </span>
                <span className="text-xs text-muted-foreground">geçen aya göre</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Son Aktiviteler</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <div className={cn(
                  'mt-0.5 h-2 w-2 rounded-full shrink-0',
                  activity.type === 'warning' ? 'bg-warning' : 'bg-primary'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Sipariş Oluştur', href: '/sales/orders/new' },
              { label: 'Fatura Kes', href: '/finance/invoices/new' },
              { label: 'Stok Girişi', href: '/inventory/movements/new' },
              { label: 'Müşteri Ekle', href: '/sales/customers/new' },
              { label: 'Rapor Al', href: '/analytics/reports' },
              { label: 'İzin Talebi', href: '/hr/leaves/new' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center justify-center rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-center hover:bg-muted hover:border-primary transition-colors"
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
