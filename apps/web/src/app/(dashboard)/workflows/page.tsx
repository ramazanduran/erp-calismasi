'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GitBranch, ToggleLeft, ToggleRight, Plus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkflows, useToggleWorkflow } from '@/lib/api/hooks/use-workflows';

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

export default function WorkflowsPage() {
  const [toggling, setToggling] = useState<string | null>(null);

  const { data: workflowsData, isLoading } = useWorkflows();
  const toggleWorkflow = useToggleWorkflow();

  const workflows = Array.isArray(workflowsData) ? workflowsData as Record<string, unknown>[] : [];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">İş Akışları</h1>
          <p className="text-sm text-muted-foreground mt-1">Otomatik iş akışlarını yönetin</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors opacity-50 cursor-not-allowed"
          title="Yakında"
          disabled
        >
          <Plus className="h-4 w-4" />
          Yeni Workflow
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ad</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trigger</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Son Çalışma</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Çalışma Sayısı</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : workflows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Henüz iş akışı tanımlanmamış</p>
                  </td>
                </tr>
              ) : (
                workflows.map((wf) => {
                  const count = (wf._count as Record<string, unknown>)?.instances ?? 0;
                  return (
                    <tr key={wf.id as string} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{wf.name as string}</div>
                        {wf.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">{wf.description as string}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {TRIGGER_LABELS[wf.triggerType as string] ?? wf.triggerType as string}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${wf.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {wf.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {wf.lastRunAt
                          ? new Date(wf.lastRunAt as string).toLocaleString('tr-TR')
                          : 'Hiç çalışmadı'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {count as number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(wf.id as string, wf.name as string)}
                            disabled={toggling === wf.id}
                            title={wf.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                          >
                            {wf.isActive ? (
                              <ToggleRight className="h-5 w-5 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                          <Link
                            href={`/workflows/${wf.id}`}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            {workflows.length} iş akışı
          </div>
        )}
      </div>
    </div>
  );
}
