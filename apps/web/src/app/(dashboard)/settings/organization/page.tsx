'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Globe,
  Palette,
  Bell,
  AlertTriangle,
  ChevronRight,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';

const schema = z.object({
  name: z.string().min(1, 'Organizasyon adı gereklidir'),
  slug: z.string(),
  description: z.string().optional().or(z.literal('')),
  logoUrl: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
  currency: z.string().default('TRY'),
  timezone: z.string().default('Europe/Istanbul'),
  locale: z.string().default('tr'),
  dateFormat: z.string().default('DD.MM.YYYY'),
  primaryColor: z.string().default('#6366f1'),
  secondaryColor: z.string().default('#8b5cf6'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifyEmail: z.boolean().default(true),
  notifySystem: z.boolean().default(true),
  notifyTasks: z.boolean().default(true),
  notifyInvoices: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  currency?: string;
  timezone?: string;
  locale?: string;
  dateFormat?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: string;
  notifyEmail?: boolean;
  notifySystem?: boolean;
  notifyTasks?: boolean;
  notifyInvoices?: boolean;
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

const readonlyClass =
  'w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground font-mono cursor-not-allowed';

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        {icon}
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SaveButton({ isPending }: { isPending: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function DeleteDialog({
  orgName,
  onClose,
  onConfirm,
  isPending,
}: {
  orgName: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [typed, setTyped] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Organizasyonu Sil</h3>
            <p className="text-sm text-muted-foreground">Bu işlem geri alınamaz</p>
          </div>
        </div>

        <p className="text-sm text-foreground">
          Organizasyonunuzu silmek istediğinizden emin misiniz? Tüm veriler kalıcı olarak silinecektir.
        </p>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Onaylamak için organizasyon adını yazın:{' '}
            <span className="font-semibold text-foreground">{orgName}</span>
          </p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className={inputClass}
            placeholder={orgName}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={typed !== orgName || isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Siliniyor...' : 'Organizasyonu Sil'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationSettingsPage() {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');

  const { data: org, isLoading } = useQuery<Organization>({
    queryKey: ['organization'],
    queryFn: () => api.get('/api/v1/organizations/current'),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      logoUrl: '',
      currency: 'TRY',
      timezone: 'Europe/Istanbul',
      locale: 'tr',
      dateFormat: 'DD.MM.YYYY',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      theme: 'system',
      notifyEmail: true,
      notifySystem: true,
      notifyTasks: true,
      notifyInvoices: true,
    },
  });

  useEffect(() => {
    if (org) {
      reset({
        name: org.name ?? '',
        slug: org.slug ?? '',
        description: org.description ?? '',
        logoUrl: org.logoUrl ?? '',
        currency: org.currency ?? 'TRY',
        timezone: org.timezone ?? 'Europe/Istanbul',
        locale: org.locale ?? 'tr',
        dateFormat: org.dateFormat ?? 'DD.MM.YYYY',
        primaryColor: org.primaryColor ?? '#6366f1',
        secondaryColor: org.secondaryColor ?? '#8b5cf6',
        theme: (org.theme as 'light' | 'dark' | 'system') ?? 'system',
        notifyEmail: org.notifyEmail ?? true,
        notifySystem: org.notifySystem ?? true,
        notifyTasks: org.notifyTasks ?? true,
        notifyInvoices: org.notifyInvoices ?? true,
      });
      if (org.logoUrl) setLogoPreviewUrl(org.logoUrl);
    }
  }, [org, reset]);

  const watchedLogoUrl = watch('logoUrl');
  const watchedPrimaryColor = watch('primaryColor');
  const watchedSecondaryColor = watch('secondaryColor');
  const watchedTheme = watch('theme');
  const watchedNotifyEmail = watch('notifyEmail');
  const watchedNotifySystem = watch('notifySystem');
  const watchedNotifyTasks = watch('notifyTasks');
  const watchedNotifyInvoices = watch('notifyInvoices');

  useEffect(() => {
    try {
      if (watchedLogoUrl) {
        new URL(watchedLogoUrl);
        setLogoPreviewUrl(watchedLogoUrl);
      } else {
        setLogoPreviewUrl('');
      }
    } catch {
      setLogoPreviewUrl('');
    }
  }, [watchedLogoUrl]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => api.patch('/api/v1/organizations/current', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Organizasyon ayarları kaydedildi');
    },
    onError: () => {
      toast.error('Ayarlar kaydedilemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('/api/v1/organizations/current'),
    onSuccess: () => {
      toast.success('Organizasyon silindi');
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error('Organizasyon silinemedi');
    },
  });

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-2xl">
        <div>
          <div className="h-8 w-64 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded-lg bg-muted animate-pulse mt-2" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="h-6 w-48 rounded bg-muted animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="h-9 w-full rounded bg-muted animate-pulse" />
              <div className="h-9 w-full rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <Link href="/" className="hover:text-foreground">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/settings" className="hover:text-foreground">
            Ayarlar
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Organizasyon</span>
        </nav>
        <h1 className="text-2xl font-bold text-foreground">Organizasyon Ayarları</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organizasyonunuzun genel ayarlarını ve tercihlerini yönetin
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SectionCard
          icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
          title="Genel Bilgiler"
        >
          <div className="space-y-4">
            <Field label="Organizasyon Adı *" error={errors.name?.message}>
              <input
                {...register('name')}
                className={inputClass}
                placeholder="Şirket Adı A.Ş."
              />
            </Field>

            <Field
              label="Slug"
              hint="Organizasyon slug'ı sistem tarafından atanır ve değiştirilemez"
            >
              <input readOnly className={readonlyClass} {...register('slug')} />
            </Field>

            <Field label="Açıklama" error={errors.description?.message}>
              <textarea
                {...register('description')}
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="Organizasyonunuzu kısaca tanımlayın..."
              />
            </Field>

            <Field label="Logo URL" error={errors.logoUrl?.message}>
              <div className="flex items-start gap-3">
                <input
                  {...register('logoUrl')}
                  className={inputClass}
                  placeholder="https://example.com/logo.png"
                />
                {logoPreviewUrl && (
                  <img
                    src={logoPreviewUrl}
                    alt="Logo önizleme"
                    className="h-10 w-10 rounded-lg object-contain border border-border bg-muted shrink-0"
                    onError={() => setLogoPreviewUrl('')}
                  />
                )}
              </div>
            </Field>
          </div>
          <SaveButton isPending={saveMutation.isPending} />
        </SectionCard>
      </form>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SectionCard
          icon={<Globe className="h-5 w-5 text-muted-foreground" />}
          title="Bölgesel Ayarlar"
        >
          <div className="space-y-4">
            <Field label="Para Birimi" error={errors.currency?.message}>
              <select {...register('currency')} className={inputClass}>
                <option value="TRY">🇹🇷 TRY — Türk Lirası</option>
                <option value="USD">🇺🇸 USD — Amerikan Doları</option>
                <option value="EUR">🇪🇺 EUR — Euro</option>
                <option value="GBP">🇬🇧 GBP — İngiliz Sterlini</option>
              </select>
            </Field>

            <Field label="Zaman Dilimi" error={errors.timezone?.message}>
              <select {...register('timezone')} className={inputClass}>
                <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                <option value="UTC">UTC (UTC+0)</option>
                <option value="Europe/London">Londra (UTC+0)</option>
                <option value="Europe/Berlin">Berlin (UTC+1)</option>
                <option value="Europe/Paris">Paris (UTC+1)</option>
                <option value="Europe/Moscow">Moskova (UTC+3)</option>
                <option value="America/New_York">New York (UTC-5)</option>
                <option value="America/Chicago">Chicago (UTC-6)</option>
                <option value="America/Los_Angeles">Los Angeles (UTC-8)</option>
                <option value="Asia/Dubai">Dubai (UTC+4)</option>
                <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                <option value="Asia/Singapore">Singapur (UTC+8)</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Dil" error={errors.locale?.message}>
                <select {...register('locale')} className={inputClass}>
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </Field>

              <Field label="Tarih Formatı" error={errors.dateFormat?.message}>
                <select {...register('dateFormat')} className={inputClass}>
                  <option value="DD.MM.YYYY">GG.AA.YYYY (01.05.2024)</option>
                  <option value="MM/DD/YYYY">AA/GG/YYYY (05/01/2024)</option>
                  <option value="YYYY-MM-DD">YYYY-AA-GG (2024-05-01)</option>
                </select>
              </Field>
            </div>
          </div>
          <SaveButton isPending={saveMutation.isPending} />
        </SectionCard>
      </form>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SectionCard
          icon={<Palette className="h-5 w-5 text-muted-foreground" />}
          title="Görünüm"
        >
          <div className="space-y-5">
            <Field label="Tema Rengi" error={errors.primaryColor?.message}>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={watchedPrimaryColor}
                  onChange={(e) => setValue('primaryColor', e.target.value)}
                  className="h-10 w-14 rounded-lg border border-border bg-background p-1 cursor-pointer shrink-0"
                />
                <input
                  {...register('primaryColor')}
                  className={`${inputClass} flex-1 font-mono`}
                  placeholder="#6366f1"
                  maxLength={7}
                />
              </div>
            </Field>

            <Field label="İkincil Renk" error={errors.secondaryColor?.message}>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={watchedSecondaryColor}
                  onChange={(e) => setValue('secondaryColor', e.target.value)}
                  className="h-10 w-14 rounded-lg border border-border bg-background p-1 cursor-pointer shrink-0"
                />
                <input
                  {...register('secondaryColor')}
                  className={`${inputClass} flex-1 font-mono`}
                  placeholder="#8b5cf6"
                  maxLength={7}
                />
              </div>
            </Field>

            <Field label="Varsayılan Görünüm">
              <div className="flex gap-3">
                {(
                  [
                    { value: 'light', label: 'Açık Tema' },
                    { value: 'dark', label: 'Koyu Tema' },
                    { value: 'system', label: 'Sistem' },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      watchedTheme === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('theme')}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </Field>
          </div>
          <SaveButton isPending={saveMutation.isPending} />
        </SectionCard>
      </form>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SectionCard
          icon={<Bell className="h-5 w-5 text-muted-foreground" />}
          title="Bildirim Tercihleri"
        >
          <div className="space-y-4">
            {(
              [
                {
                  key: 'notifyEmail' as const,
                  label: 'E-posta bildirimleri',
                  desc: 'Önemli güncellemeler e-posta ile gönderilir',
                  val: watchedNotifyEmail,
                },
                {
                  key: 'notifySystem' as const,
                  label: 'Sistem bildirimleri',
                  desc: 'Uygulama içi bildirimler aktif olur',
                  val: watchedNotifySystem,
                },
                {
                  key: 'notifyTasks' as const,
                  label: 'Görev hatırlatıcıları',
                  desc: 'Yaklaşan görevler için hatırlatma alın',
                  val: watchedNotifyTasks,
                },
                {
                  key: 'notifyInvoices' as const,
                  label: 'Fatura uyarıları',
                  desc: 'Vadesi yaklaşan faturalar için uyarı alın',
                  val: watchedNotifyInvoices,
                },
              ] as const
            ).map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <Toggle
                  checked={!!item.val}
                  onChange={(val) => setValue(item.key, val)}
                />
              </div>
            ))}
          </div>
          <SaveButton isPending={saveMutation.isPending} />
        </SectionCard>
      </form>

      <div className="rounded-xl border-2 border-red-200 bg-card shadow-sm dark:border-red-900/50">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-red-200 dark:border-red-900/50">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="font-semibold text-red-600 dark:text-red-400">Tehlikeli Bölge</h2>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Organizasyonu Sil</p>
              <p className="text-sm text-muted-foreground mt-1">
                Organizasyonu ve tüm verilerini kalıcı olarak sil. Bu işlem geri alınamaz.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="shrink-0 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
            >
              Organizasyonu Sil
            </button>
          </div>
        </div>
      </div>

      {showDeleteDialog && (
        <DeleteDialog
          orgName={org?.name ?? ''}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={() => deleteMutation.mutate()}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
