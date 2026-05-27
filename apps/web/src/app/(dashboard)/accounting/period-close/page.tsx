'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Lock, Unlock, ChevronDown, ChevronRight, RefreshCw, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type PeriodStatus = 'open' | 'in_progress' | 'closed' | 'locked';
type CheckStatus = 'ok' | 'warning' | 'error' | 'pending';

interface ClosingCheck {
  id: string;
  category: string;
  name: string;
  status: CheckStatus;
  detail: string;
  action?: string;
}

interface AccountingPeriod {
  id: string;
  year: number;
  month: number;
  status: PeriodStatus;
  closedAt?: string;
  closedBy?: string;
  checks: ClosingCheck[];
}

const STATUS_CONFIG: Record<PeriodStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open:        { label: 'Açık',         color: 'text-blue-700',   bg: 'bg-blue-100',   icon: <Unlock className="h-4 w-4" /> },
  in_progress: { label: 'Kapanışta',    color: 'text-yellow-700', bg: 'bg-yellow-100', icon: <Clock className="h-4 w-4" /> },
  closed:      { label: 'Kapatıldı',    color: 'text-green-700',  bg: 'bg-green-100',  icon: <CheckCircle2 className="h-4 w-4" /> },
  locked:      { label: 'Kilitlendi',   color: 'text-gray-700',   bg: 'bg-gray-200',   icon: <Lock className="h-4 w-4" /> },
};

const CHECK_CONFIG: Record<CheckStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ok:      { label: 'Tamam',    color: 'text-green-600',  icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
  warning: { label: 'Uyarı',   color: 'text-yellow-600', icon: <AlertTriangle className="h-4 w-4 text-yellow-600" /> },
  error:   { label: 'Hata',    color: 'text-red-600',    icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
  pending: { label: 'Bekliyor',color: 'text-gray-500',   icon: <Clock className="h-4 w-4 text-gray-400" /> },
};

const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function buildChecks(status: PeriodStatus): ClosingCheck[] {
  if (status === 'locked') {
    return [
      { id: 'c1', category: 'Muhasebe', name: 'Tüm yevmiye fişleri onaylandı', status: 'ok', detail: '1,247 fiş onaylandı' },
      { id: 'c2', category: 'Muhasebe', name: 'Mizan dengesi sağlandı', status: 'ok', detail: 'Borç = Alacak: ₺8,420,150.00' },
      { id: 'c3', category: 'Banka', name: 'Banka mutabakatı tamamlandı', status: 'ok', detail: '4 hesap mutabık' },
      { id: 'c4', category: 'Stok', name: 'Stok değerleme tamamlandı', status: 'ok', detail: 'FIFO yöntemiyle değerlendi' },
      { id: 'c5', category: 'Alacaklar', name: 'Tahsilat mutabakatı', status: 'ok', detail: 'Tüm açık alacaklar mutabık' },
      { id: 'c6', category: 'Borçlar', name: 'Tedarikçi hesapları mutabık', status: 'ok', detail: 'Tüm tedarikçi hesapları onaylandı' },
    ];
  }
  if (status === 'closed') {
    return [
      { id: 'c1', category: 'Muhasebe', name: 'Tüm yevmiye fişleri onaylandı', status: 'ok', detail: '982 fiş onaylandı' },
      { id: 'c2', category: 'Muhasebe', name: 'Mizan dengesi sağlandı', status: 'ok', detail: 'Borç = Alacak: ₺7,850,300.00' },
      { id: 'c3', category: 'Banka', name: 'Banka mutabakatı tamamlandı', status: 'ok', detail: '4 hesap mutabık' },
      { id: 'c4', category: 'Stok', name: 'Stok değerleme tamamlandı', status: 'ok', detail: 'FIFO yöntemiyle değerlendi' },
      { id: 'c5', category: 'Alacaklar', name: 'Tahsilat mutabakatı', status: 'ok', detail: 'Tüm açık alacaklar mutabık' },
      { id: 'c6', category: 'Borçlar', name: 'Tedarikçi hesapları mutabık', status: 'ok', detail: 'Tüm tedarikçi hesapları onaylandı' },
    ];
  }
  if (status === 'in_progress') {
    return [
      { id: 'c1', category: 'Muhasebe', name: 'Tüm yevmiye fişleri onaylandı', status: 'ok', detail: '1,124 fiş onaylandı' },
      { id: 'c2', category: 'Muhasebe', name: 'Mizan dengesi sağlandı', status: 'ok', detail: 'Borç = Alacak: ₺9,215,800.00' },
      { id: 'c3', category: 'Banka', name: 'Banka mutabakatı tamamlandı', status: 'warning', detail: '1 hesap mutabık değil: Garanti TL', action: 'Mutabakat Yap' },
      { id: 'c4', category: 'Stok', name: 'Stok değerleme tamamlandı', status: 'ok', detail: 'FIFO yöntemiyle değerlendi' },
      { id: 'c5', category: 'Alacaklar', name: 'Tahsilat mutabakatı', status: 'error', detail: '3 müşteri faturası mutabık değil: ₺45,800', action: 'Mutabakat Listesi' },
      { id: 'c6', category: 'Borçlar', name: 'Tedarikçi hesapları mutabık', status: 'pending', detail: 'Kontrol bekleniyor' },
    ];
  }
  return [
    { id: 'c1', category: 'Muhasebe', name: 'Tüm yevmiye fişleri onaylandı', status: 'pending', detail: 'Kontrol bekleniyor' },
    { id: 'c2', category: 'Muhasebe', name: 'Mizan dengesi sağlandı', status: 'pending', detail: 'Kontrol bekleniyor' },
    { id: 'c3', category: 'Banka', name: 'Banka mutabakatı tamamlandı', status: 'pending', detail: 'Kontrol bekleniyor' },
    { id: 'c4', category: 'Stok', name: 'Stok değerleme tamamlandı', status: 'pending', detail: 'Kontrol bekleniyor' },
    { id: 'c5', category: 'Alacaklar', name: 'Tahsilat mutabakatı', status: 'pending', detail: 'Kontrol bekleniyor' },
    { id: 'c6', category: 'Borçlar', name: 'Tedarikçi hesapları mutabık', status: 'pending', detail: 'Kontrol bekleniyor' },
  ];
}

const MOCK_PERIODS: AccountingPeriod[] = [
  { id: 'p1', year: 2026, month: 5, status: 'in_progress', checks: buildChecks('in_progress') },
  { id: 'p2', year: 2026, month: 4, status: 'closed', closedAt: '2026-05-05', closedBy: 'Ahmet Çelik', checks: buildChecks('closed') },
  { id: 'p3', year: 2026, month: 3, status: 'locked', closedAt: '2026-04-04', closedBy: 'Ahmet Çelik', checks: buildChecks('locked') },
  { id: 'p4', year: 2026, month: 2, status: 'locked', closedAt: '2026-03-03', closedBy: 'Ahmet Çelik', checks: buildChecks('locked') },
  { id: 'p5', year: 2026, month: 1, status: 'locked', closedAt: '2026-02-04', closedBy: 'Ahmet Çelik', checks: buildChecks('locked') },
  { id: 'p6', year: 2026, month: 6, status: 'open', checks: buildChecks('open') },
];

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
}

