'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Users,
  TrendingUp,
  DollarSign,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type DealStage =
  | 'new'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'lost';

interface Deal {
  id: string;
  title: string;
  customer: { name: string } | null;
  stage: DealStage;
  value: number;
  probability: number;
  expectedCloseDate: string | null;
  assignedTo: { firstName: string; lastName: string } | null;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  status: LeadStatus;
  source: string | null;
  estimatedValue: number | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEAL_STAGES: {
  id: DealStage;
  label: string;
  headerClass: string;
  bgClass: string;
  borderClass: string;
}[] = [
  {
    id: 'new',
    label: 'Yeni',
    headerClass: 'bg-slate-500 text-white',
    bgClass: 'bg-slate-50 dark:bg-slate-900/40',
    borderClass: 'border-slate-200 dark:border-slate-700',
  },
  {
    id: 'qualified',
    label: 'Nitelikli',
    headerClass: 'bg-blue-500 text-white',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    borderClass: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'proposal',
    label: 'Teklif',
    headerClass: 'bg-indigo-500 text-white',
    bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderClass: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'negotiation',
    label: 'Müzakere',
    headerClass: 'bg-orange-500 text-white',
    bgClass: 'bg-orange-50 dark:bg-orange-900/20',
    borderClass: 'border-orange-200 dark:border-orange-800',
  },
  {
    id: 'won',
    label: 'Kazanıldı',
    headerClass: 'bg-green-600 text-white',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    borderClass: 'border-green-300 dark:border-green-700',
  },
  {
    id: 'lost',
    label: 'Kaybedildi',
    headerClass: 'bg-red-600 text-white',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    borderClass: 'border-red-200 dark:border-red-700',
  },
];

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Yeni',
  contacted: 'İletişimde',
  qualified: 'Nitelikli',
  converted: 'Dönüştürüldü',
  lost: 'Kaybedildi',
};

const LEAD_STATUS_CLASSES: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  contacted:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  qualified:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  converted:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const SOURCE_LABELS: Record<string, string> = {
  web: 'Web',
  referral: 'Referans',
  social: 'Sosyal Medya',
  cold_call: 'Soğuk Arama',
  event: 'Etkinlik',
  other: 'Diğer',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeDealList(raw: unknown): Deal[] {
  if (Array.isArray(raw)) return raw as Deal[];
  if (raw && typeof raw === 'object' && 'data' in raw)
    return ((raw as { data: Deal[] }).data ?? []);
  return [];
}

function normalizeLeadList(raw: unknown): Lead[] {
  if (Array.isArray(raw)) return raw as Lead[];
  if (raw && typeof raw === 'object' && 'data' in raw)
    return ((raw as { data: Lead[] }).data ?? []);
  return [];
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DealCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2 animate-pulse">
      <div className="h-3 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="flex justify-between mt-1">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-1/4" />
      </div>
    </div>
  );
}

function LeadRowSkeleton() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j} className="px-4 py-3">
          <div className="animate-pulse bg-muted rounded h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// ─── Deal Card ────────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow space-y-1.5">
      <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
        {deal.title}
      </p>
      {deal.customer && (
        <p className="text-xs text-muted-foreground truncate">
          {deal.customer.name}
        </p>
      )}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-sm font-bold text-primary">
          {formatCurrency(Number(deal.value ?? 0))}
        </span>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          %{deal.probability}
        </span>
      </div>
      {deal.expectedCloseDate && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>{formatDate(deal.expectedCloseDate)}</span>
        </div>
      )}
      {deal.assignedTo && (
        <p className="text-xs text-muted-foreground">
          {deal.assignedTo.firstName} {deal.assignedTo.lastName}
        </p>
      )}
    </div>
  );
}

// ─── Kanban Pipeline ─────────────────────────────────────────────────────────

