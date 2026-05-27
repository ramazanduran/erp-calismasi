'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { useWorkflow } from '@/lib/api/hooks/use-workflows';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  running: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Tamamlandı',
  failed: 'Başarısız',
  running: 'Çalışıyor',
  pending: 'Bekliyor',
};

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Manuel',
  schedule: 'Zamanlayıcı',
  event: 'Olay',
  webhook: 'Webhook',
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function formatDuration(startedAt: unknown, completedAt: unknown): string {
  if (!startedAt || !completedAt) return '—';
  const start = new Date(startedAt as string).getTime();
  const end = new Date(completedAt as string).getTime();
  if (isNaN(start) || isNaN(end)) return '—';
  const ms = end - start;
  if (ms < 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: workflowData, isLoading } = useWorkflow(id);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const wf = useMemo(
    () => (workflowData ? (workflowData as Record<string, unknown>) : null),
    [workflowData],
  );

  const instances = useMemo<Record<string, unknown>[]>(
    () => (Array.isArray(wf?.instances) ? (wf!.instances as Record<string, unknown>[]) : []),
    [wf],
  );

  const stats = useMemo(() => {
    const total = instances.length;
    const completed = instances.filter((i) => i.status === 'completed').length;
    const failed = instances.filter((i) => i.status === 'failed').length;
    const rate = total > 0 ? `%${Math.round((completed / total) * 100)}` : '—';
    return { total, completed, failed, rate };
  }, [instances]);

  const steps = useMemo(() => {
    if (!wf) return [];
    const raw = wf.steps;
    return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
  }, [wf]);

  const lastRun = useMemo(() => {
    if (instances.length === 0) return null;
    const sorted = [...instances].sort((a, b) => {
      const aTime = a.startedAt ? new Date(a.startedAt as string).getTime() : 0;
      const bTime = b.startedAt ? new Date(b.startedAt as string).getTime() : 0;
      return bTime - aTime;
    });
    return sorted[0].startedAt as string | null;
  }, [instances]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!wf) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>İş akışı bulunamadı</p>
        <Link href="/workflows" className="text-primary hover:underline text-sm mt-2 inline-block">
          Geri Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/workflows"
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{wf.name as string}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{wf.description as string}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="h-4 w-4 text-blue-500" />
            <p className="text-xs text-muted-foreground">Toplam Çalışma</p>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <p className="text-xs text-muted-foreground">Başarılı</p>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <p className="text-xs text-muted-foreground">Başarısız</p>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-purple-500" />
            <p className="text-xs text-muted-foreground">Başarı Oranı</p>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.rate}</p>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground px-1">
        <span>
          <span className="font-medium text-foreground">Trigger Tipi:</span>{' '}
          {TRIGGER_LABELS[wf.triggerType as string] ?? (wf.triggerType as string) ?? '—'}
        </span>
        <span className="text-border">|</span>
        <span>
          <span className="font-medium text-foreground">Son Çalışma:</span>{' '}
          {lastRun ? new Date(lastRun).toLocaleString('tr-TR') : '—'}
        </span>
        <span className="text-border">|</span>
        <span>
          <span className="font-medium text-foreground">Oluşturulma:</span>{' '}
          {wf.createdAt ? new Date(wf.createdAt as string).toLocaleDateString('tr-TR') : '—'}
        </span>
        <span className="text-border">|</span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            wf.isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {wf.isActive ? 'Aktif' : 'Pasif'}
        </span>
      </div>

      {/* Steps Section */}
      {steps.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Adımlar</h2>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={(step.id as string) ?? i}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                <span className="text-sm font-medium">{step.name as string}</span>
                <span className="text-xs text-muted-foreground ml-auto">{step.type as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Runs Table */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Son Çalışmalar</h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8" />
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Başlangıç</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bitiş</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Süre</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entity Tipi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows />
                ) : instances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Henüz çalışma geçmişi yok
                    </td>
                  </tr>
                ) : (
                  instances.map((inst) => {
                    const instId = inst.id as string;
                    const hasError = !!(inst.error as string);
                    const isExpanded = expandedId === instId;

                    return (
                      <>
                        <tr
                          key={instId}
                          className={`border-b border-border last:border-0 transition-colors ${
                            hasError
                              ? 'cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-900/10'
                              : 'hover:bg-muted/30'
                          }`}
                          onClick={() => {
                            if (hasError) {
                              setExpandedId(isExpanded ? null : instId);
                            }
                          }}
                        >
                          <td className="px-4 py-3 w-8">
                            {hasError ? (
                              isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {STATUS_ICONS[inst.status as string] ?? <Clock className="h-4 w-4" />}
                              <span className="text-xs">
                                {STATUS_LABELS[inst.status as string] ?? (inst.status as string)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {inst.startedAt
                              ? new Date(inst.startedAt as string).toLocaleString('tr-TR')
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {inst.completedAt
                              ? new Date(inst.completedAt as string).toLocaleString('tr-TR')
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                            {formatDuration(inst.startedAt, inst.completedAt)}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                            {(inst.entityType as string) ?? '—'}
                          </td>
                        </tr>
                        {hasError && isExpanded && (
                          <tr key={`${instId}-error`} className="border-b border-border bg-red-50/40 dark:bg-red-900/10">
                            <td colSpan={6} className="px-4 py-3">
                              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                                Hata Detayı
                              </p>
                              <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap break-all font-mono bg-red-100/60 dark:bg-red-900/20 rounded p-2">
                                {inst.error as string}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
