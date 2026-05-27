'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, X, Eye, FileText, Target, Search, ChevronRight,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

type A3Status = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

interface A3Project {
  id: string;
  title: string;
  problem: string;
  background: string;
  currentState: string;
  targetState: string;
  rootCause: string;
  countermeasures: string;
  actionPlan: string;
  followUp: string;
  status: A3Status;
  owner: string;
  department: string;
  createdAt: string;
  targetDate?: string;
}

const STATUS_LABELS: Record<A3Status, string> = {
  OPEN: 'Açık',
  IN_PROGRESS: 'Devam Ediyor',
  CLOSED: 'Kapatıldı',
};

const STATUS_COLORS: Record<A3Status, string> = {
  OPEN: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-green-100 text-green-700',
};

const MOCK_A3: A3Project[] = [
  {
    id: '1',
    title: 'Hat-2 Ürün Hata Oranı Azaltma',
    problem: 'Hat-2\'de son 3 ayda ürün hata oranı %7\'ye ulaştı. Hedef %2\'nin altına indirmek.',
    background: 'Müşteri şikayetleri %40 arttı. Kalite maliyeti aylık ₺85,000\'e yükseldi.',
    currentState: 'Hata oranı: %7 | Aylık hatalı ürün: ~420 adet | En sık hata: Boyut hatası (%45)',
    targetState: 'Hata oranı: <%2 | Aylık hatalı ürün: <120 adet | Müşteri şikayeti: 0',
    rootCause: 'Kök neden: Kalıp aşınması + Operatör eğitim eksikliği\n5 Neden: Kalıp değişim periyodu çok uzun → Bütçe kısıtı → Planlama eksikliği → Önceliklendirme sorunu → Yönetim farkındalığı yok',
    countermeasures: '1. Kalıp değişim periyodunu 500 saate indirmek\n2. Operatör gözlem kontrol listesi oluşturmak\n3. Hat başında görsel standart yayınlamak',
    actionPlan: 'Hafta 1: Kalıp envanteri çıkar (Ahmet Y.)\nHafta 2: Yeni periyot planı yap (Bakım)\nHafta 3: OPL yayınla (Kalite)\nHafta 4: Pilot uygula',
    followUp: 'Aylık hata oranı takibi. 3. ayda doğrulama denetimi. Başarı kriteri: 2 ay üst üste <%2.',
    status: 'IN_PROGRESS',
    owner: 'Ahmet Yılmaz',
    department: 'Üretim',
    createdAt: '2026-05-10',
    targetDate: '2026-06-30',
  },
  {
    id: '2',
    title: 'Satın Alma Onay Süresi Azaltma',
    problem: 'Satın alma onay süreci ortalama 8 gün sürüyor. Bu gecikme üretimi durduruyor.',
    background: 'Son çeyrekte 12 üretim durması yaşandı, bunların %60\'ı malzeme bekleme kaynaklı.',
    currentState: 'Ortalama onay süresi: 8 gün | En uzun adım: Müdür onayı (3 gün) | Dijitalleşme oranı: %20',
    targetState: 'Ortalama onay süresi: <2 gün | Tüm süreç dijital | Acil onay: <4 saat',
    rootCause: 'Kök neden: Manuel onay süreçleri + Müdür erişilebilirlik sorunu\nSüreç: Kağıt form → Asistan → Müdür masasında bekler → İmza → Tekrar yazışma',
    countermeasures: '1. ERP üzerinde dijital onay akışı kurmak\n2. Mobil onay bildirimi aktif etmek\n3. ₺5,000 altı alımlar için ön onaysız süreç oluşturmak',
    actionPlan: 'Sprint 1: ERP onay modülü konfigürasyonu (IT)\nSprint 2: Mobil bildirim entegrasyonu\nSprint 3: Kullanıcı eğitimi\nSprint 4: Canlıya geçiş',
    followUp: '1. ay: Süre ölçümü | 2. ay: Değerlendirme | 3. ay: Standardizasyon',
    status: 'OPEN',
    owner: 'Fatma Kaya',
    department: 'Satın Alma',
    createdAt: '2026-05-18',
    targetDate: '2026-07-15',
  },
  {
    id: '3',
    title: 'Depo 5S ve Ergonomi İyileştirme',
    problem: 'Depo-B\'de malzeme arama süresi fazla, ergonomik olmayan yerleşim yorgunluğa yol açıyor.',
    background: '5S denetiminde Depo-B en düşük puan alan bölge (12/25). Personel şikayeti var.',
    currentState: '5S puanı: 12/25 | Ortalama malzeme bulma: 8 dk | Ergonomi hatası: 4 adet',
    targetState: '5S puanı: >20/25 | Malzeme bulma: <2 dk | Ergonomi hatası: 0',
    rootCause: 'Kök neden: Standart yerleşim planı yok + Kırmızı etiket kampanyası hiç yapılmamış',
    countermeasures: '1. Kırmızı etiket kampanyası (gereksiz malzemeleri temizle)\n2. ABC yerleşim düzeni (A: sık kullanılan → ön raf)\n3. Görsel etiketleme sistemi kur',
    actionPlan: 'Gün 1-2: Kırmızı etiket etkinliği | Gün 3-5: Yeniden yerleşim | Gün 6-7: Etiketleme | Gün 8: Denetim',
    followUp: 'Aylık 5S denetimi ile takip. 6 ay içinde puan >22 hedefi.',
    status: 'CLOSED',
    owner: 'Mehmet Sarı',
    department: 'Lojistik',
    createdAt: '2026-04-01',
    targetDate: '2026-04-30',
  },
  {
    id: '4',
    title: 'Müşteri Şikayet Yanıt Süresinin Azaltılması',
    problem: 'Müşteri şikayetlerine ortalama yanıt süresi 5 gün. Müşteri memnuniyeti düşüyor.',
    background: 'NPS skoru 6 ay içinde 72\'den 58\'e düştü. Şikayet sayısı %30 arttı.',
    currentState: 'Ortalama yanıt: 5 gün | Çözüm oranı ilk temas: %35 | Şikayet izleme: manuel',
    targetState: 'Ortalama yanıt: <24 saat | Çözüm oranı ilk temas: >%60 | Dijital şikayet sistemi',
    rootCause: 'Kök neden: Şikayetler e-posta ile yönetiliyor, atama mekanizması yok',
    countermeasures: '1. CRM modülünde şikayet ticket sistemi aktif et\n2. SLA kuralları tanımla\n3. Eskalasyon matrisi oluştur',
    actionPlan: 'Hafta 1-2: CRM yapılandırması | Hafta 3: SLA tanımı | Hafta 4: Pilot | Ay 2: Canlı geçiş',
    followUp: 'Haftalık yanıt süresi raporu. Aylık müşteri memnuniyeti anketi.',
    status: 'IN_PROGRESS',
    owner: 'Zeynep Arslan',
    department: 'Satış',
    createdAt: '2026-05-22',
    targetDate: '2026-07-01',
  },
];

