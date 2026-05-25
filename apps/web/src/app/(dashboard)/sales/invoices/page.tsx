'use client';

import { useState } from 'react';
import { Search, Plus, FileText } from 'lucide-react';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type InvoiceType = 'sale' | 'purchase' | 'refund';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: { name: string };
  type: InvoiceType;
  status: InvoiceStatus;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'FAT-2024-001',
    customer: { name: 'ABC Teknoloji A.Ş.' },
    type: 'sale',
    status: 'paid',
    netAmount: 20762.71,
    taxAmount: 3737.29,
    totalAmount: 24500,
    currency: 'TRY',
    issueDate: '2024-03-01',
    dueDate: '2024-03-31',
    paidAt: '2024-03-28',
  },
  {
    id: '2',
    invoiceNumber: 'FAT-2024-002',
    customer: { name: 'Mehmet Yılmaz' },
    type: 'sale',
    status: 'sent',
    netAmount: 1567.80,
    taxAmount: 282.20,
    totalAmount: 1850,
    currency: 'TRY',
    issueDate: '2024-03-15',
    dueDate: '2024-04-15',
    paidAt: null,
  },
  {
    id: '3',
    invoiceNumber: 'FAT-2024-003',
    customer: { name: 'XYZ Ticaret Ltd. Şti.' },
    type: 'sale',
    status: 'overdue',
    netAmount: 7372.88,
    taxAmount: 1327.12,
    totalAmount: 8700,
    currency: 'TRY',
    issueDate: '2024-02-20',
    dueDate: '2024-03-20',
    paidAt: null,
  },
  {
    id: '4',
    invoiceNumber: 'FAT-2024-004',
    customer: { name: 'ABC Teknoloji A.Ş.' },
    type: 'sale',
    status: 'draft',
    netAmount: 12966.10,
    taxAmount: 2333.90,
    totalAmount: 15300,
    currency: 'TRY',
    issueDate: '2024-03-28',
    dueDate: '2024-04-28',
    paidAt: null,
  },
];

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  paid: 'Ödendi',
  overdue: 'Vadesi Geçti',
  cancelled: 'İptal',
};

const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

const TYPE_LABELS: Record<InvoiceType, string> = {
  sale: 'Satış',
  purchase: 'Alış',
  refund: 'İade',
};

export default function SalesInvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = MOCK_INVOICES.filter((inv) => {
    const matchSearch =
      !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = MOCK_INVOICES
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faturalar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Satış faturalarını oluşturun ve yönetin
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Yeni Fatura
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Fatura', value: MOCK_INVOICES.length, suffix: 'adet', color: 'text-foreground' },
          { label: 'Bekleyen Tahsilat', value: totalPending.toLocaleString('tr-TR'), suffix: '₺', color: 'text-yellow-600' },
          { label: 'Vadesi Geçmiş', value: MOCK_INVOICES.filter(i => i.status === 'overdue').length, suffix: 'adet', color: 'text-red-600' },
          { label: 'Bu Ay Ödenen', value: MOCK_INVOICES.filter(i => i.status === 'paid').length, suffix: 'adet', color: 'text-green-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={`text-xl font-bold mt-1 ${card.color}`}>
              {card.value} <span className="text-sm font-normal">{card.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Fatura ara (no, müşteri)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm Durumlar</option>
          <option value="draft">Taslak</option>
          <option value="sent">Gönderildi</option>
          <option value="paid">Ödendi</option>
          <option value="overdue">Vadesi Geçti</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fatura No</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Müşteri</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tip</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">KDV Hariç</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Fatura bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {invoice.customer.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {TYPE_LABELS[invoice.type]}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {invoice.netAmount.toLocaleString('tr-TR', { style: 'currency', currency: invoice.currency })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {invoice.totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: invoice.currency })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString('tr-TR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[invoice.status]}`}
                      >
                        {STATUS_LABELS[invoice.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} fatura gösteriliyor</span>
          <span>Toplam: {MOCK_INVOICES.length}</span>
        </div>
      </div>
    </div>
  );
}
