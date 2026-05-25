'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useCreateLeave, useEmployees } from '@/lib/api/hooks';

const schema = z.object({
  employeeId: z.string().min(1, 'Çalışan seçiniz'),
  type: z.enum(['annual', 'sick', 'unpaid', 'maternity', 'paternity']),
  startDate: z.string().min(1, 'Başlangıç tarihi gereklidir'),
  endDate: z.string().min(1, 'Bitiş tarihi gereklidir'),
  reason: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface LeaveModalProps {
  open: boolean;
  onClose: () => void;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

export function LeaveModal({ open, onClose }: LeaveModalProps) {
  const createLeave = useCreateLeave();
  const { data: employees } = useEmployees();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'annual',
      startDate: '',
      endDate: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: 'annual',
        employeeId: '',
        startDate: '',
        endDate: '',
        reason: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await createLeave.mutateAsync(data);
      toast.success('İzin talebi oluşturuldu');
      onClose();
    } catch {
      toast.error('İzin talebi oluşturulamadı');
    }
  };

  const employeesList = Array.isArray(employees) ? employees : [];

  return (
    <Modal open={open} onClose={onClose} title="Yeni İzin Talebi" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Çalışan *" error={errors.employeeId?.message}>
          <select {...register('employeeId')} className={inputClass}>
            <option value="">Çalışan Seçin</option>
            {employeesList.map((e: { id: string; firstName: string; lastName: string; employeeNumber: string }) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.employeeNumber})
              </option>
            ))}
          </select>
        </Field>

        <Field label="İzin Tipi" error={errors.type?.message}>
          <select {...register('type')} className={inputClass}>
            <option value="annual">Yıllık İzin</option>
            <option value="sick">Hastalık İzni</option>
            <option value="unpaid">Ücretsiz İzin</option>
            <option value="maternity">Doğum İzni</option>
            <option value="paternity">Babalık İzni</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Başlangıç Tarihi *" error={errors.startDate?.message}>
            <input {...register('startDate')} type="date" className={inputClass} />
          </Field>

          <Field label="Bitiş Tarihi *" error={errors.endDate?.message}>
            <input {...register('endDate')} type="date" className={inputClass} />
          </Field>
        </div>

        <Field label="Sebep" error={errors.reason?.message}>
          <textarea
            {...register('reason')}
            className={inputClass}
            rows={3}
            placeholder="İzin sebebini giriniz..."
          />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Talep Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
