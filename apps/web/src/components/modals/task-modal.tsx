'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useCreateTask, useUpdateTask } from '@/lib/api/hooks';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  editData?: any | null;
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

export function TaskModal({ open, onClose, editData }: TaskModalProps) {
  const isEdit = !!editData?.id;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    defaultValues: {
      priority: 'medium',
    },
  });

  useEffect(() => {
    if (open) {
      if (isEdit && editData) {
        reset({
          ...editData,
          dueDate: editData.dueDate ? editData.dueDate.slice(0, 10) : '',
        });
      } else {
        reset({ title: '', description: '', priority: 'medium', dueDate: '', assignedToId: '' });
      }
    }
  }, [open, isEdit, editData, reset]);

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      assignedToId: data.assignedToId || undefined,
    };
    try {
      if (isEdit && editData?.id) {
        await updateTask.mutateAsync({ id: editData.id, data: payload });
        toast.success('Görev güncellendi');
      } else {
        await createTask.mutateAsync(payload);
        toast.success('Görev oluşturuldu');
      }
      onClose();
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Görev Düzenle' : 'Yeni Görev'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Başlık *" error={errors.title?.message as string}>
          <input {...register('title', { required: 'Başlık gereklidir' })} className={inputClass} placeholder="Görev başlığı" />
        </Field>

        <Field label="Açıklama">
          <textarea {...register('description')} className={inputClass} rows={3} placeholder="Görev açıklaması..." />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Öncelik">
            <select {...register('priority')} className={inputClass}>
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
          </Field>

          <Field label="Son Tarih">
            <input {...register('dueDate')} type="date" className={inputClass} />
          </Field>
        </div>

        <Field label="Atanan Kişi (Kullanıcı ID)">
          <input {...register('assignedToId')} className={inputClass} placeholder="Kullanıcı ID (opsiyonel)" />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            İptal
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {isSubmitting ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
