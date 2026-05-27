'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Zap, Award, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeRanking {
  rank: number;
  employeeId: string;
  name: string;
  department: string;
  totalXp: number;
  level: number;
  levelTitle: string;
  kaizenCount: number;
  approvedCount: number;
  badges: string[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  color: string;
  earnedBy: number;
  xpReward: number;
}

type Tab = 'leaderboard' | 'badges';

const MOCK_RANKINGS: EmployeeRanking[] = [
  { rank: 1, employeeId: 'e1', name: 'Ahmet Yılmaz', department: 'Üretim', totalXp: 2400, level: 18, levelTitle: 'Kaizen Master', kaizenCount: 14, approvedCount: 11, badges: ['kaizen-master', 'roi-champion', 'team-leader'] },
  { rank: 2, employeeId: 'e2', name: 'Fatma Kaya', department: 'Kalite', totalXp: 1850, level: 14, levelTitle: 'Yalın Uzman', kaizenCount: 10, approvedCount: 9, badges: ['speed-master', 'gemba-walker'] },
  { rank: 3, employeeId: 'e3', name: 'Mehmet Sarı', department: 'Lojistik', totalXp: 1420, level: 12, levelTitle: 'Yalın Uzman', kaizenCount: 9, approvedCount: 7, badges: ['first-kaizen', 'gemba-walker'] },
  { rank: 4, employeeId: 'e4', name: 'Zeynep Arslan', department: 'Satış', totalXp: 980, level: 9, levelTitle: 'Yalın Uzman', kaizenCount: 7, approvedCount: 5, badges: ['first-kaizen', 'speed-master'] },
  { rank: 5, employeeId: 'e5', name: 'Ali Bozkurt', department: 'Satın Alma', totalXp: 640, level: 7, levelTitle: 'Yalın Uzman', kaizenCount: 5, approvedCount: 4, badges: ['first-kaizen'] },
  { rank: 6, employeeId: 'e6', name: 'Selin Koç', department: 'Finans', totalXp: 310, level: 4, levelTitle: 'Yalın Çırak', kaizenCount: 3, approvedCount: 2, badges: ['first-kaizen'] },
  { rank: 7, employeeId: 'e7', name: 'Can Aydın', department: 'IT', totalXp: 180, level: 3, levelTitle: 'Yalın Çırak', kaizenCount: 2, approvedCount: 1, badges: [] },
  { rank: 8, employeeId: 'e8', name: 'Derya Mutlu', department: 'İK', totalXp: 80, level: 1, levelTitle: 'Yalın Çırak', kaizenCount: 1, approvedCount: 0, badges: [] },
];

const MOCK_BADGES: Badge[] = [
  { id: 'first-kaizen', name: 'İlk Kaizen', description: 'İlk kaizen fikrini sisteme girdin.', color: 'bg-blue-500', earnedBy: 6, xpReward: 10 },
  { id: 'speed-master', name: 'Hız Ustası', description: 'Aksiyonunu zamanından önce tamamladın.', color: 'bg-yellow-500', earnedBy: 3, xpReward: 30 },
  { id: 'roi-champion', name: 'ROI Şampiyonu', description: 'Büyük finansal tasarruf sağlayan Kaizen projesini tamamladın.', color: 'bg-green-600', earnedBy: 1, xpReward: 500 },
  { id: 'team-leader', name: 'Takım Lideri', description: 'Bir Kaizen projesinde liderlik yaptın.', color: 'bg-purple-600', earnedBy: 2, xpReward: 100 },
  { id: 'gemba-walker', name: 'Gemba Yürüyüşçüsü', description: 'En az 3 Gemba Walk denetiminde bulundun.', color: 'bg-orange-500', earnedBy: 3, xpReward: 50 },
  { id: 'kaizen-master', name: 'Kaizen Master', description: 'Level 16\'ya ulaştın. Gerçek bir sürekli iyileştirme liderisin!', color: 'bg-amber-500', earnedBy: 1, xpReward: 0 },
];

const XP_ACTIONS = [
  { label: 'Fikir Girişi', xp: '+10 XP' },
  { label: 'Fikrin Onaylanması', xp: '+50 XP' },
  { label: 'Kaizen Liderliği', xp: '+100 XP' },
  { label: 'Aksiyonu Zamanında Tamamlama', xp: '+30 XP' },
  { label: 'Büyük ROI Sağlayan Kaizen', xp: '+500 XP' },
];

function getLevelColor(levelTitle: string) {
  if (levelTitle === 'Kaizen Master') return 'bg-amber-100 text-amber-800 border border-amber-300';
  if (levelTitle === 'Yalın Uzman') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
}

function getXpForNextLevel(level: number): number {
  return level * 200;
}

