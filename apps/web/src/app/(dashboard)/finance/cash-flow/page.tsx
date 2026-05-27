'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { exportToExcel } from '@/lib/utils/excel-export';
import { cn } from '@/lib/utils';

type CashFlowCategory = 'operating' | 'investing' | 'financing';

interface CashFlowItem {
  id: string;
  date: string;
  description: string;
  category: CashFlowCategory;
  amount: number;
}

interface CashFlowSummary {
  period: string;
  opening: number;
  operating: number;
  investing: number;
  financing: number;
  closing: number;
  items: CashFlowItem[];
  forecast: { month: string; inflow: number; outflow: number; balance: number }[];
}

const MOCK_CF: CashFlowSummary = {
  period: 'Mayıs 2026',
  opening: 3135000,
  operating: 2480000,
  investing: -1250000,
  financing: -680000,
  closing: 3685000,
  items: [
    { id: '1', date: '2026-05-02', description: 'Müşteri tahsilatı – ABC Ltd', category: 'operating', amount: 850000 },
    { id: '2', date: '2026-05-04', description: 'Tedarikçi ödemesi – XYZ A.Ş.', category: 'operating', amount: -420000 },
    { id: '3', date: '2026-05-06', description: 'Maaş ödemeleri', category: 'operating', amount: -680000 },
    { id: '4', date: '2026-05-08', description: 'Müşteri tahsilatı – DEF Ltd', category: 'operating', amount: 1120000 },
    { id: '5', date: '2026-05-10', description: 'KDV ödemesi', category: 'operating', amount: -240000 },
    { id: '6', date: '2026-05-12', description: 'Yeni makine satın alma', category: 'investing', amount: -850000 },
    { id: '7', date: '2026-05-14', description: 'Banka kredisi taksit ödemesi', category: 'financing', amount: -380000 },
    { id: '8', date: '2026-05-16', description: 'Eski ekipman satışı', category: 'investing', amount: -400000 },
    { id: '9', date: '2026-05-18', description: 'Kira ödemesi', category: 'operating', amount: -150000 },
    { id: '10', date: '2026-05-20', description: 'Müşteri tahsilatı – GHI A.Ş.', category: 'operating', amount: 640000 },
    { id: '11', date: '2026-05-22', description: 'Faiz ödemesi', category: 'financing', amount: -300000 },
    { id: '12', date: '2026-05-24', description: 'Sigorta primleri', category: 'operating', amount: -80000 },
    { id: '13', date: '2026-05-26', description: 'Müşteri tahsilatı – JKL Ltd', category: 'operating', amount: 480000 },
    { id: '14', date: '2026-05-28', description: 'Elektrik, su, doğalgaz', category: 'operating', amount: -60000 },
    { id: '15', date: '2026-05-30', description: 'SGK bildirgeleri', category: 'operating', amount: -200000 },
  ],
  forecast: [
    { month: 'Haz 2026', inflow: 5200000, outflow: 4400000, balance: 4485000 },
    { month: 'Tem 2026', inflow: 4800000, outflow: 4200000, balance: 5085000 },
    { month: 'Ağu 2026', inflow: 5500000, outflow: 4600000, balance: 5985000 },
    { month: 'Eyl 2026', inflow: 5100000, outflow: 4300000, balance: 6785000 },
    { month: 'Eki 2026', inflow: 5800000, outflow: 4700000, balance: 7885000 },
    { month: 'Kas 2026', inflow: 6200000, outflow: 5100000, balance: 8985000 },
  ],
};

const CATEGORY_LABELS: Record<CashFlowCategory, string> = {
  operating: 'Faaliyetlerden',
  investing: 'Yatırım Faaliyetleri',
  financing: 'Finansman Faaliyetleri',
};

const CATEGORY_COLORS: Record<CashFlowCategory, string> = {
  operating: 'bg-blue-100 text-blue-800',
  investing: 'bg-amber-100 text-amber-800',
  financing: 'bg-purple-100 text-purple-800',
};

