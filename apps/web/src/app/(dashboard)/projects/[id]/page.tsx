'use client';

import { useState } from 'react';
import { use } from 'react';
import { ArrowLeft, PlusCircle, Clock, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const TASK_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  todo: { label: 'Yapılacak', color: 'text-gray-500', icon: Circle },
  in_progress: { label: 'Devam Ediyor', color: 'text-blue-500', icon: Clock },
  review: { label: 'İncelemede', color: 'text-yellow-500', icon: AlertCircle },
  done: { label: 'Tamamlandı', color: 'text-green-500', icon: CheckCircle2 },
  blocked: { label: 'Engellendi', color: 'text-red-500', icon: AlertCircle },
};

const PRIORITY_COLORS: Record<string, string> = { low: 'bg-gray-100', medium: 'bg-yellow-100', high: 'bg-orange-100', critical: 'bg-red-100' };

interface ProjectTask { id: string; title: string; status: string; priority: string; estimatedHours?: number; loggedHours: number; dueDate?: string; subtasks?: ProjectTask[] }

function AddTaskModal({ onClose, onSave }: { onClose: () => void; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ title: '', status: 'todo', priority: 'medium', estimatedHours: '', dueDate: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni Görev</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Görev Adı</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Durum</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(TASK_STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Öncelik</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tahmin (saat)</label>
              <input type="number" step="0.5" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Bitiş Tarihi</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Ekle</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange }: { task: ProjectTask; onStatusChange: (id: string, status: string) => void }) {
  const statuses = Object.keys(TASK_STATUS_CONFIG);
  const currIdx = statuses.indexOf(task.status);
  const config = TASK_STATUS_CONFIG[task.status];
  const Icon = config?.icon ?? Circle;

  return (
    <div className={cn('rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow', PRIORITY_COLORS[task.priority])}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config?.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2">{task.title}</p>
          {(task.estimatedHours ?? 0) > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{Number(task.loggedHours).toFixed(1)}/{task.estimatedHours} sa</span>
            </div>
          )}
          {task.dueDate && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(task.dueDate).toLocaleDateString('tr-TR')}
            </p>
          )}
          {(task.subtasks?.length ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{task.subtasks!.length} alt görev</p>
          )}
        </div>
      </div>
      <div className="flex gap-1 mt-2">
        {currIdx > 0 && (
          <button onClick={() => onStatusChange(task.id, statuses[currIdx - 1])} className="text-xs px-2 py-0.5 border border-border rounded bg-card hover:bg-muted">←</button>
        )}
        {currIdx < statuses.length - 1 && (
          <button onClick={() => onStatusChange(task.id, statuses[currIdx + 1])} className="text-xs px-2 py-0.5 border border-border rounded bg-card hover:bg-muted ml-auto">→</button>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'tasks' | 'milestones' | 'time'>('board');

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', 'detail', id],
    queryFn: () => api.get(`/api/v1/projects/${id}`),
    enabled: !!id,
  });

  const { data: board = [] } = useQuery({
    queryKey: ['projects', 'board', id],
    queryFn: () => api.get(`/api/v1/projects/${id}/board`),
    enabled: !!id && activeTab === 'board',
  });

  const createTask = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(`/api/v1/projects/${id}/tasks`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setShowTaskForm(false); },
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Record<string, unknown> }) =>
      api.put(`/api/v1/projects/${id}/tasks/${taskId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', 'board', id] }),
  });

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Yükleniyor...</div>;
  if (!project) return <div className="py-12 text-center text-muted-foreground">Proje bulunamadı</div>;

  const p = project as { id: string; name: string; code: string; status: string; progress: number; description?: string; budget?: number; currency: string; milestones: Array<{ id: string; name: string; dueDate: string; status: string }>; tasks: Array<ProjectTask & { subtasks: ProjectTask[] }> };
  const boardColumns = board as Array<{ status: string; tasks: ProjectTask[] }>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/projects" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-4 w-4" />Projeler
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">{p.code}</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">{p.status}</span>
            </div>
            <h1 className="text-2xl font-bold">{p.name}</h1>
            {p.description && <p className="text-muted-foreground mt-1">{p.description}</p>}
          </div>
          <button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Görev Ekle
          </button>
        </div>
        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Genel İlerleme</span><span>{p.progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['board', 'tasks', 'milestones', 'time'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab === 'board' ? 'Tahta' : tab === 'tasks' ? 'Görevler' : tab === 'milestones' ? 'Kilometre Taşları' : 'Zaman'}
          </button>
        ))}
      </div>

      {/* Board Tab */}
      {activeTab === 'board' && (
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {boardColumns.map((col) => {
              const config = TASK_STATUS_CONFIG[col.status];
              const Icon = config?.icon ?? Circle;
              return (
                <div key={col.status} className="w-72 rounded-xl bg-muted/30 border border-border p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn('h-4 w-4', config?.color)} />
                    <h3 className="font-semibold text-sm">{config?.label ?? col.status}</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{col.tasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {col.tasks.map((task) => (
                      <TaskCard key={task.id} task={task} onStatusChange={(taskId, status) => updateTask.mutate({ taskId, data: { status } })} />
                    ))}
                    {col.tasks.length === 0 && <div className="text-xs text-center py-6 text-muted-foreground">Görev yok</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <div className="space-y-3">
          {(p.milestones ?? []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Kilometre taşı yok</div>
          ) : (
            p.milestones.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(m.dueDate).toLocaleDateString('tr-TR')}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                  m.status === 'completed' ? 'bg-green-100 text-green-700' : m.status === 'missed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>
                  {m.status === 'completed' ? 'Tamamlandı' : m.status === 'missed' ? 'Kaçırıldı' : 'Beklemede'}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr>{['Görev', 'Durum', 'Öncelik', 'Tahmin', 'Gerçek', 'Bitiş'].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {(p.tasks ?? []).flatMap((t) => [t, ...(t.subtasks ?? [])]).map((task) => {
                const config = TASK_STATUS_CONFIG[task.status];
                const Icon = config?.icon ?? Circle;
                return (
                  <tr key={task.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Icon className={cn('h-4 w-4', config?.color)} />{task.title}</div></td>
                    <td className="px-4 py-3"><span className={cn('text-xs font-medium', config?.color)}>{config?.label}</span></td>
                    <td className="px-4 py-3 capitalize">{task.priority}</td>
                    <td className="px-4 py-3 text-muted-foreground">{task.estimatedHours ? `${task.estimatedHours} sa` : '-'}</td>
                    <td className="px-4 py-3">{Number(task.loggedHours).toFixed(1)} sa</td>
                    <td className="px-4 py-3 text-muted-foreground">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showTaskForm && <AddTaskModal onClose={() => setShowTaskForm(false)} onSave={(d) => createTask.mutate(d)} />}
    </div>
  );
}
