'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Lock, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api/client';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal('')),
  locale: z.string().default('tr'),
  timezone: z.string().default('Europe/Istanbul'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Mevcut şifre gereklidir'),
  newPassword: z.string().min(8, 'Yeni şifre en az 8 karakter olmalıdır'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

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

const readonlyClass =
  'w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: '',
      locale: 'tr',
      timezone: 'Europe/Istanbul',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileData) => {
    try {
      await api.patch('/api/v1/users/profile', data);
      toast.success('Profil güncellendi');
    } catch {
      toast.error('Profil güncellenemedi');
    }
  };

  const onPasswordSubmit = async (data: PasswordData) => {
    try {
      await api.post('/api/v1/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Şifre değiştirildi');
      resetPassword();
    } catch {
      toast.error('Şifre değiştirilemedi');
    }
  };

  const handleToggle2FA = async () => {
    try {
      if (twoFactorEnabled) {
        await api.post('/api/v1/auth/2fa/disable', {});
        setTwoFactorEnabled(false);
        toast.success('2FA deaktif edildi');
      } else {
        await api.post('/api/v1/auth/2fa/enable', {});
        setTwoFactorEnabled(true);
        toast.success('2FA aktifleştirildi');
      }
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil Ayarları</h1>
        <p className="text-sm text-muted-foreground mt-1">Kişisel bilgilerinizi ve tercihlerinizi yönetin</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Kişisel Bilgiler</h2>
        </div>
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ad *" error={profileErrors.firstName?.message}>
              <input {...registerProfile('firstName')} className={inputClass} />
            </Field>
            <Field label="Soyad *" error={profileErrors.lastName?.message}>
              <input {...registerProfile('lastName')} className={inputClass} />
            </Field>
          </div>

          <Field label="E-posta" error={profileErrors.email?.message}>
            <input value={user?.email ?? ''} readOnly className={readonlyClass} />
            <input {...registerProfile('email')} type="hidden" />
            <p className="text-xs text-muted-foreground mt-1">E-posta adresi değiştirilemez</p>
          </Field>

          <Field label="Telefon" error={profileErrors.phone?.message}>
            <input {...registerProfile('phone')} className={inputClass} placeholder="0532 111 2233" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Dil" error={profileErrors.locale?.message}>
              <select {...registerProfile('locale')} className={inputClass}>
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </Field>
            <Field label="Zaman Dilimi" error={profileErrors.timezone?.message}>
              <select {...registerProfile('timezone')} className={inputClass}>
                <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                <option value="UTC">UTC</option>
                <option value="Europe/London">Londra (UTC+0)</option>
                <option value="America/New_York">New York (UTC-5)</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {profileSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Şifre Değiştir</h2>
        </div>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <Field label="Mevcut Şifre *" error={passwordErrors.currentPassword?.message}>
            <input {...registerPassword('currentPassword')} type="password" className={inputClass} placeholder="Mevcut şifreniz" />
          </Field>
          <Field label="Yeni Şifre *" error={passwordErrors.newPassword?.message}>
            <input {...registerPassword('newPassword')} type="password" className={inputClass} placeholder="En az 8 karakter" />
          </Field>
          <Field label="Yeni Şifre Tekrar *" error={passwordErrors.confirmPassword?.message}>
            <input {...registerPassword('confirmPassword')} type="password" className={inputClass} placeholder="Yeni şifrenizi tekrar girin" />
          </Field>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {passwordSubmitting ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">İki Faktörlü Doğrulama (2FA)</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground font-medium">
              {twoFactorEnabled ? '2FA Aktif' : '2FA Pasif'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {twoFactorEnabled
                ? 'Hesabınız iki faktörlü doğrulama ile korunuyor'
                : 'Hesap güvenliğinizi artırmak için 2FA aktifleştirin'}
            </p>
          </div>
          <button
            onClick={handleToggle2FA}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              twoFactorEnabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {twoFactorEnabled ? 'Deaktif Et' : 'Aktifleştir'}
          </button>
        </div>
      </div>
    </div>
  );
}
