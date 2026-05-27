'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Search, FileDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { exportToExcel } from '@/lib/utils/excel-export';

type KaizenStatus = 'DRAFT' | 'ON_REVIEW' | 'APPROVED' | 'ACTION_PLAN' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
type MudaType =
  | 'OVERPRODUCTION'
  | 'WAITING'
  | 'TRANSPORTATION'
  | 'INAPPROPRIATE_PROCESSING'
  | 'UNNECESSARY_INVENTORY'
  | 'UNNECESSARY_MOTION'
  | 'DEFECTS'
  | 'UNDERUTILIZED_TALENT';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface KaizenProposal {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  departmentName: string;
  mudaTypes: MudaType[];
  status: KaizenStatus;
  priority: Priority;
  createdAt: string;
  approvedAt?: string;
  roiEstimate?: number;
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

const MUDA_LABELS: Record<MudaType, string> = {
  OVERPRODUCTION: 'Aşırı Üretim',
  WAITING: 'Bekleme',
  TRANSPORTATION: 'Taşıma',
  INAPPROPRIATE_PROCESSING: 'Gereksiz İşlem',
  UNNECESSARY_INVENTORY: 'Gereksiz Stok',
  UNNECESSARY_MOTION: 'Gereksiz Hareket',
  DEFECTS: 'Hatalı Üretim',
  UNDERUTILIZED_TALENT: 'Kullanılmayan Yetenek',
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

const ALL_STATUSES: KaizenStatus[] = ['DRAFT', 'ON_REVIEW', 'APPROVED', 'ACTION_PLAN', 'COMPLETED', 'VERIFIED', 'REJECTED'];
const ALL_MUDA_TYPES: MudaType[] = ['OVERPRODUCTION', 'WAITING', 'TRANSPORTATION', 'INAPPROPRIATE_PROCESSING', 'UNNECESSARY_INVENTORY', 'UNNECESSARY_MOTION', 'DEFECTS', 'UNDERUTILIZED_TALENT'];
const DEPARTMENTS = ['Üretim', 'Satın Alma', 'Kalite', 'Lojistik', 'İK', 'Finans', 'Satış', 'IT'];

const MOCK_PROPOSALS: KaizenProposal[] = [
  { id: '1', title: 'Montaj Hattı Hat Dengeleme', description: 'Hat dengeleme ile verimlilik artırımı', creatorName: 'Ahmet Y.', departmentName: 'Üretim', mudaTypes: ['WAITING', 'UNNECESSARY_MOTION'], status: 'ACTION_PLAN', priority: 'HIGH', createdAt: '2026-05-20', roiEstimate: 35000 },
  { id: '2', title: 'Satın Alma Onay Süresi Azaltma', description: 'Dijital onay akışı ile süre kısaltma', creatorName: 'Fatma K.', departmentName: 'Satın Alma', mudaTypes: ['WAITING'], status: 'APPROVED', priority: 'MEDIUM', createdAt: '2026-05-18', roiEstimate: 12000 },
  { id: '3', title: 'Depo 5S Düzenlemesi', description: 'Depoda 5S metodolojisi uygulaması', creatorName: 'Mehmet S.', departmentName: 'Lojistik', mudaTypes: ['UNNECESSARY_INVENTORY', 'UNNECESSARY_MOTION'], status: 'COMPLETED', priority: 'LOW', createdAt: '2026-05-15', roiEstimate: 8000 },
  { id: '4', title: 'Kalite Kontrol Hata Azaltma', description: 'Hatalı üretim oranını düşürme projesi', creatorName: 'Zeynep A.', departmentName: 'Kalite', mudaTypes: ['DEFECTS', 'INAPPROPRIATE_PROCESSING'], status: 'ON_REVIEW', priority: 'CRITICAL', createdAt: '2026-05-22', roiEstimate: 45000 },
  { id: '5', title: 'Müşteri Şikayet Yanıt Süresi', description: 'Şikayet yanıt süresini 48 saate indirme', creatorName: 'Ali B.', departmentName: 'Satış', mudaTypes: ['WAITING'], status: 'DRAFT', priority: 'HIGH', createdAt: '2026-05-24' },
  { id: '6', title: 'IT Altyapı Otomasyonu', description: 'Manuel işlemlerin otomasyona alınması', creatorName: 'Can D.', departmentName: 'IT', mudaTypes: ['UNDERUTILIZED_TALENT', 'WAITING'], status: 'VERIFIED', priority: 'MEDIUM', createdAt: '2026-05-10', roiEstimate: 22000 },
  { id: '7', title: 'Vardiya Teslim Süresi Optimizasyonu', description: 'Vardiya teslim sürecinin standardizasyonu', creatorName: 'Selin R.', departmentName: 'Üretim', mudaTypes: ['WAITING', 'UNNECESSARY_MOTION'], status: 'REJECTED', priority: 'LOW', createdAt: '2026-05-08' },
  { id: '8', title: 'Bordro İşlem Hızlandırma', description: 'Aylık bordro sürecinin kısaltılması', creatorName: 'Nilüfer T.', departmentName: 'İK', mudaTypes: ['WAITING', 'INAPPROPRIATE_PROCESSING'], status: 'APPROVED', priority: 'MEDIUM', createdAt: '2026-05-12', roiEstimate: 5000 },
];

interface NewProposalForm {
  title: string;
  description: string;
  departmentName: string;
  mudaTypes: MudaType[];
  priority: Priority;
}

function NewProposalModal({ onClose, onSave }: { onClose: () => void; onSave: (d: NewProposalForm) => void }) {
  const [form, setForm] = useState<NewProposalForm>({
    title: '',
    description: '',
    departmentName: '',
    mudaTypes: [],
    priority: 'MEDIUM',
  });

  function toggleMuda(m: MudaType) {
    setForm((prev) => ({
      ...prev,
      mudaTypes: prev.mudaTypes.includes(m)
        ? prev.mudaTypes.filter((x) => x !== m)
        : [...prev.mudaTypes, m],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Yeni Öneri</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium">Başlık</label>
            <input
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Kaizen önerisinin başlığı"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <textarea
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Problem ve beklenen iyileştirmeyi açıklayın"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Departman</label>
              <select
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.departmentName}
                onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                required
              >
                <option value="">Seçiniz</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Öncelik</label>
              <select
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Muda Tipleri</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_MUDA_TYPES.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.mudaTypes.includes(m)}
                    onChange={() => toggleMuda(m)}
                    className="rounded border-border"
                  />
                  {MUDA_LABELS[m]}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">
              İptal
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProposalDetailModal({ proposal, onClose }: { proposal: KaizenProposal; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold pr-4">{proposal.title}</h2>
          <div className="flex gap-2 shrink-0">
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[proposal.status])}>
              {STATUS_LABELS[proposal.status]}
            </span>
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PRIORITY_COLORS[proposal.priority])}>
              {PRIORITY_LABELS[proposal.priority]}
            </span>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Açıklama</p>
            <p className="mt-0.5">{proposal.description || '-'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Departman</p>
              <p className="mt-0.5 font-medium">{proposal.departmentName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Oluşturan</p>
              <p className="mt-0.5 font-medium">{proposal.creatorName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Tarih</p>
              <p className="mt-0.5">{new Date(proposal.createdAt).toLocaleDateString('tr-TR')}</p>
            </div>
            {proposal.roiEstimate != null && (
              <div>
                <p className="text-xs text-muted-foreground">Tahmini ROI</p>
                <p className="mt-0.5 font-semibold">₺{proposal.roiEstimate.toLocaleString('tr-TR')}</p>
              </div>
            )}
          </div>
          {proposal.mudaTypes.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Muda Tipleri</p>
              <div className="flex flex-wrap gap-1">
                {proposal.mudaTypes.map((m) => (
                  <span key={m} className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground font-medium">
                    {MUDA_LABELS[m]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KaizenProposalsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<KaizenStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<KaizenProposal | null>(null);

  const { data: proposals = [] } = useQuery<KaizenProposal[]>({
    queryKey: ['kaizen-proposals'],
    queryFn: () => api.get<KaizenProposal[]>('/api/v1/kaizen/proposals'),
    initialData: MOCK_PROPOSALS,
  });

  const createProposal = useMutation({
    mutationFn: (data: NewProposalForm) => api.post('/api/v1/kaizen/proposals', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kaizen-proposals'] });
      setShowNewModal(false);
    },
  });

  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      if (activeTab !== 'ALL' && p.status !== activeTab) return false;
      if (deptFilter && p.departmentName !== deptFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.departmentName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [proposals, activeTab, deptFilter, search]);

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { ALL: proposals.length };
    ALL_STATUSES.forEach((s) => {
      counts[s] = proposals.filter((p) => p.status === s).length;
    });
    return counts;
  }, [proposals]);

  const totalRoi = proposals.reduce((sum, p) => sum + (p.roiEstimate ?? 0), 0);
  const completedThisMonth = proposals.filter((p) => p.status === 'COMPLETED').length;
  const inReview = proposals.filter((p) => p.status === 'ON_REVIEW').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Öneri & Kaizen Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Fikir girişi, inceleme ve onay süreci</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportToExcel(
                filtered.map((p) => ({
                  title: p.title,
                  department: p.departmentName,
                  creator: p.creatorName,
                  status: STATUS_LABELS[p.status],
                  priority: PRIORITY_LABELS[p.priority],
                  mudaTypes: p.mudaTypes.map((m) => MUDA_LABELS[m]).join(', '),
                  roiEstimate: p.roiEstimate ?? '',
                  createdAt: new Date(p.createdAt).toLocaleDateString('tr-TR'),
                })),
                [
                  { key: 'title', header: 'Başlık', width: 30 },
                  { key: 'department', header: 'Departman', width: 16 },
                  { key: 'creator', header: 'Oluşturan', width: 16 },
                  { key: 'status', header: 'Durum', width: 14 },
                  { key: 'priority', header: 'Öncelik', width: 12 },
                  { key: 'mudaTypes', header: 'Muda Tipleri', width: 28 },
                  { key: 'roiEstimate', header: 'Tahmini ROI', width: 14 },
                  { key: 'createdAt', header: 'Tarih', width: 12 },
                ],
                'kaizen-onerileri',
                'Öneriler'
              )
            }
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
          >
            <PlusCircle className="h-4 w-4" /> Yeni Öneri
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Öneri', value: proposals.length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'İncelemede', value: inReview, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
          { label: 'Bu Ay Tamamlanan', value: completedThisMonth, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Tahmini ROI', value: `₺${totalRoi.toLocaleString('tr-TR')}`, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={cn('text-xl font-bold mt-0.5', card.color)}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5',
            activeTab === 'ALL' ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'
          )}
        >
          Tümü
          <span className={cn('text-xs px-1.5 py-0.5 rounded-full', activeTab === 'ALL' ? 'bg-primary-foreground/20' : 'bg-muted')}>
            {countByStatus['ALL']}
          </span>
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5',
              activeTab === s ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'
            )}
          >
            {STATUS_LABELS[s]}
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', activeTab === s ? 'bg-primary-foreground/20' : 'bg-muted')}>
              {countByStatus[s]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Başlık veya departman ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-56"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
        >
          <option value="">Tüm Departmanlar</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Öneri bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Başlık', 'Departman', 'Muda Tipleri', 'Öncelik', 'Durum', 'Oluşturan', 'Tarih', 'İşlemler'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.title}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.departmentName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {p.mudaTypes.slice(0, 2).map((m) => (
                          <span key={m} className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground font-medium whitespace-nowrap">
                            {MUDA_LABELS[m]}
                          </span>
                        ))}
                        {p.mudaTypes.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground font-medium">
                            +{p.mudaTypes.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap', PRIORITY_COLORS[p.priority])}>
                        {PRIORITY_LABELS[p.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap', STATUS_COLORS[p.status])}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.creatorName}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedProposal(p)}
                        className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded-lg hover:bg-muted"
                      >
                        <Eye className="h-3 w-3" /> Görüntüle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNewModal && (
        <NewProposalModal
          onClose={() => setShowNewModal(false)}
          onSave={(d) => createProposal.mutate(d)}
        />
      )}

      {selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
        />
      )}
    </div>
  );
}
