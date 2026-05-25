'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useCreateMovement, useProducts } from '@/lib/api/hooks';

const schema = z.object({
  productId: z.string().min(1, 'Ürün seçiniz'),
  type: z.enum(['in', 'out', 'adjustment', 'transfer']),
  quantity: z.coerce.number().min(1, 'Miktar en az 1 olmalıdır'),
  unitCost: z.coerce.number().min(0).optional(),
  reference: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface MovementModalProps {
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

export function MovementModal({ open, onClose }: MovementModalProps) {
  const createMovement = useCreateMovement();
  const { data: products } = useProducts();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'in',
      quantity: 1,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: 'in',
        productId: '',
        quantity: 1,
        unitCost: undefined,
        reference: '',
        notes: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await createMovement.mutateAsync(data);
      toast.success('Stok hareketi kaydedildi');
      onClose();
    } catch {
      toast.error('Stok hareketi kaydedilemedi');
    }
  };

  const productsList = Array.isArray(products) ? products : [];

  return (
    <Modal open={open} onClose={onClose} title="Yeni Stok Hareketi" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Ürün *" error={errors.productId?.message}>
          <select {...register('productId')} className={inputClass}>
            <option value="">Ürün Seçin</option>
            {productsList.map((p: { id: string; name: string; code: string }) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Hareket Tipi" error={errors.type?.message}>
            <select {...register('type')} className={inputClass}>
              <option value="in">Giriş</option>
              <option value="out">Çıkış</option>
              <option value="adjustment">Düzeltme</option>
              <option value="transfer">Transfer</option>
            </select>
          </Field>

          <Field label="Miktar *" error={errors.quantity?.message}>
            <input {...register('quantity')} type="number" min="1" className={inputClass} />
          </Field>
        </div>

        <Field label="Birim Maliyet (₺)" error={errors.unitCost?.message}>
          <input {...register('unitCost')} type="number" min="0" step="0.01" className={inputClass} placeholder="İsteğe bağlı" />
        </Field>

        <Field label="Referans" error={errors.reference?.message}>
          <input {...register('reference')} className={inputClass} placeholder="SAL-2024-001" />
        </Field>

        <Field label="Notlar" error={errors.notes?.message}>
          <textarea {...register('notes')} className={inputClass} rows={2} placeholder="Ek notlar..." />
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
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
