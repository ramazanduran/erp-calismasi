'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

interface ISLine {
  code: string;
  label: string;
  current: number;
  previous: number;
  isHeader?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isNegative?: boolean;
  indent?: number;
}

interface IncomeStatement {
  period: string;
  previousPeriod: string;
  lines: ISLine[];
}

const MOCK_IS: IncomeStatement = {
  period: 'Oca–May 2026',
  previousPeriod: 'Oca–May 2025',
  lines: [
    { code: 'A', label: 'BRÜT SATIŞLAR', current: 18450000, previous: 15320000, isHeader: true },
    { code: '600', label: 'Yurt İçi Satışlar', current: 14820000, previous: 12450000, indent: 1 },
    { code: '601', label: 'Yurt Dışı Satışlar', current: 3630000, previous: 2870000, indent: 1 },
    { code: 'B', label: 'SATIŞ İNDİRİMLERİ (-)', current: -920000, previous: -710000, isHeader: true, isNegative: true },
    { code: '610', label: 'Satıştan İadeler', current: -380000, previous: -290000, indent: 1 },
    { code: '611', label: 'Satış İskontoları', current: -540000, previous: -420000, indent: 1 },
    { code: 'NET', label: 'NET SATIŞLAR', current: 17530000, previous: 14610000, isSubtotal: true },
    { code: 'C', label: 'SATIŞLARIN MALİYETİ (-)', current: -11200000, previous: -9450000, isHeader: true, isNegative: true },
    { code: '620', label: 'Satılan Mamul Maliyeti', current: -7850000, previous: -6620000, indent: 1 },
    { code: '621', label: 'Satılan Ticari Mal Maliyeti', current: -3350000, previous: -2830000, indent: 1 },
    { code: 'BRUT', label: 'BRÜT SATIŞ KÂRI / ZARARI', current: 6330000, previous: 5160000, isSubtotal: true },
    { code: 'D', label: 'FAALİYET GİDERLERİ (-)', current: -3850000, previous: -3280000, isHeader: true, isNegative: true },
    { code: '630', label: 'Araştırma ve Geliştirme Gid.', current: -420000, previous: -360000, indent: 1 },
    { code: '631', label: 'Pazarlama, Satış ve Dağıtım Gid.', current: -1680000, previous: -1420000, indent: 1 },
    { code: '632', label: 'Genel Yönetim Giderleri', current: -1750000, previous: -1500000, indent: 1 },
    { code: 'FAAL', label: 'FAALİYET KÂRI / ZARARI', current: 2480000, previous: 1880000, isSubtotal: true },
    { code: 'E', label: 'DİĞER FAALİYETLERDEN GELİRLER', current: 285000, previous: 210000, isHeader: true },
    { code: '640', label: 'İştiraklerden Temettü Gelirleri', current: 85000, previous: 60000, indent: 1 },
    { code: '642', label: 'Faiz Gelirleri', current: 200000, previous: 150000, indent: 1 },
    { code: 'F', label: 'DİĞER FAALİYETLERDEN GİDERLER (-)', current: -380000, previous: -310000, isHeader: true, isNegative: true },
    { code: '660', label: 'Kısa Vadeli Borç. Faiz Giderleri', current: -280000, previous: -230000, indent: 1 },
    { code: '661', label: 'Uzun Vadeli Borç. Faiz Giderleri', current: -100000, previous: -80000, indent: 1 },
    { code: 'VÖNCESI', label: 'DÖNEM KÂRI / ZARARI (VERGİ ÖNCESİ)', current: 2385000, previous: 1780000, isSubtotal: true },
    { code: '691', label: 'DÖNEM KÂRI VERGİ KARŞILIĞI (-)', current: -870000, previous: -640000, isNegative: true },
    { code: 'NET_KAR', label: 'DÖNEM NET KÂRI / ZARARI', current: 1515000, previous: 1140000, isTotal: true },
  ],
};

function fmt(n: number): string {
  const abs = Math.abs(n);
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(abs);
}

