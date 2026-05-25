'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from './modal';
import { useCreateInvoice, useCustomers } from '@/lib/api/hooks';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Açıklama gereklidir'),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().default(20),
});

const schema = z.object({
  customerId: z.string().min(1, 'Müşteri seçiniz'),
  orderId: z.string().optional().or(z.literal('')),
  type: z.enum(['sale', 'purchase', 'refund']),
  issueDate: z.string().min(1, 'Düzenlenme tarihi gereklidir'),
  dueDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(invoiceItemSchema).min(1, 'En az bir kalem ekleyiniz'),
});

type FormData = z.infer<typeof schema>;

interface InvoiceModalProps {
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

export function InvoiceModal({ open, onClose }: InvoiceModalProps) {
  const createInvoice = useCreateInvoice();
  const { data: customers } = useCustomers();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'sale',
      issueDate: new Date().toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 20 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (open) {
      reset({
        type: 'sale',
        customerId: '',
        orderId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 20 }],
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await createInvoice.mutateAsync(data);
      toast.success('Fatura oluşturuldu');
      onClose();
    } catch {
      toast.error('Fatura oluşturulamadı');
    }
  };

  const customersList = Array.isArray(customers) ? customers : [];

  return (
    <Modal open={open} onClose={onClose} title="Yeni Fatura" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Müşteri *" error={errors.customerId?.message}>
            <select {...register('customerId')} className={inputClass}>
              <option value="">Müşteri Seçin</option>
              {customersList.map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Tip" error={errors.type?.message}>
            <select {...register('type')} className={inputClass}>
              <option value="sale">Satış</option>
              <option value="purchase">Alış</option>
              <option value="refund">İade</option>
            </select>
          </Field>

          <Field label="Düzenlenme Tarihi *" error={errors.issueDate?.message}>
            <input {...register('issueDate')} type="date" className={inputClass} />
          </Field>

          <Field label="Vade Tarihi" error={errors.dueDate?.message}>
            <input {...register('dueDate')} type="date" className={inputClass} />
          </Field>

          <Field label="Sipariş No (Opsiyonel)" error={errors.orderId?.message}>
            <input {...register('orderId')} className={inputClass} placeholder="SIP-2024-001" />
          </Field>

          <Field label="Notlar" error={errors.notes?.message}>
            <input {...register('notes')} className={inputClass} placeholder="Ek notlar..." />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Fatura Kalemleri</label>
            <button
              type="button"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0, taxRate: 20 })}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
            >
              <Plus className="h-3 w-3" />
              Kalem Ekle
            </button>
          </div>

          {(errors.items as { message?: string } | undefined)?.message && (
            <p className="text-xs text-red-500">{(errors.items as { message?: string }).message}</p>
          )}

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="col-span-5">
                  <input
                    {...register(`items.${index}.description`)}
                    placeholder="Açıklama"
                    className={inputClass}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-xs text-red-500">{errors.items[index]?.description?.message}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <input
                    {...register(`items.${index}.quantity`)}
                    type="number"
                    min="1"
                    placeholder="Miktar"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    {...register(`items.${index}.unitPrice`)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Birim Fiyat"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <select {...register(`items.${index}.taxRate`)} className={inputClass}>
                    <option value="0">KDV %0</option>
                    <option value="8">KDV %8</option>
                    <option value="18">KDV %18</option>
                    <option value="20">KDV %20</option>
                  </select>
                </div>
                <div className="col-span-1 flex items-start justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
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
            {isSubmitting ? 'Kaydediliyor...' : 'Fatura Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
