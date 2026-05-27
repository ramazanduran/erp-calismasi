'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GitBranch, ToggleLeft, ToggleRight, Plus, ChevronDown, ChevronRight,
  Search, Play, Clock, Zap, Webhook, Calendar, CheckCircle2, XCircle,
  AlertCircle, Activity, BarChart2, FileDown,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useWorkflows, useToggleWorkflow } from '@/lib/api/hooks/use-workflows';

type TriggerType = 'manual' | 'schedule' | 'event' | 'webhook';

interface WorkflowInstance {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  triggerType: TriggerType;
  isActive: boolean;
  lastRunAt?: string;
  lastError?: string;
  _count?: { instances: number };
  instances?: WorkflowInstance[];
}

const TRIGGER_CONFIG: Record<TriggerType, { label: string; icon: React.ElementType; color: string }> = {
  manual: { label: 'Manuel', icon: Play, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  schedule: { label: 'Zamanlayıcı', icon: Clock, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  event: { label: 'Olay', icon: Zap, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  webhook: { label: 'Webhook', icon: Webhook, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
};

function TriggerBadge({ type }: { type: TriggerType }) {
  const cfg = TRIGGER_CONFIG[type] ?? TRIGGER_CONFIG.manual;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
      active
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-green-500' : 'bg-gray-400')} />
      {active ? 'Aktif' : 'Pasif'}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function ExpandedDetail({ wf }: { wf: Workflow }) {
  const recentInstances = wf.instances?.slice(0, 5) ?? [];
  return (
    <tr>
      <td colSpan={7} className="bg-muted/20 border-b border-border px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Açıklama</h4>
            <p className="text-sm text-foreground">{wf.description || 'Açıklama yok'}</p>

            {wf.lastError && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">Son Hata</span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-300 font-mono">{wf.lastError}</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Son Çalışmalar</h4>
            {recentInstances.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz çalışma yok</p>
            ) : (
              <div className="space-y-1.5">
                {recentInstances.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {inst.status === 'completed' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : inst.status === 'failed' ? (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
                      )}
                      <span className="text-muted-foreground">
                        {new Date(inst.startedAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <span className={cn(
                      'capitalize font-medium',
                      inst.status === 'completed' ? 'text-green-600' : inst.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                    )}>
                      {inst.status === 'completed' ? 'Tamamlandı' : inst.status === 'failed' ? 'Başarısız' : 'Çalışıyor'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function WorkflowsPage() {
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [triggerFilter, setTriggerFilter] = useState<string>('all');

  const { data: workflowsData, isLoading } = useWorkflows();
  const toggleWorkflow = useToggleWorkflow();

  const workflows = useMemo(
    () => (Array.isArray(workflowsData) ? (workflowsData as Workflow[]) : []),
    [workflowsData],
  );

  const filtered = useMemo(() => {
    return workflows.filter((wf) => {
      if (statusFilter === 'active' && !wf.isActive) return false;
      if (statusFilter === 'inactive' && wf.isActive) return false;
      if (triggerFilter !== 'all' && wf.triggerType !== triggerFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!wf.name.toLowerCase().includes(q) && !(wf.description ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [workflows, statusFilter, triggerFilter, search]);

  const stats = useMemo(() => ({
    total: workflows.length,
    active: workflows.filter((w) => w.isActive).length,
    totalRuns: workflows.reduce((s, w) => s + (w._count?.instances ?? 0), 0),
    byTrigger: Object.fromEntries(
      Object.keys(TRIGGER_CONFIG).map((t) => [t, workflows.filter((w) => w.triggerType === t).length])
    ),
  }), [workflows]);

  const handleToggle = async (id: string, name: string) => {
    setToggling(id);
    try {
      await toggleWorkflow.mutateAsync(id);
      toast.success(`"${name}" güncellendi`);
    } catch {
      toast.error('İşlem başarısız oldu');
    } finally {
      setToggling(null);
    }
  };

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">İş Akışları</h1>
          <p className="text-sm text-muted-foreground mt-1">Otomatik iş akışlarını yönetin ve izleyin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filtered.map((w) => ({
                name: w.name,
                description: w.description ?? '',
                triggerType: TRIGGER_CONFIG[w.triggerType]?.label ?? w.triggerType,
                isActive: w.isActive ? 'Aktif' : 'Pasif',
                instanceCount: w._count?.instances ?? 0,
                lastRunAt: w.lastRunAt ? new Date(w.lastRunAt).toLocaleDateString('tr-TR') : '',
                lastError: w.lastError ?? '',
              })),
              [
                { key: 'name', header: 'İş Akışı Adı', width: 26 },
                { key: 'description', header: 'Açıklama', width: 30 },
                { key: 'triggerType', header: 'Tetikleyici', width: 14 },
                { key: 'isActive', header: 'Durum', width: 10 },
                { key: 'instanceCount', header: 'Çalıştırma', width: 12 },
                { key: 'lastRunAt', header: 'Son Çalışma', width: 14 },
                { key: 'lastError', header: 'Son Hata', width: 30 },
              ],
              'is-akislari',
              'İş Akışları'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            disabled
            title="Yakında kullanılabilir"
            className="flex items-center gap-2 rounded-lg bg-primary/50 px-4 py-2 text-sm font-medium text-primary-foreground cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Yeni Workflow
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <GitBranch className="h-4 w-4" />
            <span className="text-xs font-medium">Toplam Akış</span>
          </div>
          <p className="text-2xl font-bold">{isLoading ? '—' : stats.total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stats.active} aktif</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Aktif Akış</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{isLoading ? '—' : stats.active}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stats.total - stats.active} pasif</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <BarChart2 className="h-4 w-4" />
            <span className="text-xs font-medium">Toplam Çalışma</span>
          </div>
          <p className="text-2xl font-bold">{isLoading ? '—' : stats.totalRuns.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">tüm akışlar</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium">Tetikleyici Dağılımı</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(TRIGGER_CONFIG).map(([type, cfg]) => {
              const count = stats.byTrigger[type] ?? 0;
              if (count === 0) return null;
              return (
                <span key={type} className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', cfg.color)}>
                  {cfg.label}: {count}
                </span>
              );
            })}
            {stats.total === 0 && <span className="text-muted-foreground text-xs">—</span>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İş akışı ara (ad, açıklama)..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'active', label: 'Aktif' },
            { key: 'inactive', label: 'Pasif' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as typeof statusFilter)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                statusFilter === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={triggerFilter}
          onChange={(e) => setTriggerFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">Tüm Tetikleyiciler</option>
          {Object.entries(TRIGGER_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ad</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tetikleyici</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Son Çalışma</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam Çalışma</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">
                      {workflows.length === 0 ? 'Henüz iş akışı tanımlanmamış' : 'Eşleşen iş akışı bulunamadı'}
                    </p>
                    {search && (
                      <button onClick={() => setSearch('')} className="mt-2 text-xs text-primary hover:underline">
                        Aramayı temizle
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((wf) => {
                  const runCount = wf._count?.instances ?? 0;
                  const isExpanded = expandedId === wf.id;
                  return (
                    <>
                      <tr
                        key={wf.id}
                        className={cn(
                          'border-b border-border transition-colors',
                          isExpanded ? 'bg-muted/30' : 'hover:bg-muted/20',
                        )}
                      >
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => toggleExpand(wf.id)}
                            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                          >
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4" />
                              : <ChevronRight className="h-4 w-4" />
                            }
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-foreground">{wf.name}</div>
                          {wf.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">
                              {wf.description}
                            </div>
                          )}
                          {wf.lastError && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                              <span className="text-xs text-red-500 truncate max-w-xs">{wf.lastError}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <TriggerBadge type={wf.triggerType} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusDot active={wf.isActive} />
                        </td>
                        <td className="px-4 py-3.5">
                          {wf.lastRunAt ? (
                            <div>
                              <div className="text-sm text-foreground">
                                {new Date(wf.lastRunAt).toLocaleDateString('tr-TR')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(wf.lastRunAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">Hiç çalışmadı</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-medium">{runCount.toLocaleString('tr-TR')}</span>
                          <span className="text-muted-foreground text-xs ml-1">kez</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle(wf.id, wf.name)}
                              disabled={toggling === wf.id}
                              title={wf.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                            >
                              {wf.isActive
                                ? <ToggleRight className="h-5 w-5 text-green-500" />
                                : <ToggleLeft className="h-5 w-5" />
                              }
                            </button>
                            <Link
                              href={`/workflows/${wf.id}`}
                              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="Detaylar"
                            >
                              <Calendar className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && <ExpandedDetail wf={wf} />}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} / {workflows.length} iş akışı gösteriliyor</span>
          {(search || statusFilter !== 'all' || triggerFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setTriggerFilter('all'); }}
              className="text-primary hover:underline"
            >
              Filtreleri temizle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
