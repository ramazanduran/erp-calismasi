'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';
import { Download, Plus, X, ClipboardList, BarChart2, Calendar, Tag } from 'lucide-react';

interface Audit5S {
  id: string;
  auditNo: string;
  department: string;
  auditDate: string;
  auditorName: string;
  scores: {
    sort: number;
    set: number;
    shine: number;
    standardize: number;
    sustain: number;
  };
  totalScore: number;
  maxScore: 25;
  percentage: number;
  status: 'completed' | 'in_progress' | 'scheduled';
  notes?: string;
}

const MOCK_AUDITS: Audit5S[] = [
  {
    id: '1',
    auditNo: '5S-2024-001',
    department: 'Üretim',
    auditDate: '2024-05-10',
    auditorName: 'Ahmet Yılmaz',
    scores: { sort: 4, set: 4, shine: 3, standardize: 4, sustain: 3 },
    totalScore: 18,
    maxScore: 25,
    percentage: 72,
    status: 'completed',
    notes: 'Genel durum iyi, temizlik alanında iyileştirme gerekli.',
  },
  {
    id: '2',
    auditNo: '5S-2024-002',
    department: 'Lojistik',
    auditDate: '2024-05-12',
    auditorName: 'Fatma Kaya',
    scores: { sort: 5, set: 5, shine: 4, standardize: 5, sustain: 4 },
    totalScore: 23,
    maxScore: 25,
    percentage: 92,
    status: 'completed',
    notes: 'Mükemmel performans.',
  },
  {
    id: '3',
    auditNo: '5S-2024-003',
    department: 'Muhasebe',
    auditDate: '2024-05-14',
    auditorName: 'Mehmet Demir',
    scores: { sort: 3, set: 3, shine: 2, standardize: 3, sustain: 2 },
    totalScore: 13,
    maxScore: 25,
    percentage: 52,
    status: 'completed',
    notes: 'Masaüstü düzeni iyileştirilmeli.',
  },
  {
    id: '4',
    auditNo: '5S-2024-004',
    department: 'IT',
    auditDate: '2024-05-16',
    auditorName: 'Ayşe Çelik',
    scores: { sort: 4, set: 3, shine: 4, standardize: 3, sustain: 4 },
    totalScore: 18,
    maxScore: 25,
    percentage: 72,
    status: 'completed',
  },
  {
    id: '5',
    auditNo: '5S-2024-005',
    department: 'Üretim',
    auditDate: '2024-05-20',
    auditorName: 'Ali Şahin',
    scores: { sort: 2, set: 3, shine: 2, standardize: 2, sustain: 3 },
    totalScore: 12,
    maxScore: 25,
    percentage: 48,
    status: 'in_progress',
    notes: 'Acil iyileştirme gerekli.',
  },
  {
    id: '6',
    auditNo: '5S-2024-006',
    department: 'Lojistik',
    auditDate: '2024-06-01',
    auditorName: 'Zeynep Arslan',
    scores: { sort: 4, set: 4, shine: 5, standardize: 4, sustain: 5 },
    totalScore: 22,
    maxScore: 25,
    percentage: 88,
    status: 'scheduled',
  },
];

const DEPARTMENTS = ['Üretim', 'Lojistik', 'Muhasebe', 'IT'];

const STATUS_LABELS: Record<string, string> = {
  completed: 'Tamamlandı',
  in_progress: 'Devam Ediyor',
  scheduled: 'Planlandı',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-gray-100 text-gray-700',
};

function scoreColor(score: number) {
  if (score >= 4) return 'text-green-600 font-semibold';
  if (score === 3) return 'text-yellow-600 font-semibold';
  return 'text-red-600 font-semibold';
}

function ScoreBar({ value, max = 25 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground">{value}/{max}</span>
    </div>
  );
}

interface NewAuditForm {
  department: string;
  auditorName: string;
  auditDate: string;
  sort: number;
  set: number;
  shine: number;
  standardize: number;
  sustain: number;
  notes: string;
}

function NewAuditModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: NewAuditForm) => void }) {
  const [form, setForm] = useState<NewAuditForm>({
    department: DEPARTMENTS[0],
    auditorName: '',
    auditDate: new Date().toISOString().split('T')[0],
    sort: 3,
    set: 3,
    shine: 3,
    standardize: 3,
    sustain: 3,
    notes: '',
  });

  const scoreFields: { key: keyof Pick<NewAuditForm, 'sort' | 'set' | 'shine' | 'standardize' | 'sustain'>; label: string }[] = [
    { key: 'sort', label: 'Seiri (Ayıkla)' },
    { key: 'set', label: 'Seiton (Düzenle)' },
    { key: 'shine', label: 'Seiso (Temizle)' },
    { key: 'standardize', label: 'Seiketsu (Standartlaştır)' },
    { key: 'sustain', label: 'Shitsuke (Sürdür)' },
  ];

  const total = form.sort + form.set + form.shine + form.standardize + form.sustain;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">Yeni 5S Denetimi</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Departman</label>
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Denetçi Adı</label>
            <input
              type="text"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              value={form.auditorName}
              onChange={(e) => setForm({ ...form, auditorName: e.target.value })}
              placeholder="Denetçi adını girin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Denetim Tarihi</label>
            <input
              type="date"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              value={form.auditDate}
              onChange={(e) => setForm({ ...form, auditDate: e.target.value })}
            />
          </div>
          <div className="border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground mb-2">Puan Girişi (1-5)</p>
            {scoreFields.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-4">
                <label className="text-sm text-foreground w-48">{f.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
                    className="w-24"
                  />
                  <span className={cn('text-sm font-bold w-4 text-center', scoreColor(form[f.key] as number))}>
                    {form[f.key]}
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Toplam Puan</span>
              <span className="text-base font-bold text-foreground">{total}/25</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notlar (İsteğe Bağlı)</label>
            <textarea
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Denetim notlarını girin..."
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-border rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => onSubmit(form)}
            className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Denetimi Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FiveSPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [deptFilter, setDeptFilter] = useState('Tümü');
  const [monthFilter, setMonthFilter] = useState('Tümü');

  const { data: audits = MOCK_AUDITS } = useQuery<Audit5S[]>({
    queryKey: ['5s-audits'],
    queryFn: async () => {
      const res = await fetch('/api/v1/kaizen/5s-audits');
      if (!res.ok) return MOCK_AUDITS;
      return res.json();
    },
    initialData: MOCK_AUDITS,
  });

  const createMutation = useMutation({
    mutationFn: async (data: NewAuditForm) => {
      const res = await fetch('/api/v1/kaizen/5s-audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Kayıt hatası');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['5s-audits'] });
      setShowModal(false);
    },
  });

  const filtered = audits.filter((a) => {
    const deptMatch = deptFilter === 'Tümü' || a.department === deptFilter;
    const monthMatch = monthFilter === 'Tümü' || a.auditDate.startsWith(monthFilter);
    return deptMatch && monthMatch;
  });

  const avgScore = audits.length > 0 ? (audits.reduce((s, a) => s + a.totalScore, 0) / audits.length).toFixed(1) : '0';
  const thisMonth = audits.filter((a) => a.auditDate.startsWith('2024-05')).length;
  const redTagCount = audits.filter((a) => a.percentage < 60).length;

  const deptAverages = DEPARTMENTS.map((dept) => {
    const deptAudits = audits.filter((a) => a.department === dept);
    if (!deptAudits.length) return null;
    const avg = (k: keyof Audit5S['scores']) =>
      deptAudits.reduce((s, a) => s + a.scores[k], 0) / deptAudits.length;
    return {
      dept,
      sort: avg('sort'),
      set: avg('set'),
      shine: avg('shine'),
      standardize: avg('standardize'),
      sustain: avg('sustain'),
    };
  }).filter(Boolean) as { dept: string; sort: number; set: number; shine: number; standardize: number; sustain: number }[];

  const months = Array.from(new Set(audits.map((a) => a.auditDate.substring(0, 7)))).sort();

  const handleExport = () => {
    exportToExcel(
      filtered.map((a) => ({
        auditNo: a.auditNo,
        department: a.department,
        auditorName: a.auditorName,
        auditDate: a.auditDate,
        sort: a.scores.sort,
        set: a.scores.set,
        shine: a.scores.shine,
        standardize: a.scores.standardize,
        sustain: a.scores.sustain,
        totalScore: `${a.totalScore}/25`,
        percentage: `%${a.percentage}`,
        status: STATUS_LABELS[a.status],
      })),
      [
        { key: 'auditNo', header: 'Denetim No', width: 14 },
        { key: 'department', header: 'Departman', width: 14 },
        { key: 'auditorName', header: 'Denetçi', width: 18 },
        { key: 'auditDate', header: 'Tarih', width: 12 },
        { key: 'sort', header: 'Seiri', width: 8 },
        { key: 'set', header: 'Seiton', width: 8 },
        { key: 'shine', header: 'Seiso', width: 8 },
        { key: 'standardize', header: 'Seiketsu', width: 10 },
        { key: 'sustain', header: 'Shitsuke', width: 10 },
        { key: 'totalScore', header: 'Toplam', width: 10 },
        { key: 'percentage', header: 'Yüzde', width: 10 },
        { key: 'status', header: 'Durum', width: 14 },
      ],
      '5s-denetimleri',
      '5S Denetimleri'
    );
  };

  const sLabels: { key: keyof typeof deptAverages[0]; label: string }[] = [
    { key: 'sort', label: 'Seiri' },
    { key: 'set', label: 'Seiton' },
    { key: 'shine', label: 'Seiso' },
    { key: 'standardize', label: 'Seiketsu' },
    { key: 'sustain', label: 'Shitsuke' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dijital 5S Denetim</h1>
          <p className="text-sm text-muted-foreground mt-1">Seiri, Seiton, Seiso, Seiketsu, Shitsuke standart denetim ve takibi</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 border border-border rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Dışa Aktar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Denetim
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Toplam Denetim</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{audits.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Ortalama Puan</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgScore}/25</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Bu Ay Denetim</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{thisMonth}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
              <Tag className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Kırmızı Etiket Sayısı</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{redTagCount}</p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <select
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="Tümü">Tüm Departmanlar</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="Tümü">Tüm Aylar</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} denetim listeleniyor</span>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Denetim No</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Departman</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Denetçi</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tarih</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Seiri</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Seiton</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Seiso</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Seiketsu</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Shitsuke</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Toplam</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((audit) => (
                <tr key={audit.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">{audit.auditNo}</td>
                  <td className="px-4 py-3 text-foreground">{audit.department}</td>
                  <td className="px-4 py-3 text-foreground">{audit.auditorName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(audit.auditDate).toLocaleDateString('tr-TR')}</td>
                  <td className={cn('px-4 py-3 text-center', scoreColor(audit.scores.sort))}>{audit.scores.sort}</td>
                  <td className={cn('px-4 py-3 text-center', scoreColor(audit.scores.set))}>{audit.scores.set}</td>
                  <td className={cn('px-4 py-3 text-center', scoreColor(audit.scores.shine))}>{audit.scores.shine}</td>
                  <td className={cn('px-4 py-3 text-center', scoreColor(audit.scores.standardize))}>{audit.scores.standardize}</td>
                  <td className={cn('px-4 py-3 text-center', scoreColor(audit.scores.sustain))}>{audit.scores.sustain}</td>
                  <td className="px-4 py-3">
                    <ScoreBar value={audit.totalScore} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[audit.status])}>
                      {STATUS_LABELS[audit.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4">5S Radar Grafiği</h2>
        <p className="text-xs text-muted-foreground mb-4">Departman bazında 5S kategori ortalamaları</p>
        <div className="space-y-6">
          {deptAverages.map((da) => (
            <div key={da.dept}>
              <p className="text-sm font-semibold text-foreground mb-3">{da.dept}</p>
              <div className="space-y-2">
                {sLabels.map((sl) => {
                  const val = da[sl.key] as number;
                  const pct = (val / 5) * 100;
                  const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={sl.key} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{sl.label}</span>
                      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-8 text-right">{val.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <NewAuditModal
          onClose={() => setShowModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
}
