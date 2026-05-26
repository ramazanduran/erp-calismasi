'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, FolderKanban, Clock, CheckCircle2, AlertCircle, Users, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatCurrency, cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  planning: { label: 'Planlama', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: FolderKanban },
  active: { label: 'Aktif', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle2 },
  on_hold: { label: 'Askıda', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: AlertCircle },
  completed: { label: 'Tamamlandı', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: CheckCircle2 },
  cancelled: { label: 'İptal', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: AlertCircle },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
};

interface ProjectCount { tasks: number; milestones: number; timeEntries: number }
interface Project {
  id: string; code: string; name: string; status: string; priority: string;
  progress: number; startDate?: string; endDate?: string;
  budget?: number; currency: string; color?: string;
  customer?: { name: string } | null;
  _count: ProjectCount;
}

interface ProjectStats { total: number; active: number; byStatus: Record<string, number>; totalLoggedHours: number }

function NewProjectModal({ onClose, onSave }: { onClose: () => void; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ name: '', status: 'planning', priority: 'medium', description: '', startDate: '', endDate: '', budget: '', color: '#6366f1' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Yeni Proje</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, budget: form.budget ? Number(form.budget) : undefined }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Proje Adı</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Durum</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
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
              <label className="text-sm font-medium">Başlangıç</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Bitiş</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Bütçe (TRY)</label>
            <input type="number" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" />
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Renk</label>
            <input type="color" className="h-8 w-16 rounded border border-border cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: () => api.get('/api/v1/projects', statusFilter ? { status: statusFilter } : undefined),
  });

  const { data: stats } = useQuery({
    queryKey: ['projects', 'stats'],
    queryFn: () => api.get('/api/v1/projects/stats'),
  });

  const createProject = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/v1/projects', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setShowForm(false); },
  });

  const projectStats = stats as ProjectStats | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proje Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Tüm projelerinizi takip edin</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
          <PlusCircle className="h-4 w-4" />Yeni Proje
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Proje', value: projectStats?.total ?? 0, icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Aktif Proje', value: projectStats?.active ?? 0, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Toplam Saat', value: `${(projectStats?.totalLoggedHours ?? 0).toFixed(1)} sa`, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
          { label: 'Tamamlanan', value: projectStats?.byStatus?.completed ?? 0, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">{card.label}</p><p className="text-xl font-bold mt-0.5">{card.value}</p></div>
              <div className={cn('p-2 rounded-lg', card.bg)}><card.icon className={cn('h-4 w-4', card.color)} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'Tümü' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map((f) => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (projects as Project[]).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FolderKanban className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Proje bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">İlk projenizi oluşturun</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(projects as Project[]).map((project) => {
            const statusConf = STATUS_CONFIG[project.status];
            const StatusIcon = statusConf?.icon ?? FolderKanban;
            const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'completed';
            return (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/30 block">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color ?? '#6366f1' }} />
                    <span className="text-xs font-mono text-muted-foreground">{project.code}</span>
                  </div>
                  <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', statusConf?.bg, statusConf?.color)}>
                    <StatusIcon className="h-3 w-3" />
                    {statusConf?.label}
                  </span>
                </div>
                <h3 className="font-semibold mb-1 line-clamp-2">{project.name}</h3>
                {project.customer && <p className="text-xs text-muted-foreground mb-3">{project.customer.name}</p>}

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>İlerleme</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${project.progress}%`, backgroundColor: project.color ?? '#6366f1' }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{project._count.tasks} görev</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{project._count.timeEntries} kayıt</span>
                  </div>
                  {project.endDate && (
                    <span className={cn('flex items-center gap-1', isOverdue ? 'text-destructive font-medium' : '')}>
                      <Calendar className="h-3 w-3" />
                      {new Date(project.endDate).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                </div>

                {project.budget && (
                  <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                    Bütçe: <span className="font-medium text-foreground">{formatCurrency(project.budget)}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {showForm && <NewProjectModal onClose={() => setShowForm(false)} onSave={(d) => createProject.mutate(d)} />}
    </div>
  );
}
