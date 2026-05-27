'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Save, Trash2, GripVertical, BarChart3, PieChart,
  TrendingUp, Hash, TableProperties, X, Edit2, Eye,
  LayoutDashboard, Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type WidgetType = 'stat' | 'bar_chart' | 'line_chart' | 'pie_chart' | 'table' | 'progress';
type DataSource = 'sales' | 'inventory' | 'finance' | 'hr' | 'purchasing' | 'production' | 'crm';
type WidgetSize = '1x1' | '2x1' | '3x1' | '1x2' | '2x2' | '3x2';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: DataSource;
  metric?: string;
  size: WidgetSize;
  color?: string;
  order: number;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  isDefault: boolean;
  createdAt: string;
}

const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  stat: 'Sayı Kartı',
  bar_chart: 'Çubuk Grafik',
  line_chart: 'Çizgi Grafik',
  pie_chart: 'Pasta Grafik',
  table: 'Veri Tablosu',
  progress: 'İlerleme Çubuğu',
};

const WIDGET_ICONS: Record<WidgetType, React.ComponentType<{ className?: string }>> = {
  stat: Hash,
  bar_chart: BarChart3,
  line_chart: TrendingUp,
  pie_chart: PieChart,
  table: TableProperties,
  progress: TrendingUp,
};

const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  sales: 'Satış', inventory: 'Stok', finance: 'Finans',
  hr: 'İK', purchasing: 'Satın Alma', production: 'Üretim', crm: 'CRM',
};

const METRICS: Partial<Record<DataSource, string[]>> = {
  sales: ['Toplam Satış', 'Sipariş Sayısı', 'Müşteri Sayısı', 'Ortalama Sepet', 'İade Oranı'],
  inventory: ['Stok Değeri', 'Kritik Stok Sayısı', 'Stok Devir Hızı', 'Depo Doluluk Oranı'],
  finance: ['Toplam Gelir', 'Net Kâr', 'Alacaklar', 'Borçlar', 'Nakit Akışı'],
  hr: ['Çalışan Sayısı', 'Devamsızlık Oranı', 'Açık Pozisyon', 'Eğitim Tamamlama'],
  purchasing: ['Açık Sipariş', 'Tedarikçi Sayısı', 'Ortalama Teslimat Süresi'],
  production: ['OEE', 'Üretim Miktarı', 'Hata Oranı', 'Hat Verimliliği'],
  crm: ['Lead Sayısı', 'Dönüşüm Oranı', 'Pipeline Değeri', 'Aktif Fırsat'],
};

const COLOR_OPTIONS = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'yellow'];

const SIZE_OPTIONS: Array<{ value: WidgetSize; label: string; cols: number; rows: number }> = [
  { value: '1x1', label: 'Küçük (1×1)', cols: 1, rows: 1 },
  { value: '2x1', label: 'Orta (2×1)', cols: 2, rows: 1 },
  { value: '3x1', label: 'Geniş (3×1)', cols: 3, rows: 1 },
  { value: '2x2', label: 'Kare (2×2)', cols: 2, rows: 2 },
  { value: '3x2', label: 'Büyük (3×2)', cols: 3, rows: 2 },
];

const MOCK_DASHBOARDS: Dashboard[] = [
  {
    id: '1', name: 'Satış Performans Paneli', description: 'Aylık satış KPI\'ları ve gelir takibi',
    isDefault: true, createdAt: '2026-05-01',
    widgets: [
      { id: 'w1', type: 'stat', title: 'Bu Ay Satış', dataSource: 'sales', metric: 'Toplam Satış', size: '1x1', color: 'blue', order: 1 },
      { id: 'w2', type: 'stat', title: 'Sipariş Sayısı', dataSource: 'sales', metric: 'Sipariş Sayısı', size: '1x1', color: 'green', order: 2 },
      { id: 'w3', type: 'stat', title: 'Müşteri', dataSource: 'sales', metric: 'Müşteri Sayısı', size: '1x1', color: 'purple', order: 3 },
      { id: 'w4', type: 'bar_chart', title: 'Aylık Satış Trendi', dataSource: 'sales', metric: 'Toplam Satış', size: '3x2', color: 'blue', order: 4 },
      { id: 'w5', type: 'pie_chart', title: 'Satış Kanalları', dataSource: 'crm', metric: 'Dönüşüm Oranı', size: '2x2', color: 'orange', order: 5 },
    ],
  },
  {
    id: '2', name: 'Operasyon Özet', description: 'Üretim ve lojistik metrikleri',
    isDefault: false, createdAt: '2026-05-10',
    widgets: [
      { id: 'w6', type: 'stat', title: 'OEE', dataSource: 'production', metric: 'OEE', size: '1x1', color: 'teal', order: 1 },
      { id: 'w7', type: 'progress', title: 'Depo Doluluk', dataSource: 'inventory', metric: 'Depo Doluluk Oranı', size: '2x1', color: 'orange', order: 2 },
    ],
  },
];

