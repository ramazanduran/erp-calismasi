'use client';

import { useState } from 'react';
import { Bell, CheckCheck, Check, Info, AlertTriangle, CheckCircle2, XCircle, Package, DollarSign, Users, ShoppingCart, Cog } from 'lucide-react';
import { cn } from '@/lib/utils';

type NotificationType = 'info' | 'warning' | 'success' | 'error';
type NotificationCategory = 'system' | 'finance' | 'inventory' | 'hr' | 'sales' | 'production';

interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'warning', category: 'inventory', title: 'Kritik Stok Uyarısı', body: 'Ürün "Alüminyum Profil 40x40" stok seviyesi minimum limitin altına düştü. Mevcut stok: 5 adet.', isRead: false, createdAt: '2026-05-27T08:30:00Z', link: '/inventory/products' },
  { id: '2', type: 'success', category: 'sales', title: 'Sipariş Onaylandı', body: 'SIP-2026-0423 numaralı sipariş müşteri tarafından onaylandı. Toplam tutar: ₺45.800.', isRead: false, createdAt: '2026-05-27T08:15:00Z', link: '/sales/orders' },
  { id: '3', type: 'info', category: 'finance', title: 'Fatura Ödeme Hatırlatması', body: 'FAT-2026-0089 numaralı faturanın son ödeme tarihi 3 gün sonra. Tutar: ₺12.500.', isRead: false, createdAt: '2026-05-27T07:45:00Z', link: '/finance/invoices' },
  { id: '4', type: 'error', category: 'production', title: 'Üretim Emri Durdu', body: 'ÜRE-2026-0056 numaralı üretim emri hammadde eksikliği nedeniyle durdu. Eksik malzeme: Vida M6x20.', isRead: false, createdAt: '2026-05-27T07:00:00Z', link: '/manufacturing' },
  { id: '5', type: 'success', category: 'hr', title: 'İzin Talebi Onaylandı', body: 'Selin Arslan\'ın 28-30 Mayıs 2026 tarihli yıllık izin talebi onaylandı.', isRead: false, createdAt: '2026-05-26T17:30:00Z', link: '/hr/leaves' },
  { id: '6', type: 'warning', category: 'finance', title: 'Vadesi Geçen Tahsilat', body: '3 adet müşteri faturası 30 günden uzun süredir ödenmedi. Toplam: ₺87.200.', isRead: true, createdAt: '2026-05-26T14:00:00Z', link: '/finance/aging' },
  { id: '7', type: 'info', category: 'system', title: 'Sistem Bakımı', body: 'Planlı sistem bakımı bu Cumartesi 02:00-04:00 saatleri arasında gerçekleştirilecektir.', isRead: true, createdAt: '2026-05-26T10:00:00Z' },
  { id: '8', type: 'success', category: 'inventory', title: 'Stok Sayımı Tamamlandı', body: 'Depo A\'da gerçekleştirilen stok sayımı tamamlandı. Sayım farkı: 0 adet.', isRead: true, createdAt: '2026-05-25T16:45:00Z', link: '/inventory/stock-counts' },
  { id: '9', type: 'info', category: 'sales', title: 'Yeni Teklif Talebi', body: 'Arçelik A.Ş. 500 adet ürün için teklif talep etti. Son teklif tarihi: 30 Mayıs 2026.', isRead: true, createdAt: '2026-05-25T11:30:00Z', link: '/sales/quotes' },
  { id: '10', type: 'warning', category: 'production', title: 'Makine Bakım Uyarısı', body: 'CNC Tezgahı #3 için planlı bakım zamanı geldi. Son bakım: 90 gün önce.', isRead: true, createdAt: '2026-05-24T09:00:00Z', link: '/maintenance' },
  { id: '11', type: 'success', category: 'finance', title: 'Ödeme Alındı', body: 'Bosch Rexroth firmasından ₺235.000 tutarında ödeme alındı.', isRead: true, createdAt: '2026-05-24T08:30:00Z', link: '/finance/bank-accounts' },
  { id: '12', type: 'info', category: 'hr', title: 'Yeni Aday Başvurusu', body: 'Üretim Mühendisi pozisyonuna 5 yeni başvuru geldi.', isRead: true, createdAt: '2026-05-23T15:00:00Z', link: '/hr/recruitment' },
];

const CATEGORY_CONFIG: Record<NotificationCategory, { label: string; icon: React.ReactNode; color: string }> = {
  system:     { label: 'Sistem',   icon: <Cog className="h-3.5 w-3.5" />,         color: 'text-gray-600' },
  finance:    { label: 'Finans',   icon: <DollarSign className="h-3.5 w-3.5" />,  color: 'text-blue-600' },
  inventory:  { label: 'Stok',     icon: <Package className="h-3.5 w-3.5" />,     color: 'text-orange-600' },
  hr:         { label: 'İK',       icon: <Users className="h-3.5 w-3.5" />,       color: 'text-purple-600' },
  sales:      { label: 'Satış',    icon: <ShoppingCart className="h-3.5 w-3.5" />, color: 'text-green-600' },
  production: { label: 'Üretim',   icon: <Cog className="h-3.5 w-3.5" />,         color: 'text-red-600' },
};

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':   return <XCircle className="h-4 w-4 text-red-500" />;
    default:        return <Info className="h-4 w-4 text-blue-500" />;
  }
}

function timeAgo(iso: string): string {
  const diff = Math.floor((new Date('2026-05-27T09:00:00Z').getTime() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return 'Az önce';
  if (diff < 3600)  return `${Math.floor(diff / 60)} dakika önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');

  const markOne = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread' && n.isRead) return false;
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    return true;
  });

  const categories = Array.from(new Set(notifications.map((n) => n.category))) as NotificationCategory[];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-foreground" />
          <h1 className="text-2xl font-bold">Bildirimler</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold min-w-6 h-6 px-1.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f === 'all' ? `Tümü (${notifications.length})` : `Okunmamış (${unreadCount})`}
            </button>
          ))}
        </div>

        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            Tüm Kategoriler
          </button>
          {categories.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  categoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Bell className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">
              {filter === 'unread' ? 'Okunmamış bildirim yok' : 'Bildirim bulunamadı'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((notification) => {
              const catCfg = CATEGORY_CONFIG[notification.category];
              return (
                <li
                  key={notification.id}
                  onClick={() => markOne(notification.id)}
                  className={cn(
                    'flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer hover:bg-muted/30',
                    !notification.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                  )}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {getTypeIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={cn('text-sm leading-snug', !notification.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
                        {notification.title}
                      </p>
                      <span className={cn('inline-flex items-center gap-1 text-xs', catCfg.color)}>
                        {catCfg.icon} {catCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{notification.body}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{timeAgo(notification.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!notification.isRead && (
                      <>
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <button
                          onClick={(e) => { e.stopPropagation(); markOne(notification.id); }}
                          title="Okundu işaretle"
                          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