export default function PeriodClosePage() {
  const [periods, setPeriods] = useState<AccountingPeriod[]>(MOCK_PERIODS);
  const [expandedId, setExpandedId] = useState<string | null>('p1');
  const [running, setRunning] = useState<string | null>(null);

  const currentPeriod = periods.find((p) => p.id === 'p1')!;

  const runChecks = async (id: string) => {
    setRunning(id);
    await new Promise((r) => setTimeout(r, 2000));
    setPeriods((prev) => prev.map((p) => p.id === id ? { ...p, status: 'in_progress' as PeriodStatus, checks: buildChecks('in_progress') } : p));
    setRunning(null);
  };

  const closePeriod = (id: string) => {
    const period = periods.find((p) => p.id === id);
    if (!period) return;
    const hasErrors = period.checks.some((c) => c.status === 'error');
    if (hasErrors) {
      alert('Dönem kapatmadan önce tüm hataları giderin.');
      return;
    }
    setPeriods((prev) => prev.map((p) => p.id === id ? { ...p, status: 'closed' as PeriodStatus, closedAt: '2026-05-27', closedBy: 'Ahmet Çelik', checks: buildChecks('closed') } : p));
  };

  const lockPeriod = (id: string) => {
    setPeriods((prev) => prev.map((p) => p.id === id ? { ...p, status: 'locked' as PeriodStatus } : p));
  };

  const checkSummary = useMemo(() => {
    const checks = currentPeriod?.checks ?? [];
    return {
      ok: checks.filter((c) => c.status === 'ok').length,
      warning: checks.filter((c) => c.status === 'warning').length,
      error: checks.filter((c) => c.status === 'error').length,
      pending: checks.filter((c) => c.status === 'pending').length,
      total: checks.length,
    };
  }, [currentPeriod]);

  const groupedChecks = useMemo(() => {
    const g: Record<string, ClosingCheck[]> = {};
    (currentPeriod?.checks ?? []).forEach((c) => {
      if (!g[c.category]) g[c.category] = [];
      g[c.category].push(c);
    });
    return g;
  }, [currentPeriod]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dönem Kapanış</h1>
          <p className="text-muted-foreground">Muhasebe dönemi kapanış işlemleri ve kontrolleri</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Kontrol Tamam', value: checkSummary.ok, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Uyarı', value: checkSummary.warning, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Hata', value: checkSummary.error, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Bekliyor', value: checkSummary.pending, color: 'text-gray-500', bg: 'bg-muted' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl border border-border p-5 shadow-sm', s.bg)}>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn('mt-1 text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">/ {checkSummary.total} kontrol</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Period List */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dönemler</h2>
          {periods.sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month)).map((period) => {
            const sc = STATUS_CONFIG[period.status];
            const isExpanded = expandedId === period.id;
            return (
              <div
                key={period.id}
                onClick={() => setExpandedId(isExpanded ? null : period.id)}
                className={cn('rounded-xl border border-border bg-card p-4 shadow-sm cursor-pointer hover:border-primary/40 transition-colors', isExpanded && 'border-primary/60 bg-primary/5')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{MONTH_NAMES[period.month - 1]} {period.year}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', sc.bg, sc.color)}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>
                {period.closedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {period.closedAt} · {period.closedBy}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Period Detail */}
        <div className="lg:col-span-2">
          {expandedId && (() => {
            const period = periods.find((p) => p.id === expandedId);
            if (!period) return null;
            const sc = STATUS_CONFIG[period.status];
            const hasErrors = period.checks.some((c) => c.status === 'error');
            const hasPending = period.checks.some((c) => c.status === 'pending');
            const cats = Object.entries(
              period.checks.reduce<Record<string, ClosingCheck[]>>((g, c) => { (g[c.category] = g[c.category] ?? []).push(c); return g; }, {})
            );
            return (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-lg">{MONTH_NAMES[period.month - 1]} {period.year}</h3>
                    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', sc.bg, sc.color)}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(period.status === 'open' || period.status === 'in_progress') && (
                      <button
                        onClick={() => runChecks(period.id)}
                        disabled={running === period.id}
                        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                      >
                        <RefreshCw className={cn('h-4 w-4', running === period.id && 'animate-spin')} />
                        {running === period.id ? 'Kontrol Ediliyor...' : 'Kontrolleri Çalıştır'}
                      </button>
                    )}
                    {period.status === 'in_progress' && !hasErrors && !hasPending && (
                      <button
                        onClick={() => closePeriod(period.id)}
                        className="flex items-center gap-2 rounded-lg bg-green-600 text-white px-3 py-1.5 text-sm hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Dönemi Kapat
                      </button>
                    )}
                    {period.status === 'closed' && (
                      <button
                        onClick={() => lockPeriod(period.id)}
                        className="flex items-center gap-2 rounded-lg bg-gray-700 text-white px-3 py-1.5 text-sm hover:bg-gray-800"
                      >
                        <Lock className="h-4 w-4" /> Kilitle
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {cats.map(([category, checks]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{category}</p>
                      <div className="space-y-1.5">
                        {checks.map((check) => {
                          const cc = CHECK_CONFIG[check.status];
                          return (
                            <div key={check.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', check.status === 'error' ? 'border-red-200 bg-red-50' : check.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-border bg-muted/20')}>
                              <div className="mt-0.5 shrink-0">{cc.icon}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{check.name}</p>
                                <p className="text-xs text-muted-foreground">{check.detail}</p>
                              </div>
                              {check.action && (
                                <button className="shrink-0 text-xs text-primary hover:underline">{check.action}</button>
                              )}
                              <span className={cn('shrink-0 text-xs font-medium', cc.color)}>{cc.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {period.status === 'locked' && (
                  <div className="px-5 pb-5">
                    <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                      <Lock className="h-4 w-4" />
                      Bu dönem kilitlenmiştir. Hiçbir değişiklik yapılamaz.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
