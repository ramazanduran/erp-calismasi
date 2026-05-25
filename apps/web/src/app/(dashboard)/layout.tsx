import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-session';
import { AppShell } from '@/components/layout/app-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect('/login');

  return <AppShell user={session.user}>{children}</AppShell>;
}
