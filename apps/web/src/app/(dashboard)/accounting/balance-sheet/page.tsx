'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

interface BalanceLine {
  code: string;
  label: string;
  current: number;
  previous: number;
  isHeader?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  indent?: number;
}

interface BalanceSheet {
  period: string;
  previousPeriod: string;
  assets: BalanceLine[];
  liabilities: BalanceLine[];
}

const MOCK_BALANCE: BalanceSheet = {
  period: 'Mayıs 2026',
  previousPeriod: 'Aralık 2025',
  assets: [
    { code: 'I', label: 'DÖNEN VARLIKLAR', current: 0, previous: 0, isHeader: true, indent: 0 },
    { code: '100', label: 'Kasa', current: 285000, previous: 210000, indent: 1 },
    { code: '102', label: 'Bankalar', current: 3420000, previous: 2850000, indent: 1 },
    { code: '120', label: 'Alıcılar', current: 5840000, previous: 4920000, indent: 1 },
    { code: '126', label: 'Verilen Depozito ve Teminatlar', current: 150000, previous: 120000, indent: 1 },
    { code: '153', label: 'Ticari Mallar', current: 4250000, previous: 3890000, indent: 1 },
    { code: '180', label: 'Gelecek Aylara Ait Giderler', current: 320000, previous: 280000, indent: 1 },
    { code: 'I-T', label: 'DÖNEN VARLIKLAR TOPLAMI', current: 14265000, previous: 12270000, isSubtotal: true, indent: 0 },
    { code: 'II', label: 'DURAN VARLIKLAR', current: 0, previous: 0, isHeader: true, indent: 0 },
    { code: '252', label: 'Binalar', current: 8500000, previous: 8500000, indent: 1 },
    { code: '253', label: 'Tesis, Makine ve Cihazlar', current: 4200000, previous: 3800000, indent: 1 },
    { code: '255', label: 'Demirbaşlar', current: 1850000, previous: 1750000, indent: 1 },
    { code: '257', label: 'Birikmiş Amortismanlar (-)', current: -3420000, previous: -2980000, indent: 1 },
    { code: '260', label: 'Haklar', current: 580000, previous: 520000, indent: 1 },
    { code: 'II-T', label: 'DURAN VARLIKLAR TOPLAMI', current: 11710000, previous: 11590000, isSubtotal: true, indent: 0 },
    { code: 'AKT', label: 'AKTİF TOPLAMI', current: 25975000, previous: 23860000, isTotal: true, indent: 0 },
  ],
  liabilities: [
    { code: 'III', label: 'KISA VADELİ YABANCI KAYNAKLAR', current: 0, previous: 0, isHeader: true, indent: 0 },
    { code: '320', label: 'Satıcılar', current: 3850000, previous: 3420000, indent: 1 },
    { code: '330', label: 'Alınan Depozito ve Teminatlar', current: 280000, previous: 250000, indent: 1 },
    { code: '360', label: 'Ödenecek Vergi ve Fonlar', current: 1240000, previous: 980000, indent: 1 },
    { code: '370', label: 'Dönem Kârı Vergi Karşılığı', current: 840000, previous: 720000, indent: 1 },
    { code: '380', label: 'Gelecek Aylara Ait Gelirler', current: 180000, previous: 150000, indent: 1 },
    { code: 'III-T', label: 'KISA VADELİ KAYNAKLAR TOPLAMI', current: 6390000, previous: 5520000, isSubtotal: true, indent: 0 },
    { code: 'IV', label: 'UZUN VADELİ YABANCI KAYNAKLAR', current: 0, previous: 0, isHeader: true, indent: 0 },
    { code: '400', label: 'Banka Kredileri', current: 4200000, previous: 4800000, indent: 1 },
    { code: '420', label: 'Çıkarılmış Tahviller', current: 2000000, previous: 2000000, indent: 1 },
    { code: 'IV-T', label: 'UZUN VADELİ KAYNAKLAR TOPLAMI', current: 6200000, previous: 6800000, isSubtotal: true, indent: 0 },
    { code: 'V', label: 'ÖZ KAYNAKLAR', current: 0, previous: 0, isHeader: true, indent: 0 },
    { code: '500', label: 'Sermaye', current: 8000000, previous: 8000000, indent: 1 },
    { code: '540', label: 'Yasal Yedekler', current: 1850000, previous: 1520000, indent: 1 },
    { code: '570', label: 'Geçmiş Yıl Kârları', current: 2020000, previous: 1580000, indent: 1 },
    { code: '590', label: 'Dönem Net Kârı', current: 1515000, previous: 440000, indent: 1 },
    { code: 'V-T', label: 'ÖZ KAYNAKLAR TOPLAMI', current: 13385000, previous: 11540000, isSubtotal: true, indent: 0 },
    { code: 'PAS', label: 'PASİF TOPLAMI', current: 25975000, previous: 23860000, isTotal: true, indent: 0 },
  ],
};

function fmt(n: number): string {
  if (n === 0) return '—';
  return new Intl.NumberFormat('tr-TR', { style: 'decimal', minimumFractionDigits: 0 }).format(n);
}

