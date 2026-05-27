'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle, FolderKanban, Clock, CheckCircle2, AlertCircle, Users, Calendar, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { formatCurrency, cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  planning:  { label: 'Planlama',    color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-900/30',   icon: FolderKanban },
  active:    { label: 'Aktif',       color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle2 },
  on_hold:   { label: 'Askıda',      color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: AlertCircle },
  completed: { label: 'Tamamlandı', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: CheckCircle2 },
  cancelled: { label: 'İptal',       color: 'text-red-600',    bg: 'bg-red-100 dark:bg-red-900/30',     icon: AlertCircle },
};

interface Project {
  id: string; code: string; name: string; status: string; priority: string;
  progress: number; startDate?: string; endDate?: string;
  budget?: number; currency: string; color?: string;
  customer?: { name: string } | null;
  _count: { tasks: number; milestones: number; timeEntries: number };
}

const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1', code: 'PRJ-2026-001', name: 'ERP Sistem Entegrasyonu — Faz 2',
    status: 'active', priority: 'critical', progress: 65,
    startDate: '2026-01-15', endDate: '2026-07-31',
    budget: 1200000, currency: 'TRY', color: '#6366f1',
    customer: { name: 'Anadolu Holding' },
    _count: { tasks: 42, milestones: 5, timeEntries: 128 },
  },
  {
    id: 'p2', code: 'PRJ-2026-002', name: 'Üretim Hattı Otomasyonu',
    status: 'active', priority: 'high', progress: 40,
    startDate: '2026-02-01', endDate: '2026-09-30',
    budget: 3500000, currency: 'TRY', color: '#f59e0b',
    customer: null,
    _count: { tasks: 28, milestones: 4, timeEntries: 87 },
  },
  {
    id: 'p3', code: 'PRJ-2026-003', name: 'Mobil Uygulama Geliştirme',
    status: 'active', priority: 'medium', progress: 25,
    startDate: '2026-03-01', endDate: '2026-10-31',
    budget: 650000, currency: 'TRY', color: '#10b981',
    customer: { name: 'Güney Sanayi A.Ş.' },
    _count: { tasks: 35, milestones: 3, timeEntries: 44 },
  },
  {
    id: 'p4', code: 'PRJ-2025-022', name: 'ISO 9001:2015 Belgelendirme',
    status: 'completed', priority: 'high', progress: 100,
    startDate: '2025-09-01', endDate: '2026-03-31',
    budget: 180000, currency: 'TRY', color: '#8b5cf6',
    customer: null,
    _count: { tasks: 18, milestones: 6, timeEntries: 210 },
  },
  {
    id: 'p5', code: 'PRJ-2026-004', name: 'Depo Yönetim Sistemi Kurulumu',
    status: 'planning', priority: 'medium', progress: 5,
    startDate: '2026-06-01', endDate: '2026-12-31',
    budget: 420000, currency: 'TRY', color: '#06b6d4',
    customer: null,
    _count: { tasks: 8, milestones: 2, timeEntries: 0 },
  },
  {
    id: 'p6', code: 'PRJ-2026-005', name: 'E-Ticaret Platformu Entegrasyonu',
    status: 'on_hold', priority: 'low', progress: 15,
    startDate: '2026-01-10', endDate: '2026-08-10',
    budget: 290000, currency: 'TRY', color: '#f43f5e',
    customer: { name: 'Batı Endüstri A.Ş.' },
    _count: { tasks: 22, milestones: 3, timeEntries: 31 },
  },
];

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
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let totalLoggedHours = 0;
    for (const p of projects) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
      totalLoggedHours += p._count.timeEntries;
    }
    return {
      total: projects.length,
      active: byStatus['active'] ?? 0,
      totalLoggedHours,
      byStatus,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (q && !p.code.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q) && !p.customer?.name?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projects, search, statusFilter]);

  function handleCreate(d: Record<string, unknown>) {
    const newProject: Project = {
      id: `p${Date.now()}`,
      code: `PRJ-2026-${String(projects.length + 1).padStart(3, '0')}`,
      name: d.name as string,
      status: d.status as string,
      priority: d.priority as string,
      progress: 0,
      startDate: (d.startDate as string) || undefined,
      endDate: (d.endDate as string) || undefined,
      budget: d.budget as number | undefined,
      currency: 'TRY',
      color: d.color as string ?? '#6366f1',
      customer: null,
      _count: { tasks: 0, milestones: 0, timeEntries: 0 },
    };
    setProjects((prev) => [newProject, ...prev]);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proje Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Tüm projelerinizi takip edin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filteredProjects.map((p) => ({
                code: p.code,
                name: p.name,
                status: STATUS_CONFIG[p.status]?.label ?? p.status,
                priority: p.priority,
                progress: `${p.progress}%`,
                customer: p.customer?.name ?? '',
                budget: p.budget ?? '',
                startDate: p.startDate ? new Date(p.startDate).toLocaleDateString('tr-TR') : '',
                endDate: p.endDate ? new Date(p.endDate).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'code', header: 'Kod', width: 10 },
                { key: 'name', header: 'Proje Adı', width: 30 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'priority', header: 'Öncelik', width: 12 },
                { key: 'progress', header: 'İlerleme', width: 10 },
                { key: 'customer', header: 'Müşteri', width: 22 },
                { key: 'budget', header: 'Bütçe', width: 14 },
                { key: 'startDate', header: 'Başlangıç', width: 12 },
                { key: 'endDate', header: 'Bitiş', width: 12 },
              ],
              'projeler',
              'Projeler'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Yeni Proje
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Proje', value: stats.total, icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Aktif Proje', value: stats.active, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Toplam Kayıt', value: `${stats.totalLoggedHours} ka.`, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
          { label: 'Tamamlanan', value: stats.byStatus['completed'] ?? 0, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">{card.label}</p><p className="text-xl font-bold mt-0.5">{card.value}</p></div>
              <div className={cn('p-2 rounded-lg', card.bg)}><card.icon className={cn('h-4 w-4', card.color)} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Proje kodu, adı veya müşteri..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-56"
          />
        </div>
        {[{ value: '', label: 'Tümü' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map((f) => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
            {f.label}
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FolderKanban className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Proje bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">İlk projenizi oluşturun</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const statusConf = STATUS_CONFIG[project.status];
            const StatusIcon = statusConf?.icon ?? FolderKanban;
            const today = new Date('2026-05-27');
            const isOverdue = project.endDate && new Date(project.endDate) < today && project.status !== 'completed';
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

      {showForm && <NewProjectModal onClose={() => setShowForm(false)} onSave={handleCreate} />}
    </div>
  );
}