function KanbanPipeline({
  deals,
  isLoading,
}: {
  deals: Deal[];
  isLoading: boolean;
}) {
  const columns = useMemo(
    () =>
      DEAL_STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.id);
        const totalValue = stageDeals.reduce(
          (sum, d) => sum + Number(d.value ?? 0),
          0
        );
        return { ...stage, deals: stageDeals, totalValue };
      }),
    [deals]
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((col) => (
          <div
            key={col.id}
            className={cn(
              'w-64 flex flex-col rounded-xl border overflow-hidden',
              col.borderClass
            )}
          >
            {/* Column Header */}
            <div className={cn('px-3 py-2.5', col.headerClass)}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{col.label}</span>
                <span className="text-xs font-medium opacity-90">
                  {col.deals.length} adet
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-80">
                {formatCurrency(col.totalValue)}
              </p>
            </div>

            {/* Column Body */}
            <div
              className={cn(
                'flex-1 p-2 space-y-2 min-h-[200px]',
                col.bgClass
              )}
            >
              {isLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <DealCardSkeleton key={i} />
                  ))
                : col.deals.length === 0
                ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Fırsat yok
                    </p>
                  )
                : col.deals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Leads Table ─────────────────────────────────────────────────────────────

function LeadsTable({
  leads,
  isLoading,
}: {
  leads: Lead[];
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {[
                'Ad Soyad',
                'Şirket',
                'Kaynak',
                'Durum',
                'Tahmini Değer',
                'İşlemler',
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <LeadRowSkeleton key={i} />
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  Henüz aday kaydı bulunmuyor
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {lead.firstName} {lead.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lead.company ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lead.source
                      ? (SOURCE_LABELS[lead.source] ?? lead.source)
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        LEAD_STATUS_CLASSES[lead.status] ??
                          'bg-gray-100 text-gray-700'
                      )}
                    >
                      {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {lead.estimatedValue != null
                      ? formatCurrency(Number(lead.estimatedValue))
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted transition-colors">
                      <ExternalLink className="h-3 w-3" />
                      Detay
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && (
        <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          {leads.length} aday gösteriliyor
        </div>
      )}
    </div>
  );
}

// ─── Summary Stats ────────────────────────────────────────────────────────────

function SummaryStats({ deals }: { deals: Deal[] }) {
  const totalValue = deals.reduce((s, d) => s + Number(d.value ?? 0), 0);
  const wonDeals = deals.filter((d) => d.stage === 'won');
  const wonValue = wonDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
  const winRate =
    deals.length > 0
      ? ((wonDeals.length / deals.length) * 100).toFixed(1)
      : '0.0';

  const stats = [
    {
      label: 'Toplam Fırsat',
      value: deals.length,
      icon: Briefcase,
      colorClass: 'text-blue-500',
      bgClass: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Pipeline Değeri',
      value: formatCurrency(totalValue),
      icon: DollarSign,
      colorClass: 'text-green-500',
      bgClass: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'Kazanılan',
      value: `${wonDeals.length} (${formatCurrency(wonValue)})`,
      icon: TrendingUp,
      colorClass: 'text-emerald-500',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      label: 'Kazanma Oranı',
      value: `%${winRate}`,
      icon: Users,
      colorClass: 'text-purple-500',
      bgClass: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold mt-0.5 text-foreground">
                {s.value}
              </p>
            </div>
            <div className={cn('p-2 rounded-lg', s.bgClass)}>
              <s.icon className={cn('h-4 w-4', s.colorClass)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'deals' | 'leads';

export default function OpportunitiesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('deals');

  const { data: dealsRaw, isLoading: dealsLoading } = useQuery({
    queryKey: ['crm-deals-opportunities'],
    queryFn: () =>
      api.get<{ data: Deal[] }>('crm/deals', { page: 1, limit: 50 }),
  });

  const { data: leadsRaw, isLoading: leadsLoading } = useQuery({
    queryKey: ['crm-leads-opportunities'],
    queryFn: () =>
      api.get<{ data: Lead[] }>('crm/leads', { page: 1, limit: 50 }),
    enabled: activeTab === 'leads',
  });

  const deals = useMemo(() => normalizeDealList(dealsRaw), [dealsRaw]);
  const leads = useMemo(() => normalizeLeadList(leadsRaw), [leadsRaw]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'deals', label: 'Fırsatlar (Deals)' },
    { id: 'leads', label: 'Adaylar (Leads)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Satış Fırsatları
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Satış pipeline ve adayları yönetin
          </p>
        </div>
      </div>

      {/* Stats - only shown for deals tab */}
      {activeTab === 'deals' && (
        <SummaryStats deals={deals} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'deals' && (
        <KanbanPipeline deals={deals} isLoading={dealsLoading} />
      )}
      {activeTab === 'leads' && (
        <LeadsTable leads={leads} isLoading={leadsLoading} />
      )}
    </div>
  );
}
