'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Download, X, Phone, Mail, Users,
  Calendar, CheckSquare, MessageSquare, Video, Clock,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

type ActivityType = 'call' | 'email' | 'meeting' | 'demo' | 'followup' | 'task' | 'note';
type ActivityStatus = 'planned' | 'completed' | 'cancelled' | 'overdue';
type RelatedType = 'lead' | 'deal' | 'customer';

interface CRMActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  relatedType: RelatedType;
  relatedName: string;
  assignedTo: string;
  dueDate: string;
  completedAt?: string;
  status: ActivityStatus;
  duration?: number;
  outcome?: string;
  nextAction?: string;
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  call: 'Telefon', email: 'E-posta', meeting: 'Toplantı',
  demo: 'Demo', followup: 'Takip', task: 'Görev', note: 'Not',
};

const ACTIVITY_ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  call: Phone, email: Mail, meeting: Users,
  demo: Video, followup: Clock, task: CheckSquare, note: MessageSquare,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  call: 'bg-green-100 text-green-700',
  email: 'bg-blue-100 text-blue-700',
  meeting: 'bg-purple-100 text-purple-700',
  demo: 'bg-orange-100 text-orange-700',
  followup: 'bg-yellow-100 text-yellow-700',
  task: 'bg-teal-100 text-teal-700',
  note: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS: Record<ActivityStatus, string> = {
  planned: 'Planlandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  overdue: 'Gecikti',
};

const STATUS_COLORS: Record<ActivityStatus, string> = {
  planned: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  overdue: 'bg-red-100 text-red-700',
};

const RELATED_COLORS: Record<RelatedType, string> = {
  lead: 'bg-yellow-100 text-yellow-700',
  deal: 'bg-purple-100 text-purple-700',
  customer: 'bg-blue-100 text-blue-700',
};

const MOCK_ACTIVITIES: CRMActivity[] = [
  { id: '1', type: 'call', title: 'Keşif Görüşmesi', relatedType: 'lead', relatedName: 'Akın Tekstil A.Ş.', assignedTo: 'Zeynep A.', dueDate: '2026-05-28T10:00:00', status: 'planned', description: 'İhtiyaç analizi ve bütçe değerlendirmesi yapılacak.' },
  { id: '2', type: 'demo', title: 'ERP Demo Sunumu', relatedType: 'deal', relatedName: 'Kaya Makina Ltd.', assignedTo: 'Ali B.', dueDate: '2026-05-29T14:00:00', status: 'planned', duration: 90, description: 'Üretim modülü detaylı demo. IT müdürü de katılacak.' },
  { id: '3', type: 'email', title: 'Teklif Gönderildi', relatedType: 'deal', relatedName: 'Star Gıda San.', assignedTo: 'Fatma K.', dueDate: '2026-05-26T09:00:00', completedAt: '2026-05-26T09:15:00', status: 'completed', outcome: 'Teklif PDF gönderildi. 3 gün içinde dönüş bekleniyor.' },
  { id: '4', type: 'meeting', title: 'Sözleşme Müzakeresi', relatedType: 'deal', relatedName: 'Güven Lojistik A.Ş.', assignedTo: 'Zeynep A.', dueDate: '2026-05-27T15:00:00', status: 'planned', duration: 60 },
  { id: '5', type: 'followup', title: 'Demo Sonrası Takip', relatedType: 'lead', relatedName: 'Mavi Deniz Ltd.', assignedTo: 'Ahmet Y.', dueDate: '2026-05-25T11:00:00', status: 'overdue', description: 'Demo sonrası sorular yanıtlanacak.' },
  { id: '6', type: 'task', title: 'Referans Müşteri Bağlantısı', relatedType: 'deal', relatedName: 'Eksen Yazılım', assignedTo: 'Ali B.', dueDate: '2026-05-30T17:00:00', status: 'planned', description: 'Benzer sektörden referans müşteri bağlantısı sağlanacak.' },
  { id: '7', type: 'call', title: 'Fiyat Görüşmesi', relatedType: 'customer', relatedName: 'Türk Metal A.Ş.', assignedTo: 'Fatma K.', dueDate: '2026-05-24T10:00:00', completedAt: '2026-05-24T10:45:00', status: 'completed', duration: 45, outcome: 'Yıllık bakım paketi uzatıldı. Yeni modül talebi var.', nextAction: 'Yeni modül teklifi hazırla' },
  { id: '8', type: 'note', title: 'Rakip Analiz Notu', relatedType: 'deal', relatedName: 'Kaya Makina Ltd.', assignedTo: 'Ali B.', dueDate: '2026-05-27T09:00:00', status: 'completed', completedAt: '2026-05-27T09:00:00', description: 'Müşteri SAP ve Logo ile de görüşüyor. Fiyat avantajımız var.' },
];

interface NewActivityModalProps {
  onClose: () => void;
  onSave: (d: Partial<CRMActivity>) => void;
}

