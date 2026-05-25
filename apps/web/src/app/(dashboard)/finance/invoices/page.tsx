'use client';

import { useState } from 'react';
import { Search, Plus, TrendingUp, TrendingDown, Clock } from 'lucide-react';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type InvoiceType = 'sale' | 'purchase' | 'refund';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  type: InvoiceType;
  status: InvoiceStatus;
  netAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string | null;
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'FAT-2024-001',
    customerName: 'ABC Teknoloji A.Ş.',
    type: 'sale',
    status: 'paid',
    netAmount: 20762.71,
    totalAmount: 24500,
    currency: 'TRY',
    issueDate: '2024-03-01',
    dueDate: '2024-03-31',
  },
  {
    id: '2',
    invoiceNumber: 'FAT-2024-002',
    customerName: 'Tedarikçi XYZ',
    type: 'purchase',
    status: 'sent',
    netAmount: 42372.88,
    totalAmount: 50000,
    currency: 'TRY',
    issueDate: '2024-03-10',
    dueDate: '2024-04-10',
  },
  {
    id: '3',
    invoiceNumber: 'FAT-2024-003',
    customerName: 'Mehmet Yılmaz',
    type: 'sale',
    status: 'overdue',
    netAmount: 7372.88,
    totalAmount: 8700,
    currency: 'TRY',
    issueDate: '2024-02-20',
    dueDate: '2024-03-20',
  },
  {
    id: '4',
    invoiceNumber: 'FAT-2024-004',
    customerName: 'ABC Teknoloji A.Ş.',
    type: 'refund',
    status: 'draft',
    netAmount: 1694.92,
    totalAmount: 2000,
    currency: 'TRY',
    issueDate: '2024-03-28',
    dueDate: null,
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

const TYPE_ICONS: Record<InvoiceType, React.FC<{ className?: string }>> = {
  sale: TrendingUp,
  purchase: TrendingDown,
  refund: Clock,
};

export default function FinanceInvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = MOCK_INVOICES.filter((inv) => {
    const matchSearch =
      !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    const matchType = !typeFilter || inv.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const totalIncome = MOCK_INVOICES
    .filter((i) => i.type === 'sale' && i.status === 'paid')
    .reduce((s, i) => s + i.totalAmount, 0);
  const totalExpense = MOCK_INVOICES
    .filter((i) => i.type === 'purchase' && i.status === 'paid')
    .reduce((s, i) => s + i.totalAmount, 0);
  const pendingAmount = MOCK_INVOICES
    .filter((i) => ['sent', 'overdue'].includes(i.status))
    .reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finansal Faturalar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm gelir ve gider faturalarını yönetin
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Yeni Fatura
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Toplam Gelir (Ödenen)</p>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {totalIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Toplam Gider (Ödenen)</p>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {totalExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Bekleyen Tahsilat</p>
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {pendingAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Fatura ara (no, müşteri/tedarikçi)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm Tipler</option>
          <option value="sale">Satış</option>
          <option value="purchase">Alış</option>
          <option value="refund">İade</option>
        </select>
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Taraf</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tip</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net Tutar</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Toplam</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tarih</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    Fatura bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => {
                  const TypeIcon = TYPE_ICONS[invoice.type];
                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {invoice.customerName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <TypeIcon className="h-4 w-4" />
                          {TYPE_LABELS[invoice.type]}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {invoice.netAmount.toLocaleString('tr-TR', { style: 'currency', currency: invoice.currency })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {invoice.totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: invoice.currency })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(invoice.issueDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[invoice.status]}`}
                        >
                          {STATUS_LABELS[invoice.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })
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
