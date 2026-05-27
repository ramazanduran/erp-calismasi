'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, AlertCircle } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { cn } from '@/lib/utils';

interface AgingEntry {
  id: string;
  name: string;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
  total: number;
}

interface AgingReport {
  asOf: string;
  receivables: AgingEntry[];
  payables: AgingEntry[];
}

const MOCK_AGING: AgingReport = {
  asOf: '2026-05-27',
  receivables: [
    { id: 'r1', name: 'ABC Ticaret A.Ş.', current: 420000, d1_30: 85000, d31_60: 0, d61_90: 0, d90plus: 0, total: 505000 },
    { id: 'r2', name: 'DEF Yapı Ltd.', current: 0, d1_30: 320000, d31_60: 180000, d61_90: 0, d90plus: 0, total: 500000 },
    { id: 'r3', name: 'GHI Otomotiv', current: 850000, d1_30: 0, d31_60: 0, d61_90: 95000, d90plus: 0, total: 945000 },
    { id: 'r4', name: 'JKL İnşaat', current: 0, d1_30: 0, d31_60: 250000, d61_90: 120000, d90plus: 45000, total: 415000 },
    { id: 'r5', name: 'MNO Elektronik', current: 180000, d1_30: 75000, d31_60: 0, d61_90: 0, d90plus: 0, total: 255000 },
    { id: 'r6', name: 'PQR Tekstil', current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 285000, total: 285000 },
    { id: 'r7', name: 'STU Gıda A.Ş.', current: 630000, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 630000 },
    { id: 'r8', name: 'VWX Kimya', current: 0, d1_30: 140000, d31_60: 70000, d61_90: 0, d90plus: 0, total: 210000 },
  ],
  payables: [
    { id: 'p1', name: 'Alır Çelik Ltd.', current: 380000, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 380000 },
    { id: 'p2', name: 'Bedir Plastik A.Ş.', current: 0, d1_30: 240000, d31_60: 120000, d61_90: 0, d90plus: 0, total: 360000 },
    { id: 'p3', name: 'Çelik Makine San.', current: 920000, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 920000 },
    { id: 'p4', name: 'Demir Elektrik', current: 0, d1_30: 85000, d31_60: 0, d61_90: 60000, d90plus: 0, total: 145000 },
    { id: 'p5', name: 'Erdem Lojistik', current: 145000, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 145000 },
    { id: 'p6', name: 'Fırat Kimya A.Ş.', current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 180000, total: 180000 },
  ],
};

function fmt(n: number): string {
  if (n === 0) return '—';
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n);
}

function totalFor(entries: AgingEntry[], field: keyof AgingEntry): number {
  return entries.reduce((s, e) => s + (e[field] as number), 0);
}

