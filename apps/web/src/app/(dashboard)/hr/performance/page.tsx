'use client';

import { useState } from 'react';
import { Plus, Star, TrendingUp } from 'lucide-react';
import { usePerformanceReviews } from '@/lib/api/hooks';
import { PerformanceModal } from '@/components/modals/performance-modal';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  submitted: 'Gönderildi',
  approved: 'Onaylandı',
};

const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-muted-foreground text-sm">-</span>;
  const color =
    score >= 80
      ? 'text-green-600 dark:text-green-400'
      : score >= 60
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-red-600 dark:text-red-400';
  return <span className={`font-bold text-sm ${color}`}>{score.toFixed(1)}</span>;
}

export default function PerformancePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: reviews, isLoading } = usePerformanceReviews();

  const list = Array.isArray(reviews) ? reviews : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Performans Değerlendirme</h1>
            <p className="text-muted-foreground text-sm">Çalışan performans değerlendirmeleri</p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Değerlendirme
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Henüz performans değerlendirmesi bulunmuyor.
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Çalışan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Dönem</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Puan</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Değerlendirmeler</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((review: any) => {
                const ratings = review.ratings || {};
                const ratingValues = Object.values(ratings) as number[];
                const avgRating =
                  ratingValues.length > 0
                    ? ratingValues.reduce((a: number, b: number) => a + b, 0) / ratingValues.length
                    : null;

                return (
                  <tr key={review.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">
                        {review.employee
                          ? `${review.employee.firstName} ${review.employee.lastName}`
                          : review.employeeId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{review.period}</td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={review.score} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {avgRating != null ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">/5</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[review.status] || STATUS_CLASSES.draft}`}>
                        {STATUS_LABELS[review.status] || review.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <PerformanceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
