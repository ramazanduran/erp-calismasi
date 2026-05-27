'use client';

import { useState, useMemo } from 'react';
import { BarChart3, Package, TrendingUp, AlertTriangle, FileDown, Search, RefreshCw } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn, formatCurrency } from '@/lib/utils';

type ReportTab = 'current' | 'abc' | 'aging' | 'minmax' | 'turnover';

const TABS: { key: ReportTab; label: string; icon: any }[] = [
  { key: 'current', label: 'Anlık Stok', icon: Package },
  { key: 'abc', label: 'ABC Analizi', icon: BarChart3 },
  { key: 'aging', label: 'Stok Yaşlandırma', icon: AlertTriangle },
  { key: 'minmax', label: 'Min/Max Analizi', icon: TrendingUp },
  { key: 'turnover', label: 'Stok Devir Hızı', icon: RefreshCw },
];

const ABC_COLORS: Record<string, string> = { A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-gray-100 text-gray-600' };
const STOCK_STATUS_COLORS: Record<string, string> = { normal: 'bg-green-100 text-green-700', low: 'bg-yellow-100 text-yellow-700', critical: 'bg-red-100 text-red-700', overstock: 'bg-blue-100 text-blue-700' };
const STOCK_STATUS_LABELS: Record<string, string> = { normal: 'Normal', low: 'Düşük', critical: 'Kritik', overstock: 'Fazla Stok' };

interface CurrentStockRow { id: string; code: string; name: string; warehouse: string; currentStock: number; reserved: number; available: number; unit: string; minStock: number; status: string; }
interface ABCRow { rank: number; productName: string; annualValue: number; cumulativePercent: number; abcClass: string; }
interface AgingRow { id: string; productName: string; d0_30: number; d31_60: number; d61_90: number; d90plus: number; total: number; risk: string; }
interface MinMaxRow { id: string; productName: string; minStock: number; maxStock: number; currentStock: number; needsOrder: boolean; }
interface TurnoverRow { id: string; productName: string; periodSales: number; avgStock: number; turnoverRate: number; turnoverDays: number; }

export default function InventoryReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('current');
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: currentStock = [], isLoading: loadingCurrent } = useQuery<CurrentStockRow[]>({ queryKey: ['inv-report-current', warehouseFilter], queryFn: () => api.get('/api/v1/inventory/reports/current-stock', { warehouse: warehouseFilter || undefined }) });
  const { data: abcData = [], isLoading: loadingABC } = useQuery<ABCRow[]>({ queryKey: ['inv-report-abc', dateFrom, dateTo], queryFn: () => api.get('/api/v1/inventory/reports/abc', { from: dateFrom || undefined, to: dateTo || undefined }) });
  const { data: agingData = [], isLoading: loadingAging } = useQuery<AgingRow[]>({ queryKey: ['inv-report-aging'], queryFn: () => api.get('/api/v1/inventory/reports/aging') });
  const { data: minMaxData = [], isLoading: loadingMinMax } = useQuery<MinMaxRow[]>({ queryKey: ['inv-report-minmax'], queryFn: () => api.get('/api/v1/inventory/reports/min-max') });
  const { data: turnoverData = [], isLoading: loadingTurnover } = useQuery<TurnoverRow[]>({ queryKey: ['inv-report-turnover', dateFrom, dateTo], queryFn: () => api.get('/api/v1/inventory/reports/turnover', { from: dateFrom || undefined, to: dateTo || undefined }) });

  const isLoading = { current: loadingCurrent, abc: loadingABC, aging: loadingAging, minmax: loadingMinMax, turnover: loadingTurnover }[activeTab];

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

  const filteredTurnover = useMemo(() => {
    if (!search) return turnoverData;
    const q = search.toLowerCase();
    return turnoverData.filter((r) => r.productName?.toLowerCase().includes(q));
  }, [turnoverData, search]);

  function handleExcel() {
    if (activeTab === 'current') exportToExcel(filteredCurrent.map((r) => ({ Kod: r.code, Ürün: r.name, Depo: r.warehouse, 'Mevcut Stok': r.currentStock, Rezerve: r.reserved, 'Kullanılabilir': r.available, Birim: r.unit, 'Min Stok': r.minStock, Durum: STOCK_STATUS_LABELS[r.status] ?? r.status })), 'anlik-stok');
    if (activeTab === 'abc') exportToExcel(filteredABC.map((r) => ({ Sıra: r.rank, Ürün: r.productName, 'Yıllık Değer': r.annualValue, '% Kümülatif': r.cumulativePercent, 'ABC Sınıfı': r.abcClass })), 'abc-analizi');
    if (activeTab === 'aging') exportToExcel(filteredAging.map((r) => ({ Ürün: r.productName, '0-30 Gün': r.d0_30, '31-60 Gün': r.d31_60, '61-90 Gün': r.d61_90, '90+ Gün': r.d90plus, Toplam: r.total, Risk: r.risk })), 'stok-yaslandirma');
    if (activeTab === 'minmax') exportToExcel(filteredMinMax.map((r) => ({ Ürün: r.productName, 'Min Stok': r.minStock, 'Maks Stok': r.maxStock, 'Mevcut': r.currentStock, 'Sipariş Gerekli': r.needsOrder ? 'Evet' : 'Hayır' })), 'min-max-analizi');
    if (activeTab === 'turnover') exportToExcel(filteredTurnover.map((r) => ({ Ürün: r.productName, 'Dönem Satışı': r.periodSales, 'Ort. Stok': r.avgStock, 'Devir Hızı': r.turnoverRate, 'Devir Günü': r.turnoverDays })), 'stok-devir-hizi');
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
            {(activeTab === 'abc' || activeTab === 'turnover') && (
              <>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
                <span className="text-muted-foreground text-sm">—</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
              </>
            )}
            {activeTab === 'current' && (
              <input value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} placeholder="Depo filtrele..." className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm w-36" />
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
