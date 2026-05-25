'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from './modal';
import { useSuppliers, useCreatePurchaseOrder } from '@/lib/api/hooks';

interface PurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
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

export function PurchaseOrderModal({ open, onClose }: PurchaseOrderModalProps) {
  const { data: suppliers } = useSuppliers();
  const createOrder = useCreatePurchaseOrder();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    defaultValues: {
      supplierId: '',
      expectedDate: '',
      notes: '',
      items: [{ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 18 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');
  const netAmount = (watchedItems || []).reduce((sum: number, item: any) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const tax = parseFloat(item.taxRate) || 0;
    return sum + qty * price * (1 + tax / 100);
  }, 0);

  useEffect(() => {
    if (open) {
      reset({
        supplierId: '',
        expectedDate: '',
        notes: '',
        items: [{ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 18 }],
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: any) => {
    try {
      await createOrder.mutateAsync(data);
      toast.success('Satın alma siparişi oluşturuldu');
      onClose();
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Yeni Satın Alma Siparişi" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tedarikçi *" error={errors.supplierId?.message as string}>
            <select {...register('supplierId', { required: 'Tedarikçi seçiniz' })} className={inputClass}>
              <option value="">Tedarikçi seçin...</option>
              {(suppliers as any[] | undefined)?.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </Field>
          <Field label="Beklenen Tarih">
            <input {...register('expectedDate')} type="date" className={inputClass} />
          </Field>
          <div className="col-span-2">
            <Field label="Notlar">
              <textarea {...register('notes')} className={inputClass} rows={2} placeholder="Sipariş notları..." />
            </Field>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Sipariş Kalemleri</h4>
            <button
              type="button"
              onClick={() => append({ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 18 })}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Kalem Ekle
            </button>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Açıklama</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-20">Miktar</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-28">Birim Fiyat</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-16">KDV %</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-3 py-2">
                      <input {...register(`items.${index}.description`)} className={inputClass} placeholder="Ürün / hizmet açıklaması" />
                    </td>
                    <td className="px-3 py-2">
                      <input {...register(`items.${index}.quantity`)} type="number" min="0" step="0.001" className={inputClass} />
                    </td>
                    <td className="px-3 py-2">
                      <input {...register(`items.${index}.unitPrice`)} type="number" min="0" step="0.01" className={inputClass} />
                    </td>
                    <td className="px-3 py-2">
                      <input {...register(`items.${index}.taxRate`)} type="number" min="0" max="100" className={inputClass} />
                    </td>
                    <td className="px-3 py-2">
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-end">
            <div className="rounded-lg bg-muted/50 px-4 py-2 text-sm">
              <span className="text-muted-foreground">Tahmini Toplam (KDV dahil): </span>
              <span className="font-bold">₺{netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            İptal
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {isSubmitting ? 'Oluşturuluyor...' : 'Sipariş Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
