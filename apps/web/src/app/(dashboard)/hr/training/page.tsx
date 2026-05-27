'use client';

import { useState } from 'react';
import { PlusCircle, BookOpen, Users, CheckCircle2, Clock, FileDown } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  technical:   'Teknik',
  soft_skills: 'Kişisel Gelişim',
  compliance:  'Uyumluluk',
  safety:      'İş Güvenliği',
  leadership:  'Liderlik',
};

const FORMAT_LABELS: Record<string, string> = {
  classroom:  'Sınıf',
  online:     'Online',
  blended:    'Karma',
  on_the_job: 'İş Başında',
};

const STATUS_COLORS: Record<string, string> = {
  enrolled:    'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed:   'bg-green-100 text-green-700',
  failed:      'bg-red-100 text-red-700',
  cancelled:   'bg-gray-100 text-gray-600',
};

interface Program {
  id: string;
  title: string;
  code?: string;
  category?: string;
  format: string;
  durationHours?: number;
  isMandatory: boolean;
  isActive: boolean;
  cost?: number;
  provider?: string;
  _count?: { sessions: number; enrollments: number };
}

interface Stats {
  totalPrograms: number;
  activePrograms: number;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  byCategory: Record<string, number>;
}

function NewProgramModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    title: '', category: 'technical', format: 'classroom',
    durationHours: '', isMandatory: false, provider: '', cost: '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni Eğitim Programı</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, durationHours: form.durationHours ? +form.durationHours : undefined, cost: form.cost ? +form.cost : undefined }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Program Adı *</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Format</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                {Object.entries(FORMAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Süre (saat)</label>
              <input type="number" step="0.5" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Maliyet (₺)</label>
              <input type="number" step="0.01" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Eğitim Sağlayıcı</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="İç eğitim veya harici firma adı" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isMandatory} onChange={(e) => setForm({ ...form, isMandatory: e.target.checked })} />
            Zorunlu Eğitim
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgramDetail({ program, onClose }: { program: Program; onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['training', 'program', program.id],
    queryFn: () => api.get(`/api/v1/training/programs/${program.id}`),
  });

  const updateEnrollment = useMutation({
    mutationFn: ({ id, status, score }: { id: string; status: string; score?: number }) =>
      api.put(`/api/v1/training/enrollments/${id}`, { status, score }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training', 'program', program.id] }),
  });

  const detail = data as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{program.title}</h2>
          <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded-lg">Kapat</button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xl font-bold">{detail?._count?.sessions ?? 0}</p>
              <p className="text-xs text-muted-foreground">Seans</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xl font-bold">{detail?._count?.enrollments ?? 0}</p>
              <p className="text-xs text-muted-foreground">Kayıtlı</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xl font-bold">{detail?.enrollments?.filter((e: any) => e.status === 'completed').length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Tamamlayan</p>
            </div>
          </div>
          {detail?.enrollments?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Katılımcılar</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {detail.enrollments.map((enr: any) => (
                  <div key={enr.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border">
                    <div>
                      <p className="text-sm">{enr.employee.firstName} {enr.employee.lastName}</p>
                      <p className="text-xs text-muted-foreground">{enr.employee.position}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {enr.score && <span className="text-xs text-muted-foreground">Puan: {enr.score}</span>}
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_COLORS[enr.status] ?? 'bg-gray-100')}>
                        {enr.status === 'completed' ? 'Tamamlandı' : enr.status === 'enrolled' ? 'Kayıtlı' : enr.status}
                      </span>
                      {enr.status === 'enrolled' && (
                        <button onClick={() => updateEnrollment.mutate({ id: enr.id, status: 'completed' })}
                          className="text-xs text-green-600 hover:underline">Tamamla</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrainingPage() {
  const qc = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detailProgram, setDetailProgram] = useState<Program | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ['training', 'stats'],
    queryFn: () => api.get('/api/v1/training/stats'),
  });

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['training', 'programs', categoryFilter],
    queryFn: () => api.get('/api/v1/training/programs', categoryFilter ? { category: categoryFilter } : undefined),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/training/programs', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training'] }); setShowForm(false); },
  });

  const stats = statsData as Stats | undefined;
  const programList = programs as Program[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Eğitim Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Personel eğitim programları ve takibi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              programList.map((p) => ({
                code: p.code ?? '',
                title: p.title,
                category: CATEGORY_LABELS[p.category ?? ''] ?? p.category ?? '',
                format: FORMAT_LABELS[p.format] ?? p.format,
                durationHours: p.durationHours ?? '',
                isMandatory: p.isMandatory ? 'Evet' : 'Hayır',
                isActive: p.isActive ? 'Aktif' : 'Pasif',
                provider: p.provider ?? '',
                cost: p.cost ?? '',
                enrollments: p._count?.enrollments ?? 0,
              })),
              [
                { key: 'code', header: 'Kod', width: 10 },
                { key: 'title', header: 'Program Adı', width: 28 },
                { key: 'category', header: 'Kategori', width: 16 },
                { key: 'format', header: 'Format', width: 14 },
                { key: 'durationHours', header: 'Süre (sa)', width: 10 },
                { key: 'isMandatory', header: 'Zorunlu', width: 10 },
                { key: 'isActive', header: 'Durum', width: 10 },
                { key: 'provider', header: 'Sağlayıcı', width: 18 },
                { key: 'cost', header: 'Maliyet', width: 12 },
                { key: 'enrollments', header: 'Kayıt Sayısı', width: 12 },
              ],
              'egitim-programlari',
              'Eğitim Programları'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Yeni Program
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Aktif Programlar', value: stats.activePrograms, icon: BookOpen },
            { label: 'Toplam Kayıt', value: stats.totalEnrollments, icon: Users },
            { label: 'Tamamlayan', value: stats.completedEnrollments, icon: CheckCircle2 },
            { label: 'Tamamlama Oranı', value: `%${stats.completionRate}`, icon: Clock },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold mt-0.5">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ v: '', l: 'Tümü' }, ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ v, l }))].map((f) => (
          <button key={f.v} onClick={() => setCategoryFilter(f.v)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', categoryFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Programs Grid */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : programList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Eğitim programı bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programList.map((prog) => (
            <div key={prog.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailProgram(prog)}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                  {CATEGORY_LABELS[prog.category ?? ''] ?? prog.category}
                </span>
                <div className="flex gap-1.5">
                  {prog.isMandatory && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Zorunlu</span>}
                  {!prog.isActive && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Pasif</span>}
                </div>
              </div>
              <h3 className="font-semibold mb-1">{prog.title}</h3>
              {prog.provider && <p className="text-xs text-muted-foreground mb-3">{prog.provider}</p>}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {prog.durationHours ? `${prog.durationHours} saat` : '-'}
                </span>
                <span>{FORMAT_LABELS[prog.format]}</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {prog._count?.enrollments ?? 0} kayıt
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <NewProgramModal onClose={() => setShowForm(false)} onSave={(d) => create.mutate(d)} />}
      {detailProgram && <ProgramDetail program={detailProgram} onClose={() => setDetailProgram(null)} />}
    </div>
  );
}