const COLOR_BG: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  purple: 'bg-purple-50 border-purple-200',
  orange: 'bg-orange-50 border-orange-200',
  red: 'bg-red-50 border-red-200',
  teal: 'bg-teal-50 border-teal-200',
  yellow: 'bg-yellow-50 border-yellow-200',
};

const COLOR_TEXT: Record<string, string> = {
  blue: 'text-blue-700', green: 'text-green-700', purple: 'text-purple-700',
  orange: 'text-orange-700', red: 'text-red-700', teal: 'text-teal-700', yellow: 'text-yellow-700',
};

function WidgetPreview({ widget }: { widget: Widget }) {
  const Icon = WIDGET_ICONS[widget.type];
  const cols = SIZE_OPTIONS.find((s) => s.value === widget.size)?.cols ?? 1;
  const rows = SIZE_OPTIONS.find((s) => s.value === widget.size)?.rows ?? 1;
  const color = widget.color ?? 'blue';

  return (
    <div
      className={cn('rounded-xl border p-4 flex flex-col gap-2', COLOR_BG[color] ?? 'bg-muted border-border')}
      style={{ gridColumn: `span ${cols}`, gridRow: `span ${rows}`, minHeight: rows > 1 ? '160px' : '80px' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold truncate">{widget.title}</p>
        <Icon className={cn('h-4 w-4 shrink-0', COLOR_TEXT[color])} />
      </div>
      <div className="flex-1 flex items-center justify-center">
        {widget.type === 'stat' && (
          <div className="text-center">
            <p className={cn('text-3xl font-bold', COLOR_TEXT[color])}>—</p>
            <p className="text-xs text-muted-foreground mt-1">{widget.metric}</p>
          </div>
        )}
        {(widget.type === 'bar_chart' || widget.type === 'line_chart') && (
          <div className="w-full flex items-end gap-1 h-16">
            {[40, 65, 45, 80, 60, 90, 70].map((h, i) => (
              <div key={i} className={cn('flex-1 rounded-t', COLOR_TEXT[color].replace('text-', 'bg-').replace('-700', '-300'))}
                style={{ height: `${h}%` }} />
            ))}
          </div>
        )}
        {widget.type === 'pie_chart' && (
          <div className={cn('h-16 w-16 rounded-full border-8', COLOR_TEXT[color].replace('text-', 'border-').replace('-700', '-300'))}
            style={{ background: `conic-gradient(currentColor 60%, #e5e7eb 60%)` }} />
        )}
        {widget.type === 'progress' && (
          <div className="w-full">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{widget.metric}</span><span>—%</span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-3">
              <div className={cn('h-3 rounded-full', COLOR_TEXT[color].replace('text-', 'bg-').replace('-700', '-400'))} style={{ width: '65%' }} />
            </div>
          </div>
        )}
        {widget.type === 'table' && (
          <div className="w-full text-xs space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="h-3 bg-white/50 rounded flex-1" />
                <div className="h-3 bg-white/50 rounded w-16" />
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{DATA_SOURCE_LABELS[widget.dataSource]}</p>
    </div>
  );
}

interface AddWidgetModalProps {
  onClose: () => void;
  onAdd: (w: Omit<Widget, 'id' | 'order'>) => void;
}

function AddWidgetModal({ onClose, onAdd }: AddWidgetModalProps) {
  const [form, setForm] = useState<Omit<Widget, 'id' | 'order'>>({
    type: 'stat', title: '', dataSource: 'sales', metric: '', size: '1x1', color: 'blue',
  });

  const metrics = METRICS[form.dataSource] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Widget Ekle</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Widget Türü</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(WIDGET_TYPE_LABELS) as WidgetType[]).map((t) => {
                const Icon = WIDGET_ICONS[t];
                return (
                  <button key={t} onClick={() => setForm({ ...form, type: t })}
                    className={cn('flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors',
                      form.type === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                    <Icon className="h-5 w-5" />
                    {WIDGET_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Başlık</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Veri Kaynağı</label>
              <select value={form.dataSource} onChange={(e) => setForm({ ...form, dataSource: e.target.value as DataSource, metric: '' })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {(Object.keys(DATA_SOURCE_LABELS) as DataSource[]).map((s) => (
                  <option key={s} value={s}>{DATA_SOURCE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Metrik</label>
              <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Seçin...</option>
                {metrics.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Boyut</label>
              <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value as WidgetSize })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {SIZE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Renk</label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={cn('h-6 w-6 rounded-full border-2 transition-transform',
                      COLOR_TEXT[c].replace('text-', 'bg-').replace('-700', '-400'),
                      form.color === c ? 'border-foreground scale-125' : 'border-transparent')} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">İptal</button>
          <button onClick={() => { if (form.title) { onAdd(form); onClose(); } }}
            disabled={!form.title}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            Ekle
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardBuilderPage() {
  const queryClient = useQueryClient();
  const [selectedDashboard, setSelectedDashboard] = useState<string>('1');
  const [previewMode, setPreviewMode] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');

  const { data: dashboards = MOCK_DASHBOARDS } = useQuery<Dashboard[]>({
    queryKey: ['dashboards'],
    queryFn: async () => {
      const res = await fetch('/api/v1/analytics/dashboards');
      if (!res.ok) return MOCK_DASHBOARDS;
      return res.json();
    },
    initialData: MOCK_DASHBOARDS,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Dashboard) => {
      const res = await fetch(`/api/v1/analytics/dashboards/${data.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboards'] }),
  });

  const current = dashboards.find((d) => d.id === selectedDashboard) ?? dashboards[0];

  const addWidget = (widgetData: Omit<Widget, 'id' | 'order'>) => {
    if (!current) return;
    const newWidget: Widget = {
      ...widgetData,
      id: `w${Date.now()}`,
      order: current.widgets.length + 1,
    };
    const updated = { ...current, widgets: [...current.widgets, newWidget] };
    saveMutation.mutate(updated);
  };

  const removeWidget = (widgetId: string) => {
    if (!current) return;
    const updated = { ...current, widgets: current.widgets.filter((w) => w.id !== widgetId) };
    saveMutation.mutate(updated);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Oluşturucu</h1>
          <p className="text-muted-foreground">Özel paneller oluşturun, widget ekleyin ve düzenleyin</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={cn('flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium',
              previewMode ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
            <Eye className="h-4 w-4" />
            {previewMode ? 'Düzenleme Modu' : 'Önizleme'}
          </button>
          <button
            onClick={() => current && saveMutation.mutate(current)}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            <Save className="h-4 w-4" /> Kaydet
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        <div className="w-56 shrink-0 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Paneller</p>
          {dashboards.map((d) => (
            <button key={d.id} onClick={() => setSelectedDashboard(d.id)}
              className={cn('w-full text-left rounded-lg border p-3 text-sm transition-colors',
                selectedDashboard === d.id ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:bg-muted')}>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className="truncate">{d.name}</span>
              </div>
              {d.isDefault && <span className="text-xs text-muted-foreground ml-6">Varsayılan</span>}
            </button>
          ))}
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="Yeni panel adı..."
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => {
                if (newDashboardName.trim()) {
                  setNewDashboardName('');
                }
              }}
              className="rounded-lg border border-border p-1.5 hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {current && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{current.name}</h2>
                  {current.description && <p className="text-sm text-muted-foreground">{current.description}</p>}
                </div>
                {!previewMode && (
                  <button onClick={() => setShowAddWidget(true)}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium hover:bg-muted hover:border-primary text-muted-foreground">
                    <Plus className="h-4 w-4" /> Widget Ekle
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 auto-rows-auto">
                {[...current.widgets].sort((a, b) => a.order - b.order).map((widget) => (
                  <div key={widget.id} className="relative group"
                    style={{
                      gridColumn: `span ${SIZE_OPTIONS.find((s) => s.value === widget.size)?.cols ?? 1}`,
                      gridRow: `span ${SIZE_OPTIONS.find((s) => s.value === widget.size)?.rows ?? 1}`,
                    }}>
                    <WidgetPreview widget={widget} />
                    {!previewMode && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => removeWidget(widget.id)}
                          className="h-6 w-6 rounded bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {!previewMode && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {!previewMode && (
                  <div
                    onClick={() => setShowAddWidget(true)}
                    className="rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors min-h-[80px]"
                    style={{ gridColumn: 'span 1' }}
                  >
                    <Plus className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Widget Ekle</p>
                  </div>
                )}
              </div>

              {current.widgets.length === 0 && !previewMode && (
                <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
                  <LayoutDashboard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium mb-1">Panelde henüz widget yok</p>
                  <p className="text-sm text-muted-foreground mb-4">Widget Ekle butonuna tıklayarak başlayın</p>
                  <button onClick={() => setShowAddWidget(true)}
                    className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
                    <Plus className="h-4 w-4 inline mr-1" />İlk Widget'ı Ekle
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAddWidget && (
        <AddWidgetModal onClose={() => setShowAddWidget(false)} onAdd={addWidget} />
      )}
    </div>
  );
}
