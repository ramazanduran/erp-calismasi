'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  FileText,
  CheckCircle,
  TrendingUp,
  Percent,
  ChevronDown,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/modals/modal';

// ─── Types ───────────────────────────────────────────────────────────────────

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

interface QuoteItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  customer: { id: string; name: string };
  status: QuoteStatus;
  totalAmount: number;
  validUntil: string;
  createdAt: string;
  items: QuoteItem[];
}

interface QuoteStats {
  total: number;
  byStatus: { status: QuoteStatus; _count: number }[];
}

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  salePrice?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  expired: 'Süresi Doldu',
};

const STATUS_CLASSES: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const CHANGEABLE_STATUSES: QuoteStatus[] = ['sent', 'accepted', 'rejected'];

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

// ─── New Quote Modal ──────────────────────────────────────────────────────────

interface NewLineItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
}

const emptyItem = (): NewLineItem => ({
  productId: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  vatRate: 18,
});

function NewQuoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: customersRaw } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => api.get<{ data: Customer[] }>('api/v1/sales/customers?limit=200'),
    enabled: open,
  });

  const { data: productsRaw } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => api.get<{ data: Product[] }>('api/v1/inventory/products?limit=200'),
    enabled: open,
  });

  const customers: Customer[] = useMemo(() => {
    const raw = customersRaw as unknown;
    if (Array.isArray(raw)) return raw as Customer[];
    if (raw && typeof raw === 'object' && 'data' in raw) return (raw as { data: Customer[] }).data ?? [];
    return [];
  }, [customersRaw]);

  const products: Product[] = useMemo(() => {
    const raw = productsRaw as unknown;
    if (Array.isArray(raw)) return raw as Product[];
    if (raw && typeof raw === 'object' && 'data' in raw) return (raw as { data: Product[] }).data ?? [];
    return [];
  }, [productsRaw]);

  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<NewLineItem[]>([emptyItem()]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => api.post('api/v1/quotes', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-stats'] });
      onClose();
    },
  });

  const updateItem = (index: number, field: keyof NewLineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
          const product = products.find((p) => p.id === value);
          if (product) {
            updated.description = product.name;
            updated.unitPrice = product.salePrice ?? 0;
          }
        }
        return updated;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => {
    const lineNet = item.quantity * item.unitPrice * (1 - item.discount / 100);
    return sum + lineNet;
  }, 0);

  const tax = items.reduce((sum, item) => {
    const lineNet = item.quantity * item.unitPrice * (1 - item.discount / 100);
    return sum + lineNet * (item.vatRate / 100);
  }, 0);

  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!customerId) { setError('Lütfen müşteri seçin.'); return; }
    if (!validUntil) { setError('Lütfen geçerlilik tarihi girin.'); return; }
    if (items.some((it) => !it.description)) { setError('Tüm kalemlere açıklama girin.'); return; }

    setSubmitting(true);
    try {
      await createMutation.mutateAsync({ customerId, validUntil, notes, items });
    } catch {
      setError('Teklif oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCustomerId(''); setValidUntil(''); setNotes('');
    setItems([emptyItem()]); setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Yeni Teklif" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Müşteri *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClass}>
              <option value="">Müşteri Seçin</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Geçerlilik Tarihi *</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">Notlar</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={cn(inputClass, 'resize-none')}
            placeholder="Ek notlar..."
          />
        </div>

        {/* Line Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Teklif Kalemleri</label>
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
              <div className="col-span-3">Ürün</div>
              <div className="col-span-3">Açıklama</div>
              <div className="col-span-1">Miktar</div>
              <div className="col-span-2">Birim Fiyat</div>
              <div className="col-span-1">İskonto%</div>
              <div className="col-span-1">KDV%</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-1 p-2 rounded-lg bg-muted/30 border border-border"
              >
                <div className="col-span-3">
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Ürün Seç</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Açıklama"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discount}
                    onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-1">
                  <select
                    value={item.vatRate}
                    onChange={(e) => updateItem(index, 'vatRate', Number(e.target.value))}
                    className={inputClass}
                  >
                    <option value={8}>%8</option>
                    <option value={18}>%18</option>
                    <option value={20}>%20</option>
                  </select>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    disabled={items.length === 1}
                    className="text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Ara Toplam</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>KDV</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1 mt-1">
              <span>Genel Toplam</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">{error}</p>
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
            {submitting ? 'Kaydediliyor...' : 'Teklif Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ quote }: { quote: Quote }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus }) =>
      api.patch(`api/v1/quotes/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-stats'] });
      setOpen(false);
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted transition-colors"
      >
        Durum Değiştir
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            {CHANGEABLE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => mutation.mutate({ id: quote.id, status: s })}
                disabled={quote.status === s || mutation.isPending}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors',
                  quote.status === s && 'opacity-40 cursor-not-allowed'
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuotesPage() {
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>('');
  const [page] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: quotesRaw, isLoading } = useQuery({
    queryKey: ['quotes', statusFilter, page],
    queryFn: () =>
      api.get<{ data: Quote[]; total: number }>('api/v1/quotes', {
        status: statusFilter || undefined,
        page,
        limit: 20,
      }),
  });

  const { data: statsRaw } = useQuery({
    queryKey: ['quotes-stats'],
    queryFn: () => api.get<QuoteStats>('api/v1/quotes/stats'),
  });

  const quotes: Quote[] = useMemo(() => {
    const raw = quotesRaw as unknown;
    if (Array.isArray(raw)) return raw as Quote[];
    if (raw && typeof raw === 'object' && 'data' in raw) return (raw as { data: Quote[] }).data ?? [];
    return [];
  }, [quotesRaw]);

  const total: number = useMemo(() => {
    const raw = quotesRaw as unknown;
    if (raw && typeof raw === 'object' && 'total' in raw) return (raw as { total: number }).total ?? 0;
    return quotes.length;
  }, [quotesRaw, quotes.length]);

  const stats = statsRaw as QuoteStats | undefined;

  const acceptedCount = stats?.byStatus?.find((s) => s.status === 'accepted')?._count ?? 0;
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');
  const acceptedTotal = acceptedQuotes.reduce((sum, q) => sum + (q.totalAmount ?? 0), 0);
  const conversionRate = (stats?.total ?? 0) > 0
    ? ((acceptedCount / (stats?.total ?? 1)) * 100).toFixed(1)
    : '0.0';

  const FILTER_TABS: { value: QuoteStatus | ''; label: string }[] = [
    { value: '', label: 'Tümü' },
    { value: 'draft', label: 'Taslak' },
    { value: 'sent', label: 'Gönderildi' },
    { value: 'accepted', label: 'Kabul' },
    { value: 'rejected', label: 'Reddedildi' },
    { value: 'expired', label: 'Süresi Doldu' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teklifler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Müşteri tekliflerini yönetin ve takip edin
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Teklif
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Toplam Teklif"
          value={stats?.total ?? 0}
          icon={FileText}
          colorClass="text-blue-500"
          bgClass="bg-blue-50 dark:bg-blue-950"
        />
        <StatCard
          label="Kabul Edilen"
          value={acceptedCount}
          icon={CheckCircle}
          colorClass="text-green-500"
          bgClass="bg-green-50 dark:bg-green-950"
        />
        <StatCard
          label="Kabul Tutar"
          value={formatCurrency(acceptedTotal)}
          icon={TrendingUp}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-50 dark:bg-emerald-950"
        />
        <StatCard
          label="Dönüşüm Oranı"
          value={`%${conversionRate}`}
          icon={Percent}
          colorClass="text-purple-500"
          bgClass="bg-purple-50 dark:bg-purple-950"
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
                ({stats.byStatus.find((s) => s.status === tab.value)?._count ?? 0})
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
                {['Teklif No', 'Müşteri', 'Tarih', 'Geçerlilik', 'Tutar', 'Durum', 'İşlemler'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={7} />
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <div className="space-y-2">
                      <p>Henüz teklif oluşturulmamış</p>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="text-primary hover:underline text-sm"
                      >
                        İlk Teklifi Oluştur
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                      {quote.quoteNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {quote.customer?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(quote.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {quote.validUntil ? formatDate(quote.validUntil) : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatCurrency(quote.totalAmount ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          STATUS_CLASSES[quote.status]
                        )}
                      >
                        {STATUS_LABELS[quote.status] ?? quote.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusDropdown quote={quote} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            {quotes.length} / {total} teklif gösteriliyor
          </div>
        )}
      </div>

      <NewQuoteModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
