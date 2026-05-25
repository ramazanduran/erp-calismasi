'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useCreateCustomer, useUpdateCustomer } from '@/lib/api/hooks';

const schema = z.object({
  name: z.string().min(1, 'Ad gereklidir'),
  email: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  type: z.enum(['individual', 'corporate']),
  taxNumber: z.string().optional().or(z.literal('')),
  taxOffice: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  creditLimit: z.coerce.number().min(0).default(0),
  notes: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  editData?: Partial<FormData & { id: string }> | null;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
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

export function CustomerModal({ open, onClose, editData }: CustomerModalProps) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEdit = !!editData?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'corporate',
      creditLimit: 0,
      ...editData,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: 'corporate',
        creditLimit: 0,
        name: '',
        email: '',
        phone: '',
        taxNumber: '',
        taxOffice: '',
        address: '',
        notes: '',
        ...editData,
      });
    }
  }, [open, editData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && editData?.id) {
        await updateCustomer.mutateAsync({ id: editData.id, data });
        toast.success('Müşteri güncellendi');
      } else {
        await createCustomer.mutateAsync(data);
        toast.success('Müşteri oluşturuldu');
      }
      onClose();
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Müşteri Adı *" error={errors.name?.message}>
              <input {...register('name')} className={inputClass} placeholder="Şirket veya kişi adı" />
            </Field>
          </div>

          <Field label="Tip" error={errors.type?.message}>
            <select {...register('type')} className={inputClass}>
              <option value="corporate">Kurumsal</option>
              <option value="individual">Bireysel</option>
            </select>
          </Field>

          <Field label="E-posta" error={errors.email?.message}>
            <input {...register('email')} type="email" className={inputClass} placeholder="info@sirket.com" />
          </Field>

          <Field label="Telefon" error={errors.phone?.message}>
            <input {...register('phone')} className={inputClass} placeholder="0212 555 0101" />
          </Field>

          <Field label="Vergi Numarası" error={errors.taxNumber?.message}>
            <input {...register('taxNumber')} className={inputClass} placeholder="1234567890" />
          </Field>

          <Field label="Vergi Dairesi" error={errors.taxOffice?.message}>
            <input {...register('taxOffice')} className={inputClass} placeholder="Kadıköy VD" />
          </Field>

          <Field label="Kredi Limiti (₺)" error={errors.creditLimit?.message}>
            <input {...register('creditLimit')} type="number" min="0" className={inputClass} />
          </Field>

          <div className="col-span-2">
            <Field label="Adres" error={errors.address?.message}>
              <input {...register('address')} className={inputClass} placeholder="Tam adres" />
            </Field>
          </div>

          <div className="col-span-2">
            <Field label="Notlar" error={errors.notes?.message}>
              <textarea
                {...register('notes')}
                className={inputClass}
                rows={2}
                placeholder="Ek notlar..."
              />
            </Field>
          </div>
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
