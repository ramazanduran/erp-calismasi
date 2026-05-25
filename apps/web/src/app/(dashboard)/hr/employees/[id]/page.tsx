'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Mail, Phone, Briefcase, Calendar, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useEmployee, useLeaves } from '@/lib/api/hooks';
import { EmployeeModal } from '@/components/modals/employee-modal';

type EmployeeStatus = 'active' | 'inactive' | 'terminated';
type LeaveStatus = 'pending' | 'approved' | 'rejected';
type LeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity';

const EMP_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'Aktif', inactive: 'Pasif', terminated: 'Ayrıldı',
};

const EMP_STATUS_CLASSES: Record<EmployeeStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  terminated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Beklemede', approved: 'Onaylandı', rejected: 'Reddedildi',
};

const LEAVE_STATUS_CLASSES: Record<LeaveStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Yıllık İzin', sick: 'Hastalık İzni', unpaid: 'Ücretsiz İzin',
  maternity: 'Doğum İzni', paternity: 'Babalık İzni',
};

function LeaveStatusIcon({ status }: { status: LeaveStatus }) {
  if (status === 'approved') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-yellow-600" />;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value ?? '-'}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [editOpen, setEditOpen] = useState(false);

  const { data: employee, isLoading } = useEmployee(id);
  const { data: leaves } = useLeaves({ employeeId: id });

  const leavesList = Array.isArray(leaves) ? leaves : [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Çalışan bulunamadı</p>
        <Link href="/hr/employees" className="text-primary hover:underline text-sm mt-2 inline-block">
          Çalışan Listesi
        </Link>
      </div>
    );
  }

  const e = employee as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/hr/employees"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {(e.firstName as string)?.[0]}{(e.lastName as string)?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {e.firstName as string} {e.lastName as string}
              </h1>
              <p className="text-sm text-muted-foreground font-mono">{e.employeeNumber as string}</p>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EMP_STATUS_CLASSES[(e.status as EmployeeStatus)] ?? ''}`}>
            {EMP_STATUS_LABELS[(e.status as EmployeeStatus)] ?? e.status as string}
          </span>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Düzenle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">Kişisel Bilgiler</h2>
          <InfoRow icon={Mail} label="E-posta" value={e.email as string} />
          <InfoRow icon={Phone} label="Telefon" value={e.phone as string} />
          <InfoRow icon={Calendar} label="İşe Başlama Tarihi" value={e.startDate ? new Date(e.startDate as string).toLocaleDateString('tr-TR') : null} />
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">İş Bilgileri</h2>
          <InfoRow icon={Briefcase} label="Pozisyon" value={e.position as string} />
          <InfoRow icon={Briefcase} label="Departman" value={e.departmentName as string} />
          <InfoRow
            icon={DollarSign}
            label="Maaş"
            value={`${Number(e.salary ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} / ${e.salaryType === 'monthly' ? 'aylık' : 'saatlik'}`}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">İzin Talepleri</h2>
        </div>
        {leavesList.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">İzin talebi bulunamadı</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">İzin Tipi</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Başlangıç</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bitiş</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Gün</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                </tr>
              </thead>
              <tbody>
                {leavesList.map((leave: Record<string, unknown>) => (
                  <tr key={leave.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-foreground">
                      {LEAVE_TYPE_LABELS[(leave.type as LeaveType)] ?? leave.type as string}
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <LeaveStatusIcon status={leave.status as LeaveStatus} />
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LEAVE_STATUS_CLASSES[(leave.status as LeaveStatus)] ?? ''}`}>
                          {LEAVE_STATUS_LABELS[(leave.status as LeaveStatus)] ?? leave.status as string}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmployeeModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editData={e as Parameters<typeof EmployeeModal>[0]['editData']}
      />
    </div>
  );
}
