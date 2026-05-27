'use client';

import { useState, Fragment, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  X,
  DollarSign,
  Users,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  Loader2,
  ChevronDown,
  Banknote,
  AlertCircle,
  FileDown,
  Search,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type PayrollStatus = 'draft' | 'approved' | 'paid';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  department: { name: string };
}

interface Payroll {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: { name: string };
  };
  month: number;
  year: number;
  basicSalary: number;
  overtimePay: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  payDate?: string;
}

interface PayrollSummary {
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  paid: number;
  pending: number;
}

interface NewPayrollForm {
  employeeId: string;
  month: number;
  year: number;
  basicSalary: string;
  overtimePay: string;
  bonuses: string;
  deductions: string;
  payDate: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_PAYROLLS: Payroll[] = [
  { id: 'pay1', employee: { firstName: 'Ahmet', lastName: 'Yılmaz', employeeNumber: 'EMP-001', department: { name: 'Yazılım Geliştirme' } }, month: 5, year: 2026, basicSalary: 45000, overtimePay: 3200, bonuses: 5000, deductions: 5390, netSalary: 47810, status: 'approved' },
  { id: 'pay2', employee: { firstName: 'Zeynep', lastName: 'Kaya', employeeNumber: 'EMP-002', department: { name: 'Satış' } }, month: 5, year: 2026, basicSalary: 38000, overtimePay: 0, bonuses: 8000, deductions: 4560, netSalary: 41440, status: 'paid', payDate: '2026-05-25' },
  { id: 'pay3', employee: { firstName: 'Mehmet', lastName: 'Demir', employeeNumber: 'EMP-003', department: { name: 'Lojistik' } }, month: 5, year: 2026, basicSalary: 32000, overtimePay: 4800, bonuses: 0, deductions: 3696, netSalary: 33104, status: 'draft' },
  { id: 'pay4', employee: { firstName: 'Fatma', lastName: 'Şahin', employeeNumber: 'EMP-004', department: { name: 'İnsan Kaynakları' } }, month: 5, year: 2026, basicSalary: 35000, overtimePay: 0, bonuses: 2000, deductions: 3700, netSalary: 33300, status: 'paid', payDate: '2026-05-25' },
  { id: 'pay5', employee: { firstName: 'Can', lastName: 'Öztürk', employeeNumber: 'EMP-005', department: { name: 'Yazılım Geliştirme' } }, month: 5, year: 2026, basicSalary: 52000, overtimePay: 6000, bonuses: 0, deductions: 5800, netSalary: 52200, status: 'approved' },
  { id: 'pay6', employee: { firstName: 'Selin', lastName: 'Arslan', employeeNumber: 'EMP-006', department: { name: 'Muhasebe' } }, month: 5, year: 2026, basicSalary: 40000, overtimePay: 2000, bonuses: 3000, deductions: 4500, netSalary: 40500, status: 'draft' },
  { id: 'pay7', employee: { firstName: 'Berk', lastName: 'Çelik', employeeNumber: 'EMP-007', department: { name: 'Üretim' } }, month: 5, year: 2026, basicSalary: 28000, overtimePay: 7000, bonuses: 0, deductions: 3500, netSalary: 31500, status: 'paid', payDate: '2026-05-25' },
  { id: 'pay8', employee: { firstName: 'Nil', lastName: 'Demir', employeeNumber: 'EMP-008', department: { name: 'Pazarlama' } }, month: 5, year: 2026, basicSalary: 36000, overtimePay: 0, bonuses: 4000, deductions: 4000, netSalary: 36000, status: 'approved' },
];

const MONTHS = [
  { value: 1, label: 'Ocak' },
  { value: 2, label: 'Şubat' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Nisan' },
  { value: 5, label: 'Mayıs' },
  { value: 6, label: 'Haziran' },
  { value: 7, label: 'Temmuz' },
  { value: 8, label: 'Ağustos' },
  { value: 9, label: 'Eylül' },
  { value: 10, label: 'Ekim' },
  { value: 11, label: 'Kasım' },
  { value: 12, label: 'Aralık' },
];

const STATUS_LABELS: Record<PayrollStatus, string> = {
  draft: 'Hazırlandı',
  approved: 'Onaylandı',
  paid: 'Ödendi',
};

const STATUS_COLORS: Record<PayrollStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(value: number | string | undefined): string {
  const num = Number(value ?? 0);
  return `₺${num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-start gap-3">
      <div className={`mt-0.5 rounded-lg p-2 ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── New Payroll Modal ─────────────────────────────────────────────────────────

function NewPayrollModal({
  open,
  onClose,
  defaultMonth,
  defaultYear,
}: {
  open: boolean;
  onClose: () => void;
  defaultMonth: number;
  defaultYear: number;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewPayrollForm>({
    employeeId: '',
    month: defaultMonth,
    year: defaultYear,
    basicSalary: '',
    overtimePay: '',
    bonuses: '',
    deductions: '',
    payDate: '',
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: () => api.get<{ data: Employee[] }>('hr/employees?limit=200'),
    enabled: open,
  });
  const employees: Employee[] = (employeesData as any)?.data ?? (Array.isArray(employeesData) ? employeesData : []);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('api/v1/hr/payrolls', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Bordro başarıyla oluşturuldu');
      onClose();
      setForm({
        employeeId: '',
        month: defaultMonth,
        year: defaultYear,
        basicSalary: '',
        overtimePay: '',
        bonuses: '',
        deductions: '',
        payDate: '',
      });
    },
    onError: () => toast.error('Bordro oluşturulamadı'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.basicSalary) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }
    const payload: Record<string, unknown> = {
      employeeId: form.employeeId,
      month: Number(form.month),
      year: Number(form.year),
      basicSalary: parseFloat(form.basicSalary),
      ...(form.overtimePay && { overtimePay: parseFloat(form.overtimePay) }),
      ...(form.bonuses && { bonuses: parseFloat(form.bonuses) }),
      ...(form.deductions && { deductions: parseFloat(form.deductions) }),
      ...(form.payDate && { payDate: form.payDate }),
    };
    createMutation.mutate(payload);
  };

  if (!open) return null;

  const years = [2023, 2024, 2025, 2026];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-background border border-border shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Yeni Bordro Oluştur</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Employee */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Personel <span className="text-red-500">*</span>
            </label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="">Personel seçin...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeNumber} — {emp.firstName} {emp.lastName}
                  {emp.department?.name ? ` (${emp.department.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Month + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Ay</label>
              <select
                value={form.month}
                onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Yıl</label>
              <select
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Temel Maaş (₺) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.basicSalary}
                onChange={(e) => setForm((f) => ({ ...f, basicSalary: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Fazla Mesai (₺)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.overtimePay}
                onChange={(e) => setForm((f) => ({ ...f, overtimePay: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Primler (₺)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.bonuses}
                onChange={(e) => setForm((f) => ({ ...f, bonuses: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Kesintiler (₺)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.deductions}
                onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Net preview */}
          {form.basicSalary && (
            <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tahmini Net Ücret</span>
              <span className="text-base font-bold text-green-600">
                {formatMoney(
                  (parseFloat(form.basicSalary) || 0) +
                    (parseFloat(form.overtimePay) || 0) +
                    (parseFloat(form.bonuses) || 0) -
                    (parseFloat(form.deductions) || 0)
                )}
              </span>
            </div>
          )}

          {/* Pay date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ödeme Tarihi
            </label>
            <input
              type="date"
              value={form.payDate}
              onChange={(e) => setForm((f) => ({ ...f, payDate: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Bordro Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | ''>('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // ── Queries ──
  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll', month, year],
    queryFn: () =>
      api.get<{ data: Payroll[]; total: number }>('api/v1/hr/payrolls', {
        month,
        year,
        ...(statusFilter && { status: statusFilter }),
        page: 1,
      }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['payroll-summary', month, year],
    queryFn: () =>
      api.get<PayrollSummary>('api/v1/hr/payrolls/summary', { month, year }),
  });

  const isLoading = payrollLoading && !payrollData;

  const apiPayrolls: Payroll[] | null = useMemo(() => {
    if (payrollData === undefined) return null;
    if ((payrollData as any)?.data) return (payrollData as any).data as Payroll[];
    if (Array.isArray(payrollData)) return payrollData as Payroll[];
    return [];
  }, [payrollData]);

  const [localPayrolls, setLocalPayrolls] = useState<Payroll[]>(MOCK_PAYROLLS);

  const payrolls: Payroll[] = useMemo(() => {
    return (apiPayrolls ?? localPayrolls).filter((p) => p.month === month && p.year === year);
  }, [apiPayrolls, localPayrolls, month, year]);

  const summary = useMemo<PayrollSummary>(() => {
    const apiSum = summaryData as unknown as PayrollSummary | undefined;
    if (apiSum) return apiSum;
    const gross = payrolls.reduce((s, p) => s + p.basicSalary + p.overtimePay + p.bonuses, 0);
    const ded = payrolls.reduce((s, p) => s + p.deductions, 0);
    return {
      totalEmployees: payrolls.length,
      totalGross: gross,
      totalDeductions: ded,
      totalNet: payrolls.reduce((s, p) => s + p.netSalary, 0),
      paid: payrolls.filter((p) => p.status === 'paid').length,
      pending: payrolls.filter((p) => p.status !== 'paid').length,
    };
  }, [summaryData, payrolls]);

  // ── Mutations ──
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => {
      if (!apiPayrolls) {
        setLocalPayrolls((prev) => prev.map((p) => p.id === id ? { ...p, status: 'paid' as PayrollStatus, payDate: new Date('2026-05-27').toISOString() } : p));
        return Promise.resolve();
      }
      return api.patch(`api/v1/hr/payrolls/${id}`, { status: 'paid' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', month, year] });
      queryClient.invalidateQueries({ queryKey: ['payroll-summary', month, year] });
      toast.success('Bordro ödendi olarak işaretlendi');
    },
    onError: () => toast.error('İşlem başarısız oldu'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => {
      if (!apiPayrolls) {
        setLocalPayrolls((prev) => prev.map((p) => p.id === id ? { ...p, status: 'approved' as PayrollStatus } : p));
        return Promise.resolve();
      }
      return api.patch(`api/v1/hr/payrolls/${id}`, { status: 'approved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', month, year] });
      queryClient.invalidateQueries({ queryKey: ['payroll-summary', month, year] });
      toast.success('Bordro onaylandı');
    },
    onError: () => toast.error('İşlem başarısız oldu'),
  });

  // ── Filter locally by status + search ──
  const filtered = useMemo(() => {
    return payrolls.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = `${p.employee?.firstName ?? ''} ${p.employee?.lastName ?? ''}`.toLowerCase();
        const num = p.employee?.employeeNumber?.toLowerCase() ?? '';
        if (!name.includes(q) && !num.includes(q)) return false;
      }
      return true;
    });
  }, [payrolls, statusFilter, search]);

  const years = [2023, 2024, 2025, 2026];

  const STATUS_FILTER_TABS = [
    { value: '' as const, label: 'Tümü' },
    { value: 'draft' as const, label: 'Hazırlandı' },
    { value: 'approved' as const, label: 'Onaylandı' },
    { value: 'paid' as const, label: 'Ödendi' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bordro Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aylık maaş bordrolarını yönetin ve ödemeleri takip edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filtered.map((p) => ({
                employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
                employeeNumber: p.employee.employeeNumber,
                department: p.employee.department?.name ?? '',
                month: p.month,
                year: p.year,
                basicSalary: p.basicSalary,
                overtimePay: p.overtimePay,
                bonuses: p.bonuses,
                deductions: p.deductions,
                netSalary: p.netSalary,
                status: STATUS_LABELS[p.status] ?? p.status,
                payDate: p.payDate ? new Date(p.payDate).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'employeeName', header: 'Çalışan', width: 22 },
                { key: 'employeeNumber', header: 'Sicil No', width: 12 },
                { key: 'department', header: 'Departman', width: 18 },
                { key: 'month', header: 'Ay', width: 6 },
                { key: 'year', header: 'Yıl', width: 6 },
                { key: 'basicSalary', header: 'Temel Maaş', width: 14 },
                { key: 'overtimePay', header: 'Fazla Mesai', width: 14 },
                { key: 'bonuses', header: 'Prim', width: 12 },
                { key: 'deductions', header: 'Kesintiler', width: 12 },
                { key: 'netSalary', header: 'Net Maaş', width: 14 },
                { key: 'status', header: 'Durum', width: 12 },
                { key: 'payDate', header: 'Ödeme Tarihi', width: 14 },
              ],
              'bordro',
              'Bordro'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted self-start sm:self-auto"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Bordro Oluştur
          </button>
        </div>
      </div>

      {/* ── Period selectors ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent text-sm focus:outline-none"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent text-sm focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-muted-foreground">
          {MONTHS.find((m) => m.value === month)?.label} {year}
        </span>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Toplam Çalışan"
          value={String(summary?.totalEmployees ?? payrolls.length)}
          sub={`${summary?.paid ?? 0} ödendi, ${summary?.pending ?? 0} bekliyor`}
          icon={Users}
          iconClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Toplam Brüt Ücret"
          value={formatMoney(summary?.totalGross ?? payrolls.reduce((s, p) => s + Number(p.basicSalary) + Number(p.overtimePay ?? 0) + Number(p.bonuses ?? 0), 0))}
          icon={DollarSign}
          iconClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <SummaryCard
          label="Toplam Kesinti"
          value={formatMoney(summary?.totalDeductions ?? payrolls.reduce((s, p) => s + Number(p.deductions ?? 0), 0))}
          icon={TrendingDown}
          iconClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <SummaryCard
          label="Toplam Net Ücret"
          value={formatMoney(summary?.totalNet ?? payrolls.reduce((s, p) => s + Number(p.netSalary ?? 0), 0))}
          icon={Banknote}
          iconClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
      </div>

      {/* ── Status filter tabs + search ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Personel adı veya sicil no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-56"
          />
        </div>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1 w-fit">
        {STATUS_FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.value !== '' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({payrolls.filter((p) => p.status === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Personel No
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Personel Adı
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Departman
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Temel Maaş
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Fazla Mesai
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Primler
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Kesintiler
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Net Ücret
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Durum
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <SkeletonRows cols={10} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                    <p className="text-muted-foreground">
                      {statusFilter
                        ? 'Bu durumda bordro bulunamadı'
                        : 'Bu dönem için bordro bulunamadı. "Bordro Oluştur" butonuna tıklayın.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isPending =
                    markPaidMutation.isPending || approveMutation.isPending;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {p.employee?.employeeNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        {p.employee?.firstName} {p.employee?.lastName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {p.employee?.department?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {formatMoney(p.basicSalary)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                        {formatMoney(p.overtimePay)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                        {formatMoney(p.bonuses)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                        {formatMoney(p.deductions)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                        {formatMoney(p.netSalary)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
                            STATUS_COLORS[p.status] ?? 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {p.status === 'draft' && (
                            <button
                              onClick={() => approveMutation.mutate(p.id)}
                              disabled={isPending}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Onayla
                            </button>
                          )}
                          {p.status === 'approved' && (
                            <button
                              onClick={() => markPaidMutation.mutate(p.id)}
                              disabled={isPending}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              {isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <TrendingUp className="h-3 w-3" />
                              )}
                              Ödendi İşaretle
                            </button>
                          )}
                          {p.status === 'paid' && (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle className="h-3.5 w-3.5" />
                              {p.payDate
                                ? new Date(p.payDate).toLocaleDateString('tr-TR')
                                : 'Ödendi'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{filtered.length} bordro gösteriliyor</span>
            <span>
              {filtered.filter((p) => p.status === 'paid').length} ödendi /{' '}
              {filtered.filter((p) => p.status !== 'paid').length} bekliyor
            </span>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <NewPayrollModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultMonth={month}
        defaultYear={year}
      />
    </div>
  );
}
