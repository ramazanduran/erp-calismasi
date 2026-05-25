'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  organizationSlug: z.string().optional(),
  twoFactorCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, data.organizationSlug, data.twoFactorCode);
      toast.success('Başarıyla giriş yapıldı');
      router.push('/');
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'TWO_FACTOR_REQUIRED') {
        setRequires2FA(true);
        toast.info('Lütfen 2FA kodunuzu giriniz');
      } else {
        toast.error(
          error instanceof Error ? error.message : 'Giriş yapılamadı, lütfen tekrar deneyin'
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hoşgeldiniz</h1>
        <p className="text-muted-foreground text-sm mt-1">Hesabınıza giriş yapın</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">E-posta</label>
          <input
            {...register('email')}
            type="email"
            placeholder="ornek@sirket.com"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow"
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Şifre</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Organizasyon (isteğe bağlı)</label>
          <input
            {...register('organizationSlug')}
            type="text"
            placeholder="sirket-slug"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>

        {requires2FA && (
          <div className="space-y-2">
            <label className="text-sm font-medium">İki Faktörlü Doğrulama Kodu</label>
            <input
              {...register('twoFactorCode')}
              type="text"
              placeholder="123456"
              maxLength={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow tracking-[0.5em] text-center font-mono"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded border-input" />
            <span>Beni hatırla</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Şifremi unuttum
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {requires2FA ? 'Doğrula' : 'Giriş Yap'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Hesabınız yok mu?{' '}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Kayıt olun
        </Link>
      </p>
    </div>
  );
}
