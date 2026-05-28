'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Calendar, CheckCircle, XCircle, Clock, Users, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useLeaves, useUpdateLeaveStatus } from '@/lib/api/hooks';
import { LeaveModal } from '@/components/modals/leave-modal';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

type LeaveStatus = 'pending' | 'approved' | 'rejected';
type LeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity';

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

const MOCK_LEAVES = [
  { id: 'lv1', employee: { firstName: 'Ahmet', lastName: 'Demir' }, type: 'annual', startDate: '2026-06-01', endDate: '2026-06-07', days: 7, status: 'approved', reason: 'Yıllık izin' },
  { id: 'lv2', employee: { firstName: 'Fatma', lastName: 'Şahin' }, type: 'sick', startDate: '2026-05-20', endDate: '2026-05-22', days: 3, status: 'approved', reason: 'Hastalık' },
  { id: 'lv3', employee: { firstName: 'Mehmet', lastName: 'Yılmaz' }, type: 'annual', startDate: '2026-07-14', endDate: '2026-07-25', days: 12, status: 'pending', reason: 'Yaz tatili' },
  { id: 'lv4', employee: { firstName: 'Ayşe', lastName: 'Kaya' }, type: 'maternity', startDate: '2026-08-01', endDate: '2026-10-31', days: 92, status: 'approved', reason: 'Doğum izni' },
  { id: 'lv5', employee: { firstName: 'Hasan', lastName: 'Çelik' }, type: 'annual', startDate: '2026-05-10', endDate: '2026-05-12', days: 3, status: 'rejected', reason: 'Kişisel işler' },
];

function StatusIcon({ status }: { status: LeaveStatus }) {
  if (status === 'approved') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-yellow-600" />;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function LeavesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: leaves, isLoading } = useLeaves({ search, status: statusFilter || undefined });
  const updateStatus = useUpdateLeaveStatus();

  const leavesList = Array.isArray(leaves) ? leaves : (!isLoading ? MOCK_LEAVES : []);

  const filtered = leavesList.filter((l: Record<string, unknown>) => {
    if (typeFilter && l.type !== typeFilter) return false;
    return true;
  });

  const stats = useMemo(() => {
    const pending = leavesList.filter((l: Record<string, unknown>) => l.status === 'pending');
    const approved = leavesList.filter((l: Record<string, unknown>) => l.status === 'approved');
    const totalDays = approved.reduce((s: number, l: Record<string, unknown>) => s + (Number(l.days) || 0), 0);
    const uniqueEmployees = new Set(leavesList.map((l: Record<string, unknown>) => l.employeeId as string)).size;
    return {
      total: leavesList.length,
      pendingCount: pending.length,
      approvedCount: approved.length,
      totalDays,
      uniqueEmployees,
    };
  }, [leavesList]);

  const pendingCount = stats.pendingCount;

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(status === 'approved' ? 'İzin onaylandı' : 'İzin reddedildi');
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">İzin Talepleri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Çalışan izin taleplerini yönetin ve onaylayın
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filtered.map((leave) => {
                const emp = leave.employee as Record<string, unknown> | undefined;
                return {
                  employeeName: `${emp?.firstName ?? ''} ${emp?.lastName ?? ''}`.trim(),
                  employeeNumber: emp?.employeeNumber ?? '',
                  type: TYPE_LABELS[(leave.type as LeaveType)] ?? leave.type,
                  status: STATUS_LABELS[(leave.status as LeaveStatus)] ?? leave.status,
                  startDate: leave.startDate ? new Date(leave.startDate as string).toLocaleDateString('tr-TR') : '',
                  endDate: leave.endDate ? new Date(leave.endDate as string).toLocaleDateString('tr-TR') : '',
                  days: leave.days,
                  reason: leave.reason ?? '',
                };
              }),
              [
                { key: 'employeeName', header: 'Çalışan', width: 22 },
                { key: 'employeeNumber', header: 'Sicil No', width: 12 },
                { key: 'type', header: 'İzin Tipi', width: 15 },
                { key: 'status', header: 'Durum', width: 12 },
                { key: 'startDate', header: 'Başlangıç', width: 12 },
                { key: 'endDate', header: 'Bitiş', width: 12 },
                { key: 'days', header: 'Gün', width: 8 },
                { key: 'reason', header: 'Sebep', width: 30 },
              ],
              'izin-talepleri',
              'İzin Talepleri'
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Talep', value: stats.total, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Onay Bekleyen', value: stats.pendingCount, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
          { label: 'Onaylanan', value: stats.approvedCount, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Toplam İzin Günü', value: `${stats.totalDays} gün`, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
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

      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-900/10 p-3">
          <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <span className="font-semibold">{pendingCount} izin talebi</span> onayınızı bekliyor
          </p>
        </div>
      )}

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
              {isLoading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <div className="space-y-2">
                      <p>Henüz kayıt yok</p>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="text-primary hover:underline text-sm"
                      >
                        Yeni Talep Ekle
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((leave: Record<string, unknown>) => {
                  const employee = leave.employee as Record<string, unknown> | undefined;
                  return (
                    <tr
                      key={leave.id as string}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {employee?.firstName as string} {employee?.lastName as string}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {employee?.employeeNumber as string}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {TYPE_LABELS[(leave.type as LeaveType)] ?? leave.type as string}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(leave.startDate as string).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(leave.endDate as string).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {leave.days as number} gün
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">
                        {(leave.reason as string) ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={leave.status as LeaveStatus} />
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[(leave.status as LeaveStatus)] ?? ''}`}>
                            {STATUS_LABELS[(leave.status as LeaveStatus)] ?? leave.status as string}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {leave.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStatusChange(leave.id as string, 'approved')}
                              className="rounded px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => handleStatusChange(leave.id as string, 'rejected')}
                              className="rounded px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                            >
                              Reddet
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{filtered.length} talep gösteriliyor</span>
          </div>
        )}
      </div>

      <LeaveModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
