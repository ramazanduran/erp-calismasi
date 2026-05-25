'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useCreateLead, useUpdateLead } from '@/lib/api/hooks';

const schema = z.object({
  name: z.string().min(1, 'Ad gereklidir'),
  email: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  source: z.enum(['web', 'referral', 'social', 'cold_call', 'other']).optional(),
  value: z.coerce.number().min(0).optional(),
  notes: z.string().optional().or(z.literal('')),
  assignedToId: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  editData?: Partial<FormData & { id: string }> | null;
}

const SOURCE_LABELS = {
  web: 'Web',
  referral: 'Referans',
  social: 'Sosyal Medya',
  cold_call: 'Soğuk Arama',
  other: 'Diğer',
};

export function LeadModal({ open, onClose, editData }: LeadModalProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { source: 'web', value: 0 },
  });

  useEffect(() => {
    if (editData) {
      reset({
        name: editData.name || '',
        email: editData.email || '',
        phone: editData.phone || '',
        company: editData.company || '',
        source: editData.source,
        value: editData.value ?? 0,
        notes: editData.notes || '',
        assignedToId: editData.assignedToId || '',
      });
    } else {
      reset({ source: 'web', value: 0 });
    }
  }, [editData, reset, open]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company: data.company || undefined,
        notes: data.notes || undefined,
        assignedToId: data.assignedToId || undefined,
      };
      if (editData?.id) {
        await updateLead.mutateAsync({ id: editData.id, data: payload });
        toast.success('Lead güncellendi');
      } else {
        await createLead.mutateAsync(payload);
        toast.success('Lead oluşturuldu');
      }
      onClose();
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editData?.id ? 'Lead Düzenle' : 'Yeni Lead'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ad Soyad *</label>
            <input {...register('name')} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ad Soyad" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Firma</label>
            <input {...register('company')} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Firma adı" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-posta</label>
            <input {...register('email')} type="email" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="email@example.com" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <input {...register('phone')} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="+90 500 000 0000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kaynak</label>
            <select {...register('source')} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tahmini Değer (₺)</label>
            <input {...register('value')} type="number" min="0" step="0.01" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0.00" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notlar</label>
          <textarea {...register('notes')} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Notlar..." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
            İptal
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
            {isSubmitting ? 'Kaydediliyor...' : editData?.id ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
