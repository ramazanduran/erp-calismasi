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

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    organizationName: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır'),
    password: z
      .string()
      .min(8, 'Şifre en az 8 karakter olmalıdır')
      .regex(/[A-Z]/, 'En az bir büyük harf gereklidir')
      .regex(/[a-z]/, 'En az bir küçük harf gereklidir')
      .regex(/[0-9]/, 'En az bir rakam gereklidir'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { api } = await import('@/lib/api/client');
      await api.post('/api/v1/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        organizationName: data.organizationName,
      });
      toast.success('Hesabınız oluşturuldu! Giriş yapılıyor...');
      await login(data.email, data.password);
      router.push('/');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Kayıt işlemi başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hesap Oluştur</h1>
        <p className="text-muted-foreground text-sm mt-1">ERP sisteminizi kurmaya başlayın</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Ad</label>
            <input
              {...register('firstName')}
              type="text"
              placeholder="Ahmet"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Soyad</label>
            <input
              {...register('lastName')}
              type="text"
              placeholder="Yılmaz"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Şirket Adı</label>
          <input
            {...register('organizationName')}
            type="text"
            placeholder="Acme Şirketi"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.organizationName && (
            <p className="text-xs text-destructive">{errors.organizationName.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">E-posta</label>
          <input
            {...register('email')}
            type="email"
            placeholder="ornek@sirket.com"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Şifre</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="En az 8 karakter"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Şifre Tekrar</label>
          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="Şifreyi tekrar giriniz"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Hesap Oluştur
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Zaten hesabınız var mı?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