function NewActivityModal({ onClose, onSave }: NewActivityModalProps) {
  const [form, setForm] = useState({
    type: 'call' as ActivityType,
    title: '',
    relatedType: 'lead' as RelatedType,
    relatedName: '',
    assignedTo: '',
    dueDate: '',
    description: '',
    duration: '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Yeni Aktivite</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map((t) => {
              const Icon = ACTIVITY_ICONS[t];
              return (
                <button key={t} onClick={() => setForm({ ...form, type: t })}
                  className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                    form.type === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                  <Icon className="h-3.5 w-3.5" />
                  {ACTIVITY_LABELS[t]}
                </button>
              );
            })}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Başlık</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">İlgili Kayıt Türü</label>
              <select value={form.relatedType} onChange={(e) => setForm({ ...form, relatedType: e.target.value as RelatedType })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="lead">Lead</option>
                <option value="deal">Fırsat</option>
                <option value="customer">Müşteri</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">İlgili Kayıt Adı</label>
              <input type="text" value={form.relatedName} onChange={(e) => setForm({ ...form, relatedName: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Atanan Kişi</label>
              <input type="text" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tarih & Saat</label>
              <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          {(form.type === 'call' || form.type === 'meeting' || form.type === 'demo') && (
            <div>
              <label className="block text-sm font-medium mb-1">Süre (dakika)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Açıklama</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">İptal</button>
          <button onClick={() => { onSave(form); onClose(); }}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Kaydet</button>
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>('all');
  const [showNew, setShowNew] = useState(false);

  const { data: activities = MOCK_ACTIVITIES } = useQuery<CRMActivity[]>({
    queryKey: ['crm-activities'],
    queryFn: async () => {
      const res = await fetch('/api/v1/crm/activities');
      if (!res.ok) return MOCK_ACTIVITIES;
      return res.json();
    },
    initialData: MOCK_ACTIVITIES,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<CRMActivity>) => {
      const res = await fetch('/api/v1/crm/activities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-activities'] }),
  });

  const filtered = useMemo(() => {
    let list = activities;
    if (typeFilter !== 'all') list = list.filter((a) => a.type === typeFilter);
    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.relatedName.toLowerCase().includes(q) || a.assignedTo.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [activities, typeFilter, statusFilter, search]);

  const stats = useMemo(() => ({
    planned: activities.filter((a) => a.status === 'planned').length,
    completed: activities.filter((a) => a.status === 'completed').length,
    overdue: activities.filter((a) => a.status === 'overdue').length,
    today: activities.filter((a) => {
      const d = new Date(a.dueDate);
      const now = new Date();
      return d.toDateString() === now.toDateString() && a.status === 'planned';
    }).length,
  }), [activities]);

  const handleExport = () => {
    const rows = filtered.map((a) => ({
      'Tür': ACTIVITY_LABELS[a.type],
      'Başlık': a.title,
      'İlgili': `${a.relatedName} (${a.relatedType})`,
      'Atanan': a.assignedTo,
      'Tarih': new Date(a.dueDate).toLocaleDateString('tr-TR'),
      'Durum': STATUS_LABELS[a.status],
      'Sonuç': a.outcome ?? '',
    }));
    exportToExcel(rows, 'crm-aktiviteler', 'Aktiviteler');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM Aktiviteleri</h1>
          <p className="text-muted-foreground">Müşteri, lead ve fırsatlarla ilgili tüm aktivite ve takip kayıtları</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Yeni Aktivite
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Bugün</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{stats.today}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Planlandı</p>
          <p className="mt-1 text-2xl font-bold">{stats.planned}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-sm text-green-700">Tamamlandı</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-red-700">Geciken</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{stats.overdue}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Aktivite ara..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-56" />
        </div>
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setTypeFilter('all')}
            className={cn('rounded-full px-3 py-1 text-sm font-medium', typeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
            Tümü
          </button>
          {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map((t) => {
            const Icon = ACTIVITY_ICONS[t];
            return (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
                  typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                <Icon className="h-3 w-3" />
                {ACTIVITY_LABELS[t]}
              </button>
            );
          })}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ActivityStatus | 'all')}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">Tüm Durumlar</option>
          {(Object.keys(STATUS_LABELS) as ActivityStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.type];
          const isOverdue = activity.status === 'overdue';
          return (
            <div key={activity.id} className={cn('rounded-xl border bg-card p-4 shadow-sm', isOverdue && 'border-red-200 bg-red-50/30')}>
              <div className="flex items-start gap-4">
                <div className={cn('rounded-lg p-2 shrink-0', ACTIVITY_COLORS[activity.type])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <p className="font-semibold">{activity.title}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', ACTIVITY_COLORS[activity.type])}>
                      {ACTIVITY_LABELS[activity.type]}
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', RELATED_COLORS[activity.relatedType])}>
                      {activity.relatedType === 'lead' ? 'Lead' : activity.relatedType === 'deal' ? 'Fırsat' : 'Müşteri'}: {activity.relatedName}
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[activity.status])}>
                      {STATUS_LABELS[activity.status]}
                    </span>
                  </div>
                  {activity.description && <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>}
                  {activity.outcome && (
                    <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-1.5 mb-2">
                      <span className="font-medium">Sonuç:</span> {activity.outcome}
                    </p>
                  )}
                  {activity.nextAction && (
                    <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5 mb-2">
                      <span className="font-medium">Sonraki Adım:</span> {activity.nextAction}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(activity.dueDate).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {activity.duration && <span>{activity.duration} dk</span>}
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {activity.assignedTo}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            Aktivite bulunamadı
          </div>
        )}
      </div>

      {showNew && <NewActivityModal onClose={() => setShowNew(false)} onSave={(d) => createMutation.mutate(d)} />}
    </div>
  );
}
