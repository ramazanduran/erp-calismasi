'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, CheckCircle, DollarSign, Users, AlertTriangle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';

type KaizenStatus = 'DRAFT' | 'ON_REVIEW' | 'APPROVED' | 'ACTION_PLAN' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface KaizenProposal {
  id: string;
  title: string;
  department: string;
  status: KaizenStatus;
  priority: Priority;
  creator: string;
  createdAt: string;
}

interface KaizenTrigger {
  id: string;
  module: string;
  description: string;
  date: string;
  type: 'warning' | 'alert';
}

interface KaizenStats {
  totalProposals: number;
  approvedThisMonth: number;
  roiSavings: number;
  participationRate: number;
}

const STATUS_LABELS: Record<KaizenStatus, string> = {
  DRAFT: 'Taslak',
  ON_REVIEW: 'İncelemede',
  APPROVED: 'Onaylandı',
  ACTION_PLAN: 'Aksiyon Planı',
  COMPLETED: 'Tamamlandı',
  VERIFIED: 'Doğrulandı',
  REJECTED: 'Reddedildi',
};

const STATUS_COLORS: Record<KaizenStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ON_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  ACTION_PLAN: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  VERIFIED: 'bg-teal-100 text-teal-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
  CRITICAL: 'Kritik',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const MOCK_STATS: KaizenStats = {
  totalProposals: 47,
  approvedThisMonth: 12,
  roiSavings: 125400,
  participationRate: 78,
};

const MOCK_PROPOSALS: KaizenProposal[] = [
  { id: '1', title: 'Montaj Hattı Hat Dengeleme', department: 'Üretim', status: 'ACTION_PLAN', priority: 'HIGH', creator: 'Ahmet Y.', createdAt: '2026-05-20' },
  { id: '2', title: 'Satın Alma Onay Süresi Azaltma', department: 'Satın Alma', status: 'APPROVED', priority: 'MEDIUM', creator: 'Fatma K.', createdAt: '2026-05-18' },
  { id: '3', title: 'Depo 5S Düzenlemesi', department: 'Lojistik', status: 'COMPLETED', priority: 'LOW', creator: 'Mehmet S.', createdAt: '2026-05-15' },
  { id: '4', title: 'Kalite Kontrol Hata Azaltma', department: 'Kalite', status: 'ON_REVIEW', priority: 'CRITICAL', creator: 'Zeynep A.', createdAt: '2026-05-22' },
  { id: '5', title: 'Müşteri Şikayet Yanıt Süresi', department: 'Satış', status: 'DRAFT', priority: 'HIGH', creator: 'Ali B.', createdAt: '2026-05-24' },
];

const MOCK_TRIGGERS: KaizenTrigger[] = [
  { id: '1', module: 'Üretim (MES)', description: "Hat 3'te %7 ıskarta oranı tespit edildi → 5 Neden Analizi tetiklendi", date: '2026-05-27T07:30:00', type: 'warning' },
  { id: '2', module: 'Kalite (QMS)', description: "Tedarikçi A'dan 3 ardışık ret → Tedarikçi Geliştirme Kaizeni başlatıldı", date: '2026-05-26T14:20:00', type: 'alert' },
  { id: '3', module: 'Bakım (TPM)', description: 'Makine M-205 MTBF %22 düştü → OPL revizyonu görevi oluşturuldu', date: '2026-05-25T09:15:00', type: 'warning' },
];

export default function KaizenPage() {
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);

  const { data: stats } = useQuery<KaizenStats>({
    queryKey: ['kaizen-stats'],
    queryFn: () => api.get<KaizenStats>('/api/v1/kaizen/stats'),
    initialData: MOCK_STATS,
  });

  const { data: proposals = [] } = useQuery<KaizenProposal[]>({
    queryKey: ['kaizen-recent'],
    queryFn: () => api.get<KaizenProposal[]>('/api/v1/kaizen/proposals', { limit: 10 }),
    initialData: MOCK_PROPOSALS,
  });

  const { data: triggers = [] } = useQuery<KaizenTrigger[]>({
    queryKey: ['kaizen-triggers'],
    queryFn: () => api.get<KaizenTrigger[]>('/api/v1/kaizen/triggers'),
    initialData: MOCK_TRIGGERS,
  });

  const statCards = [
    {
      label: 'Toplam Öneri',
      value: stats?.totalProposals ?? 0,
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Bu Ay Onaylanan',
      value: stats?.approvedThisMonth ?? 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'ROI Tasarrufu',
      value: `₺${(stats?.roiSavings ?? 0).toLocaleString('tr-TR')}`,
      icon: DollarSign,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      label: 'Katılım Oranı',
      value: `%${stats?.participationRate ?? 0}`,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kaizen Merkezi</h1>
        <p className="text-muted-foreground mt-1">Sürekli iyileştirme ve yalın yönetim platformu</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold mt-0.5">{card.value}</p>
              </div>
              <div className={cn('p-2 rounded-lg', card.bg)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-4">Aktif Kaizen Projeleri</h2>
        {proposals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Proje bulunamadı</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Başlık', 'Departman', 'Durum', 'Öncelik', 'Oluşturan', 'Tarih'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {proposals.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.department}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[p.status])}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PRIORITY_COLORS[p.priority])}>
                        {PRIORITY_LABELS[p.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.creator}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-4">Çapraz Modül Tetikleyiciler</h2>
        <div className="grid gap-3">
          {triggers.map((trigger) => (
            <div
              key={trigger.id}
              className={cn(
                'rounded-lg border p-4 flex items-start gap-3',
                trigger.type === 'alert'
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
              )}
            >
              <div className="mt-0.5">
                {trigger.type === 'alert' ? (
                  <Bell className="h-4 w-4 text-red-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-semibold',
                      trigger.type === 'alert'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    )}
                  >
                    {trigger.module}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(trigger.date).toLocaleString('tr-TR')}
                  </span>
                </div>
                <p className="text-sm">{trigger.description}</p>
              </div>
              <button
                onClick={() => setSelectedTrigger(trigger.id)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-background bg-card"
              >
                İncele
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedTrigger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">Tetikleyici Detayı</h2>
            {(() => {
              const t = triggers.find((x) => x.id === selectedTrigger);
              if (!t) return null;
              return (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Kaynak Modül</p>
                    <p className="font-medium">{t.module}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Açıklama</p>
                    <p className="text-sm">{t.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tarih</p>
                    <p className="text-sm">{new Date(t.date).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedTrigger(null)}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