function AgingTable({ entries, title, headerColor }: { entries: AgingEntry[]; title: string; headerColor: string }) {
  const columns: { key: keyof AgingEntry; label: string }[] = [
    { key: 'current', label: 'Vadesi Gelmemiş' },
    { key: 'd1_30', label: '1-30 Gün' },
    { key: 'd31_60', label: '31-60 Gün' },
    { key: 'd61_90', label: '61-90 Gün' },
    { key: 'd90plus', label: '90+ Gün' },
    { key: 'total', label: 'Toplam' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className={cn('px-4 py-3 border-b border-border', headerColor)}>
        <h3 className="font-bold text-sm">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Cari Hesap</th>
              {columns.map((col) => (
                <th key={col.key} className={cn('px-4 py-2 text-right font-medium', col.key === 'total' && 'font-bold')}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const hasOverdue = entry.d61_90 > 0 || entry.d90plus > 0;
              return (
                <tr key={entry.id} className={cn('border-b border-border/50 hover:bg-muted/30', hasOverdue && 'bg-red-50/30')}>
                  <td className="px-4 py-2 font-medium flex items-center gap-2">
                    {hasOverdue && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                    {entry.name}
                  </td>
                  {columns.map((col) => {
                    const val = entry[col.key] as number;
                    const isOverdueCol = col.key === 'd61_90' || col.key === 'd90plus';
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-2 text-right tabular-nums',
                          col.key === 'total' && 'font-bold',
                          isOverdueCol && val > 0 ? 'text-red-600 font-medium' : val === 0 ? 'text-muted-foreground' : ''
                        )}
                      >
                        {col.key === 'current' || col.key === 'total' ? `₺${fmt(val)}` : val > 0 ? `₺${fmt(val)}` : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/50">
            <tr>
              <td className="px-4 py-2 font-bold text-sm">TOPLAM</td>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-right font-bold tabular-nums">
                  ₺{fmt(totalFor(entries, col.key))}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function AgingReportPage() {
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables'>('receivables');

  const { data: aging = MOCK_AGING } = useQuery<AgingReport>({
    queryKey: ['aging-report'],
    queryFn: async () => {
      const res = await fetch('/api/v1/finance/aging');
      if (!res.ok) return MOCK_AGING;
      return res.json();
    },
    initialData: MOCK_AGING,
  });

  const recTotal = totalFor(aging.receivables, 'total');
  const recOverdue = totalFor(aging.receivables, 'd61_90') + totalFor(aging.receivables, 'd90plus');
  const payTotal = totalFor(aging.payables, 'total');
  const payOverdue = totalFor(aging.payables, 'd61_90') + totalFor(aging.payables, 'd90plus');

  const handleExport = () => {
    const active = activeTab === 'receivables' ? aging.receivables : aging.payables;
    const rows = active.map((e) => ({
      'Cari Hesap': e.name,
      'Vadesi Gelmemiş': e.current,
      '1-30 Gün': e.d1_30,
      '31-60 Gün': e.d31_60,
      '61-90 Gün': e.d61_90,
      '90+ Gün': e.d90plus,
      Toplam: e.total,
    }));
    exportToExcel(rows, `vade-analizi-${activeTab}`, 'Vade Analizi');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vade Analizi (Aging Report)</h1>
          <p className="text-muted-foreground">Alacak ve borçların yaşlandırma analizi · {aging.asOf}</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          <Download className="h-4 w-4" /> Excel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam Alacak</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            ₺{new Intl.NumberFormat('tr-TR').format(recTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Gecikmiş Alacak (60+ gün)</p>
          <p className={cn('mt-1 text-2xl font-bold', recOverdue > 0 ? 'text-red-600' : 'text-green-600')}>
            ₺{new Intl.NumberFormat('tr-TR').format(recOverdue)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam Borç</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            ₺{new Intl.NumberFormat('tr-TR').format(payTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Gecikmiş Borç (60+ gün)</p>
          <p className={cn('mt-1 text-2xl font-bold', payOverdue > 0 ? 'text-red-600' : 'text-green-600')}>
            ₺{new Intl.NumberFormat('tr-TR').format(payOverdue)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        {([
          { id: 'receivables', label: 'Alacak Analizi (A/R)' },
          { id: 'payables', label: 'Borç Analizi (A/P)' },
        ] as const).map((tab) => (
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

      {activeTab === 'receivables' && (
        <AgingTable entries={aging.receivables} title="MÜŞTERİ ALACAKLARI" headerColor="bg-blue-50 text-blue-800" />
      )}
      {activeTab === 'payables' && (
        <AgingTable entries={aging.payables} title="TEDARİKÇİ BORÇLARI" headerColor="bg-orange-50 text-orange-800" />
      )}

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-3">Yaşlandırma Özeti</h3>
        <div className="flex gap-4 flex-wrap">
          {[
            { label: 'Vadesi Gelmemiş', pct: Math.round((totalFor(activeTab === 'receivables' ? aging.receivables : aging.payables, 'current') / (activeTab === 'receivables' ? recTotal : payTotal)) * 100), color: 'bg-green-500' },
            { label: '1-30 Gün', pct: Math.round((totalFor(activeTab === 'receivables' ? aging.receivables : aging.payables, 'd1_30') / (activeTab === 'receivables' ? recTotal : payTotal)) * 100), color: 'bg-blue-400' },
            { label: '31-60 Gün', pct: Math.round((totalFor(activeTab === 'receivables' ? aging.receivables : aging.payables, 'd31_60') / (activeTab === 'receivables' ? recTotal : payTotal)) * 100), color: 'bg-yellow-400' },
            { label: '61-90 Gün', pct: Math.round((totalFor(activeTab === 'receivables' ? aging.receivables : aging.payables, 'd61_90') / (activeTab === 'receivables' ? recTotal : payTotal)) * 100), color: 'bg-orange-500' },
            { label: '90+ Gün', pct: Math.round((totalFor(activeTab === 'receivables' ? aging.receivables : aging.payables, 'd90plus') / (activeTab === 'receivables' ? recTotal : payTotal)) * 100), color: 'bg-red-500' },
          ].map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <div className={cn('h-3 w-3 rounded-full', seg.color)} />
              <span className="text-sm text-muted-foreground">{seg.label}</span>
              <span className="text-sm font-semibold">%{seg.pct}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-4 rounded-full overflow-hidden flex gap-0.5">
          {[
            { key: 'current', color: 'bg-green-500' },
            { key: 'd1_30', color: 'bg-blue-400' },
            { key: 'd31_60', color: 'bg-yellow-400' },
            { key: 'd61_90', color: 'bg-orange-500' },
            { key: 'd90plus', color: 'bg-red-500' },
          ].map(({ key, color }) => {
            const entries = activeTab === 'receivables' ? aging.receivables : aging.payables;
            const total = activeTab === 'receivables' ? recTotal : payTotal;
            const pct = Math.round((totalFor(entries, key as keyof AgingEntry) / total) * 100);
            return pct > 0 ? <div key={key} className={cn('h-full', color)} style={{ width: `${pct}%` }} /> : null;
          })}
        </div>
      </div>
    </div>
  );
}
