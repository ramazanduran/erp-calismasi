'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useCreateUser, useUpdateUser } from '@/lib/api/hooks/use-users';
import { useRoles } from '@/lib/api/hooks/use-roles';
import { useDepartments } from '@/lib/api/hooks/use-departments';

const schema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  email: z.string().email('Geçerli e-posta giriniz'),
  phone: z.string().optional().or(z.literal('')),
  roleId: z.string().optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface UserModalProps {
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

export function UserModal({ open, onClose, editData }: UserModalProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: rolesData } = useRoles();
  const { data: deptsData } = useDepartments();
  const isEdit = !!editData?.id;

  const roles = Array.isArray(rolesData) ? rolesData : [];
  const departments = Array.isArray(deptsData) ? deptsData : [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', roleId: '', departmentId: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        firstName: editData?.firstName ?? '',
        lastName: editData?.lastName ?? '',
        email: editData?.email ?? '',
        phone: editData?.phone ?? '',
        roleId: editData?.roleId ?? '',
        departmentId: editData?.departmentId ?? '',
      });
    }
  }, [open, editData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        roleId: data.roleId || undefined,
        departmentId: data.departmentId || undefined,
        phone: data.phone || undefined,
      };
      if (isEdit && editData?.id) {
        await updateUser.mutateAsync({ id: editData.id, data: payload });
        toast.success('Kullanıcı güncellendi');
      } else {
        const result = await createUser.mutateAsync(payload);
        if ((result as Record<string, unknown>)?.data && (result as Record<string, unknown>)?.tempPassword) {
          toast.success(`Kullanıcı oluşturuldu. Geçici şifre: ${(result as Record<string, unknown>).tempPassword}`);
        } else {
          toast.success('Kullanıcı oluşturuldu');
        }
      }
      onClose();
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ad *" error={errors.firstName?.message}>
            <input {...register('firstName')} className={inputClass} placeholder="Ahmet" />
          </Field>

          <Field label="Soyad *" error={errors.lastName?.message}>
            <input {...register('lastName')} className={inputClass} placeholder="Yıldız" />
          </Field>

          <Field label="E-posta *" error={errors.email?.message}>
            <input {...register('email')} type="email" className={inputClass} placeholder="ahmet@sirket.com" disabled={isEdit} />
          </Field>

          <Field label="Telefon" error={errors.phone?.message}>
            <input {...register('phone')} className={inputClass} placeholder="0532 111 2233" />
          </Field>

          <Field label="Rol" error={errors.roleId?.message}>
            <select {...register('roleId')} className={inputClass}>
              <option value="">Rol seç...</option>
              {roles.map((r: Record<string, unknown>) => (
                <option key={r.id as string} value={r.id as string}>
                  {r.name as string}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Departman" error={errors.departmentId?.message}>
            <select {...register('departmentId')} className={inputClass}>
              <option value="">Departman seç...</option>
              {departments.map((d: Record<string, unknown>) => (
                <option key={d.id as string} value={d.id as string}>
                  {d.name as string}
                </option>
              ))}
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
