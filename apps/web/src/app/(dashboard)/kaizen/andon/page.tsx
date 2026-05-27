'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, AlertCircle, CheckCircle2, Zap, Plus, X,
  Clock, User, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StationStatus = 'green' | 'yellow' | 'red';
type EventType = 'quality' | 'safety' | 'breakdown' | 'material' | 'process';
type EventSeverity = 'warning' | 'critical';

interface AndonStation {
  id: string;
  name: string;
  department: string;
  type: 'production' | 'office';
  status: StationStatus;
  issue?: string;
  operator?: string;
  lastUpdated: string;
}

interface AndonEvent {
  id: string;
  stationId: string;
  stationName: string;
  department: string;
  eventType: EventType;
  severity: EventSeverity;
  description: string;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  status: 'active' | 'resolved';
}

const MOCK_STATIONS: AndonStation[] = [
  { id: '1', name: 'Hat-1', department: 'Üretim', type: 'production', status: 'green', operator: 'Ahmet Y.', lastUpdated: '2026-05-27T09:55:00' },
  { id: '2', name: 'Hat-2', department: 'Üretim', type: 'production', status: 'red', issue: 'Makine arızası - M205', operator: 'Fatma K.', lastUpdated: '2026-05-27T09:30:00' },
  { id: '3', name: 'Hat-3', department: 'Üretim', type: 'production', status: 'yellow', issue: 'Malzeme eksik', operator: 'Mehmet S.', lastUpdated: '2026-05-27T09:45:00' },
  { id: '4', name: 'Kontrol', department: 'Üretim', type: 'production', status: 'green', operator: 'Zeynep A.', lastUpdated: '2026-05-27T10:00:00' },
  { id: '5', name: 'Ambalaj', department: 'Üretim', type: 'production', status: 'green', operator: 'Ali B.', lastUpdated: '2026-05-27T09:58:00' },
  { id: '6', name: 'Depo-A', department: 'Lojistik', type: 'production', status: 'green', operator: 'Hasan Ö.', lastUpdated: '2026-05-27T10:00:00' },
  { id: '7', name: 'Depo-B', department: 'Lojistik', type: 'production', status: 'yellow', issue: '5S ihlali tespit edildi', operator: 'Elif T.', lastUpdated: '2026-05-27T09:20:00' },
  { id: '8', name: 'Sevkiyat', department: 'Lojistik', type: 'production', status: 'green', operator: 'Murat D.', lastUpdated: '2026-05-27T10:02:00' },
  { id: '9', name: 'Muhasebe', department: 'Ofis', type: 'office', status: 'green', operator: 'Selin K.', lastUpdated: '2026-05-27T10:00:00' },
  { id: '10', name: 'IT Destek', department: 'Ofis', type: 'office', status: 'red', issue: 'Sistem kesintisi - ERP sunucu', operator: 'Can A.', lastUpdated: '2026-05-27T09:10:00' },
  { id: '11', name: 'Satın Alma', department: 'Ofis', type: 'office', status: 'green', operator: 'Derya M.', lastUpdated: '2026-05-27T10:00:00' },
  { id: '12', name: 'İK', department: 'Ofis', type: 'office', status: 'green', operator: 'Burcu S.', lastUpdated: '2026-05-27T10:00:00' },
];

const MOCK_EVENTS: AndonEvent[] = [
  { id: '1', stationId: '2', stationName: 'Hat-2', department: 'Üretim', eventType: 'breakdown', severity: 'critical', description: 'M205 makinesi beklenmedik arıza. Bakım ekibi çağrıldı.', reportedBy: 'Fatma K.', reportedAt: '2026-05-27T09:30:00', status: 'active' },
  { id: '2', stationId: '10', stationName: 'IT Destek', department: 'Ofis', eventType: 'process', severity: 'critical', description: 'ERP sunucu bağlantısı kesik. IT departmanı müdahale ediyor.', reportedBy: 'Can A.', reportedAt: '2026-05-27T09:10:00', status: 'active' },
  { id: '3', stationId: '7', stationName: 'Depo-B', department: 'Lojistik', eventType: 'quality', severity: 'warning', description: '5S standardına uygun olmayan eşya yerleşimi tespit edildi.', reportedBy: 'Elif T.', reportedAt: '2026-05-27T09:20:00', status: 'active' },
  { id: '4', stationId: '3', stationName: 'Hat-3', department: 'Üretim', eventType: 'material', severity: 'warning', description: 'A-201 hammadde stoğu kritik seviyeye ulaştı.', reportedBy: 'Mehmet S.', reportedAt: '2026-05-27T09:45:00', status: 'active' },
];

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  quality: 'Kalite', safety: 'Güvenlik', breakdown: 'Arıza', material: 'Malzeme', process: 'Süreç',
};

const STATUS_BG: Record<StationStatus, string> = {
  green: 'bg-green-50 border-green-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  red: 'bg-red-50 border-red-200',
};

const STATUS_DOT: Record<StationStatus, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500 animate-pulse',
};

interface PullCordModalProps {
  stations: AndonStation[];
  onClose: () => void;
  onSave: (data: Partial<AndonEvent>) => void;
}

