'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useSupplier, useCreateSupplier, useUpdateSupplier } from '@/lib/api/hooks';

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  editId?: string | null;
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

export function SupplierModal({ open, onClose, editId }: SupplierModalProps) {
  const isEdit = !!editId;
  const { data: supplierData } = useSupplier(editId || '');
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    defaultValues: {
      paymentTerms: 30,
      currency: 'TRY',
    },
  });

  useEffect(() => {
    if (open) {
      if (isEdit && supplierData) {
        reset(supplierData);
      } else {
        reset({ paymentTerms: 30, currency: 'TRY', code: '', name: '', email: '', phone: '', taxNumber: '', taxOffice: '', contactPerson: '', notes: '' });
      }
    }
  }, [open, isEdit, supplierData, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isEdit && editId) {
        await updateSupplier.mutateAsync({ id: editId, data });
        toast.success('Tedarikçi güncellendi');
      } else {
        await createSupplier.mutateAsync(data);
        toast.success('Tedarikçi oluşturuldu');
      }
      onClose();
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kod *" error={errors.code?.message as string}>
            <input {...register('code', { required: 'Kod gereklidir' })} className={inputClass} placeholder="TED-001" />
          </Field>
          <Field label="Ad *" error={errors.name?.message as string}>
            <input {...register('name', { required: 'Ad gereklidir' })} className={inputClass} placeholder="Tedarikçi adı" />
          </Field>
          <Field label="E-posta">
            <input {...register('email')} type="email" className={inputClass} placeholder="info@tedarikci.com" />
          </Field>
          <Field label="Telefon">
            <input {...register('phone')} className={inputClass} placeholder="0212 555 0101" />
          </Field>
          <Field label="Vergi Numarası">
            <input {...register('taxNumber')} className={inputClass} placeholder="1234567890" />
          </Field>
          <Field label="Vergi Dairesi">
            <input {...register('taxOffice')} className={inputClass} placeholder="Kadıköy VD" />
          </Field>
          <Field label="İletişim Kişisi">
            <input {...register('contactPerson')} className={inputClass} placeholder="Ad Soyad" />
          </Field>
          <Field label="Ödeme Vadesi (Gün)">
            <input {...register('paymentTerms')} type="number" min="0" className={inputClass} />
          </Field>
          <Field label="Para Birimi">
            <select {...register('currency')} className={inputClass}>
              <option value="TRY">TRY - Türk Lirası</option>
              <option value="USD">USD - Dolar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Notlar">
              <textarea {...register('notes')} className={inputClass} rows={2} placeholder="Ek notlar..." />
            </Field>
          </div>
        </div>

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
