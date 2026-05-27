'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Trash2,
  AlertTriangle,
  FileDown,
  Search,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { api } from '@/lib/api/client';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/modals/modal';

// ─── Types ───────────────────────────────────────────────────────────────────

type RequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'ordered'
  | 'cancelled';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface RequestItem {
  description: string;
  quantity: number;
  unit: string;
  estimatedPrice: number | null;
}

interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requestedBy: { firstName: string; lastName: string } | null;
  department: { name: string } | null;
  status: RequestStatus;
  priority: Priority;
  neededBy: string | null;
  createdAt: string;
  items: RequestItem[];
}

interface RequestStats {
  byStatus: { status: RequestStatus; _count: number }[];
}

interface Department {
  id: string;
  name: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'Taslak',
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  ordered: 'Sipariş Verildi',
  cancelled: 'İptal',
};

const STATUS_CLASSES: Record<RequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  pending:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ordered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled:
    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};

const PRIORITY_CLASSES: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const FILTER_TABS: { value: RequestStatus | ''; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'draft', label: 'Taslak' },
  { value: 'pending', label: 'Bekliyor' },
  { value: 'approved', label: 'Onaylandı' },
  { value: 'rejected', label: 'Reddedildi' },
  { value: 'ordered', label: 'Sipariş Verildi' },
  { value: 'cancelled', label: 'İptal' },
];

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold mt-0.5 text-foreground">{value}</p>
        </div>
        <div className={cn('p-2 rounded-lg', bgClass)}>
          <Icon className={cn('h-4 w-4', colorClass)} />
        </div>
      </div>
    </div>
  );
}

// ─── Items Detail Panel ───────────────────────────────────────────────────────

function ItemsPanel({ items }: { items: RequestItem[] }) {
  if (!items || items.length === 0) {
    return (
      <td colSpan={9} className="px-6 pb-3 pt-0 bg-muted/20">
        <p className="text-xs text-muted-foreground py-2">Kalem bulunamadı.</p>
      </td>
    );
  }

  return (
    <td colSpan={9} className="px-6 pb-4 pt-0 bg-muted/20">
      <div className="rounded-lg border border-border overflow-hidden mt-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                Ürün / Açıklama
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                Miktar
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                Birim
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                Tahmini Fiyat
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 font-medium text-foreground">
                  {item.description}
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {item.quantity}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {item.unit || '-'}
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {item.estimatedPrice != null
                    ? formatCurrency(Number(item.estimatedPrice))
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </td>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Talebi Reddet" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            Bu talep reddedilecektir. Lütfen ret gerekçesini belirtin.
          </p>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Ret Gerekçesi *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            className={cn(inputClass, 'resize-none')}
            placeholder="Ret gerekçesini yazın..."
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={!reason.trim() || isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Reddediliyor...' : 'Reddet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── New Request Modal ────────────────────────────────────────────────────────

interface NewRequestItem {
  description: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
}

const emptyItem = (): NewRequestItem => ({
  description: '',
  quantity: 1,
  unit: 'adet',
  estimatedPrice: '',
});

function NewRequestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: deptsRaw } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () =>
      api.get<{ data: Department[] }>('api/v1/settings/departments?limit=100'),
    enabled: open,
  });

  const departments: Department[] = useMemo(() => {
    const raw = deptsRaw as unknown;
    if (Array.isArray(raw)) return raw as Department[];
    if (raw && typeof raw === 'object' && 'data' in raw)
      return (raw as { data: Department[] }).data ?? [];
    return [];
  }, [deptsRaw]);

  const [departmentId, setDepartmentId] = useState('');
  const [departmentText, setDepartmentText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [neededBy, setNeededBy] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<NewRequestItem[]>([emptyItem()]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const createMutation = useMutation({
    mutationFn: (payload: unknown) =>
      api.post('api/v1/purchase-requests', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests-stats'] });
      onClose();
    },
  });

  const updateItem = (
    index: number,
    field: keyof NewRequestItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!departmentId && !departmentText.trim()) {
      setError('Lütfen departman belirtin.');
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      setError('Tüm kalemlere açıklama girin.');
      return;
    }
    setSubmitting(true);
    try {
      await createMutation.mutateAsync({
        departmentId: departmentId || undefined,
        departmentName: !departmentId ? departmentText : undefined,
        priority,
        neededBy: neededBy || undefined,
        notes,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unit: it.unit,
          estimatedPrice: it.estimatedPrice ? Number(it.estimatedPrice) : null,
        })),
      });
    } catch {
      setError('Talep oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDepartmentId('');
    setDepartmentText('');
    setPriority('medium');
    setNeededBy('');
    setNotes('');
    setItems([emptyItem()]);
    setError('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Yeni Satın Alma Talebi"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Departman *
            </label>
            {departments.length > 0 ? (
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className={inputClass}
              >
                <option value="">Departman Seçin</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={departmentText}
                onChange={(e) => setDepartmentText(e.target.value)}
                placeholder="Departman adı"
                className={inputClass}
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Öncelik *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={inputClass}
            >
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Gereklilik Tarihi
            </label>
            <input
              type="date"
              value={neededBy}
              onChange={(e) => setNeededBy(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Notlar
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ek notlar..."
              className={inputClass}
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Talep Kalemleri
            </label>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Kalem Ekle
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-1 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-5">Ürün / Açıklama</div>
              <div className="col-span-2">Miktar</div>
              <div className="col-span-2">Birim</div>
              <div className="col-span-2">Tahmini Fiyat</div>
              <div className="col-span-1" />
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-1 p-2 rounded-lg bg-muted/30 border border-border"
              >
                <div className="col-span-5">
                  <input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, 'description', e.target.value)
                    }
                    placeholder="Ürün / Açıklama *"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, 'quantity', Number(e.target.value))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    placeholder="adet"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.estimatedPrice}
                    onChange={(e) =>
                      updateItem(index, 'estimatedPrice', e.target.value)
                    }
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== index))
                    }
                    disabled={items.length === 1}
                    className="text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Kaydediliyor...' : 'Talep Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Row Actions ──────────────────────────────────────────────────────────────

