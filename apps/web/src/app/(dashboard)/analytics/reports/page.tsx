'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Package,
  FileText,
  Users,
  ShoppingCart,
  Building2,
  Download,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/utils/export';
import { exportToExcel } from '@/lib/utils/excel-export';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ReportType = 'sales' | 'inventory' | 'finance' | 'hr' | 'purchasing' | 'customers';

const REPORT_CARDS: {
  value: ReportType;
  label: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  border: string;
  selectedBg: string;
}[] = [
  {
    value: 'sales',
    label: 'Satış Raporu',
    icon: TrendingUp,
    color: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    selectedBg: 'bg-blue-600 dark:bg-blue-700',
  },
  {
    value: 'inventory',
    label: 'Stok Raporu',
    icon: Package,
    color: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800',
    selectedBg: 'bg-orange-600 dark:bg-orange-700',
  },
  {
    value: 'finance',
    label: 'Fatura Raporu',
    icon: FileText,
    color: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    selectedBg: 'bg-green-600 dark:bg-green-700',
  },
  {
    value: 'hr',
    label: 'İK Raporu',
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    selectedBg: 'bg-purple-600 dark:bg-purple-700',
  },
  {
    value: 'purchasing',
    label: 'Satın Alma Raporu',
    icon: ShoppingCart,
    color: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    selectedBg: 'bg-yellow-600 dark:bg-yellow-700',
  },
  {
    value: 'customers',
    label: 'Müşteri Raporu',
    icon: Building2,
    color: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    border: 'border-teal-200 dark:border-teal-800',
    selectedBg: 'bg-teal-600 dark:bg-teal-700',
  },
];

const ENDPOINT_MAP: Record<ReportType, string> = {
  sales: '/api/v1/sales/orders',
  inventory: '/api/v1/products',
  finance: '/api/v1/sales/invoices',
  hr: '/api/v1/employees',
  purchasing: '/api/v1/purchasing/orders',
  customers: '/api/v1/customers',
};

const REPORT_HEADERS: Record<ReportType, Record<string, string>> = {
  sales: {
    orderNumber: 'Sipariş No',
    customerName: 'Müşteri',
    status: 'Durum',
    totalAmount: 'Tutar',
    createdAt: 'Tarih',
  },
  inventory: {
    code: 'Kod',
    name: 'Ürün Adı',
    currentStock: 'Stok',
    minStock: 'Min Stok',
    unit: 'Birim',
  },
  finance: {
    invoiceNumber: 'Fatura No',
    customerName: 'Müşteri',
    status: 'Durum',
    totalAmount: 'Tutar',
    dueDate: 'Vade',
  },
  hr: {
    employeeNumber: 'Personel No',
    fullName: 'Ad Soyad',
    department: 'Departman',
    position: 'Pozisyon',
    status: 'Durum',
  },
  purchasing: {
    orderNumber: 'Sipariş No',
    supplierName: 'Tedarikçi',
    status: 'Durum',
    totalAmount: 'Tutar',
    createdAt: 'Tarih',
  },
  customers: {
    code: 'Kod',
    name: 'Müşteri Adı',
    status: 'Durum',
    city: 'Şehir',
    createdAt: 'Kayıt Tarihi',
  },
};

