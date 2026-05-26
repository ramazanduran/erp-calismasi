'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Check, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { api } from '@/lib/api/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface UnreadCount {
  count: number;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('api/v1/notifications'),
  });

  const { data: unreadData } = useQuery<UnreadCount>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<UnreadCount>('api/v1/notifications/unread-count'),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`api/v1/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('api/v1/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkOne = (id: string, isRead: boolean) => {
    if (!isRead) {
      markOneMutation.mutate(id);
    }
  };

  const unreadCount = unreadData?.count ?? 0;

  const filtered =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Bildirimler</h1>
          </div>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold min-w-6 h-6 px-1.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Tümü
          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
            {notifications.length}
          </span>
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Okunmamış
          {unreadCount > 0 && (
            <span className="ml-1.5 rounded-full bg-red-100 text-red-700 px-1.5 py-0.5 text-xs">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Bell className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">
              {filter === 'unread' ? 'Okunmamış bildirim yok' : 'Henüz bildirim yok'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((notification) => (
              <li
                key={notification.id}
                onClick={() => handleMarkOne(notification.id, notification.isRead)}
                className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer hover:bg-muted/30 ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20' : ''
                }`}
              >
                {/* Icon */}
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>

                {/* Unread indicator + action */}
                <div className="flex items-center gap-2 shrink-0">
                  {!notification.isRead && (
                    <>
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markOneMutation.mutate(notification.id);
                        }}
                        title="Okundu işaretle"
                        className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
