import type { Metadata } from 'next';
import { DashboardPage } from '@/components/dashboard/dashboard-page';

export const metadata: Metadata = { title: 'Ana Panel' };

export default function Dashboard() {
  return <DashboardPage />;
}
