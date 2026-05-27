'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, ChevronLeft, ChevronRight, Users, Sun, Sunset, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ShiftType = 'morning' | 'afternoon' | 'night' | 'off';

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
}

interface ShiftAssignment {
  employeeId: string;
  date: string;
  shift: ShiftType;
}

const EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Selin Arslan', department: 'Üretim', position: 'Üretim Şefi - Hat A' },
  { id: 'e2', name: 'Emre Güler', department: 'Üretim', position: 'Üretim Şefi - Hat B' },
  { id: 'e3', name: 'Burak Yıldız', department: 'Bakım', position: 'Bakım Müdürü' },
  { id: 'e4', name: 'Cem Kaya', department: 'Lojistik', position: 'Depo Yöneticisi' },
  { id: 'e5', name: 'Nil Şen', department: 'Lojistik', position: 'Sevkiyat Şefi' },
  { id: 'e6', name: 'Murat Şahin', department: 'Üretim', position: 'Üretim Müdürü' },
  { id: 'e7', name: 'Dilek Yılmaz', department: 'Kalite', position: 'Kalite Güvence Müdürü' },
  { id: 'e8', name: 'Kemal Acar', department: 'Satış', position: 'Satış Temsilcisi' },
];

function buildMockAssignments(): ShiftAssignment[] {
  const shifts: ShiftType[] = ['morning', 'afternoon', 'night', 'morning', 'morning', 'afternoon', 'off'];
  const result: ShiftAssignment[] = [];
  const base = new Date('2026-05-25');
  EMPLOYEES.forEach((emp, eIdx) => {
    for (let d = 0; d < 7; d++) {
      const date = new Date(base);
      date.setDate(base.getDate() + d);
      const shift = shifts[(eIdx + d) % shifts.length];
      result.push({ employeeId: emp.id, date: date.toISOString().split('T')[0], shift });
    }
  });
  return result;
}

const MOCK_ASSIGNMENTS = buildMockAssignments();

const SHIFT_CONFIG: Record<ShiftType, { label: string; short: string; color: string; bg: string; icon: React.ReactNode; hours: string }> = {
  morning: { label: 'Sabah', short: 'S', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: <Sun className="h-3 w-3" />, hours: '06:00–14:00' },
  afternoon: { label: 'Öğleden Sonra', short: 'Ö', color: 'text-orange-700', bg: 'bg-orange-100', icon: <Sunset className="h-3 w-3" />, hours: '14:00–22:00' },
  night: { label: 'Gece', short: 'G', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: <Moon className="h-3 w-3" />, hours: '22:00–06:00' },
  off: { label: 'İzin', short: '—', color: 'text-muted-foreground', bg: 'bg-muted/50', icon: null, hours: '—' },
};

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function formatDate(offset: number): string {
  const base = new Date('2026-05-25');
  base.setDate(base.getDate() + offset);
  return base.toISOString().split('T')[0];
}

export default function ShiftsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [deptFilter, setDeptFilter] = useState('all');

  const { data: assignments = MOCK_ASSIGNMENTS } = useQuery<ShiftAssignment[]>({
    queryKey: ['shift-assignments', weekOffset],
    queryFn: async () => {
      const res = await fetch(`/api/v1/hr/shifts?week=${weekOffset}`);
      if (!res.ok) return MOCK_ASSIGNMENTS;
      return res.json();
    },
    initialData: MOCK_ASSIGNMENTS,
  });

  const weekDates = Array.from({ length: 7 }, (_, i) => formatDate(i + weekOffset * 7));
  const departments = Array.from(new Set(EMPLOYEES.map((e) => e.department)));

  const filteredEmployees = useMemo(() =>
    deptFilter === 'all' ? EMPLOYEES : EMPLOYEES.filter((e) => e.department === deptFilter),
    [deptFilter]
  );

  function getShift(empId: string, date: string): ShiftType {
    const a = assignments.find((a) => a.employeeId === empId && a.date === date);
    return a?.shift ?? 'off';
  }

  const shiftCounts = useMemo(() => {
    const counts: Record<ShiftType, number> = { morning: 0, afternoon: 0, night: 0, off: 0 };
    weekDates.forEach((date) => {
      EMPLOYEES.forEach((emp) => {
        counts[getShift(emp.id, date)]++;
      });
    });
    return counts;
  }, [assignments, weekDates]);

  const weekLabel = weekOffset === 0 ? 'Bu Hafta' : weekOffset === -1 ? 'Geçen Hafta' : weekOffset === 1 ? 'Gelecek Hafta' : `Hafta ${weekOffset > 0 ? '+' : ''}${weekOffset}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vardiya Planlama</h1>
          <p className="text-muted-foreground">Haftalık vardiya takvimi ve personel atama</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
          <PlusCircle className="h-4 w-4" /> Vardiya Ata
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { shift: 'morning' as const, label: 'Sabah Vardiyası' },
          { shift: 'afternoon' as const, label: 'Öğleden Sonra' },
          { shift: 'night' as const, label: 'Gece Vardiyası' },
          { shift: 'off' as const, label: 'İzin/Boş' },
        ].map(({ shift, label }) => {
          const cfg = SHIFT_CONFIG[shift];
          return (
            <div key={shift} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('flex items-center justify-center h-7 w-7 rounded-lg', cfg.bg, cfg.color)}>
                  {cfg.icon ?? <Users className="h-3.5 w-3.5" />}
                </span>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
              <p className="text-2xl font-bold">{shiftCounts[shift]}</p>
              <p className="text-xs text-muted-foreground">{cfg.hours}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg border border-border hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium min-w-28 text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg border border-border hover:bg-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Departman:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tümü</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left font-medium min-w-48">Personel</th>
                {weekDates.map((date, i) => (
                  <th key={date} className="px-3 py-2 text-center font-medium min-w-24">
                    <div>{DAY_NAMES[i]}</div>
                    <div className="text-xs font-normal text-muted-foreground">{date.slice(5)}</div>
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-medium">İzin</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const offCount = weekDates.filter((d) => getShift(emp.id, d) === 'off').length;
                return (
                  <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-2">
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.department} · {emp.position}</p>
                    </td>
                    {weekDates.map((date) => {
                      const shift = getShift(emp.id, date);
                      const cfg = SHIFT_CONFIG[shift];
                      return (
                        <td key={date} className="px-3 py-2 text-center">
                          <div className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium cursor-pointer hover:opacity-80', cfg.bg, cfg.color)}>
                            {cfg.icon}
                            {cfg.short}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center text-sm">{offCount}g</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-3">Vardiya Efsanesi</h3>
        <div className="flex flex-wrap gap-4">
          {(Object.entries(SHIFT_CONFIG) as [ShiftType, typeof SHIFT_CONFIG[ShiftType]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={cn('flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold', cfg.bg, cfg.color)}>
                {cfg.short}
              </span>
              <div>
                <p className="text-sm font-medium">{cfg.label}</p>
                <p className="text-xs text-muted-foreground">{cfg.hours}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
