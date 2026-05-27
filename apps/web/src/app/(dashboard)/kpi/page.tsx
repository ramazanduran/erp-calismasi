'use client';

import { useState } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, Minus, Target, BarChart3, FileDown } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const CATEGORY_LABELS: Record<string, string> = {
  financial:   'Finansal',
  sales:       'Satış',
  operational: 'Operasyonel',
  hr:          'İnsan Kaynakları',
  quality:     'Kalite',
  business:    'İş',
};

const DIRECTION_LABELS: Record<string, string> = {
  higher_better: 'Yüksek = İyi',
  lower_better:  'Düşük = İyi',
  target:        'Hedefe Eşit',
};

const STATUS_CONFIG = {
  good:    { label: 'İyi',       color: 'text-green-600',  bg: 'bg-green-100',  border: 'border-green-200', icon: TrendingUp },
  warning: { label: 'Uyarı',     color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200', icon: Minus },
  critical:{ label: 'Kritik',    color: 'text-red-600',    bg: 'bg-red-100',    border: 'border-red-200',  icon: TrendingDown },
  no_data: { label: 'Veri Yok',  color: 'text-gray-500',   bg: 'bg-gray-100',   border: 'border-gray-200', icon: Minus },
};

interface KpiCard {
  id: string;
  name: string;
  code: string;
  category: string;
  unit?: string;
  direction: string;
  frequency: string;
  currentValue: number | null;
  targetValue: number | null;
  status: 'good' | 'warning' | 'critical' | 'no_data';
}

interface KpiDefinition {
  id: string;
  name: string;
  code: string;
  category: string;
  unit?: string;
  direction: string;
  frequency: string;
  isActive: boolean;
}

function NewKpiModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    name: '', code: '', category: 'business', unit: '%',
    direction: 'higher_better', frequency: 'monthly', description: '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni KPI Tanımı</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">KPI Adı *</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Kod *</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm font-mono uppercase" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="ÖRNEK_KPI" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Birim</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="%, adet, TRY..." />
            </div>
            <div>
              <label className="text-sm font-medium">Sıklık</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
                <option value="quarterly">Üç Aylık</option>
                <option value="yearly">Yıllık</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Yön</label>
            <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
              {Object.entries(DIRECTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KpiDetailPanel({ kpi, currentPeriod, onClose }: { kpi: KpiDefinition; currentPeriod: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [valueInput, setValueInput] = useState('');
  const [targetInput, setTargetInput] = useState('');

  const { data: trendData } = useQuery({
    queryKey: ['kpi', 'trend', kpi.id],
    queryFn: () => api.get(`/api/v1/kpi/${kpi.id}/trend`, { periods: '12' }),
  });

  const recordValue = useMutation({
    mutationFn: (value: number) => api.post(`/api/v1/kpi/${kpi.id}/values`, { period: currentPeriod, value }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kpi'] }); setValueInput(''); },
  });

  const setTarget = useMutation({
    mutationFn: (target: number) => api.post(`/api/v1/kpi/${kpi.id}/targets`, { period: currentPeriod, target }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kpi'] }); setTargetInput(''); },
  });

  const trend = (trendData as any)?.trend ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{kpi.name}</h2>
            <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[kpi.category]} • {DIRECTION_LABELS[kpi.direction]}</p>
          </div>
          <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded-lg">Kapat</button>
        </div>

        {/* Trend Chart */}
        {trend.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Trend ({trend.length} dönem)</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name={`Değer${kpi.unit ? ` (${kpi.unit})` : ''}`} />
                {trend.some((t: any) => t.target) && (
                  <Line type="monotone" dataKey="target" stroke="#22c55e" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Hedef" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Enter Value & Target for current period */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{currentPeriod} Değeri ({kpi.unit})</label>
            <div className="flex gap-2 mt-1">
              <input type="number" step="0.01" className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-sm" value={valueInput} onChange={(e) => setValueInput(e.target.value)} placeholder="Değer girin" />
              <button onClick={() => valueInput && recordValue.mutate(+valueInput)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs">Kaydet</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{currentPeriod} Hedefi ({kpi.unit})</label>
            <div className="flex gap-2 mt-1">
              <input type="number" step="0.01" className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-sm" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder="Hedef girin" />
              <button onClick={() => targetInput && setTarget.mutate(+targetInput)} className="px-3 py-1.5 border border-border rounded text-xs hover:bg-muted">Hedef</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KpiPage() {
  const qc = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detailKpi, setDetailKpi] = useState<KpiDefinition | null>(null);

  const currentPeriod = new Date().toISOString().slice(0, 7);

  const { data: dashboardData = [], isLoading } = useQuery({
    queryKey: ['kpi', 'dashboard', currentPeriod, categoryFilter],
    queryFn: () => api.get('/api/v1/kpi/dashboard', { period: currentPeriod }),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/kpi', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kpi'] }); setShowForm(false); },
  });

  const kpis = dashboardData as KpiCard[];
  const filtered = categoryFilter ? kpis.filter((k) => k.category === categoryFilter) : kpis;

  const summaryByStatus = filtered.reduce((acc, k) => {
    acc[k.status] = (acc[k.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KPI Takibi</h1>
          <p className="text-muted-foreground mt-1">Anahtar performans göstergeleri — {currentPeriod}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filtered.map((k) => ({
                code: k.code,
                name: k.name,
                category: CATEGORY_LABELS[k.category] ?? k.category,
                unit: k.unit ?? '',
                direction: DIRECTION_LABELS[k.direction] ?? k.direction,
                frequency: k.frequency,
                currentValue: k.currentValue ?? '',
                targetValue: k.targetValue ?? '',
                status: STATUS_CONFIG[k.status]?.label ?? k.status,
              })),
              [
                { key: 'code', header: 'Kod', width: 18 },
                { key: 'name', header: 'KPI Adı', width: 30 },
                { key: 'category', header: 'Kategori', width: 18 },
                { key: 'unit', header: 'Birim', width: 10 },
                { key: 'direction', header: 'Yön', width: 18 },
                { key: 'frequency', header: 'Sıklık', width: 12 },
                { key: 'currentValue', header: 'Güncel Değer', width: 14 },
                { key: 'targetValue', header: 'Hedef', width: 14 },
                { key: 'status', header: 'Durum', width: 12 },
              ],
              'kpi-takibi',
              'KPI Takibi'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Yeni KPI
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4">
        {(['good', 'warning', 'critical', 'no_data'] as const).map((s) => {
          const sc = STATUS_CONFIG[s];
          return (
            <div key={s} className={cn('rounded-xl border p-4 shadow-sm', sc.border)}>
              <div className={cn('flex items-center gap-2', sc.color)}>
                <sc.icon className="h-4 w-4" />
                <p className="text-xs font-medium">{sc.label}</p>
              </div>
              <p className={cn('text-2xl font-bold mt-1', sc.color)}>{summaryByStatus[s] ?? 0}</p>
            </div>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ v: '', l: 'Tümü' }, ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ v, l }))].map((f) => (
          <button key={f.v} onClick={() => setCategoryFilter(f.v)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', categoryFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
            {f.l}
          </button>
        ))}
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">KPI bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">Yeni KPI tanımı oluşturun</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((kpi) => {
            const sc = STATUS_CONFIG[kpi.status];
            const Icon = sc.icon;
            const progress = kpi.currentValue !== null && kpi.targetValue !== null && Number(kpi.targetValue) > 0
              ? Math.min(150, Math.round((Number(kpi.currentValue) / Number(kpi.targetValue)) * 100))
              : null;

            return (
              <div key={kpi.id} className={cn('rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer', sc.border)} onClick={() => setDetailKpi(kpi)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{CATEGORY_LABELS[kpi.category]}</span>
                  <span className={cn('flex items-center gap-1 text-xs', sc.color)}>
                    <Icon className="h-3 w-3" />{sc.label}
                  </span>
                </div>
                <p className="text-sm font-semibold mb-2 line-clamp-2">{kpi.name}</p>
                <p className={cn('text-2xl font-bold', sc.color)}>
                  {kpi.currentValue !== null ? `${Number(kpi.currentValue).toLocaleString('tr-TR')}${kpi.unit ? ` ${kpi.unit}` : ''}` : '—'}
                </p>
                {kpi.targetValue !== null && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hedef: {Number(kpi.targetValue).toLocaleString('tr-TR')}{kpi.unit ? ` ${kpi.unit}` : ''}
                  </p>
                )}
                {progress !== null && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', sc.color.replace('text-', 'bg-').replace('-600', '-500'))} style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{progress}% hedefe ulaşıldı</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && <NewKpiModal onClose={() => setShowForm(false)} onSave={(d) => create.mutate(d)} />}
      {detailKpi && <KpiDetailPanel kpi={detailKpi} currentPeriod={currentPeriod} onClose={() => setDetailKpi(null)} />}
    </div>
  );
}
