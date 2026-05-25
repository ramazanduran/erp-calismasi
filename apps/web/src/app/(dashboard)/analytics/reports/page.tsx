'use client';

import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { downloadCSV } from '@/lib/utils/export';

const REPORT_TYPES = [
  { value: 'sales', label: 'Satış Raporu' },
  { value: 'inventory', label: 'Stok Raporu' },
  { value: 'finance', label: 'Fatura Raporu' },
  { value: 'hr', label: 'İK Raporu' },
] as const;

type ReportType = (typeof REPORT_TYPES)[number]['value'];

// ---- Column definitions ----
const REPORT_HEADERS: Record<ReportType, Record<string, string>> = {
  sales: { orderNumber: 'Sipariş No', customerName: 'Müşteri', status: 'Durum', totalAmount: 'Tutar', createdAt: 'Tarih' },
  inventory: { code: 'Kod', name: 'Ürün Adı', currentStock: 'Stok', minStock: 'Min Stok', unit: 'Birim' },
  finance: { invoiceNumber: 'Fatura No', customerName: 'Müşteri', status: 'Durum', totalAmount: 'Tutar', dueDate: 'Vade' },
  hr: { employeeNumber: 'Personel No', fullName: 'Ad Soyad', department: 'Departman', position: 'Pozisyon', status: 'Durum' },
};

const ENDPOINT_MAP: Record<ReportType, string> = {
  sales: '/api/v1/orders',
  inventory: '/api/v1/products',
  finance: '/api/v1/invoices',
  hr: '/api/v1/employees',
};

function formatRowValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '';
  if ((key === 'totalAmount') && typeof value === 'number') return formatCurrency(value);
  if ((key === 'createdAt' || key === 'dueDate') && (typeof value === 'string' || value instanceof Date)) return formatDate(value as string);
  return String(value);
}

// Transform raw API rows into display-friendly shape
function transformRow(type: ReportType, row: Record<string, unknown>): Record<string, unknown> {
  if (type === 'hr') {
    return {
      ...row,
      fullName: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
    };
  }
  return row;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report', reportType, startDate, endDate, submitted],
    queryFn: () =>
      api.get<{ data: Record<string, unknown>[]; total: number }>(ENDPOINT_MAP[reportType], {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        limit: '200',
      }),
    enabled: submitted,
  });

  const rows: Record<string, unknown>[] = ((rawData as unknown as { data?: Record<string, unknown>[] })?.data ?? (Array.isArray(rawData) ? rawData : [])).map(
    (r) => transformRow(reportType, r as Record<string, unknown>),
  );

  const headers = REPORT_HEADERS[reportType];

  function handleExport() {
    downloadCSV(
      rows,
      `${REPORT_TYPES.find((r) => r.value === reportType)?.label ?? reportType}-${new Date().toISOString().split('T')[0]}`,
      headers,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Raporlar</h1>
        <p className="text-muted-foreground mt-1">Rapor oluşturun ve dışa aktarın</p>
      </div>

      {/* Filter Panel */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Rapor Filtresi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Rapor Türü</label>
            <select
              value={reportType}
              onChange={(e) => { setReportType(e.target.value as ReportType); setSubmitted(false); }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {REPORT_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Başlangıç Tarihi</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Bitiş Tarihi</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => setSubmitted(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filtrele
            </button>
            <button
              onClick={handleExport}
              disabled={rows.length === 0}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {submitted && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">
              {REPORT_TYPES.find((r) => r.value === reportType)?.label}
            </h2>
            {!isLoading && (
              <span className="text-sm text-muted-foreground">{rows.length} kayıt</span>
            )}
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
              Rapor yükleniyor...
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Kayıt bulunamadı
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    {Object.values(headers).map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      {Object.keys(headers).map((key) => (
                        <td key={key} className="px-4 py-3 whitespace-nowrap">
                          {formatRowValue(key, row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
