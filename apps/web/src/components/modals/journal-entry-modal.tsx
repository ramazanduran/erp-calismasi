'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from './modal';
import { useCreateJournalEntry, useChartOfAccounts } from '@/lib/api/hooks';

const lineSchema = z.object({
  accountId: z.string().min(1, 'Hesap seçiniz'),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
});

const schema = z.object({
  date: z.string().min(1, 'Tarih gereklidir'),
  description: z.string().min(1, 'Açıklama gereklidir'),
  reference: z.string().optional(),
  lines: z.array(lineSchema).min(2, 'En az 2 satır gereklidir'),
});

type FormData = z.infer<typeof schema>;

interface JournalEntryModalProps {
  open: boolean;
  onClose: () => void;
}

export function JournalEntryModal({ open, onClose }: JournalEntryModalProps) {
  const { data: accounts } = useChartOfAccounts();
  const createEntry = useCreateJournalEntry();

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      lines: [
        { accountId: '', debit: 0, credit: 0, description: '' },
        { accountId: '', debit: 0, credit: 0, description: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = watch('lines');

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.01;

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await createEntry.mutateAsync(data);
      toast.success('Yevmiye kaydı oluşturuldu');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Hata oluştu');
    }
  };

  const accountList = Array.isArray(accounts) ? accounts : [];

  return (
    <Modal open={open} onClose={onClose} title="Yeni Yevmiye Kaydı" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tarih *</label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.date && <p className="text-destructive text-xs mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Referans</label>
            <input
              type="text"
              {...register('reference')}
              placeholder="Referans no / belge no"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Açıklama *</label>
          <input
            type="text"
            {...register('description')}
            placeholder="Kayıt açıklaması"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
        </div>

        {/* Lines */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Hesap Satırları</label>
            <button
              type="button"
              onClick={() => append({ accountId: '', debit: 0, credit: 0, description: '' })}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3 w-3" />
              Satır Ekle
            </button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Hesap</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-28">Borç</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-28">Alacak</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Açıklama</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-2 py-2">
                      <select
                        {...register(`lines.${index}.accountId`)}
                        className="w-full px-2 py-1.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Hesap seçin...</option>
                        {accountList.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`lines.${index}.debit`)}
                        className="w-full px-2 py-1.5 border border-border rounded bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`lines.${index}.credit`)}
                        className="w-full px-2 py-1.5 border border-border rounded bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        {...register(`lines.${index}.description`)}
                        placeholder="Açıklama"
                        className="w-full px-2 py-1.5 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </td>
                    <td className="px-2 py-2">
                      {fields.length > 2 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 border-t border-border">
                <tr>
                  <td className="px-3 py-2 text-sm font-medium text-right">Toplam</td>
                  <td className="px-3 py-2 text-sm font-bold text-right text-blue-600 dark:text-blue-400">
                    {totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-sm font-bold text-right text-red-600 dark:text-red-400">
                    {totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
            <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>
                Borç ve alacak eşit değil. Fark:{' '}
                {Math.abs(totalDebit - totalCredit).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {isBalanced && totalDebit > 0 && (
            <div className="flex items-center gap-2 mt-2 text-green-600 dark:text-green-400 text-sm">
              <span>Borç ve alacak dengeli</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={!isBalanced || createEntry.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createEntry.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
