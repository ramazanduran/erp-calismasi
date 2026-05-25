'use client';

import { useState } from 'react';
import { Search, FileText, Plus, Minus } from 'lucide-react';
import { useAuditLogs } from '@/lib/api/hooks/use-audit-logs';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  LOGOUT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function ChangesSummary({ changes }: { changes: unknown }) {
  if (!changes || typeof changes !== 'object') return <span className="text-muted-foreground text-xs">-</span>;

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

  const allKeys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].slice(0, 4);

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

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data: logsResp, isLoading } = useAuditLogs({
    entityType: entityType || undefined,
    action: action || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 30,
  });

  const resp = (logsResp as Record<string, unknown>) ?? {};
  const logs = Array.isArray(resp?.data) ? resp.data as Record<string, unknown>[] : [];
  const meta = resp?.meta as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logları</h1>
        <p className="text-sm text-muted-foreground mt-1">Sistemdeki tüm değişikliklerin kaydını görüntüleyin</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Entity tipi..."
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm İşlemler</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
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
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Log kaydı bulunamadı</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const user = log.user as Record<string, unknown> | undefined;
                  const actionStr = log.action as string;
                  return (
                    <tr key={log.id as string} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(log.createdAt as string).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3">
                        {user ? (
                          <div>
                            <div className="font-medium text-xs text-foreground">
                              {user.firstName as string} {user.lastName as string}
                            </div>
                            <div className="text-xs text-muted-foreground">{user.email as string}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sistem</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[actionStr] ?? 'bg-muted text-muted-foreground'}`}>
                          {actionStr}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {(log.entityType as string) ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono truncate max-w-[100px]">
                        {(log.entityId as string) ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <ChangesSummary changes={log.changes} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && meta && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Toplam {meta.total as number} kayıt — Sayfa {meta.page as number} / {meta.totalPages as number}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
              >
                Önceki
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (meta.totalPages as number)}
                className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
