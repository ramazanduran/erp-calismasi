'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  X,
  TrendingUp,
  Users,
  Star,
  BarChart2,
  AlertCircle,
  Loader2,
  ChevronDown,
  FileDown,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  department: { name: string };
}

interface PerformanceReview {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department?: { name: string };
  };
  reviewPeriod: string;
  rating: number;
  goals?: string;
  strengths?: string;
  improvements?: string;
  notes?: string;
  reviewedBy?: { firstName: string; lastName: string };
  createdAt: string;
}

interface NewReviewForm {
  employeeId: string;
  reviewPeriod: string;
  rating: number;
  goals: string;
  strengths: string;
  improvements: string;
  notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REVIEW_PERIOD_PRESETS = [
  '2025 Q1',
  '2025 Q2',
  '2025 Q3',
  '2025 Q4',
  '2025 Yıl Sonu',
  '2024 Q4',
  '2024 Yıl Sonu',
];

function StarRatingDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} transition-colors ${
            i < rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

function StarRatingSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  const LABELS: Record<number, string> = {
    1: 'Yetersiz',
    2: 'Gelişmeli',
    3: 'Yeterli',
    4: 'İyi',
    5: 'Mükemmel',
  };

  return (
    <div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starVal = i + 1;
          const filled = starVal <= (hovered || value);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(starVal)}
              onMouseEnter={() => setHovered(starVal)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
              title={LABELS[starVal]}
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  filled
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-muted-foreground/30 hover:text-yellow-300'
                }`}
              />
            </button>
          );
        })}
        {(hovered || value) > 0 && (
          <span className="ml-2 text-sm font-medium text-foreground">
            {LABELS[hovered || value]}
          </span>
        )}
      </div>
      {value === 0 && (
        <p className="mt-1 text-xs text-muted-foreground">Bir puan seçin (1–5)</p>
      )}
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const colorClass =
    rating >= 4
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : rating >= 3
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : rating >= 2
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const LABELS: Record<number, string> = {
    1: 'Yetersiz',
    2: 'Gelişmeli',
    3: 'Yeterli',
    4: 'İyi',
    5: 'Mükemmel',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {LABELS[rating] ?? `${rating}/5`}
    </span>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string | React.ReactNode;
  sub?: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-start gap-3">
      <div className={`mt-0.5 rounded-lg p-2 ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <div className="mt-0.5">{typeof value === 'string' ? (
          <p className="text-xl font-bold text-foreground">{value}</p>
        ) : (
          value
        )}</div>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── New Review Modal ─────────────────────────────────────────────────────────

function NewReviewModal({
  open,
  onClose,
  defaultYear,
}: {
  open: boolean;
  onClose: () => void;
  defaultYear: number;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewReviewForm>({
    employeeId: '',
    reviewPeriod: `${defaultYear} Q1`,
    rating: 0,
    goals: '',
    strengths: '',
    improvements: '',
    notes: '',
  });
  const [customPeriod, setCustomPeriod] = useState(false);

  const { data: employeesData } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: () => api.get<{ data: Employee[] }>('hr/employees?limit=200'),
    enabled: open,
  });
  const employees: Employee[] =
    (employeesData as any)?.data ?? (Array.isArray(employeesData) ? employeesData : []);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('api/v1/hr/performance', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance'] });
      toast.success('Performans değerlendirmesi oluşturuldu');
      onClose();
      setForm({
        employeeId: '',
        reviewPeriod: `${defaultYear} Q1`,
        rating: 0,
        goals: '',
        strengths: '',
        improvements: '',
        notes: '',
      });
      setCustomPeriod(false);
    },
    onError: () => toast.error('Değerlendirme oluşturulamadı'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId) {
      toast.error('Lütfen personel seçin');
      return;
    }
    if (!form.reviewPeriod.trim()) {
      toast.error('Lütfen değerlendirme dönemini girin');
      return;
    }
    if (form.rating === 0) {
      toast.error('Lütfen bir puan seçin');
      return;
    }
    createMutation.mutate({
      employeeId: form.employeeId,
      reviewPeriod: form.reviewPeriod.trim(),
      rating: form.rating,
      ...(form.goals && { goals: form.goals }),
      ...(form.strengths && { strengths: form.strengths }),
      ...(form.improvements && { improvements: form.improvements }),
      ...(form.notes && { notes: form.notes }),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-background border border-border shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Yeni Performans Değerlendirmesi</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Employee */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Personel <span className="text-red-500">*</span>
            </label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="">Personel seçin...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeNumber} — {emp.firstName} {emp.lastName}
                  {emp.department?.name ? ` (${emp.department.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Review Period */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Değerlendirme Dönemi <span className="text-red-500">*</span>
            </label>
            {!customPeriod ? (
              <div className="flex gap-2">
                <select
                  value={REVIEW_PERIOD_PRESETS.includes(form.reviewPeriod) ? form.reviewPeriod : ''}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setCustomPeriod(true);
                    } else {
                      setForm((f) => ({ ...f, reviewPeriod: e.target.value }));
                    }
                  }}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Dönem seçin...</option>
                  {REVIEW_PERIOD_PRESETS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="__custom__">Özel dönem gir...</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="örn. 2025 Q2, 2025 Yıl Sonu"
                  value={form.reviewPeriod}
                  onChange={(e) => setForm((f) => ({ ...f, reviewPeriod: e.target.value }))}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => { setCustomPeriod(false); setForm((f) => ({ ...f, reviewPeriod: REVIEW_PERIOD_PRESETS[0] })); }}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Listeden seç
                </button>
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Genel Puan (1–5) <span className="text-red-500">*</span>
            </label>
            <StarRatingSelector
              value={form.rating}
              onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
            />
          </div>

          {/* Hedefler / Goals */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Hedefler
            </label>
            <textarea
              rows={2}
              placeholder="Çalışanın bu dönem belirlenen hedefleri..."
              value={form.goals}
              onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Güçlü Yönler */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Güçlü Yönler
              </label>
              <textarea
                rows={3}
                placeholder="Çalışanın öne çıkan güçlü yönleri..."
                value={form.strengths}
                onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
            {/* Gelişim Alanları */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Gelişim Alanları
              </label>
              <textarea
                rows={3}
                placeholder="Geliştirilmesi gereken alanlar..."
                value={form.improvements}
                onChange={(e) => setForm((f) => ({ ...f, improvements: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notlar
            </label>
            <textarea
              rows={2}
              placeholder="Ek notlar ve yorumlar..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || form.rating === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Değerlendirmeyi Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['performance', year, employeeFilter],
    queryFn: () =>
      api.get<{ data: PerformanceReview[]; total: number }>('api/v1/hr/performance', {
        year,
        ...(employeeFilter && { employeeId: employeeFilter }),
        page: 1,
      }),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: () => api.get<{ data: Employee[] }>('hr/employees?limit=200'),
  });

  const reviews: PerformanceReview[] =
    (reviewData as any)?.data ?? (Array.isArray(reviewData) ? (reviewData as any) : []);
  const employees: Employee[] =
    (employeesData as any)?.data ?? (Array.isArray(employeesData) ? employeesData : []);

  // ── Computed stats ──
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((s, r) => s + Number(r.rating ?? 0), 0) / totalReviews
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews.filter((rv) => Math.round(rv.rating) === r).length,
  }));

  const years = [2023, 2024, 2025, 2026];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-primary shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Performans Değerlendirme</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Çalışan performans değerlendirmelerini yönetin ve takip edin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              reviews.map((r) => ({
                employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
                employeeNumber: r.employee.employeeNumber,
                department: r.employee.department?.name ?? '',
                reviewPeriod: r.reviewPeriod,
                rating: r.rating,
                reviewedBy: r.reviewedBy ? `${r.reviewedBy.firstName} ${r.reviewedBy.lastName}` : '',
                goals: r.goals ?? '',
                strengths: r.strengths ?? '',
                improvements: r.improvements ?? '',
                createdAt: new Date(r.createdAt).toLocaleDateString('tr-TR'),
              })),
              [
                { key: 'employeeName', header: 'Çalışan', width: 22 },
                { key: 'employeeNumber', header: 'Sicil No', width: 12 },
                { key: 'department', header: 'Departman', width: 18 },
                { key: 'reviewPeriod', header: 'Dönem', width: 14 },
                { key: 'rating', header: 'Puan', width: 8 },
                { key: 'reviewedBy', header: 'Değerlendiren', width: 20 },
                { key: 'goals', header: 'Hedefler', width: 30 },
                { key: 'strengths', header: 'Güçlü Yönler', width: 30 },
                { key: 'improvements', header: 'Gelişim Alanları', width: 30 },
                { key: 'createdAt', header: 'Tarih', width: 12 },
              ],
              'performans-degerlendirme',
              'Performans Değerlendirme'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted self-start sm:self-auto"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Yeni Değerlendirme
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent text-sm focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm Personel</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          label="Toplam Değerlendirme"
          value={String(totalReviews)}
          sub={`${year} yılı değerlendirmeleri`}
          icon={Users}
          iconClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Ortalama Puan"
          value={
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-bold text-foreground">
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </span>
              {avgRating > 0 && <StarRatingDisplay rating={Math.round(avgRating)} size="md" />}
            </div>
          }
          sub="1–5 ölçeği"
          icon={Star}
          iconClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
        />
        <SummaryCard
          label="Puan Dağılımı"
          value={
            <div className="flex items-end gap-1 h-8 mt-1">
              {ratingDistribution.reverse().map(({ rating, count }) => {
                const max = Math.max(...ratingDistribution.map((r) => r.count), 1);
                const heightPct = count > 0 ? Math.max((count / max) * 100, 15) : 5;
                return (
                  <div key={rating} className="flex flex-col items-center gap-0.5 flex-1" title={`${rating} yıldız: ${count}`}>
                    <div
                      className="w-full rounded-sm bg-yellow-400 dark:bg-yellow-500 transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
          }
          icon={BarChart2}
          iconClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Personel
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Departman
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Dönem
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Genel Puan
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground max-w-[160px]">
                  Güçlü Yönler
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground max-w-[160px]">
                  Gelişim Alanları
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Değerlendiren
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <SkeletonRows cols={8} />
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                    <p className="text-muted-foreground mb-2">
                      {year} yılı için henüz değerlendirme bulunmuyor
                    </p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="text-primary hover:underline text-sm"
                    >
                      İlk değerlendirmeyi oluştur
                    </button>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {review.employee?.firstName?.[0]}
                            {review.employee?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground whitespace-nowrap">
                            {review.employee?.firstName} {review.employee?.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {review.employee?.employeeNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {review.employee?.department?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {review.reviewPeriod}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StarRatingDisplay rating={review.rating} size="sm" />
                        <RatingBadge rating={review.rating} />
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      {review.strengths ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {review.strengths}
                        </p>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      {review.improvements ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {review.improvements}
                        </p>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {review.reviewedBy
                        ? `${review.reviewedBy.firstName} ${review.reviewedBy.lastName}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString('tr-TR')
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && reviews.length > 0 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{reviews.length} değerlendirme gösteriliyor</span>
            <span>
              Ortalama:{' '}
              <span className="font-medium text-foreground">
                {avgRating > 0 ? avgRating.toFixed(2) : '—'} / 5
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <NewReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultYear={year}
      />
    </div>
  );
}
