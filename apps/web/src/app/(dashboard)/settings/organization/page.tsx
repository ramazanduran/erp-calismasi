'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { api } from '@/lib/api/client';

const schema = z.object({
  name: z.string().min(1, 'Organizasyon adı gereklidir'),
  slug: z.string(),
  logoUrl: z.string().url('Geçerli URL giriniz').optional().or(z.literal('')),
  primaryColor: z.string().default('#6366f1'),
  locale: z.string().default('tr'),
  timezone: z.string().default('Europe/Istanbul'),
  currency: z.string().default('TRY'),
});

type FormData = z.infer<typeof schema>;

function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

const readonlyClass =
  'w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed';

export default function OrganizationSettingsPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      logoUrl: '',
      primaryColor: '#6366f1',
      locale: 'tr',
      timezone: 'Europe/Istanbul',
      currency: 'TRY',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.patch('/api/v1/organizations/current', data);
      toast.success('Organizasyon ayarları kaydedildi');
    } catch {
      toast.error('Ayarlar kaydedilemedi');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Organizasyon Ayarları</h1>
        <p className="text-sm text-muted-foreground mt-1">Organizasyonunuzun genel ayarlarını yönetin</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Genel Bilgiler</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Organizasyon Adı *" error={errors.name?.message}>
            <input {...register('name')} className={inputClass} placeholder="Şirket Adı A.Ş." />
          </Field>

          <Field label="Slug" hint="Organizasyon slug'ı değiştirilemez">
            <input readOnly className={readonlyClass} {...register('slug')} />
          </Field>

          <Field label="Logo URL" error={errors.logoUrl?.message}>
            <input {...register('logoUrl')} className={inputClass} placeholder="https://example.com/logo.png" />
          </Field>

          <Field label="Tema Rengi">
            <div className="flex items-center gap-3">
              <input
                {...register('primaryColor')}
                type="color"
                className="h-10 w-14 rounded-lg border border-border bg-background p-1 cursor-pointer"
              />
              <input
                {...register('primaryColor')}
                className={`${inputClass} flex-1`}
                placeholder="#6366f1"
              />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Dil" error={errors.locale?.message}>
              <select {...register('locale')} className={inputClass}>
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </Field>

            <Field label="Para Birimi" error={errors.currency?.message}>
              <select {...register('currency')} className={inputClass}>
                <option value="TRY">TRY - Türk Lirası</option>
                <option value="USD">USD - Amerikan Doları</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - İngiliz Sterlini</option>
              </select>
            </Field>
          </div>

          <Field label="Zaman Dilimi" error={errors.timezone?.message}>
            <select {...register('timezone')} className={inputClass}>
              <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">Londra (UTC+0)</option>
              <option value="America/New_York">New York (UTC-5)</option>
              <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
            </select>
          </Field>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
