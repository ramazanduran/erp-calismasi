'use client';

import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { useDashboardAnalytics, useSalesAnalytics, useInventoryAnalytics } from '@/lib/api/hooks';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  confirmed: 'Onaylı',
  processing: 'İşlemde',
  shipped: 'Kargoda',
  delivered: 'Teslim',
  cancelled: 'İptal',
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-7 w-32 bg-muted rounded" />
        </div>
        <div className="h-9 w-9 bg-muted rounded-lg" />
      </div>
      <div className="mt-3 h-3 w-28 bg-muted rounded" />
    </div>
  );
}

function SalesTrendChart({ data }: { data: Array<{ month: string; amount: number; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
        <Tooltip formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, 'Tutar']} />
        <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MonthlyBarChart({ data }: { data: Array<{ month: string; amount: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
        <Tooltip formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, 'Tutar']} />
        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function OrderStatusPieChart({ data }: { data: Array<{ status: string; count: number }> }) {
  const labeled = data.map((d) => ({ ...d, name: ORDER_STATUS_LABELS[d.status] ?? d.status }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={labeled} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {labeled.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DashboardPage() {
  const { data: dashData, isLoading: dashLoading } = useDashboardAnalytics();
  const { data: salesData, isLoading: salesLoading } = useSalesAnalytics('6months');
  const { data: inventoryData } = useInventoryAnalytics();

  const kpiCards = [
    {
      label: 'Aylık Gelir',
      value: dashLoading ? '—' : formatCurrency(dashData?.thisMonthRevenue ?? 0),
      change: dashData?.revenueChange ?? 0,
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'Aktif Siparişler',
      value: dashLoading ? '—' : formatNumber(dashData?.activeOrders ?? 0),
      change: 0,
      icon: ShoppingCart,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Stok Kalemi',
      value: dashLoading ? '—' : formatNumber(dashData?.totalProducts ?? 0),
      change: 0,
      icon: Package,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      label: 'Aktif Müşteri',
      value: dashLoading ? '—' : formatNumber(dashData?.totalCustomers ?? 0),
      change: 0,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  const monthlySales: Array<{ month: string; amount: number; count: number }> = salesData?.monthlySales ?? [];
  const orderStatusDist: Array<{ status: string; count: number }> = salesData?.orderStatusDistribution ?? [];
  const lowStockProducts: Array<{ id: string; name: string; code: string; currentStock: number; minStock: number; unit: string }> = inventoryData?.lowStockProducts ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ana Panel</h1>
        <p className="text-muted-foreground mt-1">Hoşgeldiniz — işletmenizin genel durumu</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {dashLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : kpiCards.map((card) => {
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
                  {card.label === 'Aylık Gelir' && (
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
                  )}
                </div>
              );
            })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Trend Line Chart */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Satış Trendi (Son 6 Ay)</h2>
          {salesLoading ? (
            <div className="h-60 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
              Grafik yükleniyor...
            </div>
          ) : monthlySales.length > 0 ? (
            <SalesTrendChart data={monthlySales} />
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">
              Veri bulunamadı
            </div>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Sipariş Durum Dağılımı</h2>
          {salesLoading ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
              Grafik yükleniyor...
            </div>
          ) : orderStatusDist.length > 0 ? (
            <OrderStatusPieChart data={orderStatusDist} />
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              Veri bulunamadı
            </div>
          )}
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Aylık Gelir Karşılaştırması</h2>
        {salesLoading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
            Grafik yükleniyor...
          </div>
        ) : monthlySales.length > 0 ? (
          <MonthlyBarChart data={monthlySales} />
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Veri bulunamadı
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Low Stock Warning */}
        {lowStockProducts.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="font-semibold text-destructive">Düşük Stok Uyarısı ({lowStockProducts.length})</h2>
            </div>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-destructive">{p.currentStock} {p.unit}</p>
                    <p className="text-xs text-muted-foreground">Min: {p.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Customers */}
        <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', lowStockProducts.length > 0 ? '' : 'xl:col-span-2')}>
          <h2 className="font-semibold mb-4">En İyi Müşteriler</h2>
          {salesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(salesData?.topCustomers ?? []).slice(0, 5).map((c: { customerId: string; customerName: string; totalAmount: number; orderCount: number }) => (
                <div key={c.customerId} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.customerName}</p>
                    <p className="text-xs text-muted-foreground">{c.orderCount} sipariş</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(c.totalAmount)}</span>
                </div>
              ))}
              {(salesData?.topCustomers ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">Veri bulunamadı</p>
              )}
            </div>
          )}
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
