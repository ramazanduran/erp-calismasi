'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
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
          {Array.from({ length: 5 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: workflowData, isLoading } = useWorkflow(id);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!workflowData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>İş akışı bulunamadı</p>
        <Link href="/workflows" className="text-primary hover:underline text-sm mt-2 inline-block">
          Geri Dön
        </Link>
      </div>
    );
  }

  const wf = workflowData as Record<string, unknown>;
  const instances = Array.isArray(wf.instances) ? wf.instances as Record<string, unknown>[] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workflows" className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{wf.name as string}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{wf.description as string}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Durum</p>
          <p className="text-sm font-semibold mt-1">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${wf.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
              {wf.isActive ? 'Aktif' : 'Pasif'}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Trigger Tipi</p>
          <p className="text-sm font-semibold mt-1">{TRIGGER_LABELS[wf.triggerType as string] ?? wf.triggerType as string}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Toplam Çalışma</p>
          <p className="text-sm font-semibold mt-1">{((wf._count as Record<string, unknown>)?.instances ?? 0) as number}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Oluşturulma</p>
          <p className="text-sm font-semibold mt-1">
            {new Date(wf.createdAt as string).toLocaleDateString('tr-TR')}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Son Çalışmalar</h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Başlangıç</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bitiş</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entity Tipi</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hata</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows />
                ) : instances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Henüz çalışma geçmişi yok
                    </td>
                  </tr>
                ) : (
                  instances.map((inst) => (
                    <tr key={inst.id as string} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {STATUS_ICONS[inst.status as string] ?? <Clock className="h-4 w-4" />}
                          <span className="text-xs">{STATUS_LABELS[inst.status as string] ?? inst.status as string}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {inst.startedAt
                          ? new Date(inst.startedAt as string).toLocaleString('tr-TR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {inst.completedAt
                          ? new Date(inst.completedAt as string).toLocaleString('tr-TR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {(inst.entityType as string) ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-red-500 max-w-[200px] truncate">
                        {(inst.error as string) ?? '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
