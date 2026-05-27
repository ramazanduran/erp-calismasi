'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Star, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';
import { Download } from 'lucide-react';

interface EvalCriteria {
  deliveryTime: number;
  quality: number;
  price: number;
  communication: number;
  compliance: number;
}

interface SupplierEvaluation {
  id: string;
  supplierCode: string;
  supplierName: string;
  category: string;
  evaluator: string;
  period: string;
  criteria: EvalCriteria;
  score: number;
  previousScore: number;
  comment: string;
  evaluatedAt: string;
  totalOrders: number;
  totalValue: number;
  onTimeDeliveryRate: number;
  defectRate: number;
}

const MOCK_EVALS: SupplierEvaluation[] = [
  {
    id: '1', supplierCode: 'TED-001', supplierName: 'Alır Çelik Ltd.', category: 'Hammadde',
    evaluator: 'Ali Yılmaz', period: 'Q1 2026',
    criteria: { deliveryTime: 4.5, quality: 4.8, price: 3.8, communication: 4.2, compliance: 4.6 },
    score: 4.4, previousScore: 4.1,
    comment: 'Kalite tutarlı, fiyat rekabeti geliştirilmeli.',
    evaluatedAt: '2026-04-15', totalOrders: 24, totalValue: 1850000, onTimeDeliveryRate: 92, defectRate: 0.8,
  },
  {
    id: '2', supplierCode: 'TED-002', supplierName: 'Bedir Plastik A.Ş.', category: 'Hammadde',
    evaluator: 'Fatma Demir', period: 'Q1 2026',
    criteria: { deliveryTime: 3.8, quality: 4.2, price: 4.5, communication: 3.9, compliance: 4.0 },
    score: 4.1, previousScore: 4.3,
    comment: 'Teslimat süreleri tutarsız, kalite kabul edilebilir.',
    evaluatedAt: '2026-04-18', totalOrders: 18, totalValue: 940000, onTimeDeliveryRate: 78, defectRate: 1.2,
  },
  {
    id: '3', supplierCode: 'TED-003', supplierName: 'Çelik Makine San.', category: 'Ekipman',
    evaluator: 'Hasan Çelik', period: 'Q1 2026',
    criteria: { deliveryTime: 4.0, quality: 4.9, price: 3.5, communication: 4.7, compliance: 4.8 },
    score: 4.4, previousScore: 4.2,
    comment: 'Mükemmel kalite ve iletişim, fiyatlandırma yüksek.',
    evaluatedAt: '2026-04-20', totalOrders: 8, totalValue: 2100000, onTimeDeliveryRate: 87, defectRate: 0.3,
  },
  {
    id: '4', supplierCode: 'TED-004', supplierName: 'Demir Elektrik', category: 'Elektrik Malzeme',
    evaluator: 'Ali Yılmaz', period: 'Q1 2026',
    criteria: { deliveryTime: 4.8, quality: 4.0, price: 4.3, communication: 4.5, compliance: 3.8 },
    score: 4.3, previousScore: 4.0,
    comment: 'Hızlı teslimat, uyumluluk belgeleri eksik kalıyor.',
    evaluatedAt: '2026-04-22', totalOrders: 31, totalValue: 580000, onTimeDeliveryRate: 95, defectRate: 1.5,
  },
  {
    id: '5', supplierCode: 'TED-005', supplierName: 'Erdem Lojistik', category: 'Lojistik',
    evaluator: 'Fatma Demir', period: 'Q1 2026',
    criteria: { deliveryTime: 2.5, quality: 3.0, price: 4.8, communication: 2.8, compliance: 3.5 },
    score: 3.3, previousScore: 3.8,
    comment: 'Ciddi teslimat sorunları yaşandı. Geliştirme planı istendi.',
    evaluatedAt: '2026-04-25', totalOrders: 42, totalValue: 320000, onTimeDeliveryRate: 65, defectRate: 4.2,
  },
  {
    id: '6', supplierCode: 'TED-006', supplierName: 'Fırat Kimya A.Ş.', category: 'Kimyasal',
    evaluator: 'Hasan Çelik', period: 'Q1 2026',
    criteria: { deliveryTime: 4.2, quality: 4.6, price: 3.9, communication: 4.4, compliance: 4.7 },
    score: 4.4, previousScore: 4.2,
    comment: 'Güvenilir tedarikçi. Devam edilmesi önerilir.',
    evaluatedAt: '2026-04-28', totalOrders: 15, totalValue: 720000, onTimeDeliveryRate: 88, defectRate: 0.5,
  },
];

