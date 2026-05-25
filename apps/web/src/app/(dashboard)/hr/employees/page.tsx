'use client';

import { useState } from 'react';
import { Search, Plus, User, Phone, Mail } from 'lucide-react';

type EmployeeStatus = 'active' | 'inactive' | 'terminated';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  departmentId: string | null;
  departmentName: string | null;
  position: string | null;
  startDate: string;
  status: EmployeeStatus;
  salary: number;
  salaryType: 'monthly' | 'hourly';
}

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    employeeNumber: 'EMP-001',
    firstName: 'Ahmet',
    lastName: 'Yıldız',
    email: 'ahmet.yildiz@sirket.com',
    phone: '0532 111 2233',
    departmentId: 'dept-1',
    departmentName: 'Yazılım Geliştirme',
    position: 'Kıdemli Yazılım Mühendisi',
    startDate: '2020-03-01',
    status: 'active',
    salary: 55000,
    salaryType: 'monthly',
  },
  {
    id: '2',
    employeeNumber: 'EMP-002',
    firstName: 'Fatma',
    lastName: 'Demir',
    email: 'fatma.demir@sirket.com',
    phone: '0533 444 5566',
    departmentId: 'dept-2',
    departmentName: 'İnsan Kaynakları',
    position: 'İK Uzmanı',
    startDate: '2021-06-15',
    status: 'active',
    salary: 35000,
    salaryType: 'monthly',
  },
  {
    id: '3',
    employeeNumber: 'EMP-003',
    firstName: 'Mustafa',
    lastName: 'Kaya',
    email: 'mustafa.kaya@sirket.com',
    phone: null,
    departmentId: 'dept-3',
    departmentName: 'Satış',
    position: 'Satış Temsilcisi',
    startDate: '2022-01-10',
    status: 'active',
    salary: 28000,
    salaryType: 'monthly',
  },
  {
    id: '4',
    employeeNumber: 'EMP-004',
    firstName: 'Zeynep',
    lastName: 'Arslan',
    email: 'zeynep.arslan@sirket.com',
    phone: '0535 777 8899',
    departmentId: 'dept-1',
    departmentName: 'Yazılım Geliştirme',
    position: 'Frontend Geliştirici',
    startDate: '2023-02-20',
    status: 'inactive',
    salary: 40000,
    salaryType: 'monthly',
  },
];

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

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = MOCK_EMPLOYEES.filter((e) => {
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    const matchSearch =
      !search ||
      fullName.includes(search.toLowerCase()) ||
      e.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.position ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = MOCK_EMPLOYEES.filter((e) => e.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Çalışanlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} aktif çalışan — personel bilgilerini yönetin
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Yeni Çalışan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Çalışan', value: MOCK_EMPLOYEES.length },
          { label: 'Aktif', value: MOCK_EMPLOYEES.filter(e => e.status === 'active').length },
          { label: 'Departman', value: new Set(MOCK_EMPLOYEES.map(e => e.departmentId).filter(Boolean)).size },
          { label: 'Bu Ay İşe Başlayan', value: 1 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
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

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sicil No</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Çalışan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Departman / Pozisyon</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İletişim</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşe Başlama</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Maaş</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Çalışan bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {employee.employeeNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {employee.firstName} {employee.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground text-sm">{employee.position ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">{employee.departmentName ?? '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {employee.email}
                        </div>
                        {employee.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(employee.startDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {employee.salary.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      <div className="text-xs text-muted-foreground font-normal">
                        {employee.salaryType === 'monthly' ? 'aylık' : 'saatlik'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[employee.status]}`}
                      >
                        {STATUS_LABELS[employee.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} çalışan gösteriliyor</span>
          <span>Toplam: {MOCK_EMPLOYEES.length}</span>
        </div>
      </div>
    </div>
  );
}
