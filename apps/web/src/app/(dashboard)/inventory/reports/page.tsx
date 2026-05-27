'use client';

import { useState, useMemo } from 'react';
import { BarChart3, Package, TrendingUp, AlertTriangle, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

type ReportTab = 'current' | 'abc' | 'aging' | 'minmax' | 'movements' | 'turnover';

const TABS: { key: ReportTab; label: string; icon: any }[] = [
  { key: 'current',   label: 'Anlık Stok',       icon: Package },
  { key: 'abc',       label: 'ABC Analizi',       icon: BarChart3 },
  { key: 'aging',     label: 'Stok Yaşlandırma',  icon: AlertTriangle },
  { key: 'minmax',    label: 'Min/Max Analizi',   icon: TrendingUp },
  { key: 'movements', label: 'Hareket Geçmişi',   icon: Package },
  { key: 'turnover',  label: 'Stok Devir Hızı',   icon: TrendingUp },
];

const ABC_COLORS: Record<string, string> = { A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-gray-100 text-gray-600' };
const STOCK_STATUS_COLORS: Record<string, string> = { normal: 'bg-green-100 text-green-700', low: 'bg-yellow-100 text-yellow-700', critical: 'bg-red-100 text-red-700', overstock: 'bg-blue-100 text-blue-700' };
const STOCK_STATUS_LABELS: Record<string, string> = { normal: 'Normal', low: 'Düşük', critical: 'Kritik', overstock: 'Fazla Stok' };
const MOVEMENT_COLORS: Record<string, string> = { in: 'bg-green-100 text-green-700', out: 'bg-red-100 text-red-700', transfer: 'bg-blue-100 text-blue-700', adjust: 'bg-gray-100 text-gray-600' };
const MOVEMENT_LABELS: Record<string, string> = { in: 'Giriş', out: 'Çıkış', transfer: 'Transfer', adjust: 'Düzeltme' };

interface CurrentStockRow { id: string; code: string; name: string; warehouse: string; currentStock: number; reserved: number; available: number; unit: string; minStock: number; status: string; }
interface ABCRow { rank: number; productName: string; annualValue: number; cumulativePercent: number; abcClass: string; }
interface AgingRow { id: string; productName: string; d0_30: number; d31_60: number; d61_90: number; d90plus: number; total: number; risk: string; }
interface MinMaxRow { id: string; productName: string; minStock: number; maxStock: number; currentStock: number; needsOrder: boolean; }
interface MovementRow { id: string; date: string; productCode: string; productName: string; warehouse: string; type: string; quantity: number; unit: string; reference?: string; }
interface TurnoverRow { id: string; productName: string; periodSales: number; avgStock: number; turnoverRate: number; turnoverDays: number; }

const MOCK_CURRENT_STOCK: CurrentStockRow[] = [
  { id: 'p1', code: 'URN-001', name: 'Çelik Vida M8x30', warehouse: 'Merkez Ana Depo', currentStock: 1200, reserved: 150, available: 1050, unit: 'Adet', minStock: 200, status: 'normal' },
  { id: 'p2', code: 'URN-002', name: 'Plastik Conta 50mm', warehouse: 'Merkez Ana Depo', currentStock: 85, reserved: 40, available: 45, unit: 'Adet', minStock: 100, status: 'low' },
  { id: 'p3', code: 'URN-003', name: 'Alüminyum Profil 2m', warehouse: 'Ankara Depo', currentStock: 320, reserved: 0, available: 320, unit: 'Adet', minStock: 50, status: 'overstock' },
  { id: 'p4', code: 'URN-004', name: 'Kauçuk Conta 30mm', warehouse: 'Merkez Ana Depo', currentStock: 12, reserved: 10, available: 2, unit: 'Adet', minStock: 50, status: 'critical' },
  { id: 'p5', code: 'URN-005', name: 'Paslanmaz Somun M10', warehouse: 'İzmir Depo', currentStock: 560, reserved: 80, available: 480, unit: 'Adet', minStock: 100, status: 'normal' },
];

const MOCK_ABC: ABCRow[] = [
  { rank: 1, productName: 'Alüminyum Profil 2m', annualValue: 2400000, cumulativePercent: 32.5, abcClass: 'A' },
  { rank: 2, productName: 'Çelik Vida M8x30', annualValue: 1800000, cumulativePercent: 57.0, abcClass: 'A' },
  { rank: 3, productName: 'Paslanmaz Somun M10', annualValue: 900000, cumulativePercent: 69.2, abcClass: 'B' },
  { rank: 4, productName: 'Plastik Conta 50mm', annualValue: 450000, cumulativePercent: 75.3, abcClass: 'B' },
  { rank: 5, productName: 'Kauçuk Conta 30mm', annualValue: 180000, cumulativePercent: 97.7, abcClass: 'C' },
];

const MOCK_AGING: AgingRow[] = [
  { id: 'p1', productName: 'Çelik Vida M8x30', d0_30: 500, d31_60: 400, d61_90: 200, d90plus: 100, total: 1200, risk: 'low' },
  { id: 'p3', productName: 'Alüminyum Profil 2m', d0_30: 50, d31_60: 70, d61_90: 100, d90plus: 100, total: 320, risk: 'medium' },
  { id: 'p4', productName: 'Kauçuk Conta 30mm', d0_30: 0, d31_60: 2, d61_90: 5, d90plus: 5, total: 12, risk: 'high' },
];

const MOCK_MINMAX: MinMaxRow[] = [
  { id: 'p1', productName: 'Çelik Vida M8x30', minStock: 200, maxStock: 2000, currentStock: 1200, needsOrder: false },
  { id: 'p2', productName: 'Plastik Conta 50mm', minStock: 100, maxStock: 500, currentStock: 85, needsOrder: true },
  { id: 'p3', productName: 'Alüminyum Profil 2m', minStock: 50, maxStock: 200, currentStock: 320, needsOrder: false },
  { id: 'p4', productName: 'Kauçuk Conta 30mm', minStock: 50, maxStock: 300, currentStock: 12, needsOrder: true },
  { id: 'p5', productName: 'Paslanmaz Somun M10', minStock: 100, maxStock: 800, currentStock: 560, needsOrder: false },
];

const MOCK_MOVEMENTS: MovementRow[] = [
  { id: 'm1', date: '2026-05-25', productCode: 'URN-001', productName: 'Çelik Vida M8x30', warehouse: 'Merkez Ana Depo', type: 'in', quantity: 300, unit: 'Adet', reference: 'SİP-2026-0042' },
  { id: 'm2', date: '2026-05-24', productCode: 'URN-002', productName: 'Plastik Conta 50mm', warehouse: 'Merkez Ana Depo', type: 'out', quantity: 25, unit: 'Adet', reference: 'SEV-2026-0018' },
  { id: 'm3', date: '2026-05-23', productCode: 'URN-003', productName: 'Alüminyum Profil 2m', warehouse: 'Ankara Depo', type: 'transfer', quantity: 50, unit: 'Adet', reference: 'TRF-2026-0005' },
  { id: 'm4', date: '2026-05-22', productCode: 'URN-005', productName: 'Paslanmaz Somun M10', warehouse: 'İzmir Depo', type: 'in', quantity: 200, unit: 'Adet', reference: 'SİP-2026-0041' },
];

const MOCK_TURNOVER: TurnoverRow[] = [
  { id: 'p1', productName: 'Çelik Vida M8x30', periodSales: 4800, avgStock: 1100, turnoverRate: 4.36, turnoverDays: 84 },
  { id: 'p2', productName: 'Plastik Conta 50mm', periodSales: 180, avgStock: 95, turnoverRate: 1.89, turnoverDays: 193 },
  { id: 'p3', productName: 'Alüminyum Profil 2m', periodSales: 620, avgStock: 290, turnoverRate: 2.14, turnoverDays: 171 },
  { id: 'p5', productName: 'Paslanmaz Somun M10', periodSales: 1200, avgStock: 480, turnoverRate: 2.50, turnoverDays: 146 },
];

export default function InventoryReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('current');
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: currentStock = [], isLoading: loadingCurrent } = useQuery<CurrentStockRow[]>({ queryKey: ['inventory-report-current', warehouseFilter], queryFn: () => api.get('/api/v1/inventory/reports/current-stock', { warehouse: warehouseFilter || undefined }), initialData: MOCK_CURRENT_STOCK });
  const { data: abcData = [], isLoading: loadingABC } = useQuery<ABCRow[]>({ queryKey: ['inventory-report-abc', dateFrom, dateTo], queryFn: () => api.get('/api/v1/inventory/reports/abc', { from: dateFrom || undefined, to: dateTo || undefined }), initialData: MOCK_ABC });
  const { data: agingData = [], isLoading: loadingAging } = useQuery<AgingRow[]>({ queryKey: ['inventory-report-aging'], queryFn: () => api.get('/api/v1/inventory/reports/aging'), initialData: MOCK_AGING });
  const { data: minMaxData = [], isLoading: loadingMinMax } = useQuery<MinMaxRow[]>({ queryKey: ['inventory-report-minmax'], queryFn: () => api.get('/api/v1/inventory/reports/minmax'), initialData: MOCK_MINMAX });
  const { data: movementsData = [], isLoading: loadingMovements } = useQuery<MovementRow[]>({ queryKey: ['inventory-report-movements', dateFrom, dateTo, warehouseFilter], queryFn: () => api.get('/api/v1/inventory/reports/movements', { from: dateFrom || undefined, to: dateTo || undefined, warehouse: warehouseFilter || undefined }), initialData: MOCK_MOVEMENTS });
  const { data: turnoverData = [], isLoading: loadingTurnover } = useQuery<TurnoverRow[]>({ queryKey: ['inventory-report-turnover', dateFrom, dateTo], queryFn: () => api.get('/api/v1/inventory/reports/turnover', { from: dateFrom || undefined, to: dateTo || undefined }), initialData: MOCK_TURNOVER });

  const isLoading = { current: loadingCurrent, abc: loadingABC, aging: loadingAging, minmax: loadingMinMax, movements: loadingMovements, turnover: loadingTurnover }[activeTab];

  const filteredCurrent = useMemo(() => {
    if (!search) return currentStock;
    const q = search.toLowerCase();
    return currentStock.filter((r) => r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q));
  }, [currentStock, search]);

  const filteredABC = useMemo(() => {
    if (!search) return abcData;
    const q = search.toLowerCase();
    return abcData.filter((r) => r.productName?.toLowerCase().includes(q));
  }, [abcData, search]);

  const filteredAging = useMemo(() => {
    if (!search) return agingData;
    const q = search.toLowerCase();
    return agingData.filter((r) => r.productName?.toLowerCase().includes(q));
  }, [agingData, search]);

  const filteredMinMax = useMemo(() => {
    if (!search) return minMaxData;
    const q = search.toLowerCase();
    return minMaxData.filter((r) => r.productName?.toLowerCase().includes(q));
  }, [minMaxData, search]);

  const filteredMovements = useMemo(() => {
    if (!search) return movementsData;
    const q = search.toLowerCase();
    return movementsData.filter((r) => r.productCode?.toLowerCase().includes(q) || r.productName?.toLowerCase().includes(q) || r.reference?.toLowerCase().includes(q));
  }, [movementsData, search]);

  const filteredTurnover = useMemo(() => {
    if (!search) return turnoverData;
    const q = search.toLowerCase();
    return turnoverData.filter((r) => r.productName?.toLowerCase().includes(q));
  }, [turnoverData, search]);

  function handleExcel() {
    if (activeTab === 'current') exportToExcel(
      filteredCurrent.map((r) => ({ kod: r.code, urun: r.name, depo: r.warehouse, mevcutStok: r.currentStock, rezerve: r.reserved, kullanilabilir: r.available, birim: r.unit, minStok: r.minStock, durum: STOCK_STATUS_LABELS[r.status] ?? r.status })),
      [{ key: 'kod', header: 'Ürün Kodu', width: 14 }, { key: 'urun', header: 'Ürün Adı', width: 28 }, { key: 'depo', header: 'Depo', width: 16 }, { key: 'mevcutStok', header: 'Mevcut Stok', width: 14 }, { key: 'rezerve', header: 'Rezerve', width: 12 }, { key: 'kullanilabilir', header: 'Kullanılabilir', width: 14 }, { key: 'birim', header: 'Birim', width: 10 }, { key: 'minStok', header: 'Min Stok', width: 12 }, { key: 'durum', header: 'Durum', width: 12 }],
      'anlik-stok', 'Anlık Stok'
    );
    if (activeTab === 'abc') exportToExcel(
      filteredABC.map((r) => ({ sira: r.rank, urun: r.productName, yillikDeger: r.annualValue, kumulatifYuzde: r.cumulativePercent?.toFixed(1) + '%', abcSinifi: r.abcClass })),
      [{ key: 'sira', header: 'Sıra', width: 8 }, { key: 'urun', header: 'Ürün', width: 28 }, { key: 'yillikDeger', header: 'Yıllık Satış Değeri', width: 20 }, { key: 'kumulatifYuzde', header: '% Kümülatif', width: 14 }, { key: 'abcSinifi', header: 'ABC Sınıfı', width: 12 }],
      'abc-analizi', 'ABC Analizi'
    );
    if (activeTab === 'aging') exportToExcel(
      filteredAging.map((r) => ({ urun: r.productName, gun0_30: r.d0_30, gun31_60: r.d31_60, gun61_90: r.d61_90, gun90p: r.d90plus, toplam: r.total, risk: r.risk })),
      [{ key: 'urun', header: 'Ürün', width: 28 }, { key: 'gun0_30', header: '0-30 Gün', width: 12 }, { key: 'gun31_60', header: '31-60 Gün', width: 12 }, { key: 'gun61_90', header: '61-90 Gün', width: 12 }, { key: 'gun90p', header: '90+ Gün', width: 12 }, { key: 'toplam', header: 'Toplam', width: 12 }, { key: 'risk', header: 'Risk', width: 12 }],
      'stok-yaslandirma', 'Stok Yaşlandırma'
    );
    if (activeTab === 'minmax') exportToExcel(
      filteredMinMax.map((r) => ({ urun: r.productName, minStok: r.minStock, maksStok: r.maxStock, mevcut: r.currentStock, siparisOnerisi: r.needsOrder ? 'Evet' : 'Hayır' })),
      [{ key: 'urun', header: 'Ürün', width: 28 }, { key: 'minStok', header: 'Min Stok', width: 12 }, { key: 'maksStok', header: 'Maks Stok', width: 12 }, { key: 'mevcut', header: 'Mevcut', width: 12 }, { key: 'siparisOnerisi', header: 'Sipariş Önerildi mi', width: 16 }],
      'min-max-analizi', 'Min/Max Analizi'
    );
    if (activeTab === 'movements') exportToExcel(
      filteredMovements.map((r) => ({ tarih: r.date ? formatDate(r.date) : '', urunKodu: r.productCode, urun: r.productName, depo: r.warehouse, tur: MOVEMENT_LABELS[r.type] ?? r.type, miktar: r.quantity, birim: r.unit, referans: r.reference ?? '' })),
      [{ key: 'tarih', header: 'Tarih', width: 12 }, { key: 'urunKodu', header: 'Ürün Kodu', width: 14 }, { key: 'urun', header: 'Ürün Adı', width: 28 }, { key: 'depo', header: 'Depo', width: 16 }, { key: 'tur', header: 'Hareket Türü', width: 14 }, { key: 'miktar', header: 'Miktar', width: 12 }, { key: 'birim', header: 'Birim', width: 10 }, { key: 'referans', header: 'Referans', width: 16 }],
      'hareket-gecmisi', 'Hareket Geçmişi'
    );
    if (activeTab === 'turnover') exportToExcel(
      filteredTurnover.map((r) => ({ urun: r.productName, donemSatisi: r.periodSales, ortStok: r.avgStock, devirHizi: r.turnoverRate?.toFixed(2), devirGunu: r.turnoverDays })),
      [{ key: 'urun', header: 'Ürün', width: 28 }, { key: 'donemSatisi', header: 'Dönem Satışı', width: 16 }, { key: 'ortStok', header: 'Ort. Stok', width: 14 }, { key: 'devirHizi', header: 'Devir Hızı', width: 14 }, { key: 'devirGunu', header: 'Devir Günü', width: 14 }],
      'stok-devir-hizi', 'Stok Devir Hızı'
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stok Raporları</h1>
          <p className="text-muted-foreground mt-1">Anlık durum, ABC analizi, yaşlandırma ve devir hızı raporları</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
          <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 flex-wrap">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  <Icon className="h-3.5 w-3.5" />{tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(activeTab === 'abc' || activeTab === 'turnover' || activeTab === 'movements') && (
              <>
                <label className="text-sm text-muted-foreground">Başlangıç</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
                <label className="text-sm text-muted-foreground">Bitiş</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
              </>
            )}
            {(activeTab === 'current' || activeTab === 'movements') && (
              <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                <option value="">Tüm Depolar</option>
                <option value="main">Ana Depo</option>
                <option value="satellite">Yardımcı Depo</option>
                <option value="transit">Transit Depo</option>
              </select>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün ara..." className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-44" />
            </div>
            <button onClick={handleExcel} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted">
              <FileDown className="h-4 w-4" /> Excel
            </button>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
          ) : (
            <>
              {/* Current Stock */}
              {activeTab === 'current' && (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Ürün Kodu</th><th className="pb-3 font-medium">Ürün Adı</th><th className="pb-3 font-medium">Depo</th><th className="pb-3 font-medium text-right">Mevcut</th><th className="pb-3 font-medium text-right">Rezerve</th><th className="pb-3 font-medium text-right">Kullanılabilir</th><th className="pb-3 font-medium">Birim</th><th className="pb-3 font-medium text-right">Min Stok</th><th className="pb-3 font-medium">Durum</th>
                  </tr></thead>
                  <tbody>
                    {filteredCurrent.length === 0 ? <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Veri bulunamadı</td></tr>
                      : filteredCurrent.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="py-3 font-mono text-xs font-semibold text-primary">{r.code}</td>
                          <td className="py-3 font-medium">{r.name}</td>
                          <td className="py-3 text-muted-foreground">{r.warehouse}</td>
                          <td className="py-3 text-right font-semibold">{r.currentStock}</td>
                          <td className="py-3 text-right text-muted-foreground">{r.reserved}</td>
                          <td className="py-3 text-right font-semibold">{r.available}</td>
                          <td className="py-3 text-muted-foreground">{r.unit}</td>
                          <td className="py-3 text-right text-muted-foreground">{r.minStock}</td>
                          <td className="py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STOCK_STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600')}>{STOCK_STATUS_LABELS[r.status] ?? r.status}</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* ABC Analysis */}
              {activeTab === 'abc' && (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium w-12">Sıra</th><th className="pb-3 font-medium">Ürün</th><th className="pb-3 font-medium text-right">Yıllık Satış Değeri</th><th className="pb-3 font-medium text-right">% Kümülatif</th><th className="pb-3 font-medium text-center">ABC Sınıfı</th>
                  </tr></thead>
                  <tbody>
                    {filteredABC.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Veri bulunamadı</td></tr>
                      : filteredABC.map((r) => (
                        <tr key={r.rank} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="py-3 text-muted-foreground">{r.rank}</td>
                          <td className="py-3 font-medium">{r.productName}</td>
                          <td className="py-3 text-right font-semibold">{formatCurrency(r.annualValue)}</td>
                          <td className="py-3 text-right text-muted-foreground">{r.cumulativePercent?.toFixed(1)}%</td>
                          <td className="py-3 text-center"><span className={cn('px-3 py-0.5 rounded-full text-xs font-bold', ABC_COLORS[r.abcClass] ?? 'bg-gray-100 text-gray-600')}>{r.abcClass}</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* Aging */}
              {activeTab === 'aging' && (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Ürün</th><th className="pb-3 font-medium text-right">0-30 Gün</th><th className="pb-3 font-medium text-right">31-60 Gün</th><th className="pb-3 font-medium text-right">61-90 Gün</th><th className="pb-3 font-medium text-right">90+ Gün</th><th className="pb-3 font-medium text-right">Toplam</th><th className="pb-3 font-medium">Risk</th>
                  </tr></thead>
                  <tbody>
                    {filteredAging.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Veri bulunamadı</td></tr>
                      : filteredAging.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="py-3 font-medium">{r.productName}</td>
                          <td className="py-3 text-right text-green-600">{r.d0_30}</td>
                          <td className="py-3 text-right text-yellow-600">{r.d31_60}</td>
                          <td className="py-3 text-right text-orange-600">{r.d61_90}</td>
                          <td className="py-3 text-right text-red-600 font-semibold">{r.d90plus}</td>
                          <td className="py-3 text-right font-semibold">{r.total}</td>
                          <td className="py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', r.risk === 'yüksek' ? 'bg-red-100 text-red-700' : r.risk === 'orta' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700')}>{r.risk}</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* Min/Max */}
              {activeTab === 'minmax' && (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Ürün</th><th className="pb-3 font-medium text-right">Min Stok</th><th className="pb-3 font-medium text-right">Maks Stok</th><th className="pb-3 font-medium text-right">Mevcut Stok</th><th className="pb-3 font-medium text-center">Sipariş Önerildi mi</th>
                  </tr></thead>
                  <tbody>
                    {filteredMinMax.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Veri bulunamadı</td></tr>
                      : filteredMinMax.map((r) => (
                        <tr key={r.id} className={cn('border-b border-border last:border-0 hover:bg-muted/30', r.needsOrder ? 'bg-red-50/30 dark:bg-red-950/10' : '')}>
                          <td className="py-3 font-medium">{r.productName}</td>
                          <td className="py-3 text-right text-muted-foreground">{r.minStock}</td>
                          <td className="py-3 text-right text-muted-foreground">{r.maxStock}</td>
                          <td className={cn('py-3 text-right font-semibold', r.currentStock <= r.minStock ? 'text-red-600' : 'text-green-600')}>{r.currentStock}</td>
                          <td className="py-3 text-center">{r.needsOrder ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Sipariş Ver</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* Movements */}
              {activeTab === 'movements' && (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Tarih</th><th className="pb-3 font-medium">Ürün Kodu</th><th className="pb-3 font-medium">Ürün Adı</th><th className="pb-3 font-medium">Depo</th><th className="pb-3 font-medium">Hareket Türü</th><th className="pb-3 font-medium text-right">Miktar</th><th className="pb-3 font-medium">Birim</th><th className="pb-3 font-medium">Referans</th>
                  </tr></thead>
                  <tbody>
                    {filteredMovements.length === 0 ? <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Hareket kaydı bulunamadı</td></tr>
                      : filteredMovements.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="py-3 text-muted-foreground text-xs">{r.date ? formatDate(r.date) : '—'}</td>
                          <td className="py-3 font-mono text-xs text-muted-foreground">{r.productCode}</td>
                          <td className="py-3 font-medium">{r.productName}</td>
                          <td className="py-3 text-muted-foreground">{r.warehouse}</td>
                          <td className="py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', MOVEMENT_COLORS[r.type] ?? 'bg-gray-100 text-gray-600')}>{MOVEMENT_LABELS[r.type] ?? r.type}</span></td>
                          <td className={cn('py-3 text-right font-semibold', r.type === 'out' ? 'text-red-600' : 'text-green-600')}>{r.type === 'out' ? '-' : '+'}{r.quantity}</td>
                          <td className="py-3 text-muted-foreground">{r.unit}</td>
                          <td className="py-3 text-muted-foreground text-xs">{r.reference ?? '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* Turnover */}
              {activeTab === 'turnover' && (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Ürün</th><th className="pb-3 font-medium text-right">Dönem Satışı</th><th className="pb-3 font-medium text-right">Ort. Stok</th><th className="pb-3 font-medium text-right">Devir Hızı</th><th className="pb-3 font-medium text-right">Devir Günü</th>
                  </tr></thead>
                  <tbody>
                    {filteredTurnover.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Veri bulunamadı</td></tr>
                      : filteredTurnover.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="py-3 font-medium">{r.productName}</td>
                          <td className="py-3 text-right">{r.periodSales}</td>
                          <td className="py-3 text-right text-muted-foreground">{r.avgStock?.toFixed(1)}</td>
                          <td className="py-3 text-right font-semibold">{r.turnoverRate?.toFixed(2)}x</td>
                          <td className="py-3 text-right text-muted-foreground">{Math.round(r.turnoverDays)} gün</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