const CRITERIA_LABELS: Record<keyof EvalCriteria, string> = {
  deliveryTime: 'Teslimat Süresi',
  quality: 'Kalite',
  price: 'Fiyat/Maliyet',
  communication: 'İletişim',
  compliance: 'Uyumluluk',
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn('h-3.5 w-3.5', value >= star ? 'fill-yellow-400 text-yellow-400' : value >= star - 0.5 ? 'fill-yellow-200 text-yellow-400' : 'text-muted-foreground/30')}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-muted-foreground">{value.toFixed(1)}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 4.5 ? 'bg-green-100 text-green-800' : score >= 3.5 ? 'bg-blue-100 text-blue-800' : score >= 2.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  const label = score >= 4.5 ? 'A — Mükemmel' : score >= 3.5 ? 'B — İyi' : score >= 2.5 ? 'C — Orta' : 'D — Yetersiz';
  return <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', color)}>{label}</span>;
}

export default function SupplierEvaluationPage() {
  const [search, setSearch] = useState('');
  const [selectedEval, setSelectedEval] = useState<SupplierEvaluation | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'orders'>('score');

  const { data: evals = MOCK_EVALS } = useQuery<SupplierEvaluation[]>({
    queryKey: ['supplier-evaluations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/purchasing/supplier-evaluations');
      if (!res.ok) return MOCK_EVALS;
      return res.json();
    },
    initialData: MOCK_EVALS,
  });

  const sorted = useMemo(() => {
    let filtered = evals.filter((e) =>
      !search || e.supplierName.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
    );
    return filtered.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'name') return a.supplierName.localeCompare(b.supplierName);
      return b.totalOrders - a.totalOrders;
    });
  }, [evals, search, sortBy]);

  const avgScore = evals.reduce((s, e) => s + e.score, 0) / evals.length;
  const excellent = evals.filter((e) => e.score >= 4.5).length;
  const needsImprovement = evals.filter((e) => e.score < 3.5).length;

  const handleExport = () => {
    const rows = evals.map((e) => ({
      'Tedarikçi': e.supplierName,
      'Kategori': e.category,
      'Dönem': e.period,
      'Teslimat Süresi': e.criteria.deliveryTime,
      'Kalite': e.criteria.quality,
      'Fiyat': e.criteria.price,
      'İletişim': e.criteria.communication,
      'Uyumluluk': e.criteria.compliance,
      'Toplam Skor': e.score,
      'Önceki Skor': e.previousScore,
      'Zamanında Teslimat (%)': e.onTimeDeliveryRate,
      'Hata Oranı (%)': e.defectRate,
    }));
    exportToExcel(rows, 'tedarikci-degerlendirme', 'Tedarikçi Değerlendirme');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tedarikçi Değerlendirme</h1>
          <p className="text-muted-foreground">Performans puanlama, kalite ve teslimat analizi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Excel
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            <PlusCircle className="h-4 w-4" /> Yeni Değerlendirme
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Ort. Puan</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{avgScore.toFixed(1)} / 5.0</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Mükemmel (≥4.5)</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{excellent}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">İyileştirme Gerekli</p>
          <p className={cn('mt-1 text-2xl font-bold', needsImprovement > 0 ? 'text-red-600' : 'text-green-600')}>{needsImprovement}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Değerlendirilen</p>
          <p className="mt-1 text-2xl font-bold">{evals.length} tedarikçi</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tedarikçi veya kategori ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="score">Puana Göre Sırala</option>
          <option value="name">İsme Göre Sırala</option>
          <option value="orders">Sipariş Sayısına Göre</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((ev) => {
          const trend = ev.score - ev.previousScore;
          return (
            <div
              key={ev.id}
              onClick={() => setSelectedEval(selectedEval?.id === ev.id ? null : ev)}
              className={cn('rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:border-primary/50 transition-colors',
                selectedEval?.id === ev.id && 'border-primary ring-1 ring-primary/20'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold">{ev.supplierName}</p>
                  <p className="text-xs text-muted-foreground">{ev.supplierCode} · {ev.category}</p>
                </div>
                <ScoreBadge score={ev.score} />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <StarRating value={ev.score} />
                <span className={cn('flex items-center gap-0.5 text-xs font-medium', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}
                </span>
              </div>

              <div className="space-y-1.5 mb-3">
                {(Object.entries(ev.criteria) as [keyof EvalCriteria, number][]).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-32 shrink-0">{CRITERIA_LABELS[key]}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', val >= 4 ? 'bg-green-500' : val >= 3 ? 'bg-yellow-400' : 'bg-red-500')}
                        style={{ width: `${(val / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-2">
                <span>Teslimat: <b className={ev.onTimeDeliveryRate >= 85 ? 'text-green-600' : 'text-red-600'}>{ev.onTimeDeliveryRate}%</b></span>
                <span>Hata: <b className={ev.defectRate <= 1 ? 'text-green-600' : 'text-red-600'}>{ev.defectRate}%</b></span>
                <span>{ev.totalOrders} sipariş</span>
              </div>

              {selectedEval?.id === ev.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">"{ev.comment}"</p>
                  <p className="text-xs text-muted-foreground mt-1">Değerlendiren: {ev.evaluator} · {ev.evaluatedAt}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
