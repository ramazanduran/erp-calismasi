'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  meeting:  { label: 'Toplantı',  color: 'text-blue-700',   bg: 'bg-blue-100' },
  deadline: { label: 'Son Tarih', color: 'text-red-700',    bg: 'bg-red-100' },
  reminder: { label: 'Hatırlatma', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  holiday:  { label: 'Tatil',     color: 'text-green-700',  bg: 'bg-green-100' },
  task:     { label: 'Görev',     color: 'text-purple-700', bg: 'bg-purple-100' },
  call:     { label: 'Arama',     color: 'text-orange-700', bg: 'bg-orange-100' },
};

const DOT_COLORS: Record<string, string> = {
  meeting:  'bg-blue-500',
  deadline: 'bg-red-500',
  reminder: 'bg-yellow-500',
  holiday:  'bg-green-500',
  task:     'bg-purple-500',
  call:     'bg-orange-500',
};

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location?: string;
  color?: string;
  status: string;
  createdBy?: { firstName: string; lastName: string } | null;
  attendees?: Array<{ name: string; email: string; status: string; isOrganizer: boolean }>;
}

function NewEventModal({ onClose, onSave, defaultDate }: { onClose: () => void; onSave: (d: any) => void; defaultDate?: string }) {
  const [form, setForm] = useState({
    title: '', type: 'meeting', startDate: defaultDate ? `${defaultDate}T09:00` : '', endDate: defaultDate ? `${defaultDate}T10:00` : '',
    isAllDay: false, location: '', description: '', status: 'confirmed',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni Etkinlik</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Başlık *</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tür</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isAllDay} onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })} />
                Tüm Gün
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Başlangıç *</label>
              <input type={form.isAllDay ? 'date' : 'datetime-local'} className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Bitiş *</label>
              <input type={form.isAllDay ? 'date' : 'datetime-local'} className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Lokasyon</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Toplantı odası, online link..." />
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const tc = TYPE_CONFIG[event.type];
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', tc?.bg, tc?.color)}>{tc?.label}</span>
            <h2 className="text-lg font-semibold mt-1">{event.title}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm p-1">✕</button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {event.isAllDay ? start.toLocaleDateString('tr-TR') : `${start.toLocaleString('tr-TR')} — ${end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Users className="h-4 w-4 mt-0.5" />
              <div>
                {event.attendees.map((a) => (
                  <div key={a.email} className="flex items-center gap-1">
                    <span>{a.name || a.email}</span>
                    {a.isOrganizer && <span className="text-xs">(Organizatör)</span>}
                    <span className={cn('text-xs ml-1', a.status === 'accepted' ? 'text-green-600' : a.status === 'declined' ? 'text-red-600' : 'text-gray-500')}>
                      {a.status === 'accepted' ? '✓' : a.status === 'declined' ? '✗' : '?'}
                    </span>
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

const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'ev1', title: 'Aylık Yönetim Toplantısı', type: 'meeting', startDate: '2026-05-27T10:00:00', endDate: '2026-05-27T11:30:00', isAllDay: false, location: 'Toplantı Odası A', status: 'confirmed', createdBy: { firstName: 'Ahmet', lastName: 'Yılmaz' } },
  { id: 'ev2', title: 'Q2 Bütçe Gözden Geçirme', type: 'meeting', startDate: '2026-05-28T14:00:00', endDate: '2026-05-28T16:00:00', isAllDay: false, location: 'Konferans Salonu', status: 'confirmed', createdBy: { firstName: 'Zeynep', lastName: 'Kaya' } },
  { id: 'ev3', title: 'Kontrat Yenileme Son Tarihi', type: 'deadline', startDate: '2026-06-05', endDate: '2026-06-05', isAllDay: true, status: 'confirmed' },
  { id: 'ev4', title: 'ERP Eğitim Günü', type: 'task', startDate: '2026-06-02T09:00:00', endDate: '2026-06-02T17:00:00', isAllDay: false, location: 'Eğitim Odası', status: 'confirmed' },
  { id: 'ev5', title: 'Tedarikçi Değerlendirme Toplantısı', type: 'meeting', startDate: '2026-05-29T09:30:00', endDate: '2026-05-29T11:00:00', isAllDay: false, status: 'confirmed', createdBy: { firstName: 'Mehmet', lastName: 'Demir' } },
  { id: 'ev6', title: 'İK Performans Görüşmeleri', type: 'meeting', startDate: '2026-06-10', endDate: '2026-06-12', isAllDay: true, status: 'tentative' },
  { id: 'ev7', title: 'Müşteri Sunumu — Anadolu Holding', type: 'call', startDate: '2026-05-30T11:00:00', endDate: '2026-05-30T12:00:00', isAllDay: false, status: 'confirmed', createdBy: { firstName: 'Zeynep', lastName: 'Kaya' } },
  { id: 'ev8', title: 'Kalite Denetimi', type: 'task', startDate: '2026-06-15', endDate: '2026-06-15', isAllDay: true, status: 'confirmed' },
];

export default function CalendarPage() {
  const qc = useQueryClient();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showForm, setShowForm] = useState(false);
  const [clickedDate, setClickedDate] = useState<string | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: eventsData = [] } = useQuery({
    queryKey: ['calendar', 'events', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: () => api.get('/api/v1/calendar', {
      from: monthStart.toISOString(),
      to: monthEnd.toISOString(),
    }),
  });

  const { data: upcomingData = [] } = useQuery({
    queryKey: ['calendar', 'upcoming'],
    queryFn: () => api.get('/api/v1/calendar/upcoming', { days: '14' }),
  });

  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);

  const create = useMutation({
    mutationFn: (data: any) => {
      if (eventsData === undefined) {
        const ne: CalendarEvent = { id: `ev${Date.now()}`, title: data.title, type: data.type, startDate: data.startDate, endDate: data.endDate, isAllDay: data.isAllDay, location: data.location, status: data.status ?? 'confirmed' };
        setLocalEvents((prev) => [...prev, ne]);
        setShowForm(false);
        return Promise.resolve();
      }
      return api.post('/api/v1/calendar', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar'] }); setShowForm(false); },
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/calendar/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });

  const events = useMemo<CalendarEvent[]>(() => {
    const raw = eventsData as unknown;
    if (Array.isArray(raw) && raw.length > 0) return raw as CalendarEvent[];
    if (eventsData !== undefined && Array.isArray(eventsData) && eventsData.length === 0) return [];
    if (eventsData === undefined || (Array.isArray(eventsData) && eventsData.length === 0)) {
      // fallback: show mock events for current month
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth();
      return MOCK_EVENTS.filter((e) => {
        const d = new Date(e.startDate);
        return d.getFullYear() === y && d.getMonth() === m;
      });
    }
    return eventsData as CalendarEvent[];
  }, [eventsData, currentDate]);

  const upcoming = useMemo<CalendarEvent[]>(() => {
    const raw = upcomingData as unknown;
    if (Array.isArray(raw) && raw.length > 0) return raw as CalendarEvent[];
    if (upcomingData !== undefined) return [];
    const today = new Date('2026-05-27');
    const limit = new Date('2026-06-10');
    return MOCK_EVENTS.filter((e) => {
      const d = new Date(e.startDate);
      return d >= today && d <= limit;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [upcomingData]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const startDay = new Date(monthStart);
    const dayOfWeek = startDay.getDay() === 0 ? 6 : startDay.getDay() - 1;
    startDay.setDate(startDay.getDate() - dayOfWeek);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDay));
      startDay.setDate(startDay.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const getEventsForDay = (day: Date) => {
    const dayStr = day.toISOString().split('T')[0];
    return events.filter((ev) => ev.startDate.split('T')[0] === dayStr);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Takvim</h1>
          <p className="text-muted-foreground mt-1">Etkinlikler, toplantılar ve hatırlatmalar</p>
        </div>
        <button onClick={() => { setClickedDate(undefined); setShowForm(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
          <PlusCircle className="h-4 w-4" />Yeni Etkinlik
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-3">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button onClick={prevMonth} className="p-1.5 rounded hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
              <h2 className="font-semibold">{MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <button onClick={nextMonth} className="p-1.5 rounded hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = day.toDateString() === today.toDateString();
                const dayEvents = getEventsForDay(day);
                const dayStr = day.toISOString().split('T')[0];

                return (
                  <div key={i} className={cn('min-h-[80px] p-1 border-b border-r border-border cursor-pointer hover:bg-muted/30', !isCurrentMonth && 'bg-muted/10', i % 7 === 6 && 'border-r-0')}
                    onClick={() => { setClickedDate(dayStr); setShowForm(true); }}>
                    <div className={cn('text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1', isToday ? 'bg-primary text-primary-foreground' : !isCurrentMonth ? 'text-muted-foreground' : '')}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div key={ev.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                          className={cn('text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80', TYPE_CONFIG[ev.type]?.bg, TYPE_CONFIG[ev.type]?.color)}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-xs text-muted-foreground px-1">+{dayEvents.length - 2} daha</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />Yaklaşan Etkinlikler
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground">14 gün içinde etkinlik yok</p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 8).map((ev) => {
                  const tc = TYPE_CONFIG[ev.type];
                  return (
                    <div key={ev.id} className="flex items-start gap-2 cursor-pointer hover:bg-muted/30 rounded p-1" onClick={() => setSelectedEvent(ev)}>
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', DOT_COLORS[ev.type])} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ev.startDate).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {!ev.isAllDay && ` • ${new Date(ev.startDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2">Etkinlik Türleri</h3>
            <div className="space-y-1.5">
              {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-sm', config.bg)} />
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showForm && <NewEventModal defaultDate={clickedDate} onClose={() => setShowForm(false)} onSave={(d) => create.mutate(d)} />}
      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
