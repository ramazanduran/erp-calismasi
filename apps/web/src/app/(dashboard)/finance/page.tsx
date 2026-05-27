'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, FileText,
  BarChart3, ArrowRight, Landmark, Scale, Receipt,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const MOCK_PL = {
  totalRevenue: 4050000, grossProfit: 1350000, grossMargin: 33.3,
  monthly: [
    { month: 1, revenue: 280000, cogs: 185000 }, { month: 2, revenue: 310000, cogs: 205000 },
    { month: 3, revenue: 350000, cogs: 230000 }, { month: 4, revenue: 390000, cogs: 255000 },
    { month: 5, revenue: 430000, cogs: 290000 }, { month: 6, revenue: 0, cogs: 0 },
  ],
};

const MOCK_AR = { total: 680000, overdue30: 120000, overdue60: 45000, overdue90plus: 28000 };

const MOCK_CF = {
  totalInflow: 3800000, totalOutflow: 3200000,
  monthly: [
    { month: 1, inflow: 260000, outflow: 220000 }, { month: 2, inflow: 290000, outflow: 250000 },
    { month: 3, inflow: 330000, outflow: 280000 }, { month: 4, inflow: 370000, outflow: 310000 },
    { month: 5, inflow: 410000, outflow: 350000 }, { month: 6, inflow: 0, outflow: 0 },
  ],
};

const fmt = (n: number) => Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function FinanceOverviewPage() {
  const year = new Date().getFullYear();

  const { data: plData } = useQuery({
    queryKey: ['finance', 'reports', 'pl', year],
    queryFn: () => api.get(`/api/v1/finance/reports/profit-loss?year=${year}`),
    initialData: MOCK_PL,
  });

  const { data: arData } = useQuery({
    queryKey: ['finance', 'reports', 'ar'],
    queryFn: () => api.get('/api/v1/finance/reports/accounts-receivable'),
    initialData: MOCK_AR,
  });

  const { data: cfData } = useQuery({
    queryKey: ['finance', 'reports', 'cf', year],
    queryFn: () => api.get(`/api/v1/finance/reports/cash-flow?year=${year}`),
    initialData: MOCK_CF,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['finance', 'invoices', 'recent'],
    queryFn: () => api.get('/sales/invoices', { limit: 5, status: 'sent' }),
  });

  const pl = plData as any;
  const ar = arData as any;
  const cf = cfData as any;
  const invoices = (invoicesData as any)?.data ?? [];

  const chartData = pl?.monthly?.map((m: any) => ({
    name: MONTH_NAMES[m.month - 1],
    Gelir: m.revenue,
    Maliyet: m.cogs,
  })) ?? [];

  const cfChartData = cf?.monthly?.map((m: any) => ({
    name: MONTH_NAMES[m.month - 1],
    Giriş: m.inflow,
    Çıkış: m.outflow,
  })) ?? [];

  const QUICK_LINKS = [
    { label: 'Hesaplar', href: '/finance/accounts', icon: CreditCard, desc: 'Finansal hesap yönetimi' },
    { label: 'Banka Hesapları', href: '/finance/bank-accounts', icon: Landmark, desc: 'Banka hesapları ve bakiyeler' },
    { label: 'Faturalar', href: '/finance/invoices', icon: FileText, desc: 'Satış ve alış faturaları' },
    { label: 'Banka Mutabakatı', href: '/finance/bank-reconciliation', icon: Scale, desc: 'Banka ekstresi eşleştirme' },
    { label: 'Raporlar', href: '/finance/reports', icon: BarChart3, desc: 'P&L, bilanço, nakit akışı' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finans Genel Bakış</h1>
        <p className="text-muted-foreground mt-1">{year} yılı finansal özet</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-medium">Toplam Gelir</p>
          </div>
          <p className="text-2xl font-bold mt-1">{pl ? `₺${fmt(pl.totalRevenue)}` : '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{year} yılı</p>
        </div>

        <div className="rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600">
            <DollarSign className="h-4 w-4" />
            <p className="text-xs font-medium">Brüt Kar</p>
          </div>
          <p className="text-2xl font-bold mt-1">{pl ? `₺${fmt(pl.grossProfit)}` : '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pl ? `%${Number(pl.grossMargin).toFixed(1)} kar marjı` : ''}
          </p>
        </div>

        <div className="rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-orange-600">
            <Receipt className="h-4 w-4" />
            <p className="text-xs font-medium">Açık Alacaklar</p>
          </div>
          <p className="text-2xl font-bold mt-1">{ar ? `₺${fmt(ar.total)}` : '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ar ? `₺${fmt(ar.overdue30 + ar.overdue60 + ar.overdue90plus)} vadesi geçmiş` : ''}
          </p>
        </div>

        <div className="rounded-xl border border-border p-4 shadow-sm">
          <div className={cn('flex items-center gap-2', (cf?.totalInflow - cf?.totalOutflow) >= 0 ? 'text-green-600' : 'text-red-600')}>
            {(cf?.totalInflow - cf?.totalOutflow) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <p className="text-xs font-medium">Net Nakit Akışı</p>
          </div>
          <p className="text-2xl font-bold mt-1">{cf ? `₺${fmt(cf.totalInflow - cf.totalOutflow)}` : '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{year} yılı toplam</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-border p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">Aylık Gelir & Maliyet</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => `₺${fmt(v)}`} />
                <Line type="monotone" dataKey="Gelir" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Maliyet" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Veri yükleniyor...</div>
          )}
        </div>

        <div className="rounded-xl border border-border p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">Nakit Akışı</h2>
          {cfChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cfChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => `₺${fmt(v)}`} />
                <Line type="monotone" dataKey="Giriş" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Çıkış" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Veri yükleniyor...</div>
          )}
        </div>
      </div>

      {/* Quick Links + Recent Invoices */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-2">
          <h2 className="text-sm font-semibold mb-3">Hızlı Erişim</h2>
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
              <div className="p-2 rounded-lg bg-primary/10">
                <link.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{link.label}</p>
                <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>

        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Bekleyen Faturalar</h2>
            <Link href="/finance/invoices" className="text-xs text-primary hover:underline flex items-center gap-1">
              Tümünü Gör <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Bekleyen fatura yok</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Müşteri</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Fatura No</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Tutar</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Vade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{inv.customer?.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{inv.invoiceNumber}</td>
                      <td className="px-3 py-2 text-right font-medium">₺{fmt(Number(inv.totalAmount))}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('tr-TR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
