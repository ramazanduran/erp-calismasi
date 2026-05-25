import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = { title: 'Kayıt Ol' };

export default function RegisterPage() {
  return <RegisterForm />;
}
