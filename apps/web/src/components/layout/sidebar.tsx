'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, DollarSign, Package, ShoppingCart, Truck as PurchaseIcon,
  Factory, Users, Truck, BarChart3, FolderKanban, FileText, Bell, Settings,
  ChevronDown, ChevronRight, X, GitBranch, CheckSquare, Calculator, Target,
  Layers, ClipboardList, FileSignature, Wrench, TrendingUp, CalendarDays, Cog,
  FolderOpen, ShieldCheck, Sparkles, Link2, Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@erp/shared-types';

const navigation = [
  { id: 'dashboard', label: 'Ana Panel', icon: LayoutDashboard, href: '/' },
  {
    id: 'finance',
    label: 'Finans & Muhasebe',
    icon: DollarSign,
    children: [
      { label: 'Genel Bakış', href: '/finance' },
      { label: 'Hesaplar', href: '/finance/accounts' },
      { label: 'Faturalar', href: '/finance/invoices' },
      { label: 'Banka Hesapları', href: '/finance/bank-accounts' },
      { label: 'Banka Mutabakatı', href: '/finance/bank-reconciliation' },
      { label: 'Raporlar', href: '/finance/reports' },
      { label: 'Vergi Yönetimi', href: '/finance/tax' },
    ],
  },
  {
    id: 'inventory',
    label: 'Stok & Depo',
    icon: Package,
    children: [
      { label: 'Ürünler', href: '/inventory/products' },
      { label: 'Depolar', href: '/inventory/warehouses' },
      { label: 'Stok Hareketleri', href: '/inventory/movements' },
      { label: 'Stok Sayım', href: '/inventory/stock-counts' },
      { label: 'Fiyat Listesi', href: '/inventory/price-lists' },
      { label: 'Stok Raporları', href: '/inventory/reports' },
    ],
  },
  {
    id: 'sales',
    label: 'Satış & CRM',
    icon: ShoppingCart,
    children: [
      { label: 'Müşteriler', href: '/sales/customers' },
      { label: 'Siparişler', href: '/sales/orders' },
      { label: 'Faturalar', href: '/sales/invoices' },
      { label: 'Teklifler', href: '/sales/quotes' },
      { label: 'Fırsatlar', href: '/sales/opportunities' },
      { label: 'Servis Talepleri', href: '/sales/service-requests' },
    ],
  },
  {
    id: 'purchasing',
    label: 'Satın Alma',
    icon: PurchaseIcon,
    children: [
      { label: 'Tedarikçiler', href: '/purchasing/suppliers' },
      { label: 'Siparişler', href: '/purchasing/orders' },
      { label: 'Talepler', href: '/purchasing/requests' },
      { label: 'Teklif İsteme (RFQ)', href: '/purchasing/rfq' },
      { label: 'İthalat & İhracat', href: '/purchasing/import-export' },
    ],
  },
  {
    id: 'accounting',
    label: 'Muhasebe',
    icon: Calculator,
    children: [
      { label: 'Hesap Planı', href: '/accounting/accounts' },
      { label: 'Yevmiye', href: '/accounting/journal' },
      { label: 'Mizan', href: '/accounting/trial-balance' },
      { label: 'Bilanço', href: '/accounting/balance-sheet' },
      { label: 'Gelir Tablosu', href: '/accounting/income-statement' },
    ],
  },
  {
    id: 'hr',
    label: 'İnsan Kaynakları',
    icon: Users,
    children: [
      { label: 'Personeller', href: '/hr/employees' },
      { label: 'İzinler', href: '/hr/leaves' },
      { label: 'Takvim', href: '/hr/calendar' },
      { label: 'Bordro', href: '/hr/payroll' },
      { label: 'Performans', href: '/hr/performance' },
      { label: 'İşe Alım', href: '/hr/recruitment' },
      { label: 'Eğitim', href: '/hr/training' },
      { label: 'İSG', href: '/hr/health-safety' },
      { label: 'Org Şeması', href: '/hr/org-chart' },
    ],
  },
  {
    id: 'logistics',
    label: 'Lojistik',
    icon: Truck,
    children: [
      { label: 'Sevkiyatlar', href: '/logistics/shipments' },
      { label: 'Araçlar', href: '/logistics/vehicles' },
      { label: 'Rota Planlama', href: '/logistics/routes' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analitik & Raporlama',
    icon: BarChart3,
    children: [
      { label: 'Genel Bakış', href: '/analytics' },
      { label: 'Raporlar', href: '/analytics/reports' },
      { label: 'Özel Raporlar', href: '/analytics/custom-reports' },
      { label: 'Dashboard Oluşturucu', href: '/analytics/dashboard-builder' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Target,
    children: [
      { label: 'Leads', href: '/crm/leads' },
      { label: 'Satış Pipeline', href: '/crm/deals' },
      { label: 'Aktiviteler', href: '/crm/activities' },
    ],
  },
  { id: 'budget', label: 'Bütçe', icon: DollarSign, href: '/budget' },
  {
    id: 'projects',
    label: 'Proje Yönetimi',
    icon: FolderKanban,
    children: [
      { label: 'Tüm Projeler', href: '/projects' },
    ],
  },
  { id: 'assets', label: 'Demirbaşlar', icon: Layers, href: '/assets' },
  { id: 'quality-control', label: 'Kalite Kontrol', icon: ClipboardList, href: '/quality-control' },
  {
    id: 'kaizen',
    label: 'Kaizen',
    icon: Lightbulb,
    children: [
      { label: 'Genel Bakış', href: '/kaizen' },
      { label: 'Öneri Yönetimi', href: '/kaizen/proposals' },
      { label: 'A3 Canvas', href: '/kaizen/a3' },
      { label: 'Dijital 5S', href: '/kaizen/5s' },
      { label: 'Andon Panosu', href: '/kaizen/andon' },
      { label: 'Liderlik Tablosu', href: '/kaizen/leaderboard' },
    ],
  },
  { id: 'contracts', label: 'Kontratlar', icon: FileSignature, href: '/contracts' },
  { id: 'maintenance', label: 'Bakım İstekleri', icon: Wrench, href: '/maintenance' },
  {
    id: 'manufacturing',
    label: 'Üretim',
    icon: Cog,
    children: [
      { label: 'Genel Bakış', href: '/manufacturing' },
      { label: 'Üretim Emirleri', href: '/manufacturing?tab=orders' },
      { label: 'Ürün Reçeteleri', href: '/manufacturing?tab=bom' },
      { label: 'İş Merkezleri', href: '/manufacturing?tab=workcenters' },
    ],
  },
  { id: 'kpi', label: 'KPI Takibi', icon: TrendingUp, href: '/kpi' },
  { id: 'calendar', label: 'Takvim', icon: CalendarDays, href: '/calendar' },
  { id: 'tasks', label: 'Görevler', icon: CheckSquare, href: '/tasks' },
  { id: 'workflows', label: 'İş Akışları', icon: GitBranch, href: '/workflows' },
  { id: 'notifications', label: 'Bildirimler', icon: Bell, href: '/notifications' },
  { id: 'documents', label: 'Dokümanlar', icon: FolderOpen, href: '/documents' },
  { id: 'ai', label: 'AI Asistan', icon: Sparkles, href: '/ai' },
  {
    id: 'settings-extra',
    label: 'Sistem',
    icon: Link2,
    children: [
      { label: 'Entegrasyonlar', href: '/settings/integrations' },
      { label: 'Uyumluluk (KVKK)', href: '/settings/compliance' },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  user: AuthUser;
}

export function Sidebar({ collapsed, mobileOpen, onMobileClose, user: _user }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard']);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (children?: { href: string }[]) =>
    children?.some((c) => pathname.startsWith(c.href)) ?? false;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300 lg:static lg:z-auto',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">E</span>
              </div>
              <span>ERP System</span>
            </Link>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <span className="text-primary-foreground text-sm font-bold">E</span>
            </div>
          )}
          <button onClick={onMobileClose} className="lg:hidden p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const isExpanded = expandedItems.includes(item.id);
            const active = item.href ? isActive(item.href) : isParentActive(item.children);

            return (
              <div key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </>
                      )}
                    </button>
                    {!collapsed && isExpanded && item.children && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'block rounded-md px-3 py-1.5 text-sm transition-colors',
                              isActive(child.href)
                                ? 'text-primary font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* Settings link */}
        <div className="border-t border-border p-2">
          <button
            onClick={() => toggleExpanded('settings')}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/settings')
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Ayarlar</span>
                {expandedItems.includes('settings') ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </>
            )}
          </button>
          {!collapsed && expandedItems.includes('settings') && (
            <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
              {[
                { label: 'Profil', href: '/settings/profile' },
                { label: 'Organizasyon', href: '/settings/organization' },
                { label: 'Kullanıcılar', href: '/settings/admin/users' },
                { label: 'Roller', href: '/settings/admin/roles' },
                { label: 'Departmanlar', href: '/settings/admin/departments' },
                { label: 'Audit Loglar', href: '/settings/admin/audit-logs' },
                { label: 'Özel Varlıklar', href: '/settings/admin/entities' },
                { label: 'Veri İçe Aktarma', href: '/settings/admin/import' },
                { label: 'API Token\'ları', href: '/settings/api-tokens' },
                { label: 'Webhooks', href: '/settings/webhooks' },
                { label: 'Döviz Kurları', href: '/settings/exchange-rates' },
                { label: 'Doküman Şablonları', href: '/settings/document-templates' },
              ].map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'block rounded-md px-3 py-1.5 text-sm transition-colors',
                    pathname === child.href
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
