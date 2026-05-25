'use client';

import { useState } from 'react';
import { Search, Plus, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

type LeaveStatus = 'pending' | 'approved' | 'rejected';
type LeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity';

interface LeaveRequest {
  id: string;
  employee: { employeeNumber: string; firstName: string; lastName: string };
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  createdAt: string;
}

const MOCK_LEAVES: LeaveRequest[] = [
  {
    id: '1',
    employee: { employeeNumber: 'EMP-001', firstName: 'Ahmet', lastName: 'Yıldız' },
    type: 'annual',
    startDate: '2024-04-08',
    endDate: '2024-04-12',
    days: 5,
    status: 'approved',
    reason: 'Yıllık tatil',
    createdAt: '2024-03-20',
  },
  {
    id: '2',
    employee: { employeeNumber: 'EMP-002', firstName: 'Fatma', lastName: 'Demir' },
    type: 'sick',
    startDate: '2024-04-01',
    endDate: '2024-04-02',
    days: 2,
    status: 'approved',
    reason: 'Hastalık raporu',
    createdAt: '2024-04-01',
  },
  {
    id: '3',
    employee: { employeeNumber: 'EMP-003', firstName: 'Mustafa', lastName: 'Kaya' },
    type: 'annual',
    startDate: '2024-04-15',
    endDate: '2024-04-19',
    days: 5,
    status: 'pending',
    reason: 'Aile ziyareti',
    createdAt: '2024-03-28',
  },
  {
    id: '4',
    employee: { employeeNumber: 'EMP-004', firstName: 'Zeynep', lastName: 'Arslan' },
    type: 'unpaid',
    startDate: '2024-03-25',
    endDate: '2024-03-29',
    days: 5,
    status: 'rejected',
    reason: 'Kişisel nedenler',
    createdAt: '2024-03-15',
  },
];

const STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Beklemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

const STATUS_CLASSES: Record<LeaveStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Yıllık İzin',
  sick: 'Hastalık İzni',
  unpaid: 'Ücretsiz İzin',
  maternity: 'Doğum İzni',
  paternity: 'Babalık İzni',
};

const StatusIcon = ({ status }: { status: LeaveStatus }) => {
  if (status === 'approved') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-yellow-600" />;
};

export default function LeavesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = MOCK_LEAVES.filter((l) => {
    const fullName = `${l.employee.firstName} ${l.employee.lastName}`.toLowerCase();
    const matchSearch =
      !search ||
      fullName.includes(search.toLowerCase()) ||
      l.employee.employeeNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || l.status === statusFilter;
    const matchType = !typeFilter || l.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const pendingCount = MOCK_LEAVES.filter((l) => l.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">İzin Talepleri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Çalışan izin taleplerini yönetin ve onaylayın
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Yeni Talep
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Talep', value: MOCK_LEAVES.length, color: 'text-foreground' },
          { label: 'Bekleyen', value: pendingCount, color: 'text-yellow-600' },
          { label: 'Onaylanan', value: MOCK_LEAVES.filter(l => l.status === 'approved').length, color: 'text-green-600' },
          { label: 'Reddedilen', value: MOCK_LEAVES.filter(l => l.status === 'rejected').length, color: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-900/10 p-3">
          <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <span className="font-semibold">{pendingCount} izin talebi</span> onayınızı bekliyor
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Çalışan ara (ad, sicil no)..."
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
          <option value="">Tüm İzin Tipleri</option>
          <option value="annual">Yıllık İzin</option>
          <option value="sick">Hastalık İzni</option>
          <option value="unpaid">Ücretsiz İzin</option>
          <option value="maternity">Doğum İzni</option>
          <option value="paternity">Babalık İzni</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm Durumlar</option>
          <option value="pending">Beklemede</option>
          <option value="approved">Onaylandı</option>
          <option value="rejected">Reddedildi</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Çalışan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İzin Tipi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Başlangıç</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bitiş</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Gün</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sebep</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    İzin talebi bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {leave.employee.firstName} {leave.employee.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {leave.employee.employeeNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {TYPE_LABELS[leave.type]}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(leave.startDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(leave.endDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {leave.days} gün
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">
                      {leave.reason ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={leave.status} />
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[leave.status]}`}
                        >
                          {STATUS_LABELS[leave.status]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {leave.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <button className="rounded px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors">
                            Onayla
                          </button>
                          <button className="rounded px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors">
                            Reddet
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} talep gösteriliyor</span>
          <span>Toplam: {MOCK_LEAVES.length}</span>
        </div>
      </div>
    </div>
  );
}
