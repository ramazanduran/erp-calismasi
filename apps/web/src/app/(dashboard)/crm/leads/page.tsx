'use client';

import { useState } from 'react';
import { Plus, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLeads, useUpdateLeadStatus, useDeleteLead } from '@/lib/api/hooks';
import { LeadModal } from '@/components/modals/lead-modal';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

const COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'Yeni', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'contacted', label: 'İletişimde', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { id: 'qualified', label: 'Nitelikli', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 'converted', label: 'Dönüştürüldü', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { id: 'lost', label: 'Kaybedildi', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
];

const SOURCE_LABELS: Record<string, string> = {
  web: 'Web',
  referral: 'Referans',
  social: 'Sosyal',
  cold_call: 'Soğuk Arama',
  other: 'Diğer',
};

const STATUS_NEXT: Record<LeadStatus, LeadStatus | null> = {
  new: 'contacted',
  contacted: 'qualified',
  qualified: 'converted',
  converted: null,
  lost: null,
};

export default function LeadsPage() {
  const { data, isLoading } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const deleteLead = useDeleteLead();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);

  const leads = (data as { data?: Record<string, unknown>[] } | undefined)?.data ?? [];

  const groupedLeads = COLUMNS.reduce<Record<LeadStatus, Record<string, unknown>[]>>((acc, col) => {
    acc[col.id] = leads.filter((l) => l.status === col.id);
    return acc;
  }, { new: [], contacted: [], qualified: [], converted: [], lost: [] });

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

  const handleEdit = (lead: Record<string, unknown>) => {
    setEditData(lead);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditData(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/4" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM - Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Satış fırsatlarını yönetin ({leads.length} lead)</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Yeni Lead
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[500px]">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${column.color}`}>
                {column.label}
              </span>
              <span className="text-xs text-muted-foreground font-medium">{groupedLeads[column.id].length}</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[200px] rounded-lg border border-dashed border-border p-2 bg-muted/20">
              {groupedLeads[column.id].map((lead) => {
                const nextStatus = STATUS_NEXT[lead.status as LeadStatus];
                return (
                  <div
                    key={lead.id as string}
                    className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => handleEdit(lead)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="text-sm font-medium text-foreground truncate">{lead.name as string}</p>
                      </div>
                    </div>
                    {lead.company && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{lead.company as string}</p>
                      </div>
                    )}
                    {lead.value && Number(lead.value) > 0 && (
                      <p className="text-xs font-semibold text-primary mt-2">
                        {Number(lead.value).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                    )}
                    {lead.source && (
                      <span className="inline-flex mt-1.5 items-center rounded px-1.5 py-0.5 text-xs bg-secondary text-secondary-foreground">
                        {SOURCE_LABELS[lead.source as string] ?? lead.source as string}
                      </span>
                    )}
                    <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {nextStatus && (
                        <button
                          onClick={() => handleStatusChange(lead.id as string, nextStatus)}
                          className="flex-1 rounded px-2 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          {COLUMNS.find((c) => c.id === nextStatus)?.label}
                        </button>
                      )}
                      {column.id !== 'lost' && (
                        <button
                          onClick={() => handleStatusChange(lead.id as string, 'lost')}
                          className="rounded px-2 py-1 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          Kaybet
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(lead.id as string)}
                        className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                );
              })}
              {groupedLeads[column.id].length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Lead yok</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <LeadModal
        open={modalOpen}
        onClose={handleModalClose}
        editData={editData as Parameters<typeof LeadModal>[0]['editData']}
      />
    </div>
  );
}
