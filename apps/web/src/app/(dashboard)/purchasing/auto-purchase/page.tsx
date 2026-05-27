'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Play, Edit2, Trash2, CheckCircle2, AlertCircle, Package, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReorderRule {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  reorderQty: number;
  maxStock: number;
  unit: string;
  preferredSupplier: string;
  leadTimeDays: number;
  active: boolean;
}

interface MRPSuggestion {
  id: string;
  productCode: string;
  productName: string;
  currentStock: number;
  requiredQty: number;
  suggestedOrderQty: number;
  supplier: string;
  estimatedCost: number;
  dueDate: string;
  reason: 'reorder_point' | 'mrp_demand' | 'safety_stock';
  status: 'pending' | 'approved' | 'po_created';
}

const MOCK_RULES: ReorderRule[] = [
  { id: '1', productCode: 'MAL-001', productName: 'Çelik Profil 40x40', category: 'Hammadde', currentStock: 450, minStock: 100, reorderPoint: 300, reorderQty: 500, maxStock: 2000, unit: 'adet', preferredSupplier: 'Alır Çelik Ltd.', leadTimeDays: 7, active: true },
  { id: '2', productCode: 'MAL-002', productName: 'Alüminyum Levha 2mm', category: 'Hammadde', currentStock: 280, minStock: 50, reorderPoint: 150, reorderQty: 200, maxStock: 800, unit: 'adet', preferredSupplier: 'Bedir Plastik A.Ş.', leadTimeDays: 5, active: true },
  { id: '3', productCode: 'AMB-001', productName: 'Karton Kutu 30x20x15', category: 'Ambalaj', currentStock: 1200, minStock: 500, reorderPoint: 800, reorderQty: 1000, maxStock: 5000, unit: 'adet', preferredSupplier: 'Çelik Makine San.', leadTimeDays: 3, active: true },
  { id: '4', productCode: 'YEK-001', productName: 'Rulman 6205-2RS', category: 'Yedek Parça', currentStock: 45, minStock: 20, reorderPoint: 30, reorderQty: 50, maxStock: 200, unit: 'adet', preferredSupplier: 'Demir Elektrik', leadTimeDays: 14, active: true },
  { id: '5', productCode: 'KIM-001', productName: 'Endüstriyel Yağ 5L', category: 'Kimyasal', currentStock: 180, minStock: 30, reorderPoint: 60, reorderQty: 100, maxStock: 400, unit: 'lt', preferredSupplier: 'Erdem Lojistik', leadTimeDays: 2, active: false },
  { id: '6', productCode: 'MAL-003', productName: 'Paslanmaz Boru DN50', category: 'Hammadde', currentStock: 85, minStock: 40, reorderPoint: 80, reorderQty: 120, maxStock: 500, unit: 'm', preferredSupplier: 'Alır Çelik Ltd.', leadTimeDays: 10, active: true },
];

const MOCK_SUGGESTIONS: MRPSuggestion[] = [
  { id: 's1', productCode: 'MAL-003', productName: 'Paslanmaz Boru DN50', currentStock: 85, requiredQty: 120, suggestedOrderQty: 120, supplier: 'Alır Çelik Ltd.', estimatedCost: 48000, dueDate: '2026-06-06', reason: 'reorder_point', status: 'pending' },
  { id: 's2', productCode: 'YEK-001', productName: 'Rulman 6205-2RS', currentStock: 45, requiredQty: 50, suggestedOrderQty: 50, supplier: 'Demir Elektrik', estimatedCost: 12500, dueDate: '2026-06-10', reason: 'safety_stock', status: 'pending' },
  { id: 's3', productCode: 'AMB-001', productName: 'Karton Kutu 30x20x15', currentStock: 1200, requiredQty: 800, suggestedOrderQty: 1000, supplier: 'Çelik Makine San.', estimatedCost: 5000, dueDate: '2026-06-03', reason: 'mrp_demand', status: 'approved' },
  { id: 's4', productCode: 'MAL-002', productName: 'Alüminyum Levha 2mm', currentStock: 280, requiredQty: 150, suggestedOrderQty: 200, supplier: 'Bedir Plastik A.Ş.', estimatedCost: 64000, dueDate: '2026-06-01', reason: 'mrp_demand', status: 'po_created' },
];

const REASON_LABELS: Record<MRPSuggestion['reason'], string> = {
  reorder_point: 'Yeniden Sipariş Noktası',
  mrp_demand: 'MRP Talebi',
  safety_stock: 'Emniyet Stoğu',
};

const STATUS_COLORS: Record<MRPSuggestion['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  po_created: 'bg-green-100 text-green-800',
};

function fmt(n: number): string {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n);
}

