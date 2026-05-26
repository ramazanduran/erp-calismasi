'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  Activity,
  BookOpen,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api/client';

// ─── Turkish month names ──────────────────────────────────────────────────────
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// ─── Number formatter ─────────────────────────────────────────────────────────
function fmt(x: number | undefined | null) {
  return Number(x ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
}

function fmtPct(x: number | undefined | null) {
  return Number(x ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 1 }) + '%';
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface MonthlyPL {
  month: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
}

interface ProfitLoss {
  year: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMargin: number;
  monthly: MonthlyPL[];
}

interface MonthlyCF {
  month: number;
  inflow: number;
  outflow: number;
  net: number;
  balance: number;
}

interface CashFlow {
  year: number;
  totalInflow: number;
  totalOutflow: number;
  monthly: MonthlyCF[];
}

interface AccountEntry {
  name: string;
  balance: number;
}

interface BalanceSheet {
  assets: AccountEntry[];
  liabilities: AccountEntry[];
  equity: AccountEntry[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

interface ARInvoice {
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
}

interface AccountsReceivable {
  total: number;
  current: number;
  overdue30: number;
  overdue60: number;
  overdue90plus: number;
  invoices: ARInvoice[];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'pl', label: 'Gelir/Gider', icon: BarChart2 },
  { id: 'cf', label: 'Nakit Akışı', icon: Activity },
  { id: 'bs', label: 'Bilanço', icon: BookOpen },
  { id: 'ar', label: 'Alacaklar', icon: Clock },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FinanceReportsPage() {
  const [year, setYear] = useState(2025);
  const [activeTab, setActiveTab] = useState<TabId>('pl');

  // Queries
  const { data: pl, isLoading: plLoading } = useQuery<ProfitLoss>({
    queryKey: ['finance', 'reports', 'profit-loss', year],
    queryFn: () =>
      api.get<ProfitLoss>(`api/v1/finance/reports/profit-loss`, { year }),
  });

  const { data: cf, isLoading: cfLoading } = useQuery<CashFlow>({
    queryKey: ['finance', 'reports', 'cash-flow', year],
    queryFn: () =>
      api.get<CashFlow>(`api/v1/finance/reports/cash-flow`, { year }),
  });

  const { data: bs, isLoading: bsLoading } = useQuery<BalanceSheet>({
    queryKey: ['finance', 'reports', 'balance-sheet'],
    queryFn: () => api.get<BalanceSheet>(`api/v1/finance/reports/balance-sheet`),
  });

  const { data: ar, isLoading: arLoading } = useQuery<AccountsReceivable>({
    queryKey: ['finance', 'reports', 'accounts-receivable'],
    queryFn: () =>
      api.get<AccountsReceivable>(`api/v1/finance/reports/accounts-receivable`),
  });

  // Chart data helpers
  const plMonthly = (pl?.monthly ?? []).map((m) => ({
    name: MONTHS[(m.month ?? 1) - 1] ?? String(m.month),
    Gelir: m.revenue,
    Maliyet: m.cogs,
    'Brüt Kâr': m.grossProfit,
  }));

  const cfMonthly = (cf?.monthly ?? []).map((m) => ({
    name: MONTHS[(m.month ?? 1) - 1] ?? String(m.month),
    Giriş: m.inflow,
    Çıkış: m.outflow,
    Net: m.net,
    Bakiye: m.balance,
  }));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finansal Raporlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gelir/gider, nakit akışı, bilanço ve alacak raporları
          </p>
        </div>
        {/* Year selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Yıl:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Gelir / Gider ── */}
      {activeTab === 'pl' && (
        <div className="space-y-6">
          {/* Summary cards */}
          {plLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-7 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Toplam Gelir"
                value={fmt(pl?.totalRevenue)}
                icon={TrendingUp}
                color="text-green-600"
              />
              <StatCard
                label="Toplam Maliyet"
                value={fmt(pl?.totalCogs)}
                icon={TrendingDown}
                color="text-red-500"
              />
              <StatCard
                label="Brüt Kâr"
                value={fmt(pl?.grossProfit)}
                icon={DollarSign}
                color={Number(pl?.grossProfit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
              />
              <StatCard
                label="Kâr Marjı"
                value={fmtPct(pl?.grossMargin)}
                icon={BarChart2}
                color={Number(pl?.grossMargin ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}
              />
            </div>
          )}

          {/* Bar chart */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold mb-5">Aylık Gelir ve Maliyet ({year})</h2>
            {plLoading ? (
              <div className="h-64 flex items-center justify-center animate-pulse">
                <div className="h-full w-full bg-muted rounded-lg" />
              </div>
            ) : plMonthly.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Veri bulunamadı
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={plMonthly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      Number(v).toLocaleString('tr-TR', { notation: 'compact' })
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{
                      borderRadius: '0.5rem',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Gelir" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Maliyet" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Nakit Akışı ── */}
      {activeTab === 'cf' && (
        <div className="space-y-6">
          {/* Summary cards */}
          {cfLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-7 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Toplam Nakit Girişi"
                value={fmt(cf?.totalInflow)}
                icon={TrendingUp}
                color="text-green-600"
              />
              <StatCard
                label="Toplam Nakit Çıkışı"
                value={fmt(cf?.totalOutflow)}
                icon={TrendingDown}
                color="text-red-500"
              />
              <StatCard
                label="Net Nakit Akışı"
                value={fmt((cf?.totalInflow ?? 0) - (cf?.totalOutflow ?? 0))}
                icon={Activity}
                color={
                  (cf?.totalInflow ?? 0) - (cf?.totalOutflow ?? 0) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              />
            </div>
          )}

          {/* Line chart */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold mb-5">Aylık Nakit Akışı ({year})</h2>
            {cfLoading ? (
              <div className="h-64 animate-pulse">
                <div className="h-full w-full bg-muted rounded-lg" />
              </div>
            ) : cfMonthly.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Veri bulunamadı
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cfMonthly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      Number(v).toLocaleString('tr-TR', { notation: 'compact' })
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{
                      borderRadius: '0.5rem',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Giriş" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Çıkış" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Bakiye" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Bilanço ── */}
      {activeTab === 'bs' && (
        <div className="space-y-4">
          {bsLoading ? (
            <div className="rounded-xl border border-border bg-card p-6 animate-pulse space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded w-full" />
              ))}
            </div>
          ) : !bs ? (
            <div className="rounded-xl border border-border bg-card py-16 flex items-center justify-center text-muted-foreground text-sm">
              Bilanço verisi bulunamadı
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Varlıklar */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-green-50/50 dark:bg-green-950/20">
                  <h2 className="font-semibold text-foreground">Varlıklar</h2>
                </div>
                <div className="divide-y divide-border">
                  {(bs.assets ?? []).map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-foreground">{a.name}</span>
                      <span className="font-medium tabular-nums">{fmt(a.balance)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-t border-border">
                  <span className="font-semibold text-sm">Toplam Varlıklar</span>
                  <span className="font-bold text-green-600 tabular-nums">{fmt(bs.totalAssets)}</span>
                </div>
              </div>

              {/* Yükümlülükler + Özkaynaklar */}
              <div className="space-y-4">
                {/* Yükümlülükler */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border bg-red-50/50 dark:bg-red-950/20">
                    <h2 className="font-semibold text-foreground">Yükümlülükler</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {(bs.liabilities ?? []).map((l, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="text-foreground">{l.name}</span>
                        <span className="font-medium tabular-nums">{fmt(l.balance)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-t border-border">
                    <span className="font-semibold text-sm">Toplam Yükümlülükler</span>
                    <span className="font-bold text-red-600 tabular-nums">{fmt(bs.totalLiabilities)}</span>
                  </div>
                </div>

                {/* Özkaynaklar */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border bg-blue-50/50 dark:bg-blue-950/20">
                    <h2 className="font-semibold text-foreground">Özkaynaklar</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {(bs.equity ?? []).map((e, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="text-foreground">{e.name}</span>
                        <span className="font-medium tabular-nums">{fmt(e.balance)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-t border-border">
                    <span className="font-semibold text-sm">Toplam Özkaynaklar</span>
                    <span className="font-bold text-blue-600 tabular-nums">{fmt(bs.totalEquity)}</span>
                  </div>
                </div>

                {/* Balance check */}
                <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between shadow-sm">
                  <span className="text-sm font-medium text-muted-foreground">
                    Yük. + Özkaynak = Varlıklar
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      Math.abs(
                        (bs.totalLiabilities + bs.totalEquity) - bs.totalAssets,
                      ) < 1
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {fmt(bs.totalLiabilities + bs.totalEquity)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Alacaklar ── */}
      {activeTab === 'ar' && (
        <div className="space-y-6">
          {/* Aging analysis cards */}
          {arLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-7 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">Vadesi Gelmemiş</p>
                  <p className="mt-1 text-2xl font-bold text-green-600 tabular-nums">
                    {fmt(ar?.current)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">1–30 Gün Gecikmiş</p>
                  <p className="mt-1 text-2xl font-bold text-yellow-600 tabular-nums">
                    {fmt(ar?.overdue30)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">31–60 Gün Gecikmiş</p>
                  <p className="mt-1 text-2xl font-bold text-orange-600 tabular-nums">
                    {fmt(ar?.overdue60)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">60+ Gün Gecikmiş</p>
                  <p className="mt-1 text-2xl font-bold text-red-600 tabular-nums">
                    {fmt(ar?.overdue90plus)}
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between shadow-sm">
                <span className="text-sm font-medium text-muted-foreground">Toplam Alacak</span>
                <span className="text-lg font-bold text-foreground tabular-nums">{fmt(ar?.total)}</span>
              </div>
            </>
          )}

          {/* Overdue invoices table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Gecikmiş Faturalar</h2>
              {!arLoading && (
                <span className="text-sm text-muted-foreground">
                  {(ar?.invoices ?? []).length} fatura
                </span>
              )}
            </div>

            {arLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                Yükleniyor...
              </div>
            ) : (ar?.invoices ?? []).length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                <Clock className="h-8 w-8 opacity-30" />
                <p className="text-sm">Gecikmiş fatura bulunmuyor</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Müşteri</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fatura No</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Tutar</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vade</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gecikme</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(ar?.invoices ?? []).map((inv, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{inv.customerName}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(inv.amount)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString('tr-TR')
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              inv.daysOverdue > 60
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
                                : inv.daysOverdue > 30
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                            }`}
                          >
                            {inv.daysOverdue} gün
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
