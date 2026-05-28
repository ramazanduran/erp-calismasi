'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  LayoutGrid,
  List,
  TrendingUp,
  Users,
  DollarSign,
  BarChart2,
  ArrowRight,
  Pencil,
  Trash2,
  CalendarDays,
  Star,
  FileDown,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { toast } from 'sonner';
import { useLeads, useUpdateLeadStatus, useDeleteLead } from '@/lib/api/hooks';
import { LeadModal } from '@/components/modals/lead-modal';
import { cn } from '@/lib/utils';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

const COLUMNS: { id: LeadStatus; label: string; color: string; bg: string; headerBg: string; valueDot: string }[] = [
  {
    id: 'new',
    label: 'Yeni',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    headerBg: 'border-blue-200 dark:border-blue-800',
    valueDot: 'bg-blue-500',
  },
  {
    id: 'contacted',
    label: 'İletişimde',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    bg: 'bg-yellow-50/50 dark:bg-yellow-950/20',
    headerBg: 'border-yellow-200 dark:border-yellow-800',
    valueDot: 'bg-yellow-500',
  },
  {
    id: 'qualified',
    label: 'Nitelikli',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    bg: 'bg-purple-50/50 dark:bg-purple-950/20',
    headerBg: 'border-purple-200 dark:border-purple-800',
    valueDot: 'bg-purple-500',
  },
  {
    id: 'converted',
    label: 'Dönüştürüldü',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    bg: 'bg-green-50/50 dark:bg-green-950/20',
    headerBg: 'border-green-200 dark:border-green-800',
    valueDot: 'bg-green-500',
  },
  {
    id: 'lost',
    label: 'Kaybedildi',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    bg: 'bg-red-50/50 dark:bg-red-950/20',
    headerBg: 'border-red-200 dark:border-red-800',
    valueDot: 'bg-red-500',
  },
];

const SOURCE_LABELS: Record<string, string> = {
  web: 'Web',
  referral: 'Referans',
  social: 'Sosyal',
  cold_call: 'Soğuk Arama',
  other: 'Diğer',
};