function PullCordModal({ stations, onClose, onSave }: PullCordModalProps) {
  const [form, setForm] = useState({
    stationId: '',
    eventType: 'breakdown' as EventType,
    severity: 'warning' as EventSeverity,
    description: '',
    reportedBy: '',
  });

  const selectedStation = stations.find((s) => s.id === form.stationId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Andon İpini Çek</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">İstasyon</label>
            <select value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Seçin...</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.department} — {s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Olay Tipi</label>
              <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value as EventType })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="breakdown">Arıza</option>
                <option value="quality">Kalite</option>
                <option value="safety">Güvenlik</option>
                <option value="material">Malzeme</option>
                <option value="process">Süreç</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Önem</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as EventSeverity })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="warning">Uyarı</option>
                <option value="critical">Kritik</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Açıklama</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bildiren</label>
            <input type="text" value={form.reportedBy} onChange={(e) => setForm({ ...form, reportedBy: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">İptal</button>
          <button
            onClick={() => { onSave({ ...form, stationName: selectedStation?.name, department: selectedStation?.department }); onClose(); }}
            className="flex items-center gap-2 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            <Zap className="h-4 w-4" />
            İpi Çek
          </button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} sa önce`;
  return `${Math.floor(hrs / 24)} gün önce`;
}

export default function AndonPage() {
  const queryClient = useQueryClient();
  const [showPullCord, setShowPullCord] = useState(false);

  const { data: stations = MOCK_STATIONS } = useQuery<AndonStation[]>({
    queryKey: ['andon-stations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/kaizen/andon/stations');
      if (!res.ok) return MOCK_STATIONS;
      return res.json();
    },
    initialData: MOCK_STATIONS,
    refetchInterval: 30000,
  });

  const { data: events = MOCK_EVENTS } = useQuery<AndonEvent[]>({
    queryKey: ['andon-events'],
    queryFn: async () => {
      const res = await fetch('/api/v1/kaizen/andon/events');
      if (!res.ok) return MOCK_EVENTS;
      return res.json();
    },
    initialData: MOCK_EVENTS,
  });

  const pullCordMutation = useMutation({
    mutationFn: async (data: Partial<AndonEvent>) => {
      const res = await fetch('/api/v1/kaizen/andon/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['andon-events'] });
      queryClient.invalidateQueries({ queryKey: ['andon-stations'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/kaizen/andon/events/${id}/resolve`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['andon-events'] }),
  });

  const activeEvents = events.filter((e) => e.status === 'active');
  const greenCount = stations.filter((s) => s.status === 'green').length;
  const yellowCount = stations.filter((s) => s.status === 'yellow').length;
  const redCount = stations.filter((s) => s.status === 'red').length;

  const departments = [...new Set(stations.map((s) => s.department))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dijital Andon Panosu</h1>
          <p className="text-muted-foreground">Üretim ve ofis alanlarında anlık durum izleme ve alert yönetimi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['andon-stations'] });
              queryClient.invalidateQueries({ queryKey: ['andon-events'] });
            }}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
          <button
            onClick={() => setShowPullCord(true)}
            className="flex items-center gap-2 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700"
          >
            <Zap className="h-4 w-4" />
            Andon İpini Çek
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-sm text-green-700">Yeşil İstasyonlar</p>
          <p className="mt-1 text-3xl font-bold text-green-700">{greenCount}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
          <p className="text-sm text-yellow-700">Sarı Uyarılar</p>
          <p className="mt-1 text-3xl font-bold text-yellow-700">{yellowCount}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-red-700">Kırmızı Alarmlar</p>
          <p className="mt-1 text-3xl font-bold text-red-700">{redCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Aktif Olaylar</p>
          <p className="mt-1 text-3xl font-bold">{activeEvents.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-5">
          <h2 className="font-semibold text-lg">İstasyon Durumu</h2>
          {departments.map((dept) => (
            <div key={dept}>
              <p className="text-sm font-medium text-muted-foreground mb-2">{dept}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stations.filter((s) => s.department === dept).map((station) => (
                  <div
                    key={station.id}
                    className={cn(
                      'rounded-xl border p-4',
                      STATUS_BG[station.status],
                      station.status === 'red' && 'ring-2 ring-red-400'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{station.name}</p>
                      <span className={cn('h-3 w-3 rounded-full', STATUS_DOT[station.status])} />
                    </div>
                    {station.operator && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <User className="h-3 w-3" />
                        {station.operator}
                      </div>
                    )}
                    {station.issue && (
                      <p className="text-xs font-medium text-red-700 mt-1 line-clamp-2">{station.issue}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(station.lastUpdated)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <h2 className="font-semibold text-lg mb-4">Aktif Olaylar</h2>
          <div className="space-y-3">
            {activeEvents.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                Aktif olay bulunmuyor
              </div>
            )}
            {[...activeEvents].sort((a, b) => (a.severity === 'critical' ? -1 : 1)).map((event) => (
              <div
                key={event.id}
                className={cn(
                  'rounded-xl border p-4',
                  event.severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                )}
              >
                <div className="flex items-start gap-3">
                  {event.severity === 'critical'
                    ? <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    : <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{event.stationName}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{event.department}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                        event.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>
                        {EVENT_TYPE_LABELS[event.eventType]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{event.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{timeAgo(event.reportedAt)}</span>
                      <button
                        onClick={() => resolveMutation.mutate(event.id)}
                        className="rounded-lg border border-border bg-white px-3 py-1 text-xs font-medium hover:bg-muted"
                      >
                        Çözüldü
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPullCord && (
        <PullCordModal
          stations={stations}
          onClose={() => setShowPullCord(false)}
          onSave={(data) => pullCordMutation.mutate(data)}
        />
      )}
    </div>
  );
}
