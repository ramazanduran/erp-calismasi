'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, Users, Briefcase, TrendingUp, UserCheck, ChevronRight, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  applied:    { label: 'Başvurdu',    color: 'text-gray-600',   bg: 'bg-gray-100' },
  screening:  { label: 'Ön Eleme',    color: 'text-blue-600',   bg: 'bg-blue-100' },
  interview:  { label: 'Mülakat',     color: 'text-purple-600', bg: 'bg-purple-100' },
  technical:  { label: 'Teknik',      color: 'text-yellow-600', bg: 'bg-yellow-100' },
  offer:      { label: 'Teklif',      color: 'text-orange-600', bg: 'bg-orange-100' },
  hired:      { label: 'İşe Alındı',  color: 'text-green-600',  bg: 'bg-green-100' },
  rejected:   { label: 'Reddedildi',  color: 'text-red-600',    bg: 'bg-red-100' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:  { label: 'Taslak',   color: 'text-gray-500' },
  open:   { label: 'Açık',     color: 'text-green-600' },
  paused: { label: 'Durduruldu', color: 'text-yellow-600' },
  closed: { label: 'Kapandı',  color: 'text-gray-600' },
  filled: { label: 'Dolduruldu', color: 'text-blue-600' },
};

interface JobPosting {
  id: string;
  title: string;
  code?: string;
  workType: string;
  experienceLevel: string;
  status: string;
  headcount: number;
  location?: string;
  publishedAt?: string;
  closingDate?: string;
  department?: { name: string } | null;
  _count?: { applications: number };
}

interface Stats {
  totalPostings: number;
  openPostings: number;
  totalCandidates: number;
  totalApplications: number;
  hired: number;
  conversionRate: number;
  byStage: Record<string, number>;
}

interface Pipeline {
  applied: any[];
  screening: any[];
  interview: any[];
  technical: any[];
  offer: any[];
  hired: any[];
  rejected: any[];
}

const MOCK_POSTINGS: JobPosting[] = [
  { id: 'job1', title: 'Kıdemli Yazılım Geliştirici', code: 'SW-2026-01', workType: 'full_time', experienceLevel: 'senior', status: 'open', headcount: 2, location: 'İstanbul', publishedAt: '2026-04-15', closingDate: '2026-06-15', department: { name: 'Yazılım Geliştirme' }, _count: { applications: 18 } },
  { id: 'job2', title: 'Satış Müdürü', code: 'SL-2026-02', workType: 'full_time', experienceLevel: 'lead', status: 'open', headcount: 1, location: 'Ankara', publishedAt: '2026-05-01', closingDate: '2026-06-30', department: { name: 'Satış' }, _count: { applications: 9 } },
  { id: 'job3', title: 'Muhasebe Uzmanı', code: 'AC-2026-01', workType: 'full_time', experienceLevel: 'mid', status: 'open', headcount: 1, location: 'İstanbul', publishedAt: '2026-05-10', department: { name: 'Muhasebe' }, _count: { applications: 24 } },
  { id: 'job4', title: 'Lojistik Koordinatörü', code: 'LG-2026-01', workType: 'full_time', experienceLevel: 'mid', status: 'filled', headcount: 1, location: 'Kocaeli', publishedAt: '2026-03-01', closingDate: '2026-04-30', department: { name: 'Lojistik' }, _count: { applications: 32 } },
  { id: 'job5', title: 'Yazılım Stajyeri', code: 'SW-2026-02', workType: 'intern', experienceLevel: 'entry', status: 'open', headcount: 3, location: 'İstanbul', publishedAt: '2026-05-20', closingDate: '2026-07-31', department: { name: 'Yazılım Geliştirme' }, _count: { applications: 47 } },
  { id: 'job6', title: 'Üretim Planlama Uzmanı', code: 'MF-2026-01', workType: 'full_time', experienceLevel: 'mid', status: 'paused', headcount: 1, location: 'Bursa', publishedAt: '2026-04-01', department: { name: 'Üretim' }, _count: { applications: 11 } },
];

