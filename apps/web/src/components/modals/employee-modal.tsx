'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useCreateEmployee, useUpdateEmployee } from '@/lib/api/hooks';

const schema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  email: z.string().email('Geçerli e-posta giriniz'),
  phone: z.string().optional().or(z.literal('')),
  employeeNumber: z.string().min(1, 'Sicil numarası gereklidir'),
  departmentId: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  startDate: z.string().min(1, 'Başlangıç tarihi gereklidir'),
  salary: z.coerce.number().min(0),
  salaryType: z.enum(['monthly', 'hourly']),
});

type FormData = z.infer<typeof schema>;

interface EmployeeModalProps {
  open: boolean;
  onClose: () => void;
  editData?: Partial<FormData & { id: string }> | null;
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

export function EmployeeModal({ open, onClose, editData }: EmployeeModalProps) {
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const isEdit = !!editData?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      salaryType: 'monthly',
      salary: 0,
      startDate: new Date().toISOString().split('T')[0],
      ...editData,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        salaryType: 'monthly',
        salary: 0,
        startDate: new Date().toISOString().split('T')[0],
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeNumber: '',
        departmentId: '',
        position: '',
        ...editData,
      });
    }
  }, [open, editData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && editData?.id) {
        await updateEmployee.mutateAsync({ id: editData.id, data });
        toast.success('Çalışan güncellendi');
      } else {
        await createEmployee.mutateAsync(data);
        toast.success('Çalışan oluşturuldu');
      }
      onClose();
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Çalışan Düzenle' : 'Yeni Çalışan'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ad *" error={errors.firstName?.message}>
            <input {...register('firstName')} className={inputClass} placeholder="Ahmet" />
          </Field>

          <Field label="Soyad *" error={errors.lastName?.message}>
            <input {...register('lastName')} className={inputClass} placeholder="Yıldız" />
          </Field>

          <Field label="E-posta *" error={errors.email?.message}>
            <input {...register('email')} type="email" className={inputClass} placeholder="ahmet@sirket.com" />
          </Field>

          <Field label="Telefon" error={errors.phone?.message}>
            <input {...register('phone')} className={inputClass} placeholder="0532 111 2233" />
          </Field>

          <Field label="Sicil No *" error={errors.employeeNumber?.message}>
            <input {...register('employeeNumber')} className={inputClass} placeholder="EMP-001" />
          </Field>

          <Field label="Departman" error={errors.departmentId?.message}>
            <input {...register('departmentId')} className={inputClass} placeholder="Departman ID" />
          </Field>

          <Field label="Pozisyon" error={errors.position?.message}>
            <input {...register('position')} className={inputClass} placeholder="Yazılım Mühendisi" />
          </Field>

          <Field label="İşe Başlama Tarihi *" error={errors.startDate?.message}>
            <input {...register('startDate')} type="date" className={inputClass} />
          </Field>

          <Field label="Maaş (₺)" error={errors.salary?.message}>
            <input {...register('salary')} type="number" min="0" className={inputClass} />
          </Field>

          <Field label="Maaş Tipi" error={errors.salaryType?.message}>
            <select {...register('salaryType')} className={inputClass}>
              <option value="monthly">Aylık</option>
              <option value="hourly">Saatlik</option>
            </select>
          </Field>
        </div>

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
            {isSubmitting ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
