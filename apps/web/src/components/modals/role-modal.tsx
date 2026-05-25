'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useCreateRole, useUpdateRole } from '@/lib/api/hooks/use-roles';

const PERMISSION_GROUPS: Record<string, string[]> = {
  dashboard: ['dashboard.read'],
  sales: ['sales.read', 'sales.write', 'sales.delete'],
  inventory: ['inventory.read', 'inventory.write', 'inventory.delete'],
  finance: ['finance.read', 'finance.write', 'finance.delete'],
  hr: ['hr.read', 'hr.write', 'hr.delete'],
  admin: ['admin.users', 'admin.roles', 'admin.settings'],
};

const GROUP_LABELS: Record<string, string> = {
  dashboard: 'Gösterge Paneli',
  sales: 'Satış & CRM',
  inventory: 'Stok & Depo',
  finance: 'Finans',
  hr: 'İnsan Kaynakları',
  admin: 'Yönetici',
};

const schema = z.object({
  name: z.string().min(1, 'Rol adı gereklidir'),
  slug: z.string().min(1, 'Slug gereklidir').regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve - kullanın'),
  description: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface RoleModalProps {
  open: boolean;
  onClose: () => void;
  editData?: Partial<FormData & { id: string; permissions: string[] }> | null;
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function RoleModal({ open, onClose, editData }: RoleModalProps) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const isEdit = !!editData?.id;
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: editData?.name ?? '',
        slug: editData?.slug ?? '',
        description: editData?.description ?? '',
      });
      setSelectedPermissions(editData?.permissions ?? []);
    }
  }, [open, editData, reset]);

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleGroup = (group: string) => {
    const perms = PERMISSION_GROUPS[group];
    const allSelected = perms.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !perms.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...perms])]);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, permissions: selectedPermissions, description: data.description || undefined };
      if (isEdit && editData?.id) {
        await updateRole.mutateAsync({ id: editData.id, data: { name: data.name, description: data.description, permissions: selectedPermissions } });
        toast.success('Rol güncellendi');
      } else {
        await createRole.mutateAsync(payload);
        toast.success('Rol oluşturuldu');
      }
      onClose();
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Rol Düzenle' : 'Yeni Rol'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Rol Adı *" error={errors.name?.message}>
            <input {...register('name')} className={inputClass} placeholder="Satış Müdürü" />
          </Field>
          <Field label="Slug *" error={errors.slug?.message}>
            <input {...register('slug')} className={inputClass} placeholder="satis-muduru" disabled={isEdit} />
          </Field>
        </div>

        <Field label="Açıklama" error={errors.description?.message}>
          <input {...register('description')} className={inputClass} placeholder="Rol açıklaması..." />
        </Field>

        <div>
          <p className="text-sm font-medium text-foreground mb-3">İzinler</p>
          <div className="space-y-4 rounded-lg border border-border p-4 max-h-72 overflow-y-auto">
            {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
              const allChecked = perms.every((p) => selectedPermissions.includes(p));
              const someChecked = perms.some((p) => selectedPermissions.includes(p));
              return (
                <div key={group}>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={() => toggleGroup(group)}
                      className="rounded border-border accent-primary"
                    />
                    <span className="text-sm font-semibold text-foreground">{GROUP_LABELS[group]}</span>
                  </label>
                  <div className="ml-6 grid grid-cols-2 gap-1">
                    {perms.map((perm) => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="rounded border-border accent-primary"
                        />
                        <span className="text-xs text-muted-foreground font-mono">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{selectedPermissions.length} izin seçildi</p>
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
