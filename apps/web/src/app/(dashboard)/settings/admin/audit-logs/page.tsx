'use client';

import { useState, useMemo } from 'react';
import {
  Search, FileText, Plus, Minus, ChevronDown, ChevronUp, Download,
  Activity, UserCheck, RefreshCw, Trash2, LogIn, LogOut, Shield,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuditLogs } from '@/lib/api/hooks/use-audit-logs';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ACTION_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  CREATE: {
    label: 'CREATE',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: Plus,
  },
  UPDATE: {
    label: 'UPDATE',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: RefreshCw,
  },
  DELETE: {
    label: 'DELETE',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: Trash2,
  },
  LOGIN: {
    label: 'LOGIN',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: LogIn,
  },
  LOGOUT: {
    label: 'LOGOUT',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    icon: LogOut,
  },
};

const ACTION_TABS = [
  { value: '', label: 'Tümü' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'LOGIN', label: 'LOGIN' },
  { value: 'LOGOUT', label: 'LOGOUT' },
];

interface AuditLog {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: unknown;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
}

interface AuditStats {
  total?: number;
  byAction?: Record<string, number>;
  todayCount?: number;
}

function ChangesSummary({ changes }: { changes: unknown }) {
  if (!changes || typeof changes !== 'object') {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const ch = changes as Record<string, unknown>;
  const before = ch.before as Record<string, unknown> | undefined;
  const after = ch.after as Record<string, unknown> | undefined;

  if (!before && !after) {
    const keys = Object.keys(ch).slice(0, 3);
    return (
      <div className="space-y-0.5">
        {keys.map((k) => (
          <div key={k} className="text-xs text-muted-foreground">
            <span className="font-mono">{k}</span>: {String(ch[k]).slice(0, 30)}
          </div>
        ))}
      </div>
    );
  }

  const allKeys = [
    ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  ].slice(0, 4);

  return (
    <div className="space-y-0.5">
      {allKeys.map((k) => {
        const prev = before?.[k];
        const next = after?.[k];
        if (prev === next) return null;
        return (
          <div key={k} className="flex items-center gap-1 text-xs">
            <span className="font-mono text-muted-foreground">{k}:</span>
            {prev !== undefined && (
              <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                <Minus className="h-2.5 w-2.5" />
                {String(prev).slice(0, 20)}
              </span>
            )}
            {next !== undefined && (
              <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                <Plus className="h-2.5 w-2.5" />
                {String(next).slice(0, 20)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ExpandedChanges({ changes }: { changes: unknown }) {
  if (!changes || typeof changes !== 'object') {
    return (
      <div className="text-sm text-muted-foreground italic">Değişiklik verisi yok</div>
    );
  }

  const ch = changes as Record<string, unknown>;
  const before = ch.before as Record<string, unknown> | undefined;
  const after = ch.after as Record<string, unknown> | undefined;

  if (!before && !after) {
    return (
      <div className="space-y-1">
        {Object.entries(ch).map(([k, v]) => (
          <div key={k} className="flex gap-2 text-xs">
            <span className="font-mono text-muted-foreground w-32 flex-shrink-0">{k}</span>
            <span>{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  const allKeys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground pb-1 border-b border-border">
        <span>Alan</span>
        <span className="text-red-600 dark:text-red-400">Önceki Değer</span>
        <span className="text-green-600 dark:text-green-400">Yeni Değer</span>
      </div>
      {allKeys.map((k) => {
        const prev = before?.[k];
        const next = after?.[k];
        return (
          <div key={k} className="grid grid-cols-3 gap-2 text-xs">
            <span className="font-mono text-muted-foreground">{k}</span>
            <span className={cn(prev !== next ? 'text-red-600 dark:text-red-400 line-through' : 'text-muted-foreground')}>
              {prev !== undefined ? String(prev) : '—'}
            </span>
            <span className={cn(prev !== next ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground')}>
              {next !== undefined ? String(next) : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function UserAvatar({ firstName, lastName }: { firstName?: string; lastName?: string }) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  return (
    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

function PaginationButtons({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const result: (number | '...')[] = [];
    if (page <= 4) {
      result.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (page >= totalPages - 3) {
      result.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      result.push(1, '...', page - 1, page, page + 1, '...', totalPages);
    }
    return result;
  }, [page, totalPages]);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
      >
        « Önceki
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-xs">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              'h-7 w-7 rounded-lg text-xs font-medium transition-colors',
              page === p
                ? 'bg-primary text-primary-foreground'
                : 'border border-border hover:bg-muted',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Sonraki »
      </button>
    </div>
  );
}

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logsResp, isLoading } = useAuditLogs({
    entityType: entityType || undefined,
    action: action || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 30,
  });

  const { data: statsData } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => api.get('/api/v1/audit-logs/stats'),
  });

  const resp = (logsResp as Record<string, unknown>) ?? {};
  const logs = Array.isArray(resp?.data) ? (resp.data as AuditLog[]) : [];
  const meta = resp?.meta as { total: number; page: number; totalPages: number } | undefined;
  const auditStats = statsData as AuditStats | null | undefined;

  const todayLogs = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return logs.filter((l) => l.createdAt?.startsWith(today)).length;
  }, [logs]);

  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      counts[l.action] = (counts[l.action] ?? 0) + 1;
    });
    return counts;
  }, [logs]);

  function clearFilters() {
    setEntityType('');
    setUserSearch('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  const hasActiveFilters = entityType || userSearch || action || startDate || endDate;

  function handleExportCSV() {
    if (logs.length === 0) {
      toast.error('Dışa aktarılacak kayıt yok');
      return;
    }
    const headers = ['Tarih', 'Kullanıcı', 'E-posta', 'İşlem', 'Entity', 'ID'];
    const rows = logs.map((l) => {
      const user = l.user;
      return [
        new Date(l.createdAt).toLocaleString('tr-TR'),
        user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'Sistem',
        user?.email ?? '',
        l.action,
        l.entityType ?? '',
        l.entityId ?? '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV dosyası indiriliyor');
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logları</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistemdeki tüm değişikliklerin kaydını görüntüleyin</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          <Download className="h-4 w-4" />
          CSV İndir
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-medium">Toplam Log</p>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold">{meta?.total ?? auditStats?.total ?? '—'}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-medium">CREATE</p>
            <Plus className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-600">
            {auditStats?.byAction?.CREATE ?? '—'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-medium">UPDATE</p>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-600">
            {auditStats?.byAction?.UPDATE ?? '—'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-medium">DELETE</p>
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-xl font-bold text-red-600">
            {auditStats?.byAction?.DELETE ?? '—'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-medium">Bugünkü Aktivite</p>
            <Activity className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-xl font-bold text-orange-500">
            {auditStats?.todayCount ?? todayLogs}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap border-b border-border pb-1">
        {ACTION_TABS.map((tab) => {
          const count = tab.value === ''
            ? (meta?.total ?? 0)
            : (actionCounts[tab.value] ?? 0);
          const cfg = ACTION_CONFIG[tab.value];
          return (
            <button
              key={tab.value}
              onClick={() => { setAction(tab.value); setPage(1); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors -mb-px border-b-2',
                action === tab.value
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {cfg && <cfg.icon className={cn('h-3.5 w-3.5', cfg.color)} />}
              {tab.label}
              {!isLoading && count > 0 && (
                <span className={cn(
                  'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-xs',
                  action === tab.value ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Entity tipi ara..."
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {entityType && (
            <button
              onClick={() => { setEntityType(''); setPage(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="relative flex-1">
          <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kullanıcı adı veya e-posta..."
            value={userSearch}
            onChange={(e) => { setUserSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {userSearch && (
            <button
              onClick={() => { setUserSearch(''); setPage(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="text-xs whitespace-nowrap">Başlangıç:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="text-xs whitespace-nowrap">Bitiş:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors whitespace-nowrap"
          >
            <X className="h-3.5 w-3.5" />
            Filtreyi Temizle
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Tarih</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kullanıcı</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">İşlem</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Değişiklikler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Log kaydı bulunamadı</p>
                    <p className="text-xs mt-1">Filtre kriterlerini değiştirmeyi deneyin</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const user = log.user;
                  const actionStr = log.action;
                  const cfg = ACTION_CONFIG[actionStr];
                  const ActionIcon = cfg?.icon ?? Activity;
                  const isExpanded = expandedId === log.id;

                  return (
                    <>
                      <tr
                        key={log.id}
                        className={cn(
                          'border-b border-border transition-colors hover:bg-muted/30',
                          isExpanded && 'bg-muted/20',
                        )}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs font-medium text-foreground">
                            {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {user ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar
                                firstName={user.firstName}
                                lastName={user.lastName}
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-foreground truncate">
                                  {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'İsimsiz'}
                                </div>
                                <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                                  {user.email ?? ''}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <span className="text-xs text-muted-foreground">Sistem</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            cfg?.bg ?? 'bg-muted',
                            cfg?.color ?? 'text-muted-foreground',
                          )}>
                            <ActionIcon className="h-3 w-3" />
                            {actionStr}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                          {log.entityType ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono max-w-[100px] truncate">
                          <span title={log.entityId}>{log.entityId ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <ChangesSummary changes={log.changes} />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${log.id}-expand`} className="border-b border-border bg-muted/10">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  <span className="font-medium text-foreground">Log ID:</span>{' '}
                                  <span className="font-mono">{log.id}</span>
                                </span>
                                <span>
                                  <span className="font-medium text-foreground">Tarih:</span>{' '}
                                  {new Date(log.createdAt).toLocaleString('tr-TR')}
                                </span>
                                {log.entityType && (
                                  <span>
                                    <span className="font-medium text-foreground">Entity:</span>{' '}
                                    <span className="font-mono">{log.entityType}</span>
                                    {log.entityId && (
                                      <span className="font-mono"> #{log.entityId}</span>
                                    )}
                                  </span>
                                )}
                              </div>
                              {log.changes && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                    Değişiklik Detayları
                                  </p>
                                  <div className="rounded-lg border border-border bg-background p-3">
                                    <ExpandedChanges changes={log.changes} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && meta && (
          <div className="border-t border-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Toplam{' '}
              <span className="font-medium text-foreground">{meta.total}</span>{' '}
              kayıt — Sayfa{' '}
              <span className="font-medium text-foreground">{meta.page}</span>{' '}
              /{' '}
              <span className="font-medium text-foreground">{meta.totalPages}</span>
            </span>

            {meta.totalPages > 1 && (
              <PaginationButtons
                page={page}
                totalPages={meta.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
