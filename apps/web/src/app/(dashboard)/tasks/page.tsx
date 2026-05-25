'use client';
import { useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { useTasks, useCompleteTask } from '@/lib/api/hooks';
import { TaskModal } from '@/components/modals/task-modal';
import { toast } from 'sonner';

const COLUMNS = [
  { status: 'todo', label: 'Yapılacak', color: 'bg-gray-100 text-gray-700' },
  { status: 'in_progress', label: 'Devam Ediyor', color: 'bg-blue-100 text-blue-700' },
  { status: 'done', label: 'Tamamlandı', color: 'bg-green-100 text-green-700' },
  { status: 'cancelled', label: 'İptal', color: 'bg-red-100 text-red-700' },
];

const PRIORITY_BADGES: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};

export default function TasksPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const { data: tasks, isLoading } = useTasks({
    priority: priorityFilter || undefined,
    assignedToId: assigneeFilter || undefined,
  });

  const completeTask = useCompleteTask();

  const handleComplete = async (id: string) => {
    try {
      await completeTask.mutateAsync(id);
      toast.success('Görev tamamlandı');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const grouped = COLUMNS.reduce<Record<string, any[]>>((acc, col) => {
    acc[col.status] = (tasks as any[] | undefined)?.filter((t) => t.status === col.status) ?? [];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Görev Yönetimi</h1>
          <p className="text-muted-foreground text-sm mt-1">Görevleri takip edin</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Yeni Görev
        </button>
      </div>

      <div className="flex gap-3">
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Tüm Öncelikler</option>
          {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <input
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          placeholder="Atanan kişi ID..."
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-48"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="h-5 bg-muted rounded w-24 animate-pulse" />
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground font-medium">{grouped[col.status].length}</span>
              </div>
              <div className="space-y-2">
                {grouped[col.status].length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Görev yok</p>
                ) : grouped[col.status].map((task) => (
                  <div key={task.id} className="rounded-lg border border-border bg-background p-3 space-y-2 hover:shadow-sm transition-shadow">
                    <p className="text-sm font-medium leading-tight">{task.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGES[task.priority] || 'bg-gray-100 text-gray-700'}`}>
                        {PRIORITY_LABELS[task.priority] || task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                    {task.assignedToId && (
                      <p className="text-xs text-muted-foreground truncate">Atanan: {task.assignedToId.slice(0, 8)}...</p>
                    )}
                    {col.status !== 'done' && col.status !== 'cancelled' && (
                      <button
                        onClick={() => handleComplete(task.id)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Tamamla
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