const MOCK_REPORT_DATA: Record<ReportType, Record<string, unknown>[]> = {
  sales: [
    { orderNumber: 'SO-2026-001', customer: { name: 'ABC Ticaret A.Ş.' }, status: 'completed', totalAmount: 45000, createdAt: '2026-05-01T00:00:00Z' },
    { orderNumber: 'SO-2026-002', customer: { name: 'XYZ Sanayi Ltd.' }, status: 'processing', totalAmount: 28500, createdAt: '2026-05-05T00:00:00Z' },
    { orderNumber: 'SO-2026-003', customer: { name: 'Marmara Tekstil' }, status: 'pending', totalAmount: 67200, createdAt: '2026-05-10T00:00:00Z' },
    { orderNumber: 'SO-2026-004', customer: { name: 'Global Gıda A.Ş.' }, status: 'completed', totalAmount: 15750, createdAt: '2026-05-14T00:00:00Z' },
    { orderNumber: 'SO-2026-005', customer: { name: 'Ege Elektronik Ltd.' }, status: 'cancelled', totalAmount: 9300, createdAt: '2026-05-18T00:00:00Z' },
  ],
  inventory: [
    { code: 'PRD-001', name: 'Laptop Dell XPS 15', currentStock: 45, minStock: 10, unit: 'Adet' },
    { code: 'PRD-002', name: 'Ofis Koltuğu Ergonomik', currentStock: 8, minStock: 5, unit: 'Adet' },
    { code: 'PRD-003', name: 'Yazıcı Toner (HP)', currentStock: 3, minStock: 5, unit: 'Kutu' },
    { code: 'PRD-004', name: 'A4 Kağıt 500 Yaprak', currentStock: 120, minStock: 20, unit: 'Paket' },
    { code: 'PRD-005', name: 'USB Hub 7 Port', currentStock: 0, minStock: 3, unit: 'Adet' },
  ],
  finance: [
    { invoiceNumber: 'FT-2026-041', customer: { name: 'ABC Ticaret A.Ş.' }, status: 'paid', totalAmount: 45000, dueDate: '2026-04-30T00:00:00Z' },
    { invoiceNumber: 'FT-2026-042', customer: { name: 'XYZ Sanayi Ltd.' }, status: 'sent', totalAmount: 28500, dueDate: '2026-06-15T00:00:00Z' },
    { invoiceNumber: 'FT-2026-043', customer: { name: 'Marmara Tekstil' }, status: 'overdue', totalAmount: 32000, dueDate: '2026-04-10T00:00:00Z' },
    { invoiceNumber: 'FT-2026-044', customer: { name: 'Global Gıda A.Ş.' }, status: 'draft', totalAmount: 15750, dueDate: '2026-06-30T00:00:00Z' },
    { invoiceNumber: 'FT-2026-045', customer: { name: 'Ege Elektronik Ltd.' }, status: 'paid', totalAmount: 9300, dueDate: '2026-05-01T00:00:00Z' },
  ],
  hr: [
    { employeeNumber: 'EMP-001', firstName: 'Ahmet', lastName: 'Demir', department: { name: 'Üretim' }, position: 'Üretim Şefi', status: 'active', createdAt: '2024-01-10T00:00:00Z' },
    { employeeNumber: 'EMP-002', firstName: 'Fatma', lastName: 'Şahin', department: { name: 'Muhasebe' }, position: 'Muhasebeci', status: 'active', createdAt: '2024-03-15T00:00:00Z' },
    { employeeNumber: 'EMP-003', firstName: 'Mehmet', lastName: 'Yılmaz', department: { name: 'Üretim' }, position: 'Makine Operatörü', status: 'active', createdAt: '2023-08-20T00:00:00Z' },
    { employeeNumber: 'EMP-004', firstName: 'Ayşe', lastName: 'Kaya', department: { name: 'İnsan Kaynakları' }, position: 'İK Uzmanı', status: 'active', createdAt: '2025-02-01T00:00:00Z' },
    { employeeNumber: 'EMP-005', firstName: 'Hasan', lastName: 'Çelik', department: { name: 'Lojistik' }, position: 'Depo Görevlisi', status: 'inactive', createdAt: '2022-11-05T00:00:00Z' },
  ],
  purchasing: [
    { orderNumber: 'PO-2026-018', supplier: { name: 'Tedarik Pro A.Ş.' }, status: 'received', totalAmount: 38000, createdAt: '2026-05-02T00:00:00Z' },
    { orderNumber: 'PO-2026-019', supplier: { name: 'Merkez Hammadde Ltd.' }, status: 'ordered', totalAmount: 52500, createdAt: '2026-05-08T00:00:00Z' },
    { orderNumber: 'PO-2026-020', supplier: { name: 'Endüstriyel Malzeme A.Ş.' }, status: 'pending', totalAmount: 19800, createdAt: '2026-05-12T00:00:00Z' },
    { orderNumber: 'PO-2026-021', supplier: { name: 'Tedarik Pro A.Ş.' }, status: 'approved', totalAmount: 14200, createdAt: '2026-05-20T00:00:00Z' },
    { orderNumber: 'PO-2026-022', supplier: { name: 'Küresel Tedarik Ltd.' }, status: 'cancelled', totalAmount: 8700, createdAt: '2026-05-22T00:00:00Z' },
  ],
  customers: [
    { code: 'MUS-001', name: 'ABC Ticaret A.Ş.', status: 'active', city: 'İstanbul', createdAt: '2023-03-10T00:00:00Z' },
    { code: 'MUS-002', name: 'XYZ Sanayi Ltd.', status: 'active', city: 'Ankara', createdAt: '2023-07-22T00:00:00Z' },
    { code: 'MUS-003', name: 'Marmara Tekstil', status: 'active', city: 'Bursa', createdAt: '2024-01-15T00:00:00Z' },
    { code: 'MUS-004', name: 'Global Gıda A.Ş.', status: 'inactive', city: 'İzmir', createdAt: '2022-11-30T00:00:00Z' },
    { code: 'MUS-005', name: 'Ege Elektronik Ltd.', status: 'active', city: 'İzmir', createdAt: '2025-05-10T00:00:00Z' },
  ],
};