export default function AutoPurchasePage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'suggestions'>('rules');
  const [runningMRP, setRunningMRP] = useState(false);
  const queryClient = useQueryClient();

  const { data: rules = MOCK_RULES } = useQuery<ReorderRule[]>({
    queryKey: ['reorder-rules'],
    queryFn: async () => {
      const res = await fetch('/api/v1/purchasing/reorder-rules');
      if (!res.ok) return MOCK_RULES;
      return res.json();
    },
    initialData: MOCK_RULES,
  });

  const { data: suggestions = MOCK_SUGGESTIONS } = useQuery<MRPSuggestion[]>({
    queryKey: ['mrp-suggestions'],
    queryFn: async () => {
      const res = await fetch('/api/v1/purchasing/mrp-suggestions');
      if (!res.ok) return MOCK_SUGGESTIONS;
      return res.json();
    },
    initialData: MOCK_SUGGESTIONS,
  });

  const handleRunMRP = () => {
    setRunningMRP(true);
    setTimeout(() => {
      setRunningMRP(false);
      queryClient.invalidateQueries({ queryKey: ['mrp-suggestions'] });
    }, 2000);
  };

  const belowReorder = rules.filter((r) => r.active && r.currentStock <= r.reorderPoint);
  const pendingCount = suggestions.filter((s) => s.status === 'pending').length;
  const totalValue = suggestions.filter((s) => s.status !== 'po_created').reduce((s, sg) => s + sg.estimatedCost, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Otomatik Satın Alma</h1>
          <p className="text-muted-foreground">Yeniden sipariş noktaları, MRP hesaplama ve otomatik PO önerileri</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunMRP}
            disabled={runningMRP}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={cn('h-4 w-4', runningMRP && 'animate-spin')} />
            {runningMRP ? 'MRP Çalışıyor...' : 'MRP Çalıştır'}
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            <PlusCircle className="h-4 w-4" /> Yeni Kural
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Aktif Kural</p>
          <p className="mt-1 text-2xl font-bold">{rules.filter((r) => r.active).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Kritik Stok Altı</p>
          <p className={cn('mt-1 text-2xl font-bold', belowReorder.length > 0 ? 'text-red-600' : 'text-green-600')}>
            {belowReorder.length} ürün
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Bekleyen Öneri</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Tahmini Toplam Değer</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">₺{fmt(totalValue)}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        {([
          { id: 'rules', label: 'Yeniden Sipariş Kuralları' },
          { id: 'suggestions', label: `MRP Önerileri (${pendingCount})` },
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

      {activeTab === 'rules' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Ürün</th>
                  <th className="px-4 py-2 text-right font-medium">Mevcut Stok</th>
                  <th className="px-4 py-2 text-right font-medium">Min. Stok</th>
                  <th className="px-4 py-2 text-right font-medium">Sipariş Noktası</th>
                  <th className="px-4 py-2 text-right font-medium">Sipariş Miktarı</th>
                  <th className="px-4 py-2 text-left font-medium">Tedarikçi</th>
                  <th className="px-4 py-2 text-center font-medium">Teslim Süresi</th>
                  <th className="px-4 py-2 text-center font-medium">Stok Durumu</th>
                  <th className="px-4 py-2 text-center font-medium">Aktif</th>
                  <th className="px-4 py-2 text-center font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => {
                  const pct = Math.round((rule.currentStock / rule.reorderPoint) * 100);
                  const isBelow = rule.currentStock <= rule.reorderPoint;
                  return (
                    <tr key={rule.id} className={cn('border-b border-border/50 hover:bg-muted/30', isBelow && rule.active && 'bg-red-50/30')}>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {isBelow && rule.active && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                          <div>
                            <p className="font-medium">{rule.productName}</p>
                            <p className="text-xs text-muted-foreground">{rule.productCode} · {rule.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className={cn('px-4 py-2 text-right tabular-nums font-semibold', isBelow ? 'text-red-600' : 'text-green-700')}>
                        {rule.currentStock} {rule.unit}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{rule.minStock}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{rule.reorderPoint}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{rule.reorderQty}</td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">{rule.preferredSupplier}</td>
                      <td className="px-4 py-2 text-center text-sm">{rule.leadTimeDays} gün</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className={cn('inline-block h-5 w-9 rounded-full transition-colors', rule.active ? 'bg-primary' : 'bg-muted')} />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          <button className="p-1 rounded hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          <button className="p-1 rounded hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-3">
          {suggestions.map((sg) => (
            <div key={sg.id} className={cn('rounded-xl border border-border bg-card p-4 shadow-sm', sg.status === 'pending' && 'border-yellow-200')}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{sg.productName}</p>
                    <p className="text-xs text-muted-foreground">{sg.productCode} · Tedarikçi: {sg.supplier}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">Mevcut: <b>{sg.currentStock}</b></span>
                      <span className="text-xs text-muted-foreground">İhtiyaç: <b>{sg.requiredQty}</b></span>
                      <span className="text-xs font-semibold text-primary">Öneri: {sg.suggestedOrderQty} adet</span>
                      <span className="text-xs text-muted-foreground">Tahmini: <b>₺{fmt(sg.estimatedCost)}</b></span>
                      <span className="text-xs text-muted-foreground">Son: {sg.dueDate}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{REASON_LABELS[sg.reason]}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_COLORS[sg.status])}>
                    {sg.status === 'pending' ? 'Bekliyor' : sg.status === 'approved' ? 'Onaylandı' : 'PO Oluşturuldu'}
                  </span>
                  {sg.status === 'pending' && (
                    <>
                      <button className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Onayla
                      </button>
                      <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                        PO Oluştur
                      </button>
                    </>
                  )}
                  {sg.status === 'approved' && (
                    <button className="flex items-center gap-1 rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-green-700">
                      <Play className="h-3.5 w-3.5" /> PO Oluştur
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