function fmt(n: number): string {
  const abs = Math.abs(n);
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(abs);
}

export default function CashFlowPage() {
  const [activeTab, setActiveTab] = useState<'statement' | 'transactions' | 'forecast'>('statement');
  const [categoryFilter, setCategoryFilter] = useState<CashFlowCategory | 'all'>('all');

  const { data: cf = MOCK_CF } = useQuery<CashFlowSummary>({
    queryKey: ['cash-flow'],
    queryFn: async () => {
      const res = await fetch('/api/v1/finance/cash-flow');
      if (!res.ok) return MOCK_CF;
      return res.json();
    },
    initialData: MOCK_CF,
  });

  const filteredItems = useMemo(() => {
    if (categoryFilter === 'all') return cf.items;
    return cf.items.filter((i) => i.category === categoryFilter);
  }, [cf.items, categoryFilter]);

  const chartData = useMemo(() => {
    const grouped: Record<string, { inflow: number; outflow: number }> = {};
    cf.items.forEach((item) => {
      const week = `H${Math.ceil(parseInt(item.date.split('-')[2]) / 7)}`;
      if (!grouped[week]) grouped[week] = { inflow: 0, outflow: 0 };
      if (item.amount > 0) grouped[week].inflow += item.amount;
      else grouped[week].outflow += Math.abs(item.amount);
    });
    return Object.entries(grouped).map(([week, v]) => ({ week, ...v }));
  }, [cf.items]);

  const handleExport = () => {
    const rows = cf.items.map((i) => ({
      Tarih: i.date,
      Açıklama: i.description,
      Kategori: CATEGORY_LABELS[i.category],
      Tutar: i.amount,
    }));
    exportToExcel(rows, 'nakit-akisi', 'Nakit Akışı');
  };

  const tabs = [
    { id: 'statement', label: 'Özet Tablo' },
    { id: 'transactions', label: 'İşlemler' },
    { id: 'forecast', label: 'Tahmin' },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nakit Akışı</h1>
          <p className="text-muted-foreground">Nakit giriş/çıkışları, kategori analizi ve tahmin</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          <Download className="h-4 w-4" /> Excel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Açılış Bakiyesi', value: cf.opening, icon: null, color: 'text-foreground' },
          { label: 'Faaliyet Nakit Akışı', value: cf.operating, icon: cf.operating >= 0 ? TrendingUp : TrendingDown, color: cf.operating >= 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'Net Değişim', value: cf.operating + cf.investing + cf.financing, icon: null, color: 'text-blue-600' },
          { label: 'Kapanış Bakiyesi', value: cf.closing, icon: null, color: 'text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn('mt-1 text-2xl font-bold', stat.color)}>
              {stat.value < 0 && '-'}₺{fmt(stat.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'statement' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="bg-primary/5 border-b border-border px-4 py-3">
              <h3 className="font-semibold text-sm">{cf.period} — Nakit Akış Tablosu</h3>
            </div>
            <div className="divide-y divide-border">
              {[
                { label: 'Dönem Başı Nakit', value: cf.opening, bold: false, indent: 0 },
                { label: 'FAALİYETLERDEN NAKIT AKIŞI', value: cf.operating, bold: true, indent: 0 },
                { label: 'Müşteri Tahsilatları', value: 3090000, bold: false, indent: 1 },
                { label: 'Tedarikçi Ödemeleri', value: -420000, bold: false, indent: 1 },
                { label: 'Personel Ödemeleri', value: -880000, bold: false, indent: 1 },
                { label: 'Vergi Ödemeleri', value: -310000, bold: false, indent: 1 },
                { label: 'Diğer Faaliyet Ödemeleri', value: 0, bold: false, indent: 1 },
                { label: 'YATIRIM FAALİYETLERİNDEN NAKIT AKIŞI', value: cf.investing, bold: true, indent: 0 },
                { label: 'Maddi Duran Varlık Alımı', value: -850000, bold: false, indent: 1 },
                { label: 'Varlık Satışları', value: -400000, bold: false, indent: 1 },
                { label: 'FİNANSMAN FAALİYETLERİNDEN NAKIT AKIŞI', value: cf.financing, bold: true, indent: 0 },
                { label: 'Kredi Taksit Ödemeleri', value: -380000, bold: false, indent: 1 },
                { label: 'Faiz Ödemeleri', value: -300000, bold: false, indent: 1 },
                { label: 'DÖNEM SONU NAKİT', value: cf.closing, bold: true, indent: 0 },
              ].map((row, i) => (
                <div key={i} className={cn('flex items-center justify-between px-4 py-2.5',
                  row.bold ? 'bg-muted/50 font-semibold' : 'hover:bg-muted/20',
                  i === 13 && 'bg-primary/10 border-t-2 border-primary/20 font-bold text-primary'
                )}>
                  <span className={cn('text-sm', row.indent === 1 && 'pl-6 text-muted-foreground')}>{row.label}</span>
                  <span className={cn('text-sm tabular-nums font-medium',
                    row.value < 0 ? 'text-red-600' : row.value > 0 && !row.bold ? 'text-green-700' : ''
                  )}>
                    {row.value !== 0 ? `${row.value < 0 ? '-' : ''}₺${fmt(row.value)}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Haftalık Nakit Giriş / Çıkış</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₺${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => `₺${fmt(v)}`} />
                <Legend />
                <Bar dataKey="inflow" name="Giriş" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Çıkış" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <span className="text-sm font-medium">Kategori:</span>
            {(['all', 'operating', 'investing', 'financing'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  categoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cat === 'all' ? 'Tümü' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Tarih</th>
                  <th className="px-4 py-2 text-left font-medium">Açıklama</th>
                  <th className="px-4 py-2 text-left font-medium">Kategori</th>
                  <th className="px-4 py-2 text-right font-medium">Tutar</th>
                  <th className="px-4 py-2 text-center font-medium">Yön</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground">{item.date}</td>
                    <td className="px-4 py-2">{item.description}</td>
                    <td className="px-4 py-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', CATEGORY_COLORS[item.category])}>
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    </td>
                    <td className={cn('px-4 py-2 text-right tabular-nums font-medium', item.amount >= 0 ? 'text-green-700' : 'text-red-600')}>
                      {item.amount < 0 && '-'}₺{fmt(item.amount)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {item.amount >= 0
                        ? <ArrowUpRight className="h-4 w-4 text-green-600 mx-auto" />
                        : <ArrowDownRight className="h-4 w-4 text-red-500 mx-auto" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">6 Aylık Nakit Akış Tahmini</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cf.forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₺${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => `₺${fmt(v)}`} />
                <Legend />
                <Line type="monotone" dataKey="inflow" name="Tahmini Giriş" stroke="#22c55e" strokeWidth={2} dot />
                <Line type="monotone" dataKey="outflow" name="Tahmini Çıkış" stroke="#ef4444" strokeWidth={2} dot />
                <Line type="monotone" dataKey="balance" name="Banka Bakiyesi" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Dönem</th>
                  <th className="px-4 py-2 text-right font-medium">Tahmini Giriş</th>
                  <th className="px-4 py-2 text-right font-medium">Tahmini Çıkış</th>
                  <th className="px-4 py-2 text-right font-medium">Net Akış</th>
                  <th className="px-4 py-2 text-right font-medium">Tahmini Bakiye</th>
                </tr>
              </thead>
              <tbody>
                {cf.forecast.map((row) => {
                  const net = row.inflow - row.outflow;
                  return (
                    <tr key={row.month} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{row.month}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-green-700">₺{fmt(row.inflow)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-red-600">₺{fmt(row.outflow)}</td>
                      <td className={cn('px-4 py-2 text-right tabular-nums font-medium', net >= 0 ? 'text-green-700' : 'text-red-600')}>
                        {net < 0 && '-'}₺{fmt(net)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-semibold">₺{fmt(row.balance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
