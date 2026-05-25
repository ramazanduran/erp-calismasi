'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useCreateProduct, useUpdateProduct, useCategories } from '@/lib/api/hooks';

const schema = z.object({
  code: z.string().min(1, 'Kod gereklidir'),
  name: z.string().min(1, 'Ürün adı gereklidir'),
  categoryId: z.string().optional().or(z.literal('')),
  unit: z.string().min(1, 'Birim gereklidir'),
  purchasePrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  vatRate: z.coerce.number(),
  minStock: z.coerce.number().min(0).default(0),
  barcode: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface ProductModalProps {
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

export function ProductModal({ open, onClose, editData }: ProductModalProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categories } = useCategories();
  const isEdit = !!editData?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      unit: 'adet',
      vatRate: 20,
      purchasePrice: 0,
      salePrice: 0,
      minStock: 0,
      ...editData,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        unit: 'adet',
        vatRate: 20,
        purchasePrice: 0,
        salePrice: 0,
        minStock: 0,
        code: '',
        name: '',
        categoryId: '',
        barcode: '',
        ...editData,
      });
    }
  }, [open, editData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && editData?.id) {
        await updateProduct.mutateAsync({ id: editData.id, data });
        toast.success('Ürün güncellendi');
      } else {
        await createProduct.mutateAsync(data);
        toast.success('Ürün oluşturuldu');
      }
      onClose();
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  const categoriesList = Array.isArray(categories) ? categories : [];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ürün Kodu *" error={errors.code?.message}>
            <input {...register('code')} className={inputClass} placeholder="URN-001" />
          </Field>

          <Field label="Birim *" error={errors.unit?.message}>
            <select {...register('unit')} className={inputClass}>
              <option value="adet">Adet</option>
              <option value="kg">Kilogram</option>
              <option value="lt">Litre</option>
              <option value="m">Metre</option>
              <option value="m2">Metrekare</option>
              <option value="kutu">Kutu</option>
              <option value="paket">Paket</option>
            </select>
          </Field>

          <div className="col-span-2">
            <Field label="Ürün Adı *" error={errors.name?.message}>
              <input {...register('name')} className={inputClass} placeholder="Ürün adını giriniz" />
            </Field>
          </div>

          <Field label="Kategori" error={errors.categoryId?.message}>
            <select {...register('categoryId')} className={inputClass}>
              <option value="">Kategori Seçin</option>
              {categoriesList.map((cat: { id: string; name: string }) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="KDV Oranı (%)" error={errors.vatRate?.message}>
            <select {...register('vatRate')} className={inputClass}>
              <option value="0">%0</option>
              <option value="8">%8</option>
              <option value="18">%18</option>
              <option value="20">%20</option>
            </select>
          </Field>

          <Field label="Alış Fiyatı (₺)" error={errors.purchasePrice?.message}>
            <input {...register('purchasePrice')} type="number" min="0" step="0.01" className={inputClass} />
          </Field>

          <Field label="Satış Fiyatı (₺)" error={errors.salePrice?.message}>
            <input {...register('salePrice')} type="number" min="0" step="0.01" className={inputClass} />
          </Field>

          <Field label="Min. Stok" error={errors.minStock?.message}>
            <input {...register('minStock')} type="number" min="0" className={inputClass} />
          </Field>

          <Field label="Barkod" error={errors.barcode?.message}>
            <input {...register('barcode')} className={inputClass} placeholder="8695830001234" />
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