const SOURCE_COLORS: Record<string, string> = {
  web: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  referral: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  social: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  cold_call: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_NEXT: Record<LeadStatus, LeadStatus | null> = {
  new: 'contacted',
  contacted: 'qualified',
  qualified: 'converted',
  converted: null,
  lost: null,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatTRY(value: number): string {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Lead = Record<string, unknown>;

const MOCK_LEADS = [
  { id: 'l1', name: 'Kaan Özdemir', company: 'TechStart Girişim', email: 'kaan@techstart.com', phone: '+90 532 200 0001', status: 'new', source: 'website', value: 85000, createdAt: '2026-05-01T09:00:00Z' },
  { id: 'l2', name: 'Selin Arslan', company: 'Mega İnşaat Ltd.', email: 'selin@megainsaat.com', phone: '+90 532 200 0002', status: 'contacted', source: 'referral', value: 320000, createdAt: '2026-05-05T10:00:00Z' },
  { id: 'l3', name: 'Berk Doğan', company: 'Hızlı Lojistik A.Ş.', email: 'berk@hizlilojistik.com', phone: '+90 532 200 0003', status: 'qualified', source: 'linkedin', value: 145000, createdAt: '2026-05-08T11:00:00Z' },
  { id: 'l4', name: 'Zeynep Akın', company: 'Butik Gıda Ltd.', email: 'zeynep@butikgida.com', phone: '+90 532 200 0004', status: 'proposal', source: 'cold_call', value: 42000, createdAt: '2026-05-12T14:00:00Z' },
  { id: 'l5', name: 'Mert Yıldız', company: 'Dijital Pazarlama Pro', email: 'mert@dijitalpro.com', phone: '+90 532 200 0005', status: 'won', source: 'email', value: 68000, createdAt: '2026-05-15T09:00:00Z' },
];

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Lead | null>(null);

  const { data, isLoading } = useLeads({
    search: search || undefined,
    source: selectedSource || undefined,
  });

  const updateStatus = useUpdateLeadStatus();
  const deleteLead = useDeleteLead();

  const leads: Lead[] = useMemo(() => {
    const raw = Array.isArray(data) ? data : (data as { data?: Lead[] } | undefined)?.data ?? (!isLoading ? (MOCK_LEADS as unknown as Lead[]) : []);
    return raw as Lead[];
  }, [data]);

  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === 'new').length;
    const nonLost = leads.filter((l) => l.status !== 'lost');
    const pipeline = nonLost.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    const converted = leads.filter((l) => l.status === 'converted').length;
    const conversionBase = leads.filter((l) => l.status !== 'lost').length;
    const conversionRate = conversionBase > 0 ? (converted / conversionBase) * 100 : 0;
    return { total, newCount, pipeline, conversionRate, converted };
  }, [leads]);

  const groupedLeads = useMemo(() => {
    return COLUMNS.reduce<Record<LeadStatus, Lead[]>>((acc, col) => {
      acc[col.id] = leads.filter((l) => l.status === col.id);
      return acc;
    }, { new: [], contacted: [], qualified: [], converted: [], lost: [] });
  }, [leads]);

  const stageBarData = useMemo(() => {
    const max = Math.max(...COLUMNS.map((c) => groupedLeads[c.id].length), 1);
    return COLUMNS.map((c) => ({
      ...c,
      count: groupedLeads[c.id].length,
      pct: (groupedLeads[c.id].length / max) * 100,
    }));
  }, [groupedLeads]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success('Durum güncellendi');
    } catch {
      toast.error('Durum güncellenemedi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu lead\'i silmek istediğinize emin misiniz?')) return;
    try {
      await deleteLead.mutateAsync(id);
      toast.success('Lead silindi');
    } catch {
      toast.error('Lead silinemedi');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditData(lead);
    setModalOpen(true);
  };

  const handleAddToColumn = (_status: LeadStatus) => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditData(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4">
          {COLUMNS.map((c) => (
            <div key={c.id} className="h-64 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM - Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Satış fırsatlarını yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                view === 'kanban'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                view === 'list'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List className="h-3.5 w-3.5" />
              Liste
            </button>
          </div>
          <button
            onClick={() => exportToExcel(
              leads.map((lead) => ({
                name: lead.name as string ?? '',
                email: lead.email as string ?? '',
                phone: lead.phone as string ?? '',
                company: lead.company as string ?? '',
                source: SOURCE_LABELS[(lead.source as string)] ?? lead.source as string ?? '',
                status: COLUMNS.find((c) => c.id === lead.status)?.label ?? lead.status as string ?? '',
                value: Number(lead.value ?? 0),
                expectedClose: lead.expectedClose ? new Date(lead.expectedClose as string).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'name', header: 'Lead Adı', width: 22 },
                { key: 'email', header: 'E-posta', width: 24 },
                { key: 'phone', header: 'Telefon', width: 14 },
                { key: 'company', header: 'Şirket', width: 20 },
                { key: 'source', header: 'Kaynak', width: 14 },
                { key: 'status', header: 'Durum', width: 14 },
                { key: 'value', header: 'Değer', width: 14 },
                { key: 'expectedClose', header: 'Tahmini Kapanış', width: 16 },
              ],
              'leads',
              'CRM Leads'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => { setEditData(null); setInitialStatus(undefined); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Yeni Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Toplam Lead</span>
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.converted} dönüştürüldü</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Yeni Lead</span>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1.5">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.newCount}</p>
          <p className="text-xs text-muted-foreground mt-1">bekleyen fırsat</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pipeline Değeri</span>
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-1.5">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.pipeline >= 1000000
              ? `${(stats.pipeline / 1000000).toFixed(1)}M ₺`
              : stats.pipeline >= 1000
              ? `${(stats.pipeline / 1000).toFixed(0)}K ₺`
              : formatTRY(stats.pipeline)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">kayıp hariç toplam</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dönüşüm Oranı</span>
            <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-1.5">
              <BarChart2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">toplam – kayıp bazında</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Aşama Dağılımı</span>
        </div>
        <div className="flex items-end gap-3">
          {stageBarData.map((stage) => (
            <div key={stage.id} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-foreground">{stage.count}</span>
              <div className="w-full rounded-t-sm bg-muted overflow-hidden" style={{ height: 28 }}>
                <div
                  className={cn('h-full rounded-t-sm transition-all', stage.valueDot)}
                  style={{ width: `${stage.pct}%`, minWidth: stage.count > 0 ? 4 : 0 }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{stage.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim, şirket veya e-posta ara..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
        >
          <option value="">Tüm Kaynaklar</option>
          <option value="web">Web</option>
          <option value="referral">Referans</option>
          <option value="social">Sosyal</option>
          <option value="cold_call">Soğuk Arama</option>
          <option value="other">Diğer</option>
        </select>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[500px]">
          {COLUMNS.map((column) => {
            const columnLeads = groupedLeads[column.id];
            const columnValue = columnLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
            return (
              <div key={column.id} className="flex flex-col gap-0">
                <div className={cn('rounded-t-xl border border-b-0 px-3 py-2.5 flex items-center justify-between', column.headerBg)}>
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', column.color)}>
                      {column.label}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{columnLeads.length}</span>
                  </div>
                  {columnValue > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {columnValue >= 1000000
                        ? `${(columnValue / 1000000).toFixed(1)}M ₺`
                        : columnValue >= 1000
                        ? `${(columnValue / 1000).toFixed(0)}K ₺`
                        : formatTRY(columnValue)}
                    </span>
                  )}
                </div>
                <div className={cn('flex flex-col gap-2 flex-1 rounded-b-xl border border-t-0 border-border p-2 min-h-[400px]', column.bg)}>
                  {columnLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-8 gap-2">
                      <p className="text-xs text-muted-foreground">Lead yok</p>
                      <button
                        onClick={() => handleAddToColumn(column.id)}
                        className="flex items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Ekle
                      </button>
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      const nextStatus = STATUS_NEXT[lead.status as LeadStatus];
                      const initials = getInitials(lead.name as string || '?');
                      return (
                        <div
                          key={lead.id as string}
                          className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                          onClick={() => handleEdit(lead)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-primary">{initials}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate leading-tight">{lead.name as string}</p>
                              {lead.company && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.company as string}</p>
                              )}
                            </div>
                            {lead.score && Number(lead.score) > 0 && (
                              <div className="shrink-0 flex items-center gap-0.5">
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                <span className="text-xs text-muted-foreground">{lead.score as number}</span>
                              </div>
                            )}
                          </div>

                          {lead.value && Number(lead.value) > 0 && (
                            <p className="text-xs font-bold text-primary mt-2">
                              {formatTRY(Number(lead.value))}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mt-2">
                            {lead.source && (
                              <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium', SOURCE_COLORS[lead.source as string] ?? 'bg-secondary text-secondary-foreground')}>
                                {SOURCE_LABELS[lead.source as string] ?? (lead.source as string)}
                              </span>
                            )}
                            {lead.estimatedCloseDate && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground">
                                <CalendarDays className="h-2.5 w-2.5" />
                                {formatDate(lead.estimatedCloseDate as string)}
                              </span>
                            )}
                          </div>

                          <div
                            className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {nextStatus && (
                              <button
                                onClick={() => handleStatusChange(lead.id as string, nextStatus)}
                                title={`${COLUMNS.find((c) => c.id === nextStatus)?.label} yap`}
                                className="flex items-center gap-1 flex-1 rounded px-2 py-1 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              >
                                <ArrowRight className="h-2.5 w-2.5" />
                                {COLUMNS.find((c) => c.id === nextStatus)?.label}
                              </button>
                            )}
                            {column.id !== 'lost' && (
                              <button
                                onClick={() => handleStatusChange(lead.id as string, 'lost')}
                                className="rounded px-2 py-1 text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                              >
                                Kaybet
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(lead)}
                              className="rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(lead.id as string)}
                              className="rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {columnLeads.length > 0 && (
                    <div className="mt-auto pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        {columnValue > 0 ? (
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            Toplam: {formatTRY(columnValue)}
                          </span>
                        ) : (
                          <span />
                        )}
                        <button
                          onClick={() => handleAddToColumn(column.id)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          Ekle
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <span className="text-sm font-semibold text-foreground">{leads.length} lead</span>
          </div>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Hiç lead bulunamadı</p>
              <button
                onClick={() => { setEditData(null); setInitialStatus(undefined); setModalOpen(true); }}
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                Yeni Lead Ekle
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Lead</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Şirket</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Kaynak</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">Değer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Tahmin. Kapanış</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Durum</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((lead) => {
                    const col = COLUMNS.find((c) => c.id === lead.status);
                    const nextStatus = STATUS_NEXT[lead.status as LeadStatus];
                    const initials = getInitials(lead.name as string || '?');
                    return (
                      <tr
                        key={lead.id as string}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => handleEdit(lead)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-primary">{initials}</span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{lead.name as string}</p>
                              {lead.email && (
                                <p className="text-xs text-muted-foreground">{lead.email as string}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {lead.company ? (lead.company as string) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {lead.source ? (
                            <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium', SOURCE_COLORS[lead.source as string] ?? 'bg-secondary text-secondary-foreground')}>
                              {SOURCE_LABELS[lead.source as string] ?? (lead.source as string)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          {lead.value && Number(lead.value) > 0 ? (
                            <span className="font-semibold text-primary">{formatTRY(Number(lead.value))}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                          {lead.estimatedCloseDate ? formatDate(lead.estimatedCloseDate as string) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {col && (
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', col.color)}>
                              {col.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {nextStatus && (
                              <button
                                onClick={() => handleStatusChange(lead.id as string, nextStatus)}
                                title={`${COLUMNS.find((c) => c.id === nextStatus)?.label} yap`}
                                className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(lead)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(lead.id as string)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 border-t border-border">
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-foreground">
                      Toplam: {leads.length} lead
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-primary">
                      {formatTRY(leads.filter((l) => l.status !== 'lost').reduce((s, l) => s + (Number(l.value) || 0), 0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      <LeadModal
        open={modalOpen}
        onClose={handleModalClose}
        editData={editData as Parameters<typeof LeadModal>[0]['editData']}
      />
    </div>
  );
}
