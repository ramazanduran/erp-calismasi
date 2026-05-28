'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { useSalesAnalytics, useInventoryAnalytics, useFinanceAnalytics, useHRAnalytics } from '@/lib/api/hooks';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const MOCK_SALES_ANALYTICS = {
  totalRevenue: 4050000, totalOrders: 156, avgOrderValue: 25961, conversionRate: 68.5,
  monthlySales: [
    { month: 'Oca', revenue: 280000, orders: 18 }, { month: 'Şub', revenue: 310000, orders: 21 },
    { month: 'Mar', revenue: 350000, orders: 24 }, { month: 'Nis', revenue: 390000, orders: 28 },
    { month: 'May', revenue: 430000, orders: 32 }, { month: 'Haz', revenue: 0, orders: 0 },
  ],
  topProducts: [
    { name: 'Laptop Dell XPS', revenue: 840000, quantity: 20 },
    { name: 'Ofis Koltuğu', revenue: 385000, quantity: 110 },
    { name: 'HP Toner', revenue: 112500, quantity: 250 },
  ],
  topCustomers: [
    { name: 'ABC Ticaret A.Ş.', revenue: 520000, orders: 12 },
    { name: 'XYZ Sanayi Ltd.', revenue: 380000, orders: 9 },
    { name: 'Marmara Tekstil', revenue: 290000, orders: 7 },
  ],
  byStatus: [
    { status: 'completed', count: 98 }, { status: 'processing', count: 32 },
    { status: 'pending', count: 18 }, { status: 'cancelled', count: 8 },
  ],
};

const MOCK_INVENTORY_ANALYTICS = {
  totalProducts: 284, lowStockCount: 12, outOfStockCount: 3, totalStockValue: 8750000,
  topByStock: [
    { name: 'A4 Kağıt 80gr', currentStock: 1200, value: 78000 },
    { name: 'Kalem Seti', currentStock: 850, value: 25500 },
    { name: 'Dosya Klasörü', currentStock: 640, value: 32000 },
  ],
  categoryBreakdown: [
    { category: 'Elektronik', count: 45, value: 4200000 },
    { category: 'Kırtasiye', count: 120, value: 580000 },
    { category: 'Mobilya', count: 38, value: 1950000 },
    { category: 'Aksesuar', count: 81, value: 2020000 },
  ],
};

const MOCK_FINANCE_ANALYTICS = {
  totalRevenue: 4050000, totalExpenses: 2870000, netProfit: 1180000, profitMargin: 29.1,
  monthlyRevenue: [
    { month: 'Oca', revenue: 280000, expenses: 198000 }, { month: 'Şub', revenue: 310000, expenses: 219000 },
    { month: 'Mar', revenue: 350000, expenses: 245000 }, { month: 'Nis', revenue: 390000, expenses: 274000 },
    { month: 'May', revenue: 430000, expenses: 302000 },
  ],
  arTotal: 680000, apTotal: 420000,
};

const MOCK_HR_ANALYTICS = {
  totalEmployees: 48, activeCount: 45, newHires: 3, turnoverRate: 6.2,
  byDepartment: [
    { department: 'Üretim', count: 15 }, { department: 'Satış', count: 10 },
    { department: 'Lojistik', count: 8 }, { department: 'Muhasebe', count: 6 },
    { department: 'İnsan Kaynakları', count: 5 }, { department: 'Bilgi Teknolojileri', count: 4 },
  ],
  attendanceRate: 94.5, avgTenureYears: 3.2,
};

const PERIOD_OPTIONS = [
  { label: 'Bu Ay', value: '1months' },
  { label: 'Son 3 Ay', value: '3months' },
  { label: 'Son 6 Ay', value: '6months' },
  { label: 'Bu Yıl', value: '12months' },
];

const TABS = ['Satış', 'Stok', 'Finans', 'İK'] as const;
type Tab = (typeof TABS)[number];

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak', confirmed: 'Onaylı', processing: 'İşlemde',
  shipped: 'Kargoda', delivered: 'Teslim', cancelled: 'İptal',
};

function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div
      className="animate-pulse bg-muted rounded-lg"
      style={{ height }}
    />
  );
}