function pct(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export default function IncomeStatementPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2026-05');
  const [compareMode, setCompareMode] = useState(true);

  const { data: is = MOCK_IS } = useQuery<IncomeStatement>({
    queryKey: ['income-statement', selectedPeriod],
    queryFn: async () => {
      const res = await fetch(`/api/v1/accounting/income-statement?period=${selectedPeriod}`);
      if (!res.ok) return MOCK_IS;
      return res.json();
    },
    initialData: MOCK_IS,
  });

  const netRevenue = is.lines.find((l) => l.code === 'NET');
  const grossProfit = is.lines.find((l) => l.code === 'BRUT');
  const operatingProfit = is.lines.find((l) => l.code === 'FAAL');
  const netProfit = is.lines.find((l) => l.code === 'NET_KAR');

  const grossMargin = netRevenue && grossProfit ? Math.round((grossProfit.current / netRevenue.current) * 100) : 0;
  const netMargin = netRevenue && netProfit ? Math.round((netProfit.current / netRevenue.current) * 100) : 0;

  const handleExport = () => {
    const rows = is.lines.map((l) => ({
      'Hesap': l.code,
      'Açıklama': l.label,
      [is.period]: l.current,
      [is.previousPeriod]: l.previous,
    }));
    exportToExcel(rows, 'gelir-tablosu', 'Gelir Tablosu');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gelir Tablosu</h1>
          <p className="text-muted-foreground">Kâr/Zarar, brüt marj ve faaliyet kârı analizi</p>
        </div>
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)}
              className="rounded" />
            Karşılaştırmalı
          </label>
          <input type="month" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Net Satışlar', value: netRevenue?.current ?? 0, prev: netRevenue?.previous ?? 0, color: 'text-blue-600' },
          { label: 'Brüt Kâr', value: grossProfit?.current ?? 0, prev: grossProfit?.previous ?? 0, color: 'text-teal-600' },
          { label: 'Brüt Marj', value: grossMargin, prev: null, suffix: '%', color: grossMargin >= 30 ? 'text-green-600' : 'text-orange-600' },
          { label: 'Net Kâr Marjı', value: netMargin, prev: null, suffix: '%', color: netMargin >= 10 ? 'text-green-600' : 'text-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn('mt-1 text-2xl font-bold', stat.color)}>
              {stat.suffix ? `${stat.value}${stat.suffix}` : `₺${fmt(stat.value)}`}
            </p>
            {stat.prev !== null && stat.value !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {is.previousPeriod}: ₺{fmt(stat.prev)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="bg-primary/5 border-b border-border px-4 py-2 flex items-center justify-between">
          <h2 className="font-bold text-sm">{is.period} — Gelir Tablosu</h2>
          <p className="text-xs text-muted-foreground">Tutarlar Türk Lirası (₺) cinsinden</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left font-medium w-20">Hesap</th>
                <th className="px-4 py-2 text-left font-medium">Açıklama</th>
                <th className="px-4 py-2 text-right font-medium">{is.period}</th>
                {compareMode && <th className="px-4 py-2 text-right font-medium text-muted-foreground">{is.previousPeriod}</th>}
                {compareMode && <th className="px-4 py-2 text-right font-medium">Değişim</th>}
                <th className="px-4 py-2 text-right font-medium">Pay (%)</th>
              </tr>
            </thead>
            <tbody>
              {is.lines.map((line) => {
                const isNeg = line.current < 0 || line.isNegative;
                const change = compareMode ? pct(line.current, line.previous) : null;
                const netRev = netRevenue?.current ?? 1;
                const share = !line.isHeader && netRev ? Math.round((Math.abs(line.current) / netRev) * 100) : null;

                return (
                  <tr
                    key={line.code}
                    className={cn(
                      'border-b border-border/50',
                      line.isTotal && 'bg-primary/10 font-bold border-t-2 border-b-2 border-primary/30 text-base',
                      line.isSubtotal && 'bg-muted/40 font-semibold border-t border-t-muted',
                      line.isHeader && 'bg-muted/60 font-semibold',
                      !line.isTotal && !line.isSubtotal && !line.isHeader && 'hover:bg-muted/30'
                    )}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{line.code}</td>
                    <td className={cn('px-4 py-2', line.indent === 1 && 'pl-8', line.isHeader && 'uppercase text-xs')}>
                      {line.label}
                    </td>
                    <td className={cn('px-4 py-2 text-right tabular-nums', isNeg && !line.isSubtotal && !line.isTotal ? 'text-red-600' : '')}>
                      {line.isHeader ? '' : (
                        <span>
                          {line.current < 0 && '('}
                          ₺{fmt(line.current)}
                          {line.current < 0 && ')'}
                        </span>
                      )}
                    </td>
                    {compareMode && (
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                        {line.isHeader ? '' : `₺${fmt(line.previous)}`}
                      </td>
                    )}
                    {compareMode && (
                      <td className="px-4 py-2 text-right">
                        {line.isHeader || !change ? null : (
                          <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium',
                            change > 0 ? 'text-green-600' : 'text-red-600')}>
                            {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(change)}%
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                      {share !== null && share > 0 ? `%${share}` : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