const AMOUNT_KEYS = new Set(['totalAmount', 'unitPrice', 'amount']);
const DATE_KEYS = new Set(['createdAt', 'dueDate', 'updatedAt', 'orderDate']);
const STATUS_KEY = 'status';

const CHART_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#eab308', '#14b8a6', '#ef4444', '#6366f1'];

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  pending: 'Beklemede',
  approved: 'Onaylandı',
  cancelled: 'İptal',
  draft: 'Taslak',
  sent: 'Gönderildi',
  paid: 'Ödendi',
  overdue: 'Gecikmiş',
  partial: 'Kısmi',
  new: 'Yeni',
  processing: 'İşlemde',
  completed: 'Tamamlandı',
  received: 'Alındı',
  ordered: 'Sipariş Verildi',
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  received: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  ordered: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

function getThisWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(now.setDate(diff));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split('T')[0],
    end: sun.toISOString().split('T')[0],
  };
}

function getThisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { start, end };
}

function getThisQuarterRange() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0];
  const end = new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().split('T')[0];
  return { start, end };
}

function getThisYearRange() {
  const y = new Date().getFullYear();
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

function transformRow(type: ReportType, row: Record<string, unknown>): Record<string, unknown> {
  if (type === 'hr') {
    return {
      ...row,
      fullName: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
      department: typeof row.department === 'object' && row.department !== null
        ? (row.department as Record<string, unknown>).name ?? ''
        : row.department,
    };
  }
  if (type === 'customers') {
    return {
      ...row,
      name: row.name ?? row.companyName ?? row.fullName,
    };
  }
  if (type === 'sales' || type === 'purchasing') {
    return {
      ...row,
      customerName: row.customerName ?? (typeof row.customer === 'object' && row.customer !== null
        ? (row.customer as Record<string, unknown>).name ?? ''
        : row.customer),
      supplierName: row.supplierName ?? (typeof row.supplier === 'object' && row.supplier !== null
        ? (row.supplier as Record<string, unknown>).name ?? ''
        : row.supplier),
    };
  }
  return row;
}

function groupByField(rows: Record<string, unknown>[], field: string): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = String(row[field] ?? 'Bilinmiyor');
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({
    name: STATUS_LABELS[name] ?? name,
    value,
  }));
}