function SalesTab({ period }: { period: string }) {
  const { data, isLoading } = useSalesAnalytics(period);
  const salesData = data ?? (!isLoading ? MOCK_SALES_ANALYTICS : undefined);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Sales Trend */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Aylık Satış Trendi</h3>
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={salesData?.monthlySales ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, 'Tutar']} />
                <Line type="monotone" dataKey="amount" stroke={COLORS[0]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Count */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Aylık Sipariş Sayısı</h3>
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={salesData?.monthlySales ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[1]} radius={[4, 4, 0, 0]} name="Sipariş" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">En İyi 5 Müşteri</h3>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {(salesData?.topCustomers ?? []).map((c: { customerId: string; customerName: string; totalAmount: number; orderCount: number }, i: number) => (
                <div key={c.customerId} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.customerName}</p>
                    <p className="text-xs text-muted-foreground">{c.orderCount} sipariş</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(c.totalAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Sipariş Durum Dağılımı</h3>
          {isLoading ? <ChartSkeleton height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={(salesData?.orderStatusDistribution ?? []).map((d: { status: string; count: number }) => ({
                    name: ORDER_STATUS_LABELS[d.status] ?? d.status,
                    value: d.count,
                  }))}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                >
                  {(salesData?.orderStatusDistribution ?? []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function InventoryTab() {
  const { data, isLoading } = useInventoryAnalytics();
  const inventoryData = data ?? (!isLoading ? MOCK_INVENTORY_ANALYTICS : undefined);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Toplam Ürün', value: formatNumber(inventoryData?.totalProducts ?? 0) },
          { label: 'Düşük Stok', value: formatNumber(inventoryData?.lowStockCount ?? 0), danger: true },
          { label: 'Kategori', value: formatNumber(inventoryData?.categoryDistribution?.length ?? 0) },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className={cn('text-2xl font-bold mt-1', kpi.danger && (inventoryData?.lowStockCount ?? 0) > 0 ? 'text-destructive' : '')}>
              {isLoading ? '—' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Kategori Bazında Ürün Sayısı</h3>
          {isLoading ? <ChartSkeleton height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(inventoryData?.categoryDistribution ?? []).map((c: { categoryName: string; productCount: number }) => ({ name: c.categoryName, count: c.productCount }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[2]} radius={[4, 4, 0, 0]} name="Ürün" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Düşük Stok Ürünleri</h3>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : (inventoryData?.lowStockProducts ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Düşük stoklu ürün yok</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(inventoryData?.lowStockProducts ?? []).map((p: { id: string; name: string; code: string; currentStock: number; minStock: number; unit: string }) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">{p.currentStock} {p.unit}</p>
                    <p className="text-xs text-muted-foreground">Min: {p.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FinanceTab({ period }: { period: string }) {
  const { data, isLoading } = useFinanceAnalytics(period);
  const financeData = data ?? (!isLoading ? MOCK_FINANCE_ANALYTICS : undefined);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Ödenmemiş Fatura', value: formatCurrency(financeData?.unpaidInvoiceAmount ?? 0), danger: true },
          { label: 'Bekleyen Fatura Sayısı', value: formatNumber(financeData?.unpaidInvoiceCount ?? 0) },
          { label: 'Tahsilat Oranı', value: `%${financeData?.collectionRate ?? 0}` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className={cn('text-2xl font-bold mt-1', kpi.danger && (financeData?.unpaidInvoiceAmount ?? 0) > 0 ? 'text-destructive' : '')}>
              {isLoading ? '—' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Income/Expense Trend */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Gelir / Gider Trendi</h3>
        {isLoading ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={financeData?.monthlyTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => `₺${v.toLocaleString('tr-TR')}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke={COLORS[1]} strokeWidth={2} dot={false} name="Gelir" />
              <Line type="monotone" dataKey="expense" stroke={COLORS[3]} strokeWidth={2} dot={false} name="Gider" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function HRTab() {
  const { data, isLoading } = useHRAnalytics();
  const hrData = data ?? (!isLoading ? MOCK_HR_ANALYTICS : undefined);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Çalışan', value: formatNumber(hrData?.totalEmployees ?? 0) },
          { label: 'Aktif Çalışan', value: formatNumber(hrData?.activeEmployees ?? 0) },
          { label: 'Açık İzin Talepleri', value: formatNumber(hrData?.pendingLeaves ?? 0), warn: true },
          { label: 'Departman', value: formatNumber(hrData?.departmentDistribution?.length ?? 0) },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className={cn('text-2xl font-bold mt-1', kpi.warn && (hrData?.pendingLeaves ?? 0) > 0 ? 'text-amber-500' : '')}>
              {isLoading ? '—' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Department Distribution */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Departman Bazında Çalışan Dağılımı</h3>
        {isLoading ? <ChartSkeleton height={200} /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(hrData?.departmentDistribution ?? []).map((d: { department: string; count: number }) => ({ name: d.department, count: d.count }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[4]} radius={[4, 4, 0, 0]} name="Çalışan" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Satış');
  const [period, setPeriod] = useState('6months');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analitik</h1>
          <p className="text-muted-foreground mt-1">İşletme performansınızı analiz edin</p>
        </div>

        {/* Period Selector */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors',
                period === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Satış' && <SalesTab period={period} />}
      {activeTab === 'Stok' && <InventoryTab />}
      {activeTab === 'Finans' && <FinanceTab period={period} />}
      {activeTab === 'İK' && <HRTab />}
    </div>
  );
}