function pct(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function BalanceTable({ lines, period, previousPeriod }: { lines: BalanceLine[]; period: string; previousPeriod: string }) {
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const toggle = (code: string) =>
    setCollapsed((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);

  return (
    <table className="w-full text-sm">
      <thead className="border-b-2 border-border">
        <tr>
          <th className="px-3 py-2 text-left font-semibold w-16">Hesap</th>
          <th className="px-3 py-2 text-left font-semibold">Açıklama</th>
          <th className="px-3 py-2 text-right font-semibold">{period} (₺)</th>
          <th className="px-3 py-2 text-right font-semibold">{previousPeriod} (₺)</th>
          <th className="px-3 py-2 text-right font-semibold">Değişim</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => {
          if (line.isHeader) {
            return (
              <tr key={line.code} className="bg-muted/60 cursor-pointer select-none" onClick={() => toggle(line.code)}>
                <td className="px-3 py-2 font-bold text-xs">{line.code}</td>
                <td className="px-3 py-2 font-bold uppercase text-xs flex items-center gap-1">
                  {collapsed.includes(line.code) ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {line.label}
                </td>
                <td colSpan={3} />
              </tr>
            );
          }

          const parentHeader = [...lines].reverse().find((l, idx) => {
            const lineIdx = lines.indexOf(line);
            const lIdx = lines.indexOf(l);
            return l.isHeader && lIdx < lineIdx;
          });
          if (parentHeader && collapsed.includes(parentHeader.code) && !line.isSubtotal && !line.isTotal) return null;

          const change = pct(line.current, line.previous);
          const isNeg = line.current < 0;

          return (
            <tr
              key={line.code}
              className={cn(
                'border-b border-border/50',
                line.isTotal && 'bg-primary/10 font-bold border-t-2 border-b-2 border-primary/30',
                line.isSubtotal && 'bg-muted/40 font-semibold',
                !line.isTotal && !line.isSubtotal && !line.isHeader && 'hover:bg-muted/30'
              )}
            >
              <td className={cn('px-3 py-1.5 text-xs text-muted-foreground font-mono', line.isTotal && 'text-foreground font-bold')}>
                {line.code}
              </td>
              <td className={cn('px-3 py-1.5', line.indent === 1 && 'pl-7')}>
                {line.label}
              </td>
              <td className={cn('px-3 py-1.5 text-right tabular-nums', isNeg && 'text-red-600')}>
                {line.isHeader ? '' : `${isNeg ? '(' : ''}${fmt(Math.abs(line.current))}${isNeg ? ')' : ''}`}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                {line.isHeader ? '' : fmt(Math.abs(line.previous))}
              </td>
              <td className="px-3 py-1.5 text-right">
                {line.isHeader || !change ? null : (
                  <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium',
                    change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground')}>
                    {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {Math.abs(change)}%
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function BalanceSheetPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2026-05');

  const { data: balance = MOCK_BALANCE } = useQuery<BalanceSheet>({
    queryKey: ['balance-sheet', selectedPeriod],
    queryFn: async () => {
      const res = await fetch(`/api/v1/accounting/balance-sheet?period=${selectedPeriod}`);
      if (!res.ok) return MOCK_BALANCE;
      return res.json();
    },
    initialData: MOCK_BALANCE,
  });

  const totals = {
    assets: balance.assets.find((l) => l.code === 'AKT'),
    liabilities: balance.liabilities.find((l) => l.code === 'PAS'),
  };

  const handleExport = () => {
    const rows = [
      ...balance.assets.map((l) => ({ Bölüm: 'AKTİF', Hesap: l.code, Açıklama: l.label, [balance.period]: l.current, [balance.previousPeriod]: l.previous })),
      ...balance.liabilities.map((l) => ({ Bölüm: 'PASİF', Hesap: l.code, Açıklama: l.label, [balance.period]: l.current, [balance.previousPeriod]: l.previous })),
    ];
    exportToExcel(rows, 'bilanco', 'Bilanço');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bilanço</h1>
          <p className="text-muted-foreground">Aktif ve pasif kalemler, dönemsel karşılaştırma</p>
        </div>
        <div className="flex gap-3 items-center">
          <input type="month" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Aktif Toplam ({balance.period})</p>
          <p className="mt-1 text-2xl font-bold">₺{fmt(totals.assets?.current ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Pasif Toplam ({balance.period})</p>
          <p className="mt-1 text-2xl font-bold">₺{fmt(totals.liabilities?.current ?? 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
            <h2 className="font-bold text-blue-800 text-sm">AKTİF (VARLIKLAR)</h2>
          </div>
          <div className="overflow-x-auto">
            <BalanceTable lines={balance.assets} period={balance.period} previousPeriod={balance.previousPeriod} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="bg-green-50 border-b border-green-100 px-4 py-2">
            <h2 className="font-bold text-green-800 text-sm">PASİF (KAYNAKLAR)</h2>
          </div>
          <div className="overflow-x-auto">
            <BalanceTable lines={balance.liabilities} period={balance.period} previousPeriod={balance.previousPeriod} />
          </div>
        </div>
      </div>
    </div>
  );
}
