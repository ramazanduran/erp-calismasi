'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, User, Phone, Mail, Pencil, Trash2, FileDown, Users, UserCheck, UserX, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useEmployees, useDeleteEmployee } from '@/lib/api/hooks';
import { EmployeeModal } from '@/components/modals/employee-modal';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { exportToExcel } from '@/lib/utils/excel-export';
import { cn } from '@/lib/utils';

type EmployeeStatus = 'active' | 'inactive' | 'terminated';

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  terminated: 'Ayrıldı',
};

const STATUS_CLASSES: Record<EmployeeStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  terminated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const MOCK_EMPLOYEES_LIST = [
  { id: 'e1', employeeNumber: 'EMP-001', firstName: 'Ahmet', lastName: 'Demir', department: { name: 'Üretim' }, position: 'Üretim Şefi', status: 'active', hireDate: '2024-01-10T00:00:00Z', salary: 35000, email: 'ahmet.demir@demo.com', phone: '+90 532 111 0001' },
  { id: 'e2', employeeNumber: 'EMP-002', firstName: 'Fatma', lastName: 'Şahin', department: { name: 'Muhasebe' }, position: 'Muhasebeci', status: 'active', hireDate: '2024-03-15T00:00:00Z', salary: 32000, email: 'fatma.sahin@demo.com', phone: '+90 532 111 0002' },
  { id: 'e3', employeeNumber: 'EMP-003', firstName: 'Mehmet', lastName: 'Yılmaz', department: { name: 'Lojistik' }, position: 'Depo Sorumlusu', status: 'active', hireDate: '2023-08-20T00:00:00Z', salary: 28000, email: 'mehmet.yilmaz@demo.com', phone: '+90 532 111 0003' },
  { id: 'e4', employeeNumber: 'EMP-004', firstName: 'Ayşe', lastName: 'Kaya', department: { name: 'İnsan Kaynakları' }, position: 'İK Uzmanı', status: 'active', hireDate: '2025-02-01T00:00:00Z', salary: 30000, email: 'ayse.kaya@demo.com', phone: '+90 532 111 0004' },
  { id: 'e5', employeeNumber: 'EMP-005', firstName: 'Hasan', lastName: 'Çelik', department: { name: 'Satış' }, position: 'Satış Temsilcisi', status: 'inactive', hireDate: '2022-11-05T00:00:00Z', salary: 0, email: 'hasan.celik@demo.com', phone: '+90 532 111 0005' },
];

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: employees, isLoading } = useEmployees({ search, status: statusFilter || undefined });
  const deleteEmployee = useDeleteEmployee();

  const employeesList = Array.isArray(employees) ? employees : (!isLoading ? MOCK_EMPLOYEES_LIST : []);

  const employeeStats = useMemo(() => {
    const total = employeesList.length;
    const active = employeesList.filter((e: Record<string, unknown>) => e.status === 'active').length;
    const inactive = employeesList.filter((e: Record<string, unknown>) => e.status === 'inactive' || e.status === 'terminated').length;
    const totalSalary = employeesList.reduce((s: number, e: Record<string, unknown>) => s + Number(e.salary ?? 0), 0);
    return { total, active, inactive, totalSalary };
  }, [employeesList]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === employeesList.length) setSelectedIds(new Set());
    else setSelectedIds(new Set((employeesList as any[])?.map((e: any) => e.id) || []));
  };

  const handleEdit = (employee: Record<string, unknown>) => {
    setEditData(employee);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" çalışanını silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteEmployee.mutateAsync(id);
      toast.success('Çalışan silindi');
    } catch {
      toast.error('Çalışan silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Çalışanlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personel bilgilerini yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              employeesList as any[] || [],
              [
                { key: 'employeeNumber', header: 'Sicil No', width: 12 },
                { key: 'firstName', header: 'Ad', width: 15 },
                { key: 'lastName', header: 'Soyad', width: 15 },
                { key: 'email', header: 'E-posta', width: 25 },
                { key: 'phone', header: 'Telefon', width: 15 },
                { key: 'position', header: 'Pozisyon', width: 20 },
                { key: 'status', header: 'Durum', width: 10 },
              ],
              'calisanlar',
              'Çalışanlar'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => { setEditData(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Çalışan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Çalışan', value: employeeStats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Aktif', value: employeeStats.active, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Pasif / Ayrılan', value: employeeStats.inactive, icon: UserX, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900' },
          { label: 'Toplam Maaş', value: employeeStats.totalSalary.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }), icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold mt-0.5">{card.value}</p>
              </div>
              <div className={cn('p-2 rounded-lg', card.bg)}>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Çalışan ara (ad, sicil no, pozisyon)..."
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
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
          <option value="terminated">Ayrıldı</option>
        </select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={employeesList.length > 0 && selectedIds.size === employeesList.length}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sicil No</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Çalışan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Departman / Pozisyon</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İletişim</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşe Başlama</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Maaş</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : employeesList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <div className="space-y-2">
                      <p>Henüz kayıt yok</p>
                      <button
                        onClick={() => { setEditData(null); setModalOpen(true); }}
                        className="text-primary hover:underline text-sm"
                      >
                        Yeni Çalışan Ekle
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                employeesList.map((employee: Record<string, unknown>) => (
                  <tr
                    key={employee.id as string}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(employee.id as string)}
                        onChange={() => toggleSelect(employee.id as string)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {employee.employeeNumber as string}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {(employee.firstName as string)?.[0]}{(employee.lastName as string)?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {employee.firstName as string} {employee.lastName as string}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground text-sm">{(employee.position as string) ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">{(employee.departmentName as string) ?? '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {employee.email as string}
                        </div>
                        {employee.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {employee.phone as string}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(employee.startDate as string).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {Number(employee.salary ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      <div className="text-xs text-muted-foreground font-normal">
                        {employee.salaryType === 'monthly' ? 'aylık' : 'saatlik'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[(employee.status as EmployeeStatus)] ?? ''}`}>
                        {STATUS_LABELS[(employee.status as EmployeeStatus)] ?? employee.status as string}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id as string, `${employee.firstName} ${employee.lastName}`)}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{employeesList.length} çalışan gösteriliyor</span>
          </div>
        )}
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={[
          {
            label: 'Sil',
            icon: <Trash2 className="h-3.5 w-3.5" />,
            variant: 'danger',
            onClick: async () => {
              if (!confirm(`${selectedIds.size} çalışan silinecek, emin misiniz?`)) return;
              await Promise.all([...selectedIds].map(id => deleteEmployee.mutateAsync(id)));
              setSelectedIds(new Set());
              toast.success(`${selectedIds.size} çalışan silindi`);
            },
          },
        ]}
      />

      <EmployeeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        editData={editData as Parameters<typeof EmployeeModal>[0]['editData']}
      />
    </div>
  );
}
