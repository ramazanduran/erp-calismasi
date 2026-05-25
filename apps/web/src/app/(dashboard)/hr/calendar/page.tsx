'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useLeaves } from '@/lib/api/hooks/use-leaves';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const TYPE_SHORT: Record<string, string> = {
  annual: 'Yıllık',
  sick: 'Hastalık',
  unpaid: 'Ücretsiz',
  maternity: 'Doğum',
  paternity: 'Babalık',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // Monday=0, Sun=6
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function LeaveCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data: leavesData, isLoading } = useLeaves();
  const leavesList = Array.isArray(leavesData) ? leavesData as Record<string, unknown>[] : [];

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build a map: day -> list of leaves that overlap with this day
  const leavesByDay: Map<number, Record<string, unknown>[]> = new Map();

  leavesList.forEach((leave) => {
    const start = new Date(leave.startDate as string);
    const end = new Date(leave.endDate as string);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date >= start && date <= end) {
        if (!leavesByDay.has(d)) leavesByDay.set(d, []);
        leavesByDay.get(d)!.push(leave);
      }
    }
  });

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">İzin Takvimi</h1>
          <p className="text-sm text-muted-foreground mt-1">Çalışan izinlerini takvimde görüntüleyin</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-green-400" /> Onaylı
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-yellow-400" /> Bekliyor
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-red-400" /> Reddedildi
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-foreground">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground bg-muted/50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <div className="p-8 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse opacity-40" />
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const dayLeaves = day ? (leavesByDay.get(day) ?? []) : [];

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] border-b border-r border-border p-1.5 ${!day ? 'bg-muted/20' : ''} ${isToday ? 'bg-primary/5' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayLeaves.slice(0, 2).map((leave) => {
                          const emp = leave.employee as Record<string, unknown> | undefined;
                          return (
                            <div
                              key={leave.id as string}
                              className={`rounded px-1 py-0.5 text-xs truncate ${STATUS_COLORS[leave.status as string] ?? 'bg-muted text-muted-foreground'}`}
                              title={`${emp?.firstName} ${emp?.lastName} — ${TYPE_SHORT[leave.type as string] ?? leave.type}`}
                            >
                              {emp?.firstName as string} {(emp?.lastName as string)?.charAt(0)}.
                            </div>
                          );
                        })}
                        {dayLeaves.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-1">+{dayLeaves.length - 2} daha</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend / summary */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">{MONTHS[month]} Özeti</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['approved', 'pending', 'rejected'] as const).map((status) => {
            const count = leavesList.filter((l) => {
              const start = new Date(l.startDate as string);
              const end = new Date(l.endDate as string);
              const monthStart = new Date(year, month, 1);
              const monthEnd = new Date(year, month + 1, 0);
              return l.status === status && start <= monthEnd && end >= monthStart;
            }).length;
            const labels = { approved: 'Onaylı İzin', pending: 'Bekleyen', rejected: 'Reddedilen' };
            const dotColors = { approved: 'bg-green-400', pending: 'bg-yellow-400', rejected: 'bg-red-400' };
            return (
              <div key={status} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotColors[status]}`} />
                  <span className="text-xs text-muted-foreground">{labels[status]}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