const MOCK_STATS: Stats = {
  totalPostings: MOCK_POSTINGS.length,
  openPostings: MOCK_POSTINGS.filter((p) => p.status === 'open').length,
  totalCandidates: 98,
  totalApplications: MOCK_POSTINGS.reduce((s, p) => s + (p._count?.applications ?? 0), 0),
  hired: 5,
  conversionRate: 5.1,
  byStage: { applied: 42, screening: 28, interview: 15, technical: 8, offer: 5, hired: 5 },
};

function NewPostingModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    title: '', workType: 'full_time', experienceLevel: 'mid',
    headcount: '1', location: '', description: '', status: 'open',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni İş İlanı</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, headcount: +form.headcount }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Pozisyon Adı *</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Çalışma Tipi</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })}>
                <option value="full_time">Tam Zamanlı</option>
                <option value="part_time">Yarı Zamanlı</option>
                <option value="contract">Sözleşmeli</option>
                <option value="intern">Stajyer</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Deneyim Seviyesi</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
                <option value="entry">Giriş Seviye</option>
                <option value="mid">Orta Seviye</option>
                <option value="senior">Kıdemli</option>
                <option value="lead">Lider</option>
                <option value="executive">Yönetici</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Kadro Sayısı</label>
              <input type="number" min="1" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.headcount} onChange={(e) => setForm({ ...form, headcount: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Lokasyon</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

function PipelineView({ postingId, onClose }: { postingId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['recruitment', 'pipeline', postingId],
    queryFn: () => api.get(`/api/v1/recruitment/postings/${postingId}/pipeline`),
  });

  const moveStage = useMutation({
    mutationFn: ({ appId, stage }: { appId: string; stage: string }) =>
      api.put(`/api/v1/recruitment/applications/${appId}`, { stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline', postingId] }),
  });

  if (isLoading) return null;
  const pipeline = data as Pipeline;
  const activeStages = ['applied', 'screening', 'interview', 'technical', 'offer', 'hired'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Başvuru Hattı</h2>
          <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded-lg">Kapat</button>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {activeStages.map((stage) => {
            const sc = STAGE_CONFIG[stage];
            const apps = pipeline[stage as keyof Pipeline] ?? [];
            return (
              <div key={stage} className="space-y-2">
                <div className={cn('rounded px-2 py-1 text-xs font-medium', sc.bg, sc.color)}>
                  {sc.label} ({apps.length})
                </div>
                {apps.map((app: any) => (
                  <div key={app.id} className="rounded-lg border border-border bg-background p-2">
                    <p className="text-xs font-medium">{app.candidate.firstName} {app.candidate.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.candidate.email}</p>
                    <div className="flex gap-1 mt-1.5">
                      {activeStages.indexOf(stage) < activeStages.length - 1 && (
                        <button onClick={() => moveStage.mutate({ appId: app.id, stage: activeStages[activeStages.indexOf(stage) + 1] })}
                          className="text-xs text-primary hover:underline flex items-center gap-0.5">
                          <ChevronRight className="h-3 w-3" />İlerlet
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function RecruitmentPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [pipelineId, setPipelineId] = useState<string | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ['recruitment', 'stats'],
    queryFn: () => api.get('/api/v1/recruitment/stats'),
  });

  const { data: rawPostings, isLoading: postingsLoading } = useQuery({
    queryKey: ['recruitment', 'postings', statusFilter],
    queryFn: () => api.get('/api/v1/recruitment/postings', statusFilter ? { status: statusFilter } : undefined),
  });
  const isLoading = postingsLoading && rawPostings === undefined;

  const [localPostings, setLocalPostings] = useState<JobPosting[]>(MOCK_POSTINGS);
  const postingsData: JobPosting[] = rawPostings !== undefined
    ? (Array.isArray(rawPostings) ? rawPostings as JobPosting[] : [])
    : localPostings;

  const create = useMutation({
    mutationFn: (data: any) => {
      if (!rawPostings) {
        const np: JobPosting = { id: `job${Date.now()}`, title: data.title, workType: data.workType, experienceLevel: data.experienceLevel, status: data.status, headcount: data.headcount, location: data.location, _count: { applications: 0 } };
        setLocalPostings((prev) => [np, ...prev]);
        setShowForm(false);
        return Promise.resolve();
      }
      return api.post('/api/v1/recruitment/postings', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment'] }); setShowForm(false); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/api/v1/recruitment/postings/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });

  const stats: Stats = (statsData as Stats | undefined) ?? MOCK_STATS;
  const allPostings = postingsData as JobPosting[];
  const postings = useMemo(() => {
    if (!search) return allPostings;
    const q = search.toLowerCase();
    return allPostings.filter((p) =>
      p.title?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    );
  }, [allPostings, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İşe Alım</h1>
          <p className="text-muted-foreground mt-1">İş ilanları ve aday takibi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              postings.map((p) => ({
                code: p.code ?? '',
                title: p.title,
                department: p.department?.name ?? '',
                workType: p.workType,
                experienceLevel: p.experienceLevel,
                status: STATUS_CONFIG[p.status]?.label ?? p.status,
                headcount: p.headcount,
                applications: p._count?.applications ?? 0,
                location: p.location ?? '',
                publishedAt: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('tr-TR') : '',
                closingDate: p.closingDate ? new Date(p.closingDate).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'code', header: 'Kod', width: 10 },
                { key: 'title', header: 'Pozisyon', width: 26 },
                { key: 'department', header: 'Departman', width: 18 },
                { key: 'workType', header: 'Çalışma Şekli', width: 16 },
                { key: 'experienceLevel', header: 'Deneyim', width: 14 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'headcount', header: 'Kadro', width: 8 },
                { key: 'applications', header: 'Başvuru', width: 10 },
                { key: 'location', header: 'Lokasyon', width: 16 },
                { key: 'publishedAt', header: 'Yayın Tarihi', width: 14 },
                { key: 'closingDate', header: 'Kapanış Tarihi', width: 14 },
              ],
              'ise-alim',
              'İşe Alım İlanları'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Yeni İlan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Açık İlanlar', value: stats.openPostings, icon: Briefcase },
            { label: 'Toplam Aday', value: stats.totalCandidates, icon: Users },
            { label: 'Toplam Başvuru', value: stats.totalApplications, icon: TrendingUp },
            { label: 'İşe Alınan', value: stats.hired, icon: UserCheck },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold mt-0.5">{card.value}</p>
            </div>
          ))}
        </div>

      {/* Stage Summary */}
      {stats.byStage && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium mb-3">Başvuru Aşamaları</p>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(STAGE_CONFIG).map(([stage, sc]) => {
              const count = stats.byStage[stage] ?? 0;
              if (!count) return null;
              return (
                <div key={stage} className={cn('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full', sc.bg, sc.color)}>
                  <span className="font-medium">{sc.label}</span>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="İlan başlığı, departman veya konum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
          />
        </div>
        {[{ v: '', l: 'Tümü' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
          <button key={f.v} onClick={() => setStatusFilter(f.v)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', statusFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Postings Grid */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : postings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">İş ilanı bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {postings.map((posting) => {
            const sc = STATUS_CONFIG[posting.status];
            return (
              <div key={posting.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <span className={cn('text-xs font-medium', sc?.color)}>{sc?.label}</span>
                  <span className="text-xs text-muted-foreground">{posting._count?.applications ?? 0} başvuru</span>
                </div>
                <h3 className="font-semibold mb-1">{posting.title}</h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  {[
                    posting.workType === 'full_time' ? 'Tam Zamanlı' : posting.workType,
                    posting.experienceLevel,
                    posting.location,
                  ].filter(Boolean).map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{tag}</span>
                  ))}
                </div>
                {posting.department && <p className="text-xs text-muted-foreground mb-3">{posting.department.name}</p>}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button onClick={() => setPipelineId(posting.id)} className="flex-1 text-xs py-1.5 rounded border border-border hover:bg-muted">
                    Pipeline Görüntüle
                  </button>
                  {posting.status === 'draft' && (
                    <button onClick={() => updateStatus.mutate({ id: posting.id, status: 'open' })}
                      className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded">
                      Yayınla
                    </button>
                  )}
                  {posting.status === 'open' && (
                    <button onClick={() => updateStatus.mutate({ id: posting.id, status: 'paused' })}
                      className="text-xs px-3 py-1.5 border border-border rounded hover:bg-muted">
                      Durdur
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <NewPostingModal onClose={() => setShowForm(false)} onSave={(d) => create.mutate(d)} />}
      {pipelineId && <PipelineView postingId={pipelineId} onClose={() => setPipelineId(null)} />}
    </div>
  );
}
