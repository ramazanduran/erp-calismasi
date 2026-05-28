'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/lib/api/hooks/use-notifications';

interface Notification {
  id: string;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notifications, isLoading } = useNotifications({ unreadOnly: false });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const MOCK_NOTIFS: Notification[] = [
    { id: 'n1', title: 'Yeni Sipariş Alındı', body: 'SO-2026-032 no\'lu sipariş oluşturuldu', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString(), type: 'order' },
    { id: 'n2', title: 'Fatura Ödendi', body: 'INV-2026-018 ödemesi alındı', isRead: false, createdAt: new Date(Date.now() - 86400000).toISOString(), type: 'invoice' },
    { id: 'n3', title: 'Düşük Stok Uyarısı', body: 'HP Toner stoku 3 adete düştü', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString(), type: 'inventory' },
    { id: 'n4', title: 'İzin Talebi Onaylandı', body: 'Ahmet Yılmaz izin talebi onaylandı', isRead: true, createdAt: new Date(Date.now() - 259200000).toISOString(), type: 'leave' },
  ];
  const items: Notification[] = Array.isArray(notifications) ? (notifications as Notification[]) : (!isLoading ? MOCK_NOTIFS : []);
  const unreadCount = items.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <h3 className="font-semibold text-sm">Bildirimler</h3>
          {unreadCount > 0 && (
            <span className="h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center px-1.5 font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => markAll.mutate()}
              title="Tümünü okundu işaretle"
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Bildirim bulunamadı
          </div>
        ) : (
          <div>
            {items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors',
                  n.isRead ? 'opacity-70' : 'bg-primary/5',
                )}
              >
                <div className={cn('mt-1 h-2 w-2 rounded-full shrink-0', n.isRead ? 'bg-muted' : 'bg-primary')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    title="Okundu işaretle"
                    className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block w-full text-center text-xs font-medium text-primary hover:underline py-1"
        >
          Tüm Bildirimleri Gör
        </Link>
      </div>
    </div>
  );
}
