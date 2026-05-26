'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  LayoutGrid,
  List,
  Search,
  X,
  AlertCircle,
  Clock,
  CheckSquare,
  ClipboardList,
  Calendar,
  User,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTasks, useCompleteTask } from '@/lib/api/hooks';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'todo' | 'in_progress' | 'done' | 'cancelled';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  dueDate?: string;
  assignedToId?: string;
  createdAt?: string;
  completedAt?: string;
}

const COLUMNS: { status: Status; label: string; color: string; dotColor: string }[] = [
  { status: 'todo', label: 'Yapılacak', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dotColor: 'bg-slate-400' },
  { status: 'in_progress', label: 'Devam Ediyor', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dotColor: 'bg-blue-500' },
  { status: 'done', label: 'Tamamlandı', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', dotColor: 'bg-green-500' },
  { status: 'cancelled', label: 'İptal', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dotColor: 'bg-red-400' },
];

const PRIORITY_BADGE: Record<Priority, string> = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};

const STATUS_LABEL: Record<Status, string> = {
  todo: 'Yapılacak',
  in_progress: 'Devam Ediyor',
  done: 'Tamamlandı',
  cancelled: 'İptal',
};

function getInitials(id?: string): string {
  if (!id) return '?';
  return id.slice(0, 2).toUpperCase();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isOverdue(dueDate?: string, status?: Status): boolean {
  if (!dueDate || status === 'done' || status === 'cancelled') return false;
  return new Date(dueDate) < new Date();
}

interface NewTaskModalProps {
  onClose: () => void;
}

function NewTaskModal({ onClose }: NewTaskModalProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    dueDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTask = useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/tasks', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Görev oluşturuldu');
      onClose();
    },
    onError: () => {
      toast.error('Görev oluşturulamadı');
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Başlık zorunludur';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createTask.mutate({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Yeni Görev Oluştur</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Görev başlığı..."
              className={`w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-input'}`}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Açıklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Görev açıklaması (opsiyonel)..."
              rows={3}
              className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Öncelik</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="urgent">Acil</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Vade Tarihi</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {createTask.isPending ? (
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  completing: boolean;
}

function TaskCard({ task, onComplete, completing }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className="group rounded-xl border border-border bg-background p-3.5 space-y-2.5 hover:shadow-md hover:border-primary/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground line-clamp-2 flex-1">{task.title}</p>
        <span className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[task.priority] || 'bg-gray-100 text-gray-700'}`}>
          {PRIORITY_LABEL[task.priority] || task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500' : 'text-muted-foreground'}`}>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
              {overdue && <AlertCircle className="h-3 w-3" />}
            </div>
          )}
        </div>
        {task.assignedToId && (
          <div
            title={task.assignedToId}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold"
          >
            {getInitials(task.assignedToId)}
          </div>
        )}
      </div>

      {task.status !== 'done' && task.status !== 'cancelled' && (
        <button
          onClick={() => onComplete(task.id)}
          disabled={completing}
          className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50 transition-colors"
        >
          {completing ? (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-emerald-600/30 border-t-emerald-600 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Tamamla
        </button>
      )}
    </div>
  );
}