function RowActions({ request }: { request: PurchaseRequest }) {
  const queryClient = useQueryClient();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.put(`api/v1/purchase-requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests-stats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`api/v1/purchase-requests/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests-stats'] });
      setRejectModalOpen(false);
    },
  });

  if (request.status !== 'pending') {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => approveMutation.mutate(request.id)}
          disabled={approveMutation.isPending}
          className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <CheckCircle className="h-3 w-3" />
          Onayla
        </button>
        <button
          onClick={() => setRejectModalOpen(true)}
          disabled={rejectMutation.isPending}
          className="flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          <XCircle className="h-3 w-3" />
          Reddet
        </button>
      </div>

      <RejectModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={(reason) =>
          rejectMutation.mutate({ id: request.id, reason })
        }
        isPending={rejectMutation.isPending}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchaseRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: requestsRaw, isLoading } = useQuery({
    queryKey: ['purchase-requests', statusFilter, page],
    queryFn: () =>
      api.get<{ data: PurchaseRequest[]; total: number }>(
        'api/v1/purchase-requests',
        { status: statusFilter || undefined, page, limit: 20 }
      ),
  });

  const { data: statsRaw } = useQuery({
    queryKey: ['purchase-requests-stats'],
    queryFn: () => api.get<RequestStats>('api/v1/purchase-requests/stats'),
  });

  const requests: PurchaseRequest[] = useMemo(() => {
    const raw = requestsRaw as unknown;
    if (Array.isArray(raw)) return raw as PurchaseRequest[];
    if (raw && typeof raw === 'object' && 'data' in raw)
      return (raw as { data: PurchaseRequest[] }).data ?? [];
    return [];
  }, [requestsRaw]);

  const total: number = useMemo(() => {
    const raw = requestsRaw as unknown;
    if (raw && typeof raw === 'object' && 'total' in raw)
      return (raw as { total: number }).total ?? 0;
    return requests.length;
  }, [requestsRaw, requests.length]);

  const filteredRequests = useMemo(() => {
    if (!search) return requests;
    const q = search.toLowerCase();
    return requests.filter((r) =>
      r.requestNumber?.toLowerCase().includes(q) ||
      r.department?.name?.toLowerCase().includes(q) ||
      (r.requestedBy ? `${r.requestedBy.firstName} ${r.requestedBy.lastName}`.toLowerCase().includes(q) : false)
    );
  }, [requests, search]);

  const stats = statsRaw as RequestStats | undefined;

  const getCount = (status: RequestStatus) =>
    stats?.byStatus?.find((s) => s.status === status)?._count ?? 0;

  const totalCount =
    stats?.byStatus?.reduce((sum, s) => sum + s._count, 0) ?? 0;

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Satın Alma Talepleri
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Satın alma taleplerini yönetin ve onaylayın
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filteredRequests.map((r) => ({
                requestNumber: r.requestNumber,
                requestedBy: r.requestedBy ? `${r.requestedBy.firstName} ${r.requestedBy.lastName}` : '',
                department: r.department?.name ?? '',
                status: STATUS_LABELS[r.status] ?? r.status,
                priority: PRIORITY_LABELS[r.priority] ?? r.priority,
                itemCount: r.items.length,
                totalEstimated: r.items.reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0),
                neededBy: r.neededBy ? new Date(r.neededBy).toLocaleDateString('tr-TR') : '',
                createdAt: new Date(r.createdAt).toLocaleDateString('tr-TR'),
              })),
              [
                { key: 'requestNumber', header: 'Talep No', width: 14 },
                { key: 'requestedBy', header: 'Talep Eden', width: 20 },
                { key: 'department', header: 'Departman', width: 16 },
                { key: 'status', header: 'Durum', width: 16 },
                { key: 'priority', header: 'Öncelik', width: 10 },
                { key: 'itemCount', header: 'Kalem Sayısı', width: 12 },
                { key: 'totalEstimated', header: 'Tahmini Toplam', width: 16 },
                { key: 'neededBy', header: 'Gereksinim Tarihi', width: 16 },
                { key: 'createdAt', header: 'Oluşturulma', width: 14 },
              ],
              'satin-alma-talepleri',
              'Satın Alma Talepleri'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Talep
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Toplam Talep"
          value={totalCount}
          icon={ClipboardList}
          colorClass="text-blue-500"
          bgClass="bg-blue-50 dark:bg-blue-950"
        />
        <StatCard
          label="Bekleyen"
          value={getCount('pending')}
          icon={Clock}
          colorClass="text-yellow-500"
          bgClass="bg-yellow-50 dark:bg-yellow-950"
        />
        <StatCard
          label="Onaylanan"
          value={getCount('approved')}
          icon={CheckCircle}
          colorClass="text-green-500"
          bgClass="bg-green-50 dark:bg-green-950"
        />
        <StatCard
          label="Reddedilen"
          value={getCount('rejected')}
          icon={XCircle}
          colorClass="text-red-500"
          bgClass="bg-red-50 dark:bg-red-950"
        />
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Talep no, talep eden veya departman..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto pb-px">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              statusFilter === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.value !== '' && stats?.byStatus && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                (
                {stats.byStatus.find((s) => s.status === tab.value)?._count ?? 0}
                )
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-8 px-2 py-3" />
                {[
                  'Talep No',
                  'Talep Eden',
                  'Departman',
                  'Öncelik',
                  'Gereklilik Tarihi',
                  'Durum',
                  'Kalem Sayısı',
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
                <SkeletonRows cols={9} />
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="space-y-2">
                      <p>{search ? 'Arama sonucu bulunamadı' : 'Henüz satın alma talebi oluşturulmamış'}</p>
                      {!search && (
                        <button
                          onClick={() => setModalOpen(true)}
                          className="text-primary hover:underline text-sm"
                        >
                          İlk Talebi Oluştur
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.flatMap((req) => {
                  const isExpanded = expandedRows.has(req.id);
                  return [
                    <tr
                      key={req.id}
                      className={cn(
                        'border-b border-border hover:bg-muted/30 transition-colors',
                        isExpanded && 'bg-muted/20'
                      )}
                    >
                      <td className="w-8 px-2 py-3">
                        <button
                          onClick={() => toggleExpand(req.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                        {req.requestNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {req.requestedBy
                          ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {req.department?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            PRIORITY_CLASSES[req.priority] ??
                              'bg-gray-100 text-gray-700'
                          )}
                        >
                          {PRIORITY_LABELS[req.priority] ?? req.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {req.neededBy ? formatDate(req.neededBy) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            STATUS_CLASSES[req.status] ??
                              'bg-gray-100 text-gray-700'
                          )}
                        >
                          {STATUS_LABELS[req.status] ?? req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-center">
                        {req.items?.length ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <RowActions request={req} />
                      </td>
                    </tr>,
                    isExpanded && (
                      <tr
                        key={`${req.id}-items`}
                        className="border-b border-border bg-muted/10"
                      >
                        <ItemsPanel items={req.items ?? []} />
                      </tr>
                    ),
                  ].filter(Boolean);
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            {filteredRequests.length} / {total} talep gösteriliyor
          </div>
        )}
      </div>

      <NewRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
