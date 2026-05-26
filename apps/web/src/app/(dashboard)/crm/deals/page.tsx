'use client';

import { useState } from 'react';
import { PlusCircle, Trophy, Target, TrendingUp, Users } from 'lucide-react';
import { useDealPipeline, useDealStats, useCreateDeal, useUpdateDeal, useDeleteDeal } from '@/lib/api/hooks';
import { formatCurrency, cn } from '@/lib/utils';

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  qualification: { label: 'Nitelendirme', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' },
  proposal: { label: 'Teklif', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800' },
  negotiation: { label: 'Müzakere', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800' },
  won: { label: 'Kazanıldı', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800' },
  lost: { label: 'Kaybedildi', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800' },
};

interface PipelineDeal {
  id: string;
  title: string;
  value: number | string;
  probability: number;
  stage: string;
  customer?: { name: string } | null;
  expectedClose?: string | null;
}

interface PipelineColumn {
  stage: string;
  deals: PipelineDeal[];
  totalValue: number;
  count: number;
}

interface DealStats {
  totalDeals?: number;
  totalValue?: number;
  wonDeals?: number;
  wonValue?: number;
  winRate?: number;
  avgDealSize?: number;
  openDeals?: number;
}

function DealFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    stage: 'qualification',
    value: '',
    probability: 20,
    currency: 'TRY',
    expectedClose: '',
    description: '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni Fırsat</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, value: Number(form.value) }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Fırsat Adı</label>
            <input
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Aşama</label>
              <select
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                {Object.entries(STAGE_CONFIG).map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Değer (TRY)</label>
              <input
                type="number"
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                min={0}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Olasılık (%)</label>
              <input
                type="number"
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tahmini Kapanış</label>
              <input
                type="date"
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.expectedClose}
                onChange={(e) => setForm({ ...form, expectedClose: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <textarea
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DealCard({ deal, onStageChange }: { deal: PipelineDeal; onStageChange: (id: string, stage: string) => void }) {
  const stages = ['qualification', 'proposal', 'negotiation', 'won', 'lost'];
  const currentIdx = stages.indexOf(deal.stage);

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm font-medium line-clamp-2">{deal.title}</p>
      {deal.customer && <p className="text-xs text-muted-foreground mt-1">{deal.customer.name}</p>}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold text-primary">{formatCurrency(Number(deal.value))}</span>
        <span className="text-xs text-muted-foreground">%{deal.probability}</span>
      </div>
      {deal.expectedClose && (
        <p className="text-xs text-muted-foreground mt-1">
          Kapanış: {new Date(deal.expectedClose).toLocaleDateString('tr-TR')}
        </p>
      )}
      <div className="flex gap-1 mt-2">
        {currentIdx > 0 && (
          <button
            onClick={() => onStageChange(deal.id, stages[currentIdx - 1])}
            className="text-xs px-2 py-0.5 border border-border rounded hover:bg-muted"
          >
            ←
          </button>
        )}
        {currentIdx < stages.length - 1 && (
          <button
            onClick={() => onStageChange(deal.id, stages[currentIdx + 1])}
            className="text-xs px-2 py-0.5 border border-border rounded hover:bg-muted ml-auto"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const { data: pipeline = [], isLoading } = useDealPipeline();
  const { data: stats } = useDealStats();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const handleSave = async (data: Record<string, unknown>) => {
    await createDeal.mutateAsync(data);
    setShowForm(false);
  };

  const handleStageChange = (id: string, stage: string) => {
    updateDeal.mutate({ id, data: { stage } });
  };

  const dealStats = stats as DealStats | undefined;
  const pipelineColumns = pipeline as PipelineColumn[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Satış Pipeline</h1>
          <p className="text-muted-foreground mt-1">Satış fırsatlarını yönetin ve takip edin</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={cn('px-3 py-1.5 text-sm', view === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('px-3 py-1.5 text-sm', view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
            >
              Liste
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
          >
            <PlusCircle className="h-4 w-4" />
            Yeni Fırsat
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Açık Fırsatlar', value: dealStats?.openDeals ?? 0, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Toplam Değer', value: formatCurrency(dealStats?.totalValue ?? 0), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Kazanma Oranı', value: `%${(dealStats?.winRate ?? 0).toFixed(1)}`, icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
          { label: 'Ort. Fırsat', value: formatCurrency(dealStats?.avgDealSize ?? 0), icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold mt-0.5">{card.value}</p>
              </div>
              <div className={cn('p-2 rounded-lg', card.bg)}>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Kanban */}
      {view === 'kanban' && (
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
          ) : (
            <div className="flex gap-4 min-w-max pb-4">
              {pipelineColumns.map((col) => {
                const config = STAGE_CONFIG[col.stage];
                return (
                  <div key={col.stage} className={cn('w-72 rounded-xl border p-3', config?.bg ?? 'bg-muted/30')}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={cn('font-semibold text-sm', config?.color)}>{config?.label ?? col.stage}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{col.count} fırsat</span>
                        <span className="text-xs font-medium">{formatCurrency(col.totalValue)}</span>
                      </div>
                    </div>
                    <div className="space-y-2 min-h-[100px]">
                      {col.deals.map((deal) => (
                        <DealCard key={deal.id} deal={deal} onStageChange={handleStageChange} />
                      ))}
                      {col.deals.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">Fırsat yok</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Fırsat', 'Müşteri', 'Değer', 'Aşama', 'Olasılık', 'Kapanış'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pipelineColumns.flatMap((col) => col.deals).map((deal) => (
                <tr key={deal.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{deal.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{deal.customer?.name ?? '-'}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(Number(deal.value))}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STAGE_CONFIG[deal.stage]?.color ?? '')}>
                      {STAGE_CONFIG[deal.stage]?.label ?? deal.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3">%{deal.probability}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {deal.expectedClose ? new Date(deal.expectedClose).toLocaleDateString('tr-TR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <DealFormModal onClose={() => setShowForm(false)} onSave={handleSave} />}
    </div>
  );
}