function BadgeIcon({ badge, size = 'sm' }: { badge: Badge; size?: 'sm' | 'lg' }) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-bold shrink-0',
        badge.color,
        size === 'lg' ? 'h-12 w-12 text-lg' : 'h-5 w-5 text-xs'
      )}
      title={badge.name}
    >
      {badge.name[0]}
    </div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');

  const { data: rankings = MOCK_RANKINGS } = useQuery<EmployeeRanking[]>({
    queryKey: ['kaizen-leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/v1/kaizen/leaderboard');
      if (!res.ok) return MOCK_RANKINGS;
      return res.json();
    },
    initialData: MOCK_RANKINGS,
  });

  const { data: badges = MOCK_BADGES } = useQuery<Badge[]>({
    queryKey: ['kaizen-badges'],
    queryFn: async () => {
      const res = await fetch('/api/v1/kaizen/badges');
      if (!res.ok) return MOCK_BADGES;
      return res.json();
    },
    initialData: MOCK_BADGES,
  });

  const totalXp = rankings.reduce((s, e) => s + e.totalXp, 0);
  const masters = rankings.filter((e) => e.levelTitle === 'Kaizen Master').length;

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumHeights = ['h-28', 'h-36', 'h-24'];
  const podiumMedals = ['🥈', '🥇', '🥉'];
  const podiumColors = ['bg-gray-100 border-gray-300', 'bg-amber-50 border-amber-300', 'bg-orange-50 border-orange-300'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kaizen Liderlik Tablosu</h1>
        <p className="text-muted-foreground">Çalışan katkıları, XP puanları ve rozet sistemi</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam XP</p>
          <p className="mt-1 text-2xl font-bold">{totalXp.toLocaleString('tr-TR')}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">Kaizen Master</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{masters}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Aktif Katılımcı</p>
          <p className="mt-1 text-2xl font-bold">{rankings.filter((e) => e.kaizenCount > 0).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Kazanılan Rozet</p>
          <p className="mt-1 text-2xl font-bold">{rankings.reduce((s, e) => s + e.badges.length, 0)}</p>
        </div>
      </div>

      <div className="flex border-b border-border">
        {([{ id: 'leaderboard', label: 'Liderlik Tablosu' }, { id: 'badges', label: 'Rozetler' }] as const).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="flex items-end justify-center gap-4 pt-4">
            {podiumOrder.map((emp, i) => emp && (
              <div key={emp.employeeId} className="flex flex-col items-center gap-2">
                <div className="text-2xl">{podiumMedals[i]}</div>
                <div className="text-center">
                  <p className="font-semibold text-sm">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.department}</p>
                  <p className="text-xs font-bold mt-0.5">{emp.totalXp.toLocaleString()} XP</p>
                </div>
                <div className={cn('w-28 rounded-t-lg border-2 flex items-end justify-center pb-2', podiumHeights[i], podiumColors[i])}>
                  <span className="text-2xl font-bold text-muted-foreground">#{i === 1 ? 1 : i === 0 ? 2 : 3}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium w-12">Sıra</th>
                  <th className="px-4 py-3 text-left font-medium">Çalışan</th>
                  <th className="px-4 py-3 text-left font-medium">Seviye</th>
                  <th className="px-4 py-3 text-left font-medium">XP</th>
                  <th className="px-4 py-3 text-left font-medium">Kaizen</th>
                  <th className="px-4 py-3 text-left font-medium">Onaylanan</th>
                  <th className="px-4 py-3 text-left font-medium">Rozetler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rest.map((emp) => {
                  const nextLevelXp = getXpForNextLevel(emp.level);
                  const progress = Math.min(100, Math.round((emp.totalXp % nextLevelXp) / nextLevelXp * 100));
                  const empBadges = badges.filter((b) => emp.badges.includes(b.id));
                  return (
                    <tr key={emp.employeeId} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-center font-bold text-muted-foreground">#{emp.rank}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.department}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getLevelColor(emp.levelTitle))}>
                          {emp.levelTitle}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">Seviye {emp.level}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{emp.totalXp.toLocaleString()} XP</p>
                        <div className="w-24 bg-muted rounded-full h-1.5 mt-1">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{emp.kaizenCount}</td>
                      <td className="px-4 py-3 text-center">{emp.approvedCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {empBadges.map((b) => (
                            <BadgeIcon key={b.id} badge={b} />
                          ))}
                          {emp.badges.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              XP Kazanma Yolları
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {XP_ACTIONS.map((a) => (
                <div key={a.label} className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold text-primary">{a.xp}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <div key={badge.id} className="rounded-xl border border-border bg-card p-5 shadow-sm flex gap-4">
              <div className={cn('h-14 w-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shrink-0', badge.color)}>
                {badge.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{badge.name}</p>
                  {badge.xpReward > 0 && (
                    <span className="rounded-full bg-yellow-100 text-yellow-700 px-2 py-0.5 text-xs font-medium">
                      +{badge.xpReward} XP
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-medium text-foreground">{badge.earnedBy}</span> çalışan kazandı
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
