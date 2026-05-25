import { useQuery } from '@tanstack/react-query';
import { api } from '../client';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (params?: Record<string, unknown>) => [...auditLogKeys.all, 'list', params] as const,
};

export function useAuditLogs(params?: {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: auditLogKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get('/api/v1/audit-logs', params as Record<string, unknown>),
  });
}
