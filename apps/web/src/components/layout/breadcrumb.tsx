'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const PATH_LABELS: Record<string, string> = {
  sales: 'Satış', customers: 'Müşteriler', orders: 'Siparişler', invoices: 'Faturalar',
  inventory: 'Stok', products: 'Ürünler', movements: 'Hareketler', 'stock-counts': 'Stok Sayım', 'price-lists': 'Fiyat Listesi',
  finance: 'Finans', accounts: 'Hesaplar', transactions: 'İşlemler',
  hr: 'İK', employees: 'Çalışanlar', leaves: 'İzinler', payroll: 'Bordro', performance: 'Performans', calendar: 'Takvim',
  purchasing: 'Satın Alma', suppliers: 'Tedarikçiler',
  accounting: 'Muhasebe', journal: 'Yevmiye', 'trial-balance': 'Mizan',
  tasks: 'Görevler', crm: 'CRM', leads: 'Lead Yönetimi',
  analytics: 'Analitik', reports: 'Raporlar',
  workflows: 'İş Akışları', settings: 'Ayarlar', profile: 'Profil', organization: 'Organizasyon',
  admin: 'Yönetici', users: 'Kullanıcılar', roles: 'Roller', departments: 'Departmanlar', 'audit-logs': 'Audit Log', import: 'İçe Aktarma',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    label: PATH_LABELS[seg] || (seg.length === 36 ? 'Detay' : seg),
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link href="/" className="hover:text-foreground flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground">{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
