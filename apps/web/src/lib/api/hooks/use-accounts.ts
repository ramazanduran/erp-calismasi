import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const accountKeys = {
  all: ['accounts'] as const,
  list: (params?: Record<string, unknown>) => [...accountKeys.all, 'list', params] as const,
  detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
};

export function useAccounts(params?: { type?: string; isActive?: boolean; page?: number }) {
  return useQuery({
    queryKey: accountKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get('/api/v1/finance/accounts', params as Record<string, unknown>),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => api.get(`/api/v1/finance/accounts/${id}`),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/finance/accounts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch(`/api/v1/finance/accounts/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/finance/accounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}