interface NewA3ModalProps {
  onClose: () => void;
  onSave: (data: Partial<A3Project>) => void;
}

function NewA3Modal({ onClose, onSave }: NewA3ModalProps) {
  const [form, setForm] = useState({ title: '', problem: '', department: 'Üretim', owner: '', targetDate: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Yeni A3 Projesi</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Başlık</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Problem Tanımı</label>
            <textarea rows={3} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Departman</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {['Üretim', 'Kalite', 'Lojistik', 'Satış', 'Satın Alma', 'İK', 'Finans', 'IT'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hedef Tarih</label>
              <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sorumlu</label>
            <input type="text" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">İptal</button>
          <button onClick={() => { onSave(form); onClose(); }}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Oluştur</button>
        </div>
      </div>
    </div>
  );
}

function A3DetailModal({ project, onClose }: { project: A3Project; onClose: () => void }) {
  const sections = [
    { label: '1. Arka Plan', value: project.background, color: 'border-blue-200' },
    { label: '2. Mevcut Durum', value: project.currentState, color: 'border-orange-200' },
    { label: '3. Hedef Durum', value: project.targetState, color: 'border-green-200' },
    { label: '4. Kök Neden Analizi', value: project.rootCause, color: 'border-red-200' },
    { label: '5. Karşı Önlemler', value: project.countermeasures, color: 'border-purple-200' },
    { label: '6. Aksiyon Planı', value: project.actionPlan, color: 'border-yellow-200' },
    { label: '7. Takip & Doğrulama', value: project.followUp, color: 'border-teal-200' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6">
      <div className="w-full max-w-5xl rounded-xl border border-border bg-card shadow-lg mx-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{project.title}</h2>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[project.status])}>
                {STATUS_LABELS[project.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{project.department} · {project.owner} · Hedef: {project.targetDate ?? '-'}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5">
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 mb-4">
            <p className="text-xs font-semibold text-orange-700 mb-1">PROBLEM TANIMI</p>
            <p className="text-sm">{project.problem}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {sections.slice(0, 3).map((s) => (
              <div key={s.label} className={cn('rounded-lg border p-4', s.color)}>
                <p className="text-xs font-semibold text-muted-foreground mb-2">{s.label}</p>
                <p className="text-sm whitespace-pre-wrap">{s.value || '—'}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-700 mb-2">{sections[3].label}</p>
            <p className="text-sm whitespace-pre-wrap">{sections[3].value || '—'}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mt-3">
            {sections.slice(4).map((s) => (
              <div key={s.label} className={cn('rounded-lg border p-4', s.color)}>
                <p className="text-xs font-semibold text-muted-foreground mb-2">{s.label}</p>
                <p className="text-sm whitespace-pre-wrap">{s.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function A3Page() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<A3Project | null>(null);

  const { data: projects = MOCK_A3 } = useQuery<A3Project[]>({
    queryKey: ['kaizen-a3'],
    queryFn: async () => {
      const res = await fetch('/api/v1/kaizen/a3');
      if (!res.ok) return MOCK_A3;
      return res.json();
    },
    initialData: MOCK_A3,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<A3Project>) => {
      const res = await fetch('/api/v1/kaizen/a3', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kaizen-a3'] }),
  });

  const filtered = projects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q) || p.department.toLowerCase().includes(q);
  });

  const handleExport = () => {
    const rows = filtered.map((p) => ({
      'Başlık': p.title,
      'Departman': p.department,
      'Sorumlu': p.owner,
      'Durum': STATUS_LABELS[p.status],
      'Hedef Tarih': p.targetDate ?? '',
      'Oluşturulma': p.createdAt,
    }));
    exportToExcel(rows, 'a3-projeleri', 'A3 Projeleri');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">A3 Problem Çözme</h1>
          <p className="text-muted-foreground">Toyota A3 metodolojisi ile yapılandırılmış problem çözme süreci</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Yeni A3
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Açık A3'ler</p>
          <p className="mt-1 text-2xl font-bold">{projects.filter((p) => p.status === 'OPEN').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Devam Eden</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{projects.filter((p) => p.status === 'IN_PROGRESS').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Kapatılan</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{projects.filter((p) => p.status === 'CLOSED').length}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="A3 ara..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Başlık</th>
              <th className="px-4 py-3 text-left font-medium">Departman</th>
              <th className="px-4 py-3 text-left font-medium">Sorumlu</th>
              <th className="px-4 py-3 text-left font-medium">Durum</th>
              <th className="px-4 py-3 text-left font-medium">Hedef Tarih</th>
              <th className="px-4 py-3 text-left font-medium">Oluşturulma</th>
              <th className="px-4 py-3 text-left font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((project) => (
              <tr key={project.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{project.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{project.department}</td>
                <td className="px-4 py-3">{project.owner}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[project.status])}>
                    {STATUS_LABELS[project.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {project.targetDate ? new Date(project.targetDate).toLocaleDateString('tr-TR') : '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(project.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelected(project)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Canvas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && <NewA3Modal onClose={() => setShowNew(false)} onSave={(d) => createMutation.mutate(d)} />}
      {selected && <A3DetailModal project={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
