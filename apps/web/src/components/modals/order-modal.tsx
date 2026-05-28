'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from './modal';
import { useCreateOrder, useCustomers, useProducts } from '@/lib/api/hooks';

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Ürün seçiniz'),
  quantity: z.coerce.number().min(1, 'Miktar en az 1 olmalıdır'),
  unitPrice: z.coerce.number().min(0),
  discountRate: z.coerce.number().min(0).max(100).default(0),
});

const schema = z.object({
  customerId: z.string().min(1, 'Müşteri seçiniz'),
  type: z.enum(['sale', 'purchase']),
  notes: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  items: z.array(orderItemSchema).min(1, 'En az bir kalem ekleyiniz'),
});

type FormData = z.infer<typeof schema>;

interface OrderModalProps {
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

const MOCK_CUSTOMERS_LIST = [
  { id: 'c1', name: 'ABC Ticaret A.Ş.' },
  { id: 'c2', name: 'XYZ Sanayi Ltd.' },
  { id: 'c3', name: 'Marmara Tekstil' },
  { id: 'c4', name: 'Güneş Holding' },
];

const MOCK_PRODUCTS_LIST = [
  { id: 'p1', name: 'Laptop Dell XPS 15', code: 'PRD-001', salePrice: 42000 },
  { id: 'p2', name: 'Ofis Koltuğu Ergonomik', code: 'PRD-002', salePrice: 3500 },
  { id: 'p3', name: 'HP Toner 26A', code: 'PRD-003', salePrice: 450 },
  { id: 'p4', name: 'A4 Kağıt 80gr', code: 'PRD-004', salePrice: 85 },
];

export function OrderModal({ open, onClose }: OrderModalProps) {
  const createOrder = useCreateOrder();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

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
      items: [{ productId: '', quantity: 1, unitPrice: 0, discountRate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (open) {
      reset({
        type: 'sale',
        customerId: '',
        notes: '',
        dueDate: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0, discountRate: 0 }],
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await createOrder.mutateAsync(data);
      toast.success('Sipariş oluşturuldu');
      onClose();
    } catch {
      toast.error('Sipariş oluşturulamadı');
    }
  };

  const customersList = Array.isArray(customers) ? customers : MOCK_CUSTOMERS_LIST;
  const productsList = Array.isArray(products) ? products : MOCK_PRODUCTS_LIST;

  return (
    <Modal open={open} onClose={onClose} title="Yeni Sipariş" size="xl">
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
            </select>
          </Field>

          <Field label="Vade Tarihi" error={errors.dueDate?.message}>
            <input {...register('dueDate')} type="date" className={inputClass} />
          </Field>

          <Field label="Notlar" error={errors.notes?.message}>
            <input {...register('notes')} className={inputClass} placeholder="Ek notlar..." />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Sipariş Kalemleri</label>
            <button
              type="button"
              onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discountRate: 0 })}
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
                <div className="col-span-4">
                  <select
                    {...register(`items.${index}.productId`)}
                    className={inputClass}
                  >
                    <option value="">Ürün Seçin</option>
                    {productsList.map((p: { id: string; name: string; salePrice: number }) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {errors.items?.[index]?.productId && (
                    <p className="text-xs text-red-500">{errors.items[index]?.productId?.message}</p>
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
                <div className="col-span-3">
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
                  <input
                    {...register(`items.${index}.discountRate`)}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="İsk. %"
                    className={inputClass}
                  />
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
            {isSubmitting ? 'Kaydediliyor...' : 'Sipariş Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