export default function TasksPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<'kanban' | 'liste'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);

  const { data: rawTasks, isLoading } = useTasks({
    priority: priorityFilter || undefined,
    status: statusFilter || undefined,
  });

  const completeTask = useCompleteTask();

  const tasks: Task[] = useMemo(() => {
    const list = Array.isArray(rawTasks) ? (rawTasks as Task[]) : [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  }, [rawTasks, search]);

  const stats = useMemo(() => {
    const all = Array.isArray(rawTasks) ? (rawTasks as Task[]) : [];
    const today = new Date().toDateString();
    return {
      total: all.length,
      inProgress: all.filter((t) => t.status === 'in_progress').length,
      completedToday: all.filter((t) => t.status === 'done' && t.completedAt && new Date(t.completedAt).toDateString() === today).length,
      urgent: all.filter((t) => t.priority === 'urgent' || t.priority === 'high').length,
    };
  }, [rawTasks]);

  const grouped = useMemo(() => {
    return COLUMNS.reduce<Record<Status, Task[]>>((acc, col) => {
      acc[col.status] = tasks.filter((t) => t.status === col.status);
      return acc;
    }, {} as Record<Status, Task[]>);
  }, [tasks]);

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      await completeTask.mutateAsync(id);
      toast.success('Görev tamamlandı');
    } catch {
      toast.error('İşlem başarısız');
    } finally {
      setCompletingId(null);
    }
  };

  const statCards = [
    {
      label: 'Toplam Görev',
      value: stats.total,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Devam Eden',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'Bugün Tamamlandı',
      value: stats.completedToday,
      icon: CheckSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Acil / Yüksek',
      value: stats.urgent,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Görev Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">Tüm görevleri takip edin ve yönetin</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Yeni Görev
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                {isLoading ? (
                  <div className="h-6 w-10 bg-muted rounded animate-pulse mt-0.5" />
                ) : (
                  <p className="text-2xl font-bold text-foreground leading-tight">{card.value}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Görev ara..."
              className="pl-8 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-48 transition-colors"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            <option value="">Tüm Öncelikler</option>
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
            <option value="urgent">Acil</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            <option value="">Tüm Durumlar</option>
            <option value="todo">Yapılacak</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="done">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>

          {(search || priorityFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setPriorityFilter(''); setStatusFilter(''); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Temizle
            </button>
          )}
        </div>

        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5">
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban
          </button>
          <button
            onClick={() => setView('liste')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === 'liste' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <List className="h-3.5 w-3.5" />
            Liste
          </button>
        </div>
      </div>

      {isLoading ? (
        view === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => (
              <div key={col.status} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="h-5 bg-muted rounded w-24 animate-pulse" />
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3">
                  <div className="h-4 bg-muted rounded animate-pulse flex-1" />
                  <div className="h-4 bg-muted rounded animate-pulse w-16" />
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                  <div className="h-4 bg-muted rounded animate-pulse w-24" />
                  <div className="h-4 bg-muted rounded animate-pulse w-16" />
                </div>
              ))}
            </div>
          </div>
        )
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="rounded-xl border border-border bg-card/50 p-4 flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                  <span className="text-sm font-semibold text-foreground">{col.label}</span>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${col.color}`}>
                  {grouped[col.status].length}
                </span>
              </div>
              <div className="space-y-2.5 flex-1">
                {grouped[col.status].length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-xs text-muted-foreground">Görev yok</p>
                  </div>
                ) : (
                  grouped[col.status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleComplete}
                      completing={completingId === task.id}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Görev</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Öncelik</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vade</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Atanan</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Görev bulunamadı</p>
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                    const col = COLUMNS.find((c) => c.status === task.status);
                    const overdue = isOverdue(task.dueDate, task.status);
                    return (
                      <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority] || 'bg-gray-100 text-gray-700'}`}>
                            {PRIORITY_LABEL[task.priority] || task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${col?.color || 'bg-gray-100 text-gray-700'}`}>
                            {STATUS_LABEL[task.status] || task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {task.dueDate ? (
                            <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                              {overdue && <AlertCircle className="h-3 w-3" />}
                              {formatDate(task.dueDate)}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {task.assignedToId ? (
                            <div className="flex items-center gap-2">
                              <div
                                title={task.assignedToId}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold"
                              >
                                {getInitials(task.assignedToId)}
                              </div>
                              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                {task.assignedToId.slice(0, 8)}...
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3.5 w-3.5" />
                              Atanmamış
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            {task.status !== 'done' && task.status !== 'cancelled' && (
                              <button
                                onClick={() => handleComplete(task.id)}
                                disabled={completingId === task.id}
                                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                              >
                                {completingId === task.id ? (
                                  <span className="h-3 w-3 rounded-full border-2 border-emerald-600/30 border-t-emerald-600 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Tamamla
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            {tasks.length} görev gösteriliyor
            {(search || priorityFilter || statusFilter) && rawTasks && Array.isArray(rawTasks) && tasks.length !== rawTasks.length && (
              <span className="ml-1">({(rawTasks as Task[]).length} toplam)</span>
            )}
          </div>
        </div>
      )}

      {modalOpen && <NewTaskModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