function topByField(rows: Record<string, unknown>[], nameField: string, valueField: string, top = 10): { name: string; value: number }[] {
  return rows
    .map((r) => ({ name: String(r[nameField] ?? ''), value: Number(r[valueField] ?? 0) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, top);
}

type SummaryItem = { label: string; value: string | number; sub?: string };

function buildSummary(type: ReportType, rows: Record<string, unknown>[]): SummaryItem[] {
  if (type === 'sales') {
    const total = rows.length;
    const revenue = rows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
    const avg = total > 0 ? revenue / total : 0;
    return [
      { label: 'Toplam Sipariş', value: total },
      { label: 'Toplam Ciro', value: formatCurrency(revenue) },
      { label: 'Ort. Sipariş Değeri', value: formatCurrency(avg) },
    ];
  }
  if (type === 'inventory') {
    const total = rows.length;
    const lowStock = rows.filter((r) => Number(r.currentStock) > 0 && Number(r.currentStock) <= Number(r.minStock)).length;
    const outOfStock = rows.filter((r) => Number(r.currentStock) <= 0).length;
    return [
      { label: 'Toplam Ürün', value: total },
      { label: 'Düşük Stok', value: lowStock, sub: 'kritik seviye' },
      { label: 'Stok Tükendi', value: outOfStock, sub: 'ürün' },
    ];
  }
  if (type === 'finance') {
    const total = rows.length;
    const paid = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
    const overdue = rows.filter((r) => r.status === 'overdue').reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
    return [
      { label: 'Toplam Fatura', value: total },
      { label: 'Ödenen', value: formatCurrency(paid) },
      { label: 'Gecikmiş', value: formatCurrency(overdue) },
    ];
  }
  if (type === 'hr') {
    const total = rows.length;
    const active = rows.filter((r) => r.status === 'active').length;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = rows.filter((r) => {
      const d = r.createdAt ? new Date(r.createdAt as string) : null;
      return d && d >= startOfMonth;
    }).length;
    return [
      { label: 'Toplam Personel', value: total },
      { label: 'Aktif', value: active },
      { label: 'Bu Ay Yeni', value: newThisMonth },
    ];
  }
  if (type === 'purchasing') {
    const total = rows.length;
    const spend = rows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
    return [
      { label: 'Toplam Sipariş', value: total },
      { label: 'Toplam Harcama', value: formatCurrency(spend) },
    ];
  }
  if (type === 'customers') {
    const total = rows.length;
    const active = rows.filter((r) => r.status === 'active').length;
    const now = new Date();
    const startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisPeriod = rows.filter((r) => {
      const d = r.createdAt ? new Date(r.createdAt as string) : null;
      return d && d >= startOfPeriod;
    }).length;
    return [
      { label: 'Toplam Müşteri', value: total },
      { label: 'Aktif', value: active },
      { label: 'Bu Dönem Yeni', value: newThisPeriod },
    ];
  }
  return [];
}

function buildChartData(type: ReportType, rows: Record<string, unknown>[]): { data: { name: string; value: number }[]; type: 'bar' | 'pie'; label: string } {
  if (type === 'sales') {
    return { data: groupByField(rows, 'status'), type: 'bar', label: 'Siparişler (Duruma Göre)' };
  }
  if (type === 'inventory') {
    return { data: topByField(rows, 'name', 'currentStock', 10), type: 'bar', label: 'En Çok Stoklu Ürünler (Top 10)' };
  }
  if (type === 'finance') {
    return { data: groupByField(rows, 'status'), type: 'bar', label: 'Faturalar (Duruma Göre)' };
  }
  if (type === 'hr') {
    const deptCounts: Record<string, number> = {};
    for (const row of rows) {
      const dept = String(row.department ?? 'Bilinmiyor');
      deptCounts[dept] = (deptCounts[dept] ?? 0) + 1;
    }
    return {
      data: Object.entries(deptCounts).map(([name, value]) => ({ name, value })),
      type: 'pie',
      label: 'Personel (Departmana Göre)',
    };
  }
  if (type === 'purchasing') {
    return { data: groupByField(rows, 'status'), type: 'bar', label: 'Satın Alma Siparişleri (Duruma Göre)' };
  }
  if (type === 'customers') {
    return {
      data: groupByField(rows, 'status'),
      type: 'pie',
      label: 'Müşteriler (Duruma Göre)',
    };
  }
  return { data: [], type: 'bar', label: '' };
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: rawData, isLoading, refetch } = useQuery({
    queryKey: ['report', reportType, startDate, endDate, submitted],
    queryFn: () =>
      api.get<Record<string, unknown>[] | { data: Record<string, unknown>[]; total: number }>(
        ENDPOINT_MAP[reportType],
        {
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          limit: '200',
        },
      ),
    enabled: submitted,
  });

  const rows: Record<string, unknown>[] = useMemo(() => {
    const raw = Array.isArray(rawData)
      ? rawData
      : (rawData as { data?: Record<string, unknown>[] } | undefined)?.data ?? [];
    const normalized = (raw as Record<string, unknown>[]).map((r) => transformRow(reportType, r));
    if (normalized.length === 0 && submitted) return MOCK_REPORT_DATA[reportType].map((r) => transformRow(reportType, r));
    return normalized;
  }, [rawData, reportType, submitted]);

  const headers = REPORT_HEADERS[reportType];
  const summaryItems = useMemo(() => buildSummary(reportType, rows), [reportType, rows]);
  const chartInfo = useMemo(() => buildChartData(reportType, rows), [reportType, rows]);

  const numericColumnKeys = useMemo(() => {
    return Object.keys(headers).filter((k) => AMOUNT_KEYS.has(k));
  }, [headers]);

  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const key of numericColumnKeys) {
      totals[key] = rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    }
    return totals;
  }, [rows, numericColumnKeys]);

  function applyPreset(preset: 'week' | 'month' | 'quarter' | 'year') {
    let range: { start: string; end: string };
    if (preset === 'week') range = getThisWeekRange();
    else if (preset === 'month') range = getThisMonthRange();
    else if (preset === 'quarter') range = getThisQuarterRange();
    else range = getThisYearRange();
    setStartDate(range.start);
    setEndDate(range.end);
    setSubmitted(true);
  }

  function handleReportTypeChange(type: ReportType) {
    setReportType(type);
    setSubmitted(false);
  }

  function handleSubmit() {
    setSubmitted(true);
    if (submitted) {
      refetch();
    }
  }

  function handleExportCSV() {
    const filename = `${REPORT_CARDS.find((r) => r.value === reportType)?.label ?? reportType}-${new Date().toISOString().split('T')[0]}`;
    downloadCSV(rows, filename, headers);
  }

  function handleExportExcel() {
    const filename = `${REPORT_CARDS.find((r) => r.value === reportType)?.label ?? reportType}-${new Date().toISOString().split('T')[0]}`;
    const columns = Object.entries(headers).map(([key, header]) => ({ key, header, width: 18 }));
    exportToExcel(rows, columns, filename, REPORT_CARDS.find((r) => r.value === reportType)?.label ?? 'Rapor');
  }

  function renderCellValue(key: string, value: unknown): React.ReactNode {
    if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">—</span>;
    if (key === STATUS_KEY && typeof value === 'string') {
      return (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_BADGE_COLORS[value] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')}>
          {STATUS_LABELS[value] ?? value}
        </span>
      );
    }
    if (AMOUNT_KEYS.has(key) && typeof value === 'number') {
      return <span className="font-semibold tabular-nums">{formatCurrency(value)}</span>;
    }
    if (DATE_KEYS.has(key) && (typeof value === 'string' || value instanceof Date)) {
      return <span className="text-muted-foreground">{formatDate(value as string)}</span>;
    }
    return <span>{String(value)}</span>;
  }

  const selectedCard = REPORT_CARDS.find((c) => c.value === reportType)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Raporlar</h1>
        <p className="text-muted-foreground mt-1">Rapor oluşturun ve dışa aktarın</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {REPORT_CARDS.map((card) => {
          const Icon = card.icon;
          const isSelected = reportType === card.value;
          return (
            <button
              key={card.value}
              onClick={() => handleReportTypeChange(card.value)}
              className={cn(
                'flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all hover:shadow-md',
                isSelected
                  ? `${card.selectedBg} border-transparent text-white shadow-md`
                  : `bg-card ${card.border} hover:border-opacity-70`,
              )}
            >
              <div className={cn('rounded-xl p-2.5', isSelected ? 'bg-white/20' : card.iconBg)}>
                <Icon className={cn('h-5 w-5', isSelected ? 'text-white' : card.color)} />
              </div>
              <span className={cn('text-xs font-semibold leading-tight', isSelected ? 'text-white' : 'text-foreground')}>
                {card.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset('week')}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              Bu Hafta
            </button>
            <button
              onClick={() => applyPreset('month')}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              Bu Ay
            </button>
            <button
              onClick={() => applyPreset('quarter')}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              Bu Çeyrek
            </button>
            <button
              onClick={() => applyPreset('year')}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              Bu Yıl
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Başlangıç Tarihi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setSubmitted(false); }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bitiş Tarihi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setSubmitted(false); }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Rapor Oluştur
              </button>
            </div>
          </div>
        </div>
      </div>

      {submitted && !isLoading && rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryItems.map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              {item.sub && <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {submitted && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Rapor yükleniyor...</p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Seçilen filtreler için kayıt bulunamadı</p>
            </div>
          ) : (
            <>
              {chartInfo.data.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-4">{chartInfo.label}</h3>
                  {chartInfo.type === 'bar' ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartInfo.data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                          formatter={(value: number) => [value, 'Adet']}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartInfo.data.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={chartInfo.data}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, percent }: { name: string; percent: number }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                          >
                            {chartInfo.data.map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            formatter={(value: number) => [value, 'Adet']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2 min-w-[160px]">
                        {chartInfo.data.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-sm shrink-0"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-xs text-foreground truncate">{entry.name}</span>
                            <span className="text-xs font-semibold text-muted-foreground ml-auto">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className={cn('rounded-lg p-1.5', selectedCard.iconBg)}>
                      <selectedCard.icon className={cn('h-4 w-4', selectedCard.color)} />
                    </div>
                    <h2 className="font-semibold text-foreground">{selectedCard.label}</h2>
                    <span className="text-sm text-muted-foreground">{rows.length} kayıt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      CSV
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Excel
                    </button>
                  </div>
                </div>

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
                            <td
                              key={key}
                              className={cn(
                                'px-4 py-3 whitespace-nowrap',
                                AMOUNT_KEYS.has(key) && 'text-right tabular-nums',
                              )}
                            >
                              {renderCellValue(key, row[key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    {numericColumnKeys.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-border bg-muted/40">
                          {Object.keys(headers).map((key, idx) => (
                            <td
                              key={key}
                              className={cn(
                                'px-4 py-3 whitespace-nowrap font-semibold',
                                AMOUNT_KEYS.has(key) && 'text-right tabular-nums text-primary',
                              )}
                            >
                              {idx === 0 ? (
                                <span className="text-muted-foreground">Toplam:</span>
                              ) : AMOUNT_KEYS.has(key) ? (
                                formatCurrency(columnTotals[key] ?? 0)
                              ) : null}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
